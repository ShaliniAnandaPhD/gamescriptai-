import { v4 as uuidv4 } from 'uuid';
import { kv } from '@vercel/kv';
import weave from 'weave';

/**
 * CENTRAL NERVOUS SYSTEM
 * Every generation creates a RunContext that flows through all engines
 */

export interface RunContext {
    // Metadata
    run_id: string;
    episode_number: number;
    timestamp: string;
    topic: string;

    // Stage 1: Prediction
    prediction?: {
        predicted_quality: number;
        predicted_pass: boolean;
        risk_factors: {
            primitive: string;
            risk_level: 'low' | 'medium' | 'high';
            reason: string;
        }[];
        recommended_adjustments: {
            primitive: string;
            current: number;
            recommended: number;
            expected_improvement: number;
        }[];
        confidence: number;
        engine: 'predictive-quality';
        latency_ms: number;
    };

    // Stage 2: Generation
    generation?: {
        model: string;
        draft_id: string;
        script: string;
        word_count: number;
        estimated_duration_seconds: number;
        primitives_snapshot: Record<string, number>;
        primitives_hash: string;
        latency_ms: number;
        engine: 'generation';
    };

    // Stage 3: Consensus Evaluation
    consensus?: {
        agent_votes: {
            strict_critic: {
                score: number;
                vote: 'pass' | 'fail';
                complaint: string;
                examples: string[];
            };
            balanced_judge: {
                score: number;
                vote: 'pass' | 'fail';
                reasoning: string;
            };
            optimistic_reviewer: {
                score: number;
                vote: 'pass' | 'fail';
                praise: string;
            };
        };
        consensus_score: number;
        final_vote: 'pass' | 'fail';
        consensus_strength: number; // 0-1 (how much agents agreed)
        primary_complaint?: string; // The main issue (e.g., "hyperbole")
        disputed_primitives: string[]; // Where agents disagreed
        latency_ms: number;
        engine: 'multi-agent-consensus';
    };

    // Stage 4: Meta-Learning Analysis
    meta_learning?: {
        correlations_analyzed: number;
        patterns_matched: string[];
        historical_effectiveness: {
            primitive: string;
            similar_failures: number;
            avg_mutation_size: number;
            success_rate: number;
        }[];
        recommended_mutation_size: number;
        reasoning: string;
        confidence: number;
        latency_ms: number;
        engine: 'meta-learning';
    };

    // Stage 5: Adaptive Mutation
    mutation?: {
        mutations_applied: {
            primitive: string;
            old_value: number;
            new_value: number;
            delta: number;
            severity: number;
            reason: string;
            meta_learning_informed: boolean;
        }[];
        total_mutations: number;
        expected_improvement: number;
        engine: 'adaptive-mutation';
        latency_ms?: number;
    };

    // Stage 6: Regeneration (if needed)
    regeneration?: {
        new_script: string;
        new_quality: number;
        improvement: number;
        attempts: number;
        latency_ms?: number;
    };

    // Final Status
    final_status: 'passed' | 'failed' | 'improved' | 'in_progress';
    total_latency_ms: number;
}

/**
 * Create a new run context
 */
export function createRunContext(topic: string, episodeNumber: number): RunContext {
    return {
        run_id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        episode_number: episodeNumber,
        timestamp: new Date().toISOString(),
        topic,
        final_status: 'in_progress',
        total_latency_ms: 0,
    };
}

/**
 * Add stage result to context
 */
export function updateRunContext<K extends keyof RunContext>(
    context: RunContext,
    stage: K,
    data: RunContext[K]
): RunContext {
    return {
        ...context,
        [stage]: data,
    };
}

/**
 * Save run context to forensic store
 */
export async function saveRunContext(context: RunContext) {
    try {
        // Save to Vercel KV for forensic audit
        await kv.lpush('run_contexts', JSON.stringify(context));
        await kv.ltrim('run_contexts', 0, 99); // Keep last 100

        // Also log to Weave if available
        if ((weave as any).log) {
            (weave as any).log({
                run_id: context.run_id,
                context: context,
            });
        }
    } catch (error) {
        console.error('Failed to save run context:', error);
    }
}

/**
 * Get summary for logging
 */
export function getRunContextSummary(context: RunContext): string {
    const stages = [
        context.prediction ? '✓ Predicted' : '○ Predict',
        context.generation ? '✓ Generated' : '○ Generate',
        context.consensus ? '✓ Evaluated' : '○ Evaluate',
        context.meta_learning ? '✓ Analyzed' : '○ Meta-Learn',
        context.mutation ? '✓ Mutated' : '○ Mutate',
    ];

    return `Run ${context.run_id}: ${stages.join(' → ')} | Status: ${context.final_status}`;
}
