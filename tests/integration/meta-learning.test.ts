import { describe, it, expect, beforeAll } from '@jest/globals';
import { TestUtils } from '../helpers/test-utils';

describe('Meta-Learning Engine Integration', () => {

    beforeAll(async () => {
        // Ensure we have some episodes to analyze
        // In a real test we might inject these into the DB
    });

    it('should discover primitive correlations', async () => {
        const episodes = [
            { episode_num: 1, primitives_before: { brevity: 0.5, entertainment_value: 0.8 }, final_eval: { score: 90, passed: true } },
            { episode_num: 2, primitives_before: { brevity: 0.9, entertainment_value: 0.4 }, final_eval: { score: 60, passed: false } },
            { episode_num: 3, primitives_before: { brevity: 0.5, entertainment_value: 0.85 }, final_eval: { score: 92, passed: true } },
            { episode_num: 4, primitives_before: { brevity: 1.0, entertainment_value: 0.3 }, final_eval: { score: 55, passed: false } },
            { episode_num: 5, primitives_before: { brevity: 0.6, entertainment_value: 0.75 }, final_eval: { score: 88, passed: true } }
        ];

        console.log('\n🧪 Testing Correlation Discovery...');

        const res = await fetch('http://localhost:5174/api/meta-learn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'discover_correlations', episodes }),
        });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.result)).toBe(true);

        if (data.result.length > 0) {
            console.log(`✅ Discovered ${data.result.length} correlations.`);
            console.log(`   Sample: ${data.result[0].explanation}`);
        }
    }, 30000);

    it('should identify success patterns', async () => {
        const episodes = [
            { episode_num: 1, primitives_before: { fact_verification: 0.9 }, final_eval: { score: 95, passed: true } },
            { episode_num: 2, primitives_before: { fact_verification: 0.4 }, final_eval: { score: 40, passed: false } },
            { episode_num: 3, primitives_before: { fact_verification: 0.95 }, final_eval: { score: 98, passed: true } }
        ];

        console.log('\n🧪 Testing Pattern Identification...');

        const res = await fetch('http://localhost:5174/api/meta-learn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'identify_patterns', episodes }),
        });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.result)).toBe(true);

        if (data.result.length > 0) {
            console.log(`✅ Identified ${data.result.length} patterns.`);
            console.log(`   Sample: ${data.result[0].pattern}`);
        }
    }, 30000);
});
