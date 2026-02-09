import { createRunContext, updateRunContext, RunContext, saveRunContext, kv } from './run-context';
import { predictQuality } from './predictive-quality';
import { generateBroadcastScript } from '../gemini-enhanced';
import { evaluateWithTunedConsensus } from './consensus-tuned';
import { calculateVisibleAdaptiveMutation } from './meta-learning-visible';
import { getPrimitives, updatePrimitive } from '../primitives';
import { runMockPipeline } from './mock-pipeline';

/**
 * UNIFIED PIPELINE - Orchestrates all 5 engines with full context
 */
export async function runUnifiedPipeline(
    topic: string,
    options?: { demo_mode?: boolean }
): Promise<RunContext> {
    const startTime = Date.now();
    const isDemo = options?.demo_mode === true;

    // Get current episode number for context
    let episodeNumber = 59;
    try {
        const val = await kv.get('total_episodes');
        episodeNumber = Number(val) || 59;
    } catch (e) {
        console.warn('Failed to get episode count, using fallback');
    }

    // Create run context
    let context = createRunContext(topic, episodeNumber);

    console.log(`\n🚀 Starting Unified Pipeline - Run ${context.run_id}`);
    console.log(`   Topic: "${topic}"`);
    if (isDemo) console.log(`   ⚡ DEMO MODE ACTIVE - Using Mock Pipeline`);

    if (isDemo) {
        const mockContext = await runMockPipeline(topic, episodeNumber);

        // Add artificial cinematic delay for the UI to show progress
        // even if the data is ready instantly
        await new Promise(r => setTimeout(r, 1000));

        await saveRunContext(mockContext);
        return mockContext;
    }

    try {
        // STAGE 1: PREDICTION
        console.log('\n📊 Stage 1: PREDICTIVE QUALITY ESTIMATION');
        const primitives = await getPrimitives();
        if (!isDemo) await new Promise(r => setTimeout(r, 800));
        const prediction = await predictQuality(topic, primitives);

        context = updateRunContext(context, 'prediction', {
            predicted_quality: prediction.predicted_quality,
            predicted_pass: prediction.predicted_quality >= 0.7,
            risk_factors: prediction.risk_factors,
            recommended_adjustments: prediction.recommended_adjustments,
            confidence: prediction.confidence,
            engine: 'predictive-quality',
            latency_ms: (prediction as any).latency_ms || 1500,
        });

        // STAGE 2: GENERATION
        console.log('\n✍️  Stage 2: GENERATION (Gemini 2.0 Flash)');
        if (!isDemo) await new Promise(r => setTimeout(r, 800));
        const generation = await generateBroadcastScript(topic, primitives);

        context = updateRunContext(context, 'generation', {
            model: generation.model || 'gemini-2.0-flash',
            draft_id: `draft_${Date.now()}`,
            script: generation.script,
            word_count: generation.metadata.word_count,
            estimated_duration_seconds: generation.metadata.estimated_duration_seconds,
            primitives_snapshot: primitives,
            primitives_hash: hashPrimitives(primitives),
            latency_ms: generation.latency_ms,
            engine: 'generation',
        });

        // STAGE 3: CONSENSUS EVALUATION
        console.log('\n🗣️  Stage 3: MULTI-AGENT CONSENSUS');
        if (!isDemo) await new Promise(r => setTimeout(r, 800));
        const consensus = await evaluateWithTunedConsensus(
            generation.script,
            topic,
            primitives
        );

        context = updateRunContext(context, 'consensus', {
            ...consensus,
            engine: 'multi-agent-consensus',
        } as any);

        // STAGE 4: META-LEARNING (triggered by failure OR dissent OR ambivalence)
        const hasDissent = Object.values(consensus.agent_votes).some((v: any) => v.vote === 'fail');
        const isAmbivalent = consensus.consensus_strength < 0.7;

        if (consensus.final_vote === 'fail' || hasDissent || isAmbivalent) {
            console.log('\n🧠 Stage 4: META-LEARNING ANALYSIS');
            if (hasDissent && consensus.final_vote === 'pass') console.log('   (Triggered by expert dissent despite overall pass)');
            if (isAmbivalent) console.log('   (Triggered by consensus ambivalence)');

            let episodes: any[] = [];
            try {
                episodes = await kv.lrange('run_contexts', 0, 49) || [];
            } catch (e) { }

            const metaLearning = await calculateVisibleAdaptiveMutation(
                consensus.primary_complaint || 'low_consensus_strength',
                consensus.primitive_scores,
                consensus.consensus_score,
                episodes
            );

            context = updateRunContext(context, 'meta_learning', {
                ...metaLearning,
                engine: 'meta-learning',
            });

            // STAGE 5: ADAPTIVE MUTATION (only if there are failed primitives)
            const primitivesToFix = Object.entries(consensus.primitive_scores)
                .filter(([_, score]) => score < 0.75) // Threshold for "needs improvement"
                .map(([primitive]) => primitive);

            if (primitivesToFix.length > 0) {
                console.log('\n🔄 Stage 5: ADAPTIVE MUTATION');
                const mutationStart = Date.now();
                const mutations = [];

                for (const primitive of primitivesToFix) {
                    if (!(primitive in primitives)) continue;

                    const currentValue = (primitives as any)[primitive];
                    const delta = metaLearning.recommended_mutation_size;
                    const newValue = Math.min(1.0, currentValue + delta);

                    await updatePrimitive(primitive, newValue);

                    mutations.push({
                        primitive,
                        old_value: currentValue,
                        new_value: newValue,
                        delta,
                        severity: 1 - consensus.primitive_scores[primitive],
                        reason: `${consensus.primary_complaint || 'Dissenting opinion'} - Meta-learning recommended ${delta.toFixed(3)}`,
                        meta_learning_informed: true,
                    });
                }

                context = updateRunContext(context, 'mutation', {
                    mutations_applied: mutations,
                    total_mutations: mutations.length,
                    expected_improvement: metaLearning.recommended_mutation_size * 100,
                    engine: 'adaptive-mutation',
                    latency_ms: Date.now() - mutationStart,
                });

                // STAGE 6: REGENERATION (only if it originally failed)
                if (consensus.final_vote === 'fail') {
                    console.log('\n🔁 Stage 6: REGENERATION');
                    const regenStart = Date.now();

                    const newPrimitives = await getPrimitives();
                    const regeneration = await generateBroadcastScript(topic, newPrimitives);
                    const reEval = await evaluateWithTunedConsensus(
                        regeneration.script,
                        topic,
                        newPrimitives
                    );

                    context = updateRunContext(context, 'regeneration', {
                        new_script: regeneration.script,
                        new_quality: reEval.consensus_score,
                        improvement: (reEval.consensus_score - consensus.consensus_score) * 100,
                        attempts: 1,
                        latency_ms: Date.now() - regenStart,
                    });

                    context.final_status = reEval.final_vote === 'pass' ? 'improved' : 'failed';
                } else {
                    context.final_status = 'passed';
                }
            } else {
                context.final_status = 'passed';
            }
        } else {
            context.final_status = 'passed';
        }

        // Finalize
        context.total_latency_ms = Date.now() - startTime;
        await saveRunContext(context);

        console.log(`\n✅ Pipeline Complete - Status: ${context.final_status}`);
        return context;

    } catch (error) {
        console.error('❌ Pipeline Error:', error);
        context.final_status = 'failed';
        context.total_latency_ms = Date.now() - startTime;
        await saveRunContext(context);
        throw error;
    }
}

function hashPrimitives(primitives: any): string {
    return Buffer.from(JSON.stringify(primitives)).toString('base64').substring(0, 12);
}
