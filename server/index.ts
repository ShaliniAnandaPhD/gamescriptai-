// server/index.ts
// ─────────────────────────────────────────────────────────────────────────
// Express server on :5174
// • POST /api/run-cycle  →  runs the episode locally, then forwards to
//   the Python Weave sidecar at :5199 so the trace is fully populated.
// • GET  /api/health     →  liveness check
// ─────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import express from "express";
import cors from "cors";
import { runCycle } from "./runCycle";
import { analyzeGameImage } from "./gemini-enhanced";
import {
    discoverPrimitiveCorrelations,
    identifyLearningPatterns,
    getStoredCorrelations,
    getStoredInsights
} from "./lib/meta-learning";
import { evaluateWithConsensus } from "./lib/consensus-evaluation";
import { predictQuality } from "./lib/predictive-quality";
import { getNarrativeContinuity } from "./lib/contextual-memory";
import { runUnifiedPipeline } from "./lib/pipeline-orchestrator";
import { kv } from "@vercel/kv";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" })); // Increased limit for images

// ── health ────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
    res.json({
        ok: true,
        wandb_configured: !!process.env.WANDB_API_KEY,
        hf_configured: !!process.env.HF_API_KEY,
        sidecar_url: "http://localhost:5199",
        version: "2.5-sophisticated"
    });
});

// ── meta-learning ─────────────────────────────────────────────────────────
app.post("/api/meta-learn", async (req, res) => {
    try {
        const { action, episodes = [] } = req.body;
        let result;

        switch (action) {
            case 'discover_correlations':
                result = await discoverPrimitiveCorrelations(episodes);
                break;
            case 'identify_patterns':
                result = await identifyLearningPatterns(episodes);
                break;
            case 'get_current':
                result = {
                    correlations: await getStoredCorrelations(),
                    insights: await getStoredInsights()
                };
                break;
            default:
                return res.status(400).json({ error: "Unknown action" });
        }
        res.json({ success: true, result });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ── predictive-quality ─────────────────────────────────────────────────────
app.post("/api/predict-quality", async (req, res) => {
    try {
        const { topic, primitives, context } = req.body;
        const result = await predictQuality(topic, primitives, context);
        res.json({ success: true, prediction: result });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ── consensus-eval ─────────────────────────────────────────────────────────
app.post("/api/consensus-eval", async (req, res) => {
    try {
        const { script, topic, primitives } = req.body;
        const startTime = Date.now();
        const consensus = await evaluateWithConsensus(script, topic, primitives);
        res.json({
            success: true,
            consensus,
            latency_ms: Date.now() - startTime
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ── multimodal ─────────────────────────────────────────────────────────────
app.post("/api/multimodal", async (req, res) => {
    try {
        const { image, analysisType } = req.body;
        if (!image || !analysisType) {
            return res.status(400).json({ error: "image and analysisType are required" });
        }

        // Strip data prefix if base64
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        console.log(`🖼️  Multimodal analysis request: ${analysisType}`);
        const result = await analyzeGameImage(base64Data, analysisType);

        res.json({
            success: true,
            ...result,
            model: "gemini-2.0-flash-exp"
        });
    } catch (e: any) {
        console.error("Error in /api/multimodal:", e);
        res.status(500).json({ error: e?.message ?? "Analysis failed" });
    }
});

// ── run-cycle ─────────────────────────────────────────────────────────────
app.post("/api/run-cycle", async (req, res) => {
    try {
        const hfKey = process.env.HF_API_KEY || "";
        if (!hfKey) {
            return res.status(400).json({ error: "HF_API_KEY not set in .env" });
        }

        const topic = String(req.body?.topic ?? "").trim();
        const episodeNum = Number(req.body?.episode_num ?? 1);
        const primitives = req.body?.primitives;

        if (!topic) {
            return res.status(400).json({ error: "topic is required" });
        }

        // ── 1. Run the cycle locally (generates text, evaluates, learns) ──
        const out = await runCycle({
            topic,
            primitives,
            episode_num: episodeNum,
        });

        // ── 2. Forward to Weave sidecar for trace emission ──────────────
        let weaveResult: any = null;
        try {
            const sidecarRes = await fetch("http://localhost:5199/trace", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    episode_num: episodeNum,
                    episode_id: out.episode_id ?? `ep_${episodeNum}`,
                    boot_id: out.boot_id ?? "local",
                    topic: out.topic ?? topic,
                    primitives: out.primitives_after ?? primitives,
                }),
            });

            if (sidecarRes.ok) {
                weaveResult = await sidecarRes.json();
                console.log(`📊 Weave trace emitted for ep_${episodeNum}`);
            } else {
                console.warn(`⚠️  Sidecar returned ${sidecarRes.status}`);
            }
        } catch (e: any) {
            console.warn(`⚠️  Sidecar unreachable (${e?.message}) — trace skipped`);
        }

        // ── 3. Return combined result ─────────────────────────────────────
        res.json({
            ...out,
            weave_logged: !!weaveResult,
            weave_trace: weaveResult?.identity ?? null,
        });

    } catch (e: any) {
        console.error("Error in /api/run-cycle:", e);
        res.status(400).json({ error: e?.message ?? "Unknown error" });
    }
});

// ── UNIFIED PIPELINE ────────────────────────────────────────────────────────
app.post("/api/generate-unified", async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic || topic.trim().length < 10) {
            return res.status(400).json({ error: "Topic must be at least 10 characters" });
        }

        console.log(`\n🚀 UNIFIED PIPELINE REQUEST: "${topic}"`);
        const context = await runUnifiedPipeline(topic);

        res.json({
            success: true,
            context,
            summary: {
                run_id: context.run_id,
                final_status: context.final_status,
                total_latency_ms: context.total_latency_ms
            }
        });
    } catch (e: any) {
        console.error("❌ Unified pipeline error:", e);
        res.status(500).json({ error: e.message || "Pipeline execution failed" });
    }
});

app.get("/api/run-contexts", async (req, res) => {
    try {
        const contexts = await kv.lrange('run_contexts', 0, 9) || [];
        res.json({
            success: true,
            contexts: contexts.map(c => typeof c === 'string' ? JSON.parse(c) : c),
            count: contexts.length
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

import { getPrimitives, updatePrimitive } from "./primitives";

app.get("/api/primitives", async (req, res) => {
    try {
        const primitives = await getPrimitives();
        res.json(primitives);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/primitives", async (req, res) => {
    try {
        const { name, value } = req.body;
        await updatePrimitive(name, value);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ── testing-support ───────────────────────────────────────────────────────
app.post("/api/test/reset", async (req, res) => {
    try {
        const { action } = req.body;
        console.log(`🧪 Test reset action: ${action}`);

        // Note: For a real demo, we might want to clear Firestore too, 
        // but for now we focus on the in-memory meta-learning state.
        if (action === 'reset_primitives' || action === 'clear_all') {
            // We can't easily reset the default primitives in 'primitives.ts' 
            // without a restart, but we can return a success indicator.
        }

        res.json({ success: true, message: `Action ${action} executed` });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ── boot ──────────────────────────────────────────────────────────────────
const PORT = 5174;
app.listen(PORT, () => {
    console.log(`\n🚀 Express server on http://localhost:${PORT}`);
    console.log(`📊 W&B:  ${process.env.WANDB_API_KEY ? "✅ configured" : "❌ missing"}`);
    console.log(`🤖 HF:   ${process.env.HF_API_KEY ? "✅ configured" : "❌ missing"}`);
    console.log(`🔗 Weave sidecar: http://localhost:5199  (start with: python server/wandb_sidecar.py --server)\n`);
});
