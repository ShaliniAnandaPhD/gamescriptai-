export type Primitives = {
    // V1
    fact_verification: number;
    anti_hyperbole: number;
    source_attribution: number;
    temporal_accuracy: number;
    entertainment_value: number;
    brevity: number;

    // V2
    audience_targeting: number;
    controversy_sensitivity: number;
    statistical_depth: number;
    local_context_awareness: number;
    sponsor_compliance: number;
    accessibility_optimization: number;
    real_time_momentum: number;
    player_privacy_protection: number;
};

export const defaultPrimitives: Primitives = {
    // V1
    fact_verification: 0.70,
    anti_hyperbole: 0.85,
    source_attribution: 0.84,
    temporal_accuracy: 0.70,
    entertainment_value: 0.80,
    brevity: 0.40,

    // V2
    audience_targeting: 0.75,
    controversy_sensitivity: 0.90,
    statistical_depth: 0.65,
    local_context_awareness: 0.70,
    sponsor_compliance: 0.95,
    accessibility_optimization: 0.60,
    real_time_momentum: 0.80,
    player_privacy_protection: 0.85,
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
