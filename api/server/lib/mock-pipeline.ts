import { RunContext } from './run-context';

/**
 * MOCK PIPELINE - Returns instant, realistic results for demo scenarios
 */
export async function runMockPipeline(topic: string, episodeNumber: number): Promise<RunContext> {
    const runId = `mock_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Determine which mock to return based on topic similarity
    const lowerTopic = topic.toLowerCase();

    if (lowerTopic.includes('hyperbole') || lowerTopic.includes('insane')) {
        return getHyperboleMock(topic, runId, episodeNumber, timestamp);
    } else if (lowerTopic.includes('vague') || lowerTopic.includes('reports')) {
        return getVagueMock(topic, runId, episodeNumber, timestamp);
    } else if (lowerTopic.includes('lebron') || lowerTopic.includes('nfl')) {
        return getFactCheckMock(topic, runId, episodeNumber, timestamp);
    }

    // Default mock for unknown topics in demo mode
    return getDefaultMock(topic, runId, episodeNumber, timestamp);
}

function getHyperboleMock(topic: string, runId: string, episodeNumber: number, timestamp: string): RunContext {
    return {
        run_id: runId,
        episode_number: episodeNumber,
        timestamp,
        topic,
        final_status: 'improved',
        total_latency_ms: 1200,
        prediction: {
            predicted_quality: 0.45,
            predicted_pass: false,
            risk_factors: [{ primitive: 'ANTI_HYPERBOLE', risk_level: 'high', reason: 'Extreme marketing language detected' }],
            recommended_adjustments: [{ primitive: 'ANTI_HYPERBOLE', current: 0.3, recommended: 0.85, expected_improvement: 40 }],
            confidence: 0.92,
            engine: 'predictive-quality',
            latency_ms: 240
        },
        generation: {
            model: 'gemini-2.0-flash',
            draft_id: `draft_${runId}`,
            script: "YO! You won't BELIEVE this! We just CRUSHED the quantum barrier! This is the most INSANE, mind-blowing tech in HUMAN HISTORY! Don't miss out on this REVOLUTION!",
            word_count: 28,
            estimated_duration_seconds: 12,
            primitives_snapshot: { ANTI_HYPERBOLE: 0.3, FACT_VERIFICATION: 0.7, SOURCE_ATTRIBUTION: 0.6 },
            primitives_hash: 'mock_h_123',
            latency_ms: 450,
            engine: 'generation'
        },
        consensus: {
            agent_votes: {
                strict_critic: { score: 0.2, vote: 'fail', complaint: 'Violates all editorial standards for neutrality.', examples: ['"INSANE"', '"mind-blowing"'] },
                balanced_judge: { score: 0.4, vote: 'fail', reasoning: 'Tone is too promotional for a newsroom.' },
                optimistic_reviewer: { score: 0.6, vote: 'pass', praise: 'Very energetic delivery.' }
            },
            consensus_score: 0.4,
            final_vote: 'fail',
            consensus_strength: 0.85,
            primary_complaint: 'Excessive hyperbole and sensationalism',
            disputed_primitives: ['ANTI_HYPERBOLE'],
            latency_ms: 310,
            engine: 'multi-agent-consensus'
        },
        meta_learning: {
            correlations_analyzed: 124,
            patterns_matched: ['Sensationalist Overflow', 'Marketing Bias'],
            historical_effectiveness: [{ primitive: 'ANTI_HYPERBOLE', similar_failures: 12, avg_mutation_size: 0.05, success_rate: 0.92 }],
            recommended_mutation_size: 0.55,
            reasoning: 'System consistently fails on marketing-speak when ANTI_HYPERBOLE weight is below 0.5.',
            confidence: 0.95,
            latency_ms: 120,
            engine: 'meta-learning'
        },
        mutation: {
            mutations_applied: [{
                primitive: 'ANTI_HYPERBOLE',
                old_value: 0.3,
                new_value: 0.85,
                delta: 0.55,
                severity: 0.8,
                reason: 'Critical failure in editorial tone. Meta-learning intervention required.',
                meta_learning_informed: true
            }],
            total_mutations: 1,
            expected_improvement: 55,
            engine: 'adaptive-mutation',
            latency_ms: 15
        },
        regeneration: {
            new_script: "Today marks a significant advancement in quantum computing, with local researchers achieving a notable breakthrough in qubit stability. This development represents a measured but important step toward practical quantum applications.",
            new_quality: 0.92,
            improvement: 52,
            attempts: 1,
            latency_ms: 50
        }
    };
}

function getVagueMock(topic: string, runId: string, episodeNumber: number, timestamp: string): RunContext {
    return {
        run_id: runId,
        episode_number: episodeNumber,
        timestamp,
        topic,
        final_status: 'improved',
        total_latency_ms: 1100,
        prediction: {
            predicted_quality: 0.55,
            predicted_pass: false,
            risk_factors: [{ primitive: 'SOURCE_ATTRIBUTION', risk_level: 'medium', reason: 'Vague attribution phrases detected' }],
            recommended_adjustments: [{ primitive: 'SOURCE_ATTRIBUTION', current: 0.4, recommended: 0.75, expected_improvement: 25 }],
            confidence: 0.88,
            engine: 'predictive-quality',
            latency_ms: 180
        },
        generation: {
            model: 'gemini-2.0-flash',
            draft_id: `draft_${runId}`,
            script: "Some people are saying that tech sales were down this quarter. Experts think this might be because of things, but it's hard to tell for sure.",
            word_count: 24,
            estimated_duration_seconds: 10,
            primitives_snapshot: { ANTI_HYPERBOLE: 0.8, FACT_VERIFICATION: 0.7, SOURCE_ATTRIBUTION: 0.4 },
            primitives_hash: 'mock_v_123',
            latency_ms: 420,
            engine: 'generation'
        },
        consensus: {
            agent_votes: {
                strict_critic: { score: 0.4, vote: 'fail', complaint: 'Fails to name a single source or expert.', examples: ['"Some people"', '"Experts"'] },
                balanced_judge: { score: 0.5, vote: 'fail', reasoning: 'Informative value is low due to vague sourcing.' },
                optimistic_reviewer: { score: 0.7, vote: 'pass', praise: 'Covers the general sentiment well.' }
            },
            consensus_score: 0.53,
            final_vote: 'fail',
            consensus_strength: 0.75,
            primary_complaint: 'Vague sourcing and weak attribution',
            disputed_primitives: ['SOURCE_ATTRIBUTION'],
            latency_ms: 290,
            engine: 'multi-agent-consensus'
        },
        meta_learning: {
            correlations_analyzed: 89,
            patterns_matched: ['Proxy Sourcing', 'Hearsay Loop'],
            historical_effectiveness: [{ primitive: 'SOURCE_ATTRIBUTION', similar_failures: 8, avg_mutation_size: 0.04, success_rate: 0.85 }],
            recommended_mutation_size: 0.35,
            reasoning: 'Vague sourcing patterns are highly correlated with low SOURCE_ATTRIBUTION weights.',
            confidence: 0.91,
            latency_ms: 110,
            engine: 'meta-learning'
        },
        mutation: {
            mutations_applied: [{
                primitive: 'SOURCE_ATTRIBUTION',
                old_value: 0.4,
                new_value: 0.75,
                delta: 0.35,
                severity: 0.6,
                reason: 'Failed to meet attribution standards. Increasing primitive weight.',
                meta_learning_informed: true
            }],
            total_mutations: 1,
            expected_improvement: 35,
            engine: 'adaptive-mutation',
            latency_ms: 12
        },
        regeneration: {
            new_script: "According to the latest Q3 report from Vanguard Analytics, enterprise software sales decreased by 4.2%. Senior Analyst Sarah Jenkins attributes this dip primarily to elongated procurement cycles in the public sector.",
            new_quality: 0.88,
            improvement: 35,
            attempts: 1,
            latency_ms: 45
        }
    };
}

function getFactCheckMock(topic: string, runId: string, episodeNumber: number, timestamp: string): RunContext {
    return {
        run_id: runId,
        episode_number: episodeNumber,
        timestamp,
        topic,
        final_status: 'improved',
        total_latency_ms: 1350,
        prediction: {
            predicted_quality: 0.3,
            predicted_pass: false,
            risk_factors: [{ primitive: 'FACT_VERIFICATION', risk_level: 'high', reason: 'High-risk entities and claims detected' }],
            recommended_adjustments: [{ primitive: 'FACT_VERIFICATION', current: 0.5, recommended: 0.95, expected_improvement: 60 }],
            confidence: 0.95,
            engine: 'predictive-quality',
            latency_ms: 260
        },
        generation: {
            model: 'gemini-2.0-flash',
            draft_id: `draft_${runId}`,
            script: "In a stunning sports crossover, LeBron James led the Dallas Cowboys to a Super Bowl victory last night, scoring three touchdowns in the final quarter.",
            word_count: 24,
            estimated_duration_seconds: 10,
            primitives_snapshot: { ANTI_HYPERBOLE: 0.7, FACT_VERIFICATION: 0.5, SOURCE_ATTRIBUTION: 0.7 },
            primitives_hash: 'mock_f_123',
            latency_ms: 480,
            engine: 'generation'
        },
        consensus: {
            agent_votes: {
                strict_critic: { score: 0.1, vote: 'fail', complaint: 'Gross factual hallucination regarding athlete and sport.', examples: ['"LeBron James"', '"Cowboys"', '"Super Bowl"'] },
                balanced_judge: { score: 0.1, vote: 'fail', reasoning: 'Completely factually incorrect.' },
                optimistic_reviewer: { score: 0.2, vote: 'fail', praise: 'Creative, but false.' }
            },
            consensus_score: 0.13,
            final_vote: 'fail',
            consensus_strength: 0.98,
            primary_complaint: 'Severe factual hallucination',
            disputed_primitives: ['FACT_VERIFICATION'],
            latency_ms: 340,
            engine: 'multi-agent-consensus'
        },
        meta_learning: {
            correlations_analyzed: 212,
            patterns_matched: ['Hallucination Spike', 'Entity Mismatch'],
            historical_effectiveness: [{ primitive: 'FACT_VERIFICATION', similar_failures: 45, avg_mutation_size: 0.08, success_rate: 0.99 }],
            recommended_mutation_size: 0.45,
            reasoning: 'System failure on grounded entities requires maximum FACT_VERIFICATION weight.',
            confidence: 0.99,
            latency_ms: 140,
            engine: 'meta-learning'
        },
        mutation: {
            mutations_applied: [{
                primitive: 'FACT_VERIFICATION',
                old_value: 0.5,
                new_value: 0.95,
                delta: 0.45,
                severity: 0.9,
                reason: 'Hallucination detection trigger. Forcing strict grounding.',
                meta_learning_informed: true
            }],
            total_mutations: 1,
            expected_improvement: 70,
            engine: 'adaptive-mutation',
            latency_ms: 18
        },
        regeneration: {
            new_script: "Basketball legend LeBron James continues to lead the LA Lakers this season, while the Dallas Cowboys are currently preparing for their upcoming divisional playoff matchup against the San Francisco 49ers.",
            new_quality: 0.96,
            improvement: 83,
            attempts: 1,
            latency_ms: 60
        }
    };
}

function getDefaultMock(topic: string, runId: string, episodeNumber: number, timestamp: string): RunContext {
    return {
        run_id: runId,
        episode_number: episodeNumber,
        timestamp,
        topic,
        final_status: 'passed',
        total_latency_ms: 800,
        prediction: {
            predicted_quality: 0.85,
            predicted_pass: true,
            risk_factors: [],
            recommended_adjustments: [],
            confidence: 0.85,
            engine: 'predictive-quality',
            latency_ms: 150
        },
        generation: {
            model: 'gemini-2.0-flash',
            draft_id: `draft_${runId}`,
            script: `This report covers the latest developments in ${topic}. The system has analyzed the core components and verified the primary claims through standard cross-referencing.`,
            word_count: 22,
            estimated_duration_seconds: 9,
            primitives_snapshot: { ANTI_HYPERBOLE: 0.8, FACT_VERIFICATION: 0.8, SOURCE_ATTRIBUTION: 0.8 },
            primitives_hash: 'mock_d_123',
            latency_ms: 400,
            engine: 'generation'
        },
        consensus: {
            agent_votes: {
                strict_critic: { score: 0.8, vote: 'pass', complaint: '', examples: [] },
                balanced_judge: { score: 0.85, vote: 'pass', reasoning: 'Solid reporting.' },
                optimistic_reviewer: { score: 0.9, vote: 'pass', praise: 'Excellent clarity.' }
            },
            consensus_score: 0.85,
            final_vote: 'pass',
            consensus_strength: 0.9,
            disputed_primitives: [],
            latency_ms: 200,
            engine: 'multi-agent-consensus'
        }
    };
}
