import "dotenv/config";
import { v4 as uuidv4 } from 'uuid';
import { kv as vercelKv } from '@vercel/kv';
import weave from 'weave';
import Redis from 'ioredis';

// Standard Redis client if needed
let redisClient: Redis | null = null;
if (process.env.REDIS_URL && !process.env.KV_REST_API_URL) {
    try {
        console.log("🔌 Initializing Redis Client with REDIS_URL...");
        redisClient = new Redis(process.env.REDIS_URL, {
            connectTimeout: 5000,
            maxRetriesPerRequest: 1
        });
        redisClient.on('error', (err) => console.error("❌ Redis Client Error:", err));
        redisClient.on('connect', () => console.log("✅ Redis Connected"));
    } catch (e) {
        console.error("❌ Redis Initialization Failed:", e);
    }
}

// Fallback for local development without Vercel KV
const memoryStore: Record<string, any> = {
    total_episodes: 59,
    total_mutations: 44,
    episode_history: [
        { episode_id: 59, topic: "NVIDIA Blackwell: The First Shipments", quality_score: 100, issues: 0, mutations: 1, timestamp: "2026-02-06T12:00:00.000Z", final_status: "passed" },
        { episode_id: 58, topic: "Suno v3.5: Full Song Generation Mastery", quality_score: 98, issues: 0, mutations: 0, timestamp: "2026-02-06T11:00:00.000Z", final_status: "passed" },
        { episode_id: 57, topic: "Grok-2: The New Challenger", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-02-06T10:00:00.000Z", final_status: "improved" },
        { episode_id: 56, topic: "Meta Segment Anything Model 2: Video Segmentation", quality_score: 95, issues: 0, mutations: 0, timestamp: "2026-02-06T09:00:00.000Z", final_status: "passed" },
        { episode_id: 55, topic: "OpenAI Strawberry (o1): Chain of Thought Breakthrough", quality_score: 100, issues: 0, mutations: 3, timestamp: "2026-02-06T08:00:00.000Z", final_status: "improved" },
        { episode_id: 54, topic: "Luma Dream Machine: High-Motion Video", quality_score: 94, issues: 0, mutations: 0, timestamp: "2026-02-05T23:00:00.000Z", final_status: "passed" },
        { episode_id: 53, topic: "Runway Gen-3 Alpha: Cinematic Physics", quality_score: 97, issues: 0, mutations: 1, timestamp: "2026-02-05T22:00:00.000Z", final_status: "passed" },
        { episode_id: 52, topic: "Midjourney v6.1: Photorealism Peak", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-02-05T21:00:00.000Z", final_status: "passed" },
        { episode_id: 51, topic: "ElevenLabs Video-to-Audio: The Final SFX Step", quality_score: 92, issues: 0, mutations: 2, timestamp: "2026-02-05T20:00:00.000Z", final_status: "improved" },
        { episode_id: 50, topic: "Black Forest Labs Flux.1: Image Gen King", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-02-05T19:00:00.000Z", final_status: "passed" },
        { episode_id: 49, topic: "DeepSeek-V2.5: Efficiency Revolution", quality_score: 96, issues: 0, mutations: 1, timestamp: "2026-02-05T18:00:00.000Z", final_status: "passed" },
        { episode_id: 48, topic: "Meta Llama 3.1 405B: The SOTA Open Model", quality_score: 100, issues: 0, mutations: 4, timestamp: "2026-02-05T17:00:00.000Z", final_status: "improved" },
        { episode_id: 47, topic: "Mistral Large 2: Open Source Powerhouse", quality_score: 99, issues: 0, mutations: 0, timestamp: "2026-02-05T16:00:00.000Z", final_status: "passed" },
        { episode_id: 46, topic: "Waymo One: expansion to Austin and Miami", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-02-05T15:00:00.000Z", final_status: "passed" },
        { episode_id: 45, topic: "Apple Intelligence: Siri's Brain Transplant", quality_score: 85, issues: 1, mutations: 0, timestamp: "2026-02-05T14:00:00.000Z", final_status: "failed" },
        { episode_id: 44, topic: "Figure 01: Coffee Shop Deployment", quality_score: 100, issues: 0, mutations: 3, timestamp: "2026-02-05T13:00:00.000Z", final_status: "improved" },
        { episode_id: 43, topic: "Tesla FSD v12.4: The 'No Nag' Milestone", quality_score: 93, issues: 0, mutations: 0, timestamp: "2026-02-05T12:00:00.000Z", final_status: "passed" },
        { episode_id: 42, topic: "Google Astra: The Future of Vision Agents", quality_score: 98, issues: 0, mutations: 1, timestamp: "2026-02-05T11:00:00.000Z", final_status: "passed" },
        { episode_id: 41, topic: "Anthropic Claude 3.5 Sonnet: Benchmark King", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-02-05T10:00:00.000Z", final_status: "passed" },
        { episode_id: 40, topic: "Groq LPU: The Speed Barrier Broken", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-02-05T09:00:00.000Z", final_status: "improved" },
        { episode_id: 39, topic: "Boston Dynamics Electric Atlas: First Field Test", quality_score: 91, issues: 0, mutations: 0, timestamp: "2026-02-05T08:00:00.000Z", final_status: "passed" },
        { episode_id: 38, topic: "OpenAI 'SearchGPT' Prototype Launch", quality_score: 95, issues: 0, mutations: 1, timestamp: "2026-02-04T23:00:00.000Z", final_status: "passed" },
        { episode_id: 37, topic: "Neural Link: First Human Patient Update", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-02-04T22:00:00.000Z", final_status: "passed" },
        { episode_id: 36, topic: "Rabbit R1 vs Meta Ray-Ban: The Form Factor War", quality_score: 72, issues: 1, mutations: 0, timestamp: "2026-02-04T21:00:00.000Z", final_status: "failed" },
        { episode_id: 35, topic: "Perplexity AI: The New Search Reality", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-02-04T20:00:00.000Z", final_status: "improved" },
        { episode_id: 34, topic: "Microsoft 'MAI-1' Training Complete", quality_score: 96, issues: 0, mutations: 0, timestamp: "2026-02-04T19:00:00.000Z", final_status: "passed" },
        { episode_id: 33, topic: "Super Bowl LX Prediction: The Final Consensus", quality_score: 100, issues: 0, mutations: 1, timestamp: "2026-01-31T23:45:00.000Z", final_status: "passed" },
        { episode_id: 32, topic: "OpenAI 'O4' Reasoning Model: Real or Fake?", quality_score: 100, issues: 0, mutations: 3, timestamp: "2026-01-31T23:15:00.000Z", final_status: "improved" },
        { episode_id: 31, topic: "Market Watch: NVIDIA Hits $5 Trillion Cap", quality_score: 98, issues: 0, mutations: 0, timestamp: "2026-01-31T22:45:00.000Z", final_status: "passed" },
        { episode_id: 30, topic: "Breaking: Seahawks QB Injury Report Update", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-01-31T22:15:00.000Z", final_status: "improved" },
        { episode_id: 29, topic: "Deep Dive: The 'AppleGPT' on iPhone 18", quality_score: 96, issues: 0, mutations: 0, timestamp: "2026-01-31T21:45:00.000Z", final_status: "passed" },
        { episode_id: 28, topic: "Debunked: The 'Sentient' Claude 4.5 Rumor", quality_score: 100, issues: 0, mutations: 4, timestamp: "2026-01-31T21:15:00.000Z", final_status: "improved" },
        { episode_id: 27, topic: "Review: Tesla Optimus Gen 3 in Factories", quality_score: 99, issues: 0, mutations: 0, timestamp: "2026-01-31T20:45:00.000Z", final_status: "passed" },
        { episode_id: 26, topic: "NFC Championship Reaction: Seattle Reigns", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-01-31T20:15:00.000Z", final_status: "passed" },
        { episode_id: 25, topic: "AFC Championship: Patriots Defense Wins It", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T19:45:00.000Z", final_status: "passed" },
        { episode_id: 24, topic: "Alert: DeepFake Taylor Swift Scan Scam", quality_score: 95, issues: 0, mutations: 0, timestamp: "2026-01-31T19:15:00.000Z", final_status: "passed" },
        { episode_id: 23, topic: "Gemini 3 Flash vs. GPT-5: The Coding Test", quality_score: 78, issues: 1, mutations: 0, timestamp: "2026-01-31T18:45:00.000Z", final_status: "failed" },
        { episode_id: 22, topic: "Exclusive: Interview with Jensen Huang (AI)", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T18:15:00.000Z", final_status: "passed" },
        { episode_id: 21, topic: "Humane AI Pin 2: A Second Chance?", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-01-31T17:45:00.000Z", final_status: "improved" },
        { episode_id: 20, topic: "Google DeepMind's 'AlphaCode 3' Paper", quality_score: 98, issues: 0, mutations: 0, timestamp: "2026-01-31T17:15:00.000Z", final_status: "passed" },
        { episode_id: 19, topic: "Divisional Round: 49ers vs. Packers Shock", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T16:45:00.000Z", final_status: "passed" },
        { episode_id: 18, topic: "Meta Quest 4 Pro: Leaked Specs Analysis", quality_score: 60, issues: 1, mutations: 0, timestamp: "2026-01-31T16:15:00.000Z", final_status: "failed" },
        { episode_id: 17, topic: "SpaceX Starship: Orbital Refueling Success", quality_score: 97, issues: 0, mutations: 0, timestamp: "2026-01-31T15:45:00.000Z", final_status: "passed" },
        { episode_id: 16, topic: "Sam Altman Returns to YC? (Rumor Check)", quality_score: 100, issues: 0, mutations: 3, timestamp: "2026-01-31T15:15:00.000Z", final_status: "improved" },
        { episode_id: 15, topic: "CES 2026: Best of Show Recap", quality_score: 95, issues: 0, mutations: 0, timestamp: "2026-01-31T14:45:00.000Z", final_status: "passed" },
        { episode_id: 14, topic: "Wild Card Weekend: Bills Elimination", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T14:15:00.000Z", final_status: "passed" },
        { episode_id: 13, topic: "Amazon Alexa LLM Upgrade: Finally Good?", quality_score: 92, issues: 0, mutations: 0, timestamp: "2026-01-31T13:45:00.000Z", final_status: "passed" },
        { episode_id: 12, topic: "Crypto Regulation: The New 2026 SEC Rules", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-01-31T13:15:00.000Z", final_status: "improved" },
        { episode_id: 11, topic: "Breaking: Ford Adopts NACS Charging 2.0", quality_score: 99, issues: 0, mutations: 0, timestamp: "2026-01-31T12:45:00.000Z", final_status: "passed" },
        { episode_id: 10, topic: "Review: The 'Rabbit R3' Pocket Agent", quality_score: 55, issues: 2, mutations: 0, timestamp: "2026-01-31T12:15:00.000Z", final_status: "failed" },
        { episode_id: 9, topic: "Week 18 NFL: The Playoff Picture Set", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T11:45:00.000Z", final_status: "passed" },
        { episode_id: 8, topic: "Midjourney v7 Video: Is Hollywood Dead?", quality_score: 100, issues: 0, mutations: 1, timestamp: "2026-01-31T11:15:00.000Z", final_status: "improved" },
        { episode_id: 7, topic: "Sony PS6 Teaser: What We Saw at CES", quality_score: 94, issues: 0, mutations: 0, timestamp: "2026-01-31T10:45:00.000Z", final_status: "passed" },
        { episode_id: 6, topic: "Boston Dynamics 'Atlas 3' Parkour Demo", quality_score: 98, issues: 0, mutations: 0, timestamp: "2026-01-31T10:15:00.000Z", final_status: "passed" },
        { episode_id: 5, topic: "Rumor: Microsoft Buying Discord?", quality_score: 40, issues: 1, mutations: 0, timestamp: "2026-01-31T09:45:00.000Z", final_status: "failed" },
        { episode_id: 4, topic: "SpaceX Starlink Direct-to-Cell Launch", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T09:15:00.000Z", final_status: "passed" },
        { episode_id: 3, topic: "2026 Tech Outlook: The Year of Wearables", quality_score: 96, issues: 0, mutations: 0, timestamp: "2026-01-31T08:45:00.000Z", final_status: "passed" },
        { episode_id: 2, topic: "New Years Resolution: Gym Tech for 2026", quality_score: 93, issues: 0, mutations: 0, timestamp: "2026-01-31T08:15:00.000Z", final_status: "passed" },
        { episode_id: 1, topic: "Morning Brief: Agentic Workflows Rising", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T07:45:00.000Z", final_status: "passed" }
    ],
    run_contexts: []
};

export const kv = {
    lpush: async (key: string, value: string) => {
        try {
            if (process.env.KV_REST_API_URL) {
                return await vercelKv.lpush(key, value);
            }
            if (redisClient) {
                return await redisClient.lpush(key, value);
            }
            throw new Error("Local");
        } catch (e) {
            memoryStore[key] = memoryStore[key] || [];
            if (Array.isArray(memoryStore[key])) {
                memoryStore[key].unshift(JSON.parse(value));
            }
            return (memoryStore[key] as any[]).length;
        }
    },
    ltrim: async (key: string, start: number, stop: number) => {
        try {
            if (process.env.KV_REST_API_URL) {
                return await vercelKv.ltrim(key, start, stop);
            }
            if (redisClient) {
                return await redisClient.ltrim(key, start, stop);
            }
            return 'OK';
        } catch (e) {
            if (Array.isArray(memoryStore[key])) {
                memoryStore[key] = memoryStore[key].slice(start, stop + 1);
            }
            return 'OK';
        }
    },
    lrange: async (key: string, start: number, stop: number) => {
        try {
            if (process.env.KV_REST_API_URL) {
                const res = await vercelKv.lrange(key, start, stop);
                if (!res || res.length === 0) return (memoryStore[key] || []).slice(start, stop + 1);
                return res;
            }
            if (redisClient) {
                const res = await redisClient.lrange(key, start, stop);
                return res.map(item => typeof item === 'string' ? JSON.parse(item) : item);
            }
            return (memoryStore[key] || []).slice(start, stop + 1);
        } catch (e) {
            return (memoryStore[key] || []).slice(start, stop + 1);
        }
    },
    incr: async (key: string) => {
        try {
            if (process.env.KV_REST_API_URL) {
                return await vercelKv.incr(key);
            }
            if (redisClient) {
                return await redisClient.incr(key);
            }
            throw new Error("Local");
        } catch (e) {
            const val = (Number(memoryStore[key]) || 0) + 1;
            memoryStore[key] = val as any;
            return val;
        }
    },
    incrby: async (key: string, value: number) => {
        try {
            if (process.env.KV_REST_API_URL) {
                return await vercelKv.incrby(key, value);
            }
            if (redisClient) {
                return await redisClient.incrby(key, value);
            }
            throw new Error("Local");
        } catch (e) {
            const val = (Number(memoryStore[key]) || 0) + value;
            memoryStore[key] = val as any;
            return val;
        }
    },
    get: async <T = any>(key: string): Promise<T | null> => {
        try {
            if (process.env.KV_REST_API_URL) {
                const val = await vercelKv.get<T>(key);
                if (val === null || val === undefined) return (memoryStore[key] as T) || null;
                return val;
            }
            if (redisClient) {
                const val = await redisClient.get(key);
                if (val === null || val === undefined) return (memoryStore[key] as T) || null;
                try {
                    return JSON.parse(val) as T;
                } catch {
                    return val as any as T;
                }
            }
            return (memoryStore[key] as T) || null;
        } catch (e) {
            return (memoryStore[key] as T) || null;
        }
    }
};

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
