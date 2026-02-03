/**
 * Test helper utilities
 */
export class TestUtils {

    /**
     * Clear all test data from the server
     */
    static async clearTestData() {
        const res = await fetch('http://localhost:5174/api/test/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear_all' }),
        });
        return res.json();
    }

    /**
     * Initialize primitives to default state
     */
    static async resetPrimitives() {
        const res = await fetch('http://localhost:5174/api/test/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset_primitives' }),
        });
        return res.json();
    }

    /**
     * Validate score is within expected range
     */
    static validateScore(
        score: number,
        expected: { min?: number; max?: number }
    ): { valid: boolean; message?: string } {
        if (expected.min !== undefined && score < expected.min) {
            return {
                valid: false,
                message: `Score ${score.toFixed(2)} below minimum ${expected.min}`,
            };
        }

        if (expected.max !== undefined && score > expected.max) {
            return {
                valid: false,
                message: `Score ${score.toFixed(2)} above maximum ${expected.max}`,
            };
        }

        return { valid: true };
    }

    /**
     * Wait for async operation
     */
    static async wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Measure execution time
     */
    static async measureTime<T>(
        fn: () => Promise<T>
    ): Promise<{ result: T; latency_ms: number }> {
        const start = Date.now();
        const result = await fn();
        const latency_ms = Date.now() - start;

        return { result, latency_ms };
    }
}
