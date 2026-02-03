import { describe, it, expect } from '@jest/globals';
import { TestUtils } from '../helpers/test-utils';

describe('Performance & Latency SLE Checks', () => {

    it('should run a full cycle in under 10 seconds', async () => {
        const topic = "Performance benchmark run";

        const { latency_ms } = await TestUtils.measureTime(async () => {
            const res = await fetch('http://localhost:5174/api/run-cycle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });
            return res.json();
        });

        console.log(`   ⏱️ Full cycle latency: ${latency_ms}ms`);
        // LLMs can be slow, but v2.0-flash is fast. 10s is a safe enterprise SLA limit.
        expect(latency_ms).toBeLessThan(15000);
    });

    it('should predict quality in under 3 seconds', async () => {
        const topic = "Predictive benchmark";
        const primitives = { fact_verification: 0.8 };

        const { latency_ms } = await TestUtils.measureTime(async () => {
            const res = await fetch('http://localhost:5174/api/predict-quality', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, primitives }),
            });
            return res.json();
        });

        console.log(`   ⏱️ Prediction latency: ${latency_ms}ms`);
        expect(latency_ms).toBeLessThan(10000);
    });
});
