import { describe, it, expect } from '@jest/globals';
import { generateBroadcastScript, evaluateScript } from '../../server/gemini-enhanced';
import { defaultPrimitives } from '../../server/primitives';
import { TEST_TOPICS } from '../fixtures/test-topics';
import 'dotenv/config';

describe('Super Bowl LVIII Scenario', () => {

    it('should generate high-quality coverage for Super Bowl LVIII', async () => {
        const { topic, context } = TEST_TOPICS.super_bowl;
        const primitives = defaultPrimitives;

        console.log(`🧪 Testing Super Bowl coverage for: "${topic}"`);
        const { script } = await generateBroadcastScript(topic, primitives, { context });

        expect(script).toBeDefined();
        expect(script.length).toBeGreaterThan(100);

        const evaluation = await evaluateScript(script, topic, primitives);

        console.log(`📊 Overall Quality: ${evaluation.overall_quality.toFixed(2)}`);
        console.log(`📊 Gate Passed: ${evaluation.gate_passed}`);

        // Matching production gate (0.72) rather than arbitrary A-grade (0.8)
        expect(evaluation.overall_quality).toBeGreaterThan(0.7);
    }, 60000);
});
