import { describe, it, expect, beforeAll } from '@jest/globals';
import { TestUtils } from '../helpers/test-utils';
import { TEST_TOPICS } from '../fixtures/test-topics';

describe('Full Pipeline Integration', () => {

    beforeAll(async () => {
        // await TestUtils.clearTestData();
        await TestUtils.resetPrimitives();
    });

    it('should complete full generate → evaluate cycle', async () => {
        const { topic } = TEST_TOPICS.hyperbolic;

        console.log('\n🧪 Testing full pipeline...\n');

        // Step 1: Run Cycle (which does generation + evaluation + mutation)
        console.log('Step 1: Running Cycle...');
        const res = await fetch('http://localhost:5174/api/run-cycle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, episode_num: 999 }),
        });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.draft_text).toBeDefined();
        expect(data.final_eval).toBeDefined();

        console.log(`   ✓ Draft script generated.`);
        console.log(`   ✓ Final Quality: ${data.final_eval.score.toFixed(1)}`);
        console.log(`   ✓ Gate: ${data.final_eval.passed ? '✅ PASSED' : '❌ FAILED'}`);

        if (data.mutations && data.mutations.length > 0) {
            console.log('\nStep 2: Mutations applied:');
            data.mutations.forEach((mut: any) => {
                console.log(`   • ${mut.primitive_name}: ${mut.old_weight.toFixed(2)} → ${mut.new_weight.toFixed(2)} (${mut.delta > 0 ? '+' : ''}${mut.delta.toFixed(2)})`);
            });
        }
    }, 60000); // 60s timeout for LLM calls

    it('should handle Super Bowl topic via Consensus Evaluation', async () => {
        const { topic } = TEST_TOPICS.super_bowl;
        const script = "Patrick Mahomes delivered a clinical performance to secure the win.";
        const primitives = {
            fact_verification: 0.9,
            anti_hyperbole: 0.8,
            source_attribution: 0.8,
            temporal_accuracy: 0.8,
            entertainment_value: 0.8,
            brevity: 0.5
        };

        console.log('\n🧪 Testing Consensus Evaluation...');

        const res = await fetch('http://localhost:5174/api/consensus-eval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script, topic, primitives }),
        });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.consensus).toBeDefined();
        expect(data.consensus.consensus_strength).toBeGreaterThan(0);

        console.log(`✅ Consensus Strength: ${(data.consensus.consensus_strength * 100).toFixed(1)}%`);
        console.log(`✅ Overall Quality: ${data.consensus.overall_quality.toFixed(2)}`);
    }, 60000);
});
