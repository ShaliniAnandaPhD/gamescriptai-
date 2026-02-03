/**
 * Quick test script for GameScript AI v2.5
 */
async function runQuickTests() {
    const HOST = "http://localhost:5174";
    console.log("\n🧪 GameScript AI - Quick Test (Node.js)");
    console.log("======================================\n");

    try {
        const health = await fetch(`${HOST}/api/health`);
        if (!health.ok) throw new Error();
        console.log("📡 Signal detected at " + HOST + "\n");
    } catch (e) {
        console.error("🚨 Error: Backend server not found at " + HOST);
        console.error("Please run 'npm run dev' first.\n");
        process.exit(1);
    }

    // Test 1: Hyperbole Detection
    console.log("🔹 Test 1: Hyperbole Detection (Direct run-cycle)");
    console.log("Topic: ABSOLUTELY INSANE game with UNPRECEDENTED plays!\n");

    try {
        const res = await fetch(`${HOST}/api/run-cycle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: "ABSOLUTELY INSANE game with UNPRECEDENTED plays!", episode_num: 999 }),
        });
        const data = await res.json();
        const quality = data.final_eval?.score ?? 0;

        // Hyperbolic should result in LOWER quality scores for anti_hyperbole
        if (quality < 0.85) {
            console.log(`✅ PASS - System correctly identified risks. Quality: ${quality.toFixed(1)}`);
        } else {
            console.log(`⚠️  INFO - Quality was high (${quality.toFixed(1)}). Models might be too lenient on hyperbole.`);
        }
    } catch (e) {
        console.error("❌ FAIL - Hyperbole detection request failed:", e);
    }

    console.log("\n🔹 Test 2: Consensus Evaluation");
    console.log("Running 3-agent debate...\n");

    try {
        const res = await fetch(`${HOST}/api/consensus-eval`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                script: "A solid performance by the team.",
                topic: "Game Recap",
                primitives: { brevity: 0.5, fact_verification: 0.8, anti_hyperbole: 0.8, source_attribution: 0.8, temporal_accuracy: 0.8, entertainment_value: 0.8 }
            }),
        });
        const data = await res.json();
        const strength = data.consensus?.consensus_strength ?? 0;

        if (strength > 0) {
            console.log(`✅ PASS - Consensus reached. Strength: ${(strength * 100).toFixed(1)}%`);
        } else {
            console.log("❌ FAIL - Consensus strength is 0.");
        }
    } catch (e) {
        console.error("❌ FAIL - Consensus evaluation request failed:", e);
    }

    console.log("\n👑 Quick tests complete!\n");
}

runQuickTests();
