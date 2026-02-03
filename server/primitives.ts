export type Primitives = {
    fact_verification: number;
    anti_hyperbole: number;
    source_attribution: number;
    temporal_accuracy: number;
    entertainment_value: number;
    brevity: number;
};

export const defaultPrimitives: Primitives = {
    fact_verification: 0.65,
    anti_hyperbole: 0.75,
    source_attribution: 0.72,
    temporal_accuracy: 0.70,
    entertainment_value: 0.80,
    brevity: 0.40,
};

export function learn(primitives: Primitives, issues: any[]): Primitives {
    const updated = { ...primitives };

    issues.forEach((issue) => {
        if (issue.type === 'hallucination' || issue.type === 'unverified') {
            updated.fact_verification = Math.min(1.0, updated.fact_verification + 0.15);
        }
        if (issue.type === 'hyperbole') {
            updated.anti_hyperbole = Math.min(1.0, updated.anti_hyperbole + 0.10);
        }
        if (issue.type === 'missing_source') {
            updated.source_attribution = Math.min(1.0, updated.source_attribution + 0.12);
        }
        if (issue.type === 'temporal_vague') {
            updated.temporal_accuracy = Math.min(1.0, updated.temporal_accuracy + 0.10);
        }
    });

    return updated;
}
