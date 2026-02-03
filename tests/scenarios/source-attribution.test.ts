import { describe, it, expect } from '@jest/globals';
import { evaluateScript } from '../../server/gemini-enhanced';
import { defaultPrimitives } from '../../server/primitives';
import { TEST_TOPICS } from '../fixtures/test-topics';
import 'dotenv/config';

describe('Source Attribution Scenario', () => {

    it('should flag vague topics with poor sourcing', async () => {
        const { topic } = TEST_TOPICS.vague;
        const script = "Reports say things are bad. Some people are talking about it.";
        const primitives = defaultPrimitives;

        console.log(`🧪 Testing source attribution for: "${topic}"`);
        const evaluation = await evaluateScript(script, topic, primitives);

        const sourceReasoning = evaluation.reasoning.find(
            r => r.primitive === 'source_attribution'
        );

        expect(sourceReasoning).toBeDefined();
        console.log(`📊 Source attribution score: ${sourceReasoning?.score}`);
    }, 30000);
});
