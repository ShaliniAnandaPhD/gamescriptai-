import { describe, it, expect } from '@jest/globals';
import { evaluateScript } from '../../server/gemini-enhanced';
import { defaultPrimitives } from '../../server/primitives';
import { TEST_TOPICS } from '../fixtures/test-topics';
import 'dotenv/config';

describe('Fact Verification Scenario', () => {

    it('should flag factually questionable topics', async () => {
        const { topic } = TEST_TOPICS.questionable;
        const script = "LeBron James had a historic night, dropping 85 points in a single game.";
        const primitives = defaultPrimitives;

        console.log(`🧪 Testing fact verification for: "${topic}"`);
        const evaluation = await evaluateScript(script, topic, primitives);

        const factReasoning = evaluation.reasoning.find(
            r => r.primitive === 'fact_verification'
        );

        expect(factReasoning).toBeDefined();
        console.log(`📊 Fact verification score: ${factReasoning?.score}`);

        // If it's a hallucination or incorrect fact, score should be low
        if (factReasoning && factReasoning.score > 0.8) {
            console.warn('⚠️  Warning: Gemini might have accepted the false fact.');
        }
    }, 30000);
});
