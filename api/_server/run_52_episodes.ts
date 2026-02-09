// server/run_52_episodes.ts
// ─────────────────────────────────────────────────────────────────────────
// Usage:  npx tsx server/run_52_episodes.ts
//
// Prerequisites:
//   Terminal A:  python server/wandb_sidecar.py --server   (Weave sidecar)
//   Terminal B:  npm run dev                               (Express + Vite)
//   Terminal C:  npx tsx server/run_52_episodes.ts         (this file)
// ─────────────────────────────────────────────────────────────────────────

const TOPICS: string[] = [
    // 1-8: tech + sports (hallucination bait)
    "iPhone 17 Pro rumor with GPT-7 integration announced",
    "NVIDIA next-gen GPU revolutionary breakthrough leaked",
    "NFL quarterback trade rumors — Brock Purdy to the Raiders",
    "Apple Watch Ultra 3 incredible game-changing features",
    "Tesla robotaxi absolutely unprecedented launch event",
    "Meta AI GPT-9 earth-shattering partnership revealed",
    "NBA playoff predictions — amazing unbelievable upsets ahead",
    "Google Gemini 2.5 revolutionary new capabilities soon",

    // 9-16: source + temporal triggers
    "AI regulation changes happening recently in the EU",
    "Crypto market shifts — big moves lately in Bitcoin",
    "New drug approval coming soon from Pfizer",
    "Climate policy updates expected recently from the White House",
    "Stock market rally lately — tech sector incredible gains",
    "Space mission launch soon — absolutely game-changing",
    "Social media algorithm changes recently affecting creators",
    "Housing market shifts — unprecedented price drops lately",

    // 17-24: combined failures
    "GPT-7 revolutionary climate breakthrough recently announced",
    "Llama 5 incredible earth-shattering release date soon",
    "AI safety regulations — game-changing moves lately from Congress",
    "Quantum computing breakthrough — GPT-8 integration rumored soon",
    "Revolutionary new cancer treatment recently discovered by AI",
    "Unprecedented GPT-9 partnership with NASA announced lately",
    "Amazing new robotics breakthrough soon from Boston Dynamics",
    "Unbelievable AI art model GPT-7 Pro released recently",

    // 25-36: clean (should pass gate first try)
    "According to Reuters on January 30, Fed holds rates steady",
    "Bloomberg reported on January 28 that Apple revenue beat estimates",
    "The Wall Street Journal confirmed on January 29 Meta ad revenue growth",
    "Per CNBC on January 31, Amazon AWS quarterly results exceeded forecasts",
    "Sources at the White House confirmed January 30 trade deal progress",
    "According to the CDC on January 27, flu season peak has passed",
    "The Financial Times reported January 29 on EU digital tax framework",
    "Per AP News on January 30, Supreme Court ruled on AI copyright case",
    "According to TechCrunch January 28, Series B funding rounds hit record",
    "The Associated Press reported January 31 on new NASA Mars findings",
    "Per Bloomberg January 29, global semiconductor shortage easing",
    "According to NPR on January 30, college enrollment trends shifting",
    "The Associated Press reported January 31 on new NASA Mars findings",

    // 37-44: production stress
    "From demo to product hardening checklist",
    "Failure clustering and root cause summaries",
    "Quality scoring rubrics and thresholds",
    "Episode timeline visualization for learning curves",
    "Redis memory probe latency optimization",
    "W&B Weave trace completeness verification",
    "Primitive weight convergence after 50 episodes",
    "Cost proxy metrics for the soak test",

    // 45-52: edge cases
    "GPT-7 and Llama 5 both revolutionary game-changing amazing breakthroughs recently",
    "According to sources on January 30, AI safety summit produced concrete results",
    "The incredibly amazing unprecedented revolutionary breakthrough in quantum computing",
    "Verifying new structured Weave ops with Sidecar",
    "Multi-model debate: GPT-7 vs Claude 5 vs Llama 5 recently",
    "Clean factual summary: Fed rate decision January 30 per Reuters",
    "Combined test: revolutionary claims but according to Bloomberg on Jan 29",
    "Final episode: system health check and primitive convergence report",
];

const API = "http://127.0.0.1:5174/api/run-cycle";
const PAUSE_MS = 2000;  // 2s between episodes

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function main() {
    console.log("\n" + "═".repeat(70));
    console.log("  🚀 LIVING NEWSROOM — 52-EPISODE SOAK TEST");
    console.log("  Each episode → Express → Weave sidecar → W&B trace");
    console.log("═".repeat(70) + "\n");

    // ── health check ────────────────────────────────────────────────────
    try {
        const h = await (await fetch("http://127.0.0.1:5174/api/health")).json();
        console.log(`  Health: ${JSON.stringify(h)}\n`);
    } catch {
        console.error("  ❌ Express not running on :5174. Run `npm run dev` first.");
        process.exit(1);
    }

    let primitives: Record<string, number> | undefined = undefined;
    const results: Array<{ ep: number; topic: string; score: number; passed: boolean; mutations: number }> = [];

    for (let i = 0; i < TOPICS.length; i++) {
        const epNum = i + 1;
        const topic = TOPICS[i];
        const short = topic.length > 60 ? topic.slice(0, 57) + "…" : topic;

        process.stdout.write(`  [${String(epNum).padStart(2)}/52] ${short.padEnd(60)} `);

        try {
            const res = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    episode_num: epNum,
                    primitives,
                }),
            });

            const out = await res.json();

            if (!res.ok) {
                console.log(`❌ ${out.error || "unknown"}`);
                continue;
            }

            const score = Math.round((out.final_eval?.score ?? 0) * 100);
            const passed = out.final_eval?.passed ?? false;
            const muts = (out.mutations || []).length;
            const weave = out.weave_logged ? "📊" : "  ";

            console.log(`${passed ? "✅" : "❌"} ${score}/100  muts=${muts}  ${weave}`);

            results.push({ ep: epNum, topic, score, passed, mutations: muts });

            // Carry forward primitives
            if (out.primitives_after) primitives = out.primitives_after;

        } catch (e: any) {
            console.log(`💥 ${e?.message}`);
        }

        // ── scoreboard every 10 episodes ──────────────────────────────
        if (epNum % 10 === 0) {
            const recent = results.slice(-10);
            const avg = (recent.reduce((s, r) => s + r.score, 0) / recent.length).toFixed(0);
            const learns = recent.filter((r) => r.mutations > 0).length;
            console.log(`\n  ┌─ Scoreboard (last 10) ──────────────────────┐`);
            console.log(`  │  Avg score: ${avg}/100   Learning fired: ${learns}/10    │`);
            console.log(`  └─────────────────────────────────────────────┘\n`);
        }

        if (i < TOPICS.length - 1) await sleep(PAUSE_MS);
    }

    // ── final summary ───────────────────────────────────────────────────
    const totalPassed = results.filter((r) => r.passed).length;
    const totalLearn = results.filter((r) => r.mutations > 0).length;
    const avgScore = (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1);

    console.log("\n" + "═".repeat(70));
    console.log("  📊 52-EPISODE SOAK COMPLETE");
    console.log("═".repeat(70));
    console.log(`  Episodes:       52`);
    console.log(`  Gate passed:    ${totalPassed}/52`);
    console.log(`  Learning fired: ${totalLearn}/52`);
    console.log(`  Avg final score: ${avgScore}/100`);
    console.log(`\n  Final primitives:`);
    if (primitives) {
        for (const [name, val] of Object.entries(primitives)) {
            const bar = "█".repeat(Math.round(val * 40));
            console.log(`    ${name.padEnd(25)} ${val.toFixed(2)}  ${bar}`);
        }
    }
    console.log(`\n  → W&B Weave: check your project for 52 traces with full children/steps`);
    console.log("═".repeat(70) + "\n");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
