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
    });
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

// ── boot ──────────────────────────────────────────────────────────────────
const PORT = 5174;
app.listen(PORT, () => {
    console.log(`\n🚀 Express server on http://localhost:${PORT}`);
    console.log(`📊 W&B:  ${process.env.WANDB_API_KEY ? "✅ configured" : "❌ missing"}`);
    console.log(`🤖 HF:   ${process.env.HF_API_KEY ? "✅ configured" : "❌ missing"}`);
    console.log(`🔗 Weave sidecar: http://localhost:5199  (start with: python server/wandb_sidecar.py --server)\n`);
});
