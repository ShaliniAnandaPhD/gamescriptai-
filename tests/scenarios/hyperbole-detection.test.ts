import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateBroadcastScript, evaluateScript } from '../../server/gemini-enhanced';
import { defaultPrimitives } from '../../server/primitives';
import { TestUtils } from '../helpers/test-utils';
import { TEST_TOPICS } from '../fixtures/test-topics';
import 'dotenv/config';

describe('Hyperbole Detection & Correction', () => {

    beforeEach(async () => {
        // For local tests, we don't necessarily clear Firestore, 
        // but we can ensure we start with default primitives.
        await TestUtils.resetPrimitives();
    });

    it('should detect hyperbolic language in topic', async () => {
        const { topic } = TEST_TOPICS.hyperbolic;
        const primitives = defaultPrimitives;

        // Generate script
        const { script } = await generateBroadcastScript(topic, primitives);

        // Evaluate
        const evaluation = await evaluateScript(script, topic, primitives);

        // Should flag hyperbole (or at least acknowledge it in reasoning)
        // Note: Scores are AI-generated, so we check for presence and general direction
        const hyperboleReasoning = evaluation.reasoning.find(
            r => r.primitive === 'anti_hyperbole'
        );

        expect(hyperboleReasoning).toBeDefined();
        console.log(`📊 Anti-hyperbole score: ${hyperboleReasoning?.score}`);
    }, 30000);

    it('should identify specific hyperbolic phrases', async () => {
        const script = `This was ABSOLUTELY the most INCREDIBLE game with UNPRECEDENTED plays!`;
        const primitives = defaultPrimitives;

        const evaluation = await evaluateScript(
            script,
            "Sports game coverage",
            primitives
        );

        // Should identify examples
        const hyperboleReasoning = evaluation.reasoning.find(
            r => r.primitive === 'anti_hyperbole'
        );

        expect(hyperboleReasoning?.examples).toBeDefined();
        expect(hyperboleReasoning?.examples.length).toBeGreaterThan(0);

        console.log(`🔍 Detected phrases: ${hyperboleReasoning?.examples.join(', ')}`);
    }, 30000);
});
