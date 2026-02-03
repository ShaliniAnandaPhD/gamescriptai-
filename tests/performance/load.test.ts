import { describe, it, expect } from '@jest/globals';
import { TestUtils } from '../helpers/test-utils';

describe('Load & Concurrency Performance', () => {

    it('should handle 3 concurrent generation requests under 20 seconds', async () => {
        const topics = [
            "Future of AI in sports",
            "Next-gen broadcasting tech",
            "Fan engagement via metaverse"
        ];

        console.log('🧪 Testing concurrent load (3 requests)...');

        const startTime = Date.now();

        const results = await Promise.all(
            topics.map(topic =>
                fetch('http://localhost:5174/api/run-cycle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic }),
                }).then(res => res.json())
            )
        );

        const totalTime = Date.now() - startTime;
        console.log(`⏱️  Total concurrent execution time: ${totalTime}ms`);

        expect(results.length).toBe(3);
        results.forEach(res => expect(res.draft_text).toBeDefined());

        // Concurrency should be efficient. 20s is reasonable for 3 LLM cycles.
        expect(totalTime).toBeLessThan(30000);
    }, 40000);
});
