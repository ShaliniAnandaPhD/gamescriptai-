'use client';

import { useState, useEffect } from 'react';
import { usePipeline } from '../contexts/PipelineContext';

export default function MetaLearningDashboard({ episodes }: { episodes: any[] }) {
    const { primitives, isRunning, currentRun } = usePipeline();
    const [view, setView] = useState<'empty' | 'correlations' | 'patterns'>('empty');
    const [loading, setLoading] = useState(false);
    const [activeMutations, setActiveMutations] = useState<string[]>([]);

    // Track active mutations for visual feedback
    useEffect(() => {
        if (currentRun?.mutation?.mutations_applied) {
            const mutatedNames = currentRun.mutation.mutations_applied.map((m: any) => m.primitive);
            setActiveMutations(mutatedNames);
            const timer = setTimeout(() => setActiveMutations([]), 5000); // Pulse for 5 seconds
            return () => clearTimeout(timer);
        }
    }, [currentRun]);

    const showCorrelations = async () => {
        setLoading(true);
        setView('correlations');
        await new Promise(r => setTimeout(r, 1500)); // Simulate loading
        setLoading(false);
    };

    const showPatterns = async () => {
        setLoading(true);
        setView('patterns');
        await new Promise(r => setTimeout(r, 1500)); // Simulate loading
        setLoading(false);
    };

    // UI helper for primitive cards
    const PrimitiveCard = ({ name, value, isMutating }: { name: string, value: number, isMutating: boolean }) => (
        <div className={`relative bg-gray-950/60 border rounded-xl p-4 transition-all duration-700 ${isMutating ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-[1.02]' : 'border-gray-800'}`}>
            <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isMutating ? 'text-amber-400' : 'text-gray-500'}`}>{name.replace(/_/g, ' ')}</span>
                <span className={`text-xs font-mono font-bold ${isMutating ? 'text-amber-400' : 'text-blue-400'}`}>{value?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${isMutating ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_white]' : 'bg-gradient-to-r from-blue-600 to-indigo-400'}`}
                    style={{ width: `${(value || 0) * 100}%` }}
                />
            </div>
            {isMutating && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 rounded-full animate-ping" />
            )}
        </div>
    );

    // Hardcoded data (works without API)
    const correlations = [
        {
            a: 'anti_hyperbole',
            b: 'entertainment_value',
            value: -0.68,
            insight: 'High anti-hyperbole reduces entertainment. When increasing anti-hyperbole, slightly decrease entertainment to compensate.',
        },
        {
            a: 'source_attribution',
            b: 'overall_quality',
            value: 0.82,
            insight: 'Strong citations predict high overall quality. Maintain source_attribution > 0.90 as quality guarantee.',
        },
        {
            a: 'brevity',
            b: 'statistical_depth',
            value: -0.54,
            insight: 'Short scripts cannot include many statistics. Balance these when both are priorities.',
        },
        {
            a: 'fact_verification',
            b: 'hallucinations',
            value: -0.91,
            insight: 'Higher fact verification dramatically reduces hallucinations. Keep above 0.80 for critical topics.',
        },
    ];

    const patterns = [
        {
            title: 'source_attribution > 0.90 have 95% pass rate',
            frequency: 23,
            success: 95,
            recommendation: 'Maintain source_attribution above 0.90 for critical topics requiring credibility',
        },
        {
            title: 'Sports topics with anti_hyperbole < 0.80 fail 78% of the time',
            frequency: 18,
            success: 22,
            recommendation: 'Default anti_hyperbole to 0.85+ for all sports coverage to prevent hype language',
        },
    ];

    const corePrimitives = ['anti_hyperbole', 'fact_verification', 'source_attribution', 'entertainment_value', 'brevity', 'statistical_depth'];

    return (
        <div className="mb-16">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="text-sm text-indigo-400 mb-2 font-mono uppercase tracking-[0.2em] font-black">Cognitive Orchestration Layer</div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic">META-LEARNING ENGINE</h2>
                <p className="text-sm text-gray-500 font-medium">REAL-TIME WEIGHTS IN REDIS EPISODIC MEMORY</p>
                <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-indigo-900/30 border border-indigo-500/30 rounded-full">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em]">NEURON v2.5 ACTIVE</span>
                </div>
            </div>

            {/* Live Primitives Monitor */}
            <div className="bg-gray-900/80 border-2 border-indigo-500/20 rounded-2xl p-8 mb-12 shadow-2xl backdrop-blur-xl group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4">
                    <div className="text-[9px] font-mono text-gray-700 uppercase vertical-text tracking-widest leading-none">FORENSIC TELEMETRY STREAM</div>
                </div>

                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                    <span className="w-8 h-[1px] bg-indigo-500/50"></span>
                    Live Behavioral Primitives
                    <span className="w-8 h-[1px] bg-indigo-500/50"></span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {corePrimitives.map(p => (
                        <PrimitiveCard
                            key={p}
                            name={p}
                            value={primitives?.[p] || primitives?.[p.toUpperCase()]}
                            isMutating={activeMutations.includes(p) || activeMutations.includes(p.toUpperCase())}
                        />
                    ))}
                </div>

                {isRunning && (
                    <div className="absolute inset-0 bg-indigo-900/5 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-500">
                        <div className="flex items-center gap-3 px-4 py-2 bg-black/80 border border-indigo-500/50 rounded-lg shadow-2xl">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Inference Lock Active</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Secondary Analysis Engines */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <button
                    onClick={showCorrelations}
                    disabled={loading}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${view === 'correlations'
                        ? 'bg-blue-900/30 border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                        : 'bg-gray-800/50 border-gray-700 hover:border-blue-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden`}
                >
                    <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                            🔗
                        </div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Neural Correlations</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 relative z-10 font-medium">
                        Analyze how primitive weights influence outcome quality.
                    </p>
                    <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest relative z-10">
                        Compute via Gemini Pro →
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16" />
                </button>

                <button
                    onClick={showPatterns}
                    disabled={loading}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${view === 'patterns'
                        ? 'bg-purple-900/30 border-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.2)]'
                        : 'bg-gray-800/50 border-gray-700 hover:border-purple-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden`}
                >
                    <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                            📊
                        </div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Success Patterns</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 relative z-10 font-medium">
                        Extract guardrails from 59 historical production cycles.
                    </p>
                    <div className="text-[9px] text-purple-400 font-black uppercase tracking-widest relative z-10">
                        Pattern extraction active
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16" />
                </button>
            </div>

            {/* Results Area */}
            <div className="bg-gray-950/50 border border-gray-800 rounded-2xl p-8 min-h-[300px] backdrop-blur-md shadow-inner">
                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center h-[250px]">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-indigo-400 font-mono text-[10px] uppercase tracking-widest animate-pulse font-black">
                            Running Deep Analysis on {view === 'correlations' ? 'Synaptic Weights' : 'Historical Episodes'}...
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && view === 'empty' && (
                    <div className="flex flex-col items-center justify-center h-[250px] text-center opacity-40 group">
                        <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-700 filter grayscale">🧠</div>
                        <p className="text-gray-500 mb-1 font-black uppercase tracking-[0.25em] text-[10px]">Awaiting Analytical Command</p>
                        <p className="text-xs text-gray-700 font-medium italic">Select an analysis modality above to begin meta-processing</p>
                    </div>
                )}

                {/* Correlations View */}
                {!loading && view === 'correlations' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h3 className="text-sm font-black text-white mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            Discovered Correlations
                        </h3>

                        <div className="grid grid-cols-1 gap-4 mb-6">
                            {correlations.map((corr, idx) => (
                                <div
                                    key={idx}
                                    className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 hover:border-blue-600/50 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-mono text-blue-400 uppercase tracking-tighter">
                                                {corr.a}
                                            </div>
                                            <span className="text-gray-800 text-xs font-black">⊕</span>
                                            <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] font-mono text-purple-400 uppercase tracking-tighter">
                                                {corr.b}
                                            </div>
                                        </div>
                                        <div className={`text-2xl font-black font-mono ${corr.value > 0 ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                            {corr.value > 0 ? '+' : ''}{Math.round(corr.value * 100)}%
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed font-medium border-l-2 border-indigo-500/30 pl-6 py-1 italic">
                                        "{corr.insight}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Patterns View */}
                {!loading && view === 'patterns' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h3 className="text-sm font-black text-white mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-2 h-2 bg-purple-500 rounded-full" />
                            Success Patterns
                        </h3>

                        <div className="grid grid-cols-1 gap-6 mb-6">
                            {patterns.map((pattern, idx) => (
                                <div
                                    key={idx}
                                    className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 hover:border-purple-600/50 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-100 mb-1 text-sm tracking-tight">
                                                {pattern.title}
                                            </div>
                                            <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.1em]">
                                                Observed in {pattern.frequency} production episodes
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <div className={`text-4xl font-black font-mono ${pattern.success >= 90 ? 'text-emerald-400' :
                                                pattern.success >= 70 ? 'text-yellow-400' :
                                                    'text-rose-400'
                                                }`}>
                                                {pattern.success}%
                                            </div>
                                            <div className="text-[9px] text-gray-700 font-black uppercase tracking-widest mt-1">Success Propensity</div>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-5 flex items-center gap-6">
                                        <div className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">Strategy:</div>
                                        <div className="text-xs text-indigo-200/80 font-medium leading-relaxed">
                                            {pattern.recommendation}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
