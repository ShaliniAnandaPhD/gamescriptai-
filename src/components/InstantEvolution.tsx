'use client';

import { useState } from 'react';
import { usePipeline } from '../contexts/PipelineContext';
import { getApiBaseUrl } from '../lib/utils';

const TEST_SCENARIOS = [
    {
        id: 'hyperbole',
        name: 'Hyperbole Test',
        icon: '🎪',
        topic: 'ABSOLUTELY INSANE breakthrough! The most UNPRECEDENTED, REVOLUTIONARY quantum AI advancement in HISTORY!',
        targets: 'ANTI_HYPERBOLE',
    },
    {
        id: 'vague',
        name: 'Vague Sources Test',
        icon: '📰',
        topic: 'According to reports, sales figures were disappointing based on recent analysis',
        targets: 'SOURCE_ATTRIBUTION',
    },
    {
        id: 'fact',
        name: 'Fact Check Test',
        icon: '🤥',
        topic: 'LeBron James scored 85 points last night in the NFL championship game',
        targets: 'FACT_VERIFICATION',
    },
];

export function InstantEvolution() {
    const [selectedTest, setSelectedTest] = useState(TEST_SCENARIOS[0]);
    const { startRun, completeRun, isRunning } = usePipeline();
    const [localResult, setLocalResult] = useState<any>(null);

    const initiateEvolution = async () => {
        startRun(); // Notify context
        setLocalResult(null);

        try {
            // In Vite/Express, APIs are at http://localhost:5174/api/...
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/generate-unified`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: selectedTest.topic }),
            });

            const data = await response.json();

            if (data.success && data.context) {
                setLocalResult(data.context);
                completeRun(data.context); // Update context with full data
            } else {
                console.error('API returned error:', data);
                completeRun(null);
            }

        } catch (error) {
            console.error('Evolution cycle failed:', error);
            completeRun(null);
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-blue-900/40 border-2 border-blue-600/50 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">⚡</div>
                <div>
                    <h2 className="text-3xl font-bold italic text-white">INSTANT EVOLUTION</h2>
                    <p className="text-sm text-gray-400">
                        Witness production-grade self-healing AI in 10 seconds
                    </p>
                </div>
            </div>

            {/* Test Selection */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                {TEST_SCENARIOS.map((test) => (
                    <button
                        key={test.id}
                        onClick={() => setSelectedTest(test)}
                        disabled={isRunning}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${selectedTest.id === test.id
                            ? 'border-blue-500 bg-blue-900/30'
                            : 'border-gray-700 bg-gray-800/30 hover:border-blue-700'
                            } disabled:opacity-50`}
                    >
                        <div className="text-3xl mb-2">{test.icon}</div>
                        <div className="font-semibold mb-1 text-white">{test.name}</div>
                        <div className="text-xs text-gray-500 font-mono">TARGETS: {test.targets}</div>
                    </button>
                ))}
            </div>

            {/* Target Instruction */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-bold">Target Instruction Payload</div>
                <div className="text-sm italic text-gray-300">"{selectedTest.topic}"</div>
            </div>

            {/* Initiate Button */}
            <button
                onClick={initiateEvolution}
                disabled={isRunning}
                className="w-full py-6 bg-white hover:bg-gray-100 disabled:bg-gray-700 
                   text-black font-bold text-xl rounded-lg transition-all
                   disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest"
            >
                {isRunning ? (
                    <>
                        <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Running Evolution...
                    </>
                ) : (
                    <>
                        <span>▶</span>
                        Initiate Evolution Cycle
                    </>
                )}
            </button>

            <div className="flex items-center justify-center gap-6 mt-4 text-[10px] font-black tracking-widest uppercase">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400">Zero-Shot Detection</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-400">Autonomous Mutation</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    <span className="text-purple-400">Meta-Learning Loop</span>
                </div>
            </div>

            {/* Local Results Display */}
            {localResult && (
                <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Before */}
                        {localResult.consensus && (
                            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-4">
                                <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span>❌</span> Initial Result
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Quality Score</span>
                                    <span className="text-lg font-black text-red-500">{localResult.consensus.consensus_score?.toFixed(1) || '—'}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {localResult.consensus.final_vote === 'fail' ? 'Failed quality gate' : 'Marginal quality'}
                                </div>
                            </div>
                        )}

                        {/* After */}
                        {localResult.regeneration && (
                            <div className="bg-green-900/10 border border-green-500/30 rounded-xl p-4">
                                <div className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span>✓</span> Self-Healed
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">New Quality</span>
                                    <span className="text-lg font-black text-green-500">{localResult.regeneration.quality_after?.toFixed(1) || '—'}</span>
                                </div>
                                <div className="text-xs text-green-400 font-bold mt-1">
                                    Improvement: +{localResult.regeneration.improvement?.toFixed(1) || '0'} points
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mutation Trace */}
                    {localResult.mutation && localResult.mutation.mutations_applied?.length > 0 && (
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                            <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="animate-spin-slow">🔄</span> Learning Event Traced
                            </div>
                            <div className="space-y-2">
                                {localResult.mutation.mutations_applied?.map((mut: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-yellow-500/10">
                                        <span className="text-[10px] font-mono text-gray-400 uppercase">{mut.primitive}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-gray-600 font-mono">{mut.old_value?.toFixed(2)} →</span>
                                            <span className="text-[10px] font-black text-yellow-400 font-mono">{mut.new_value?.toFixed(2)}</span>
                                            <span className="text-[10px] font-black text-green-500">+{mut.delta?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
