'use client';

import { usePipeline } from '@/contexts/PipelineContext';

export function MutationHighlight() {
    const { currentRun } = usePipeline();

    if (!currentRun?.mutation) return null;

    const mutations = currentRun.mutation.mutations_applied || [];

    return (
        <div className="bg-gradient-to-r from-yellow-900/20 to-green-900/20 border-2 border-yellow-500/50 rounded-2xl p-6 mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <span>🔄</span>
                System Evolution Event
                <span className="text-sm text-yellow-400 font-normal ml-2 tracking-widest uppercase">Behavioral Primitives Updated</span>
            </h3>

            <div className="space-y-4">
                {mutations.map((mut: any, idx: number) => (
                    <div key={idx} className="bg-gray-900/80 border border-gray-700 rounded-xl p-5 shadow-2xl">
                        {/* ✅ PRIMITIVE NAME */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <span className="text-lg font-mono font-bold text-blue-300">
                                    {mut.primitive}
                                </span>
                                <span className="text-[10px] text-gray-500 ml-3 uppercase tracking-widest font-black">weight adjustment</span>
                            </div>
                        </div>

                        {/* ✅ BEFORE → AFTER WITH VISUAL DIFF */}
                        <div className="flex items-center gap-6 mb-4">
                            <div className="flex-1 bg-red-900/20 border border-red-600/50 rounded-lg p-4">
                                <div className="text-[10px] font-black text-red-400 mb-1 uppercase tracking-widest">BEFORE</div>
                                <div className="text-4xl font-black text-red-500">{mut.old_value.toFixed(2)}</div>
                            </div>

                            <div className="text-3xl font-black text-green-500 animate-pulse">→</div>

                            <div className="flex-1 bg-green-900/20 border border-green-600/50 rounded-lg p-4 font-black">
                                <div className="text-[10px] font-black text-green-400 mb-1 uppercase tracking-widest">AFTER</div>
                                <div className="text-4xl font-black text-green-500">{mut.new_value.toFixed(2)}</div>
                            </div>

                            <div className="px-5 py-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg text-center min-w-[100px]">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DELTA</div>
                                <div className="text-2xl font-black text-yellow-400">
                                    +{mut.delta.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* ✅ WHY IT CHANGED */}
                        {mut.reason && (
                            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                                <div className="text-[10px] font-black text-blue-400 mb-1 uppercase tracking-widest">WHY THIS CHANGED:</div>
                                <div className="text-sm text-gray-300 italic">"{mut.reason}"</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ✅ IMPACT SUMMARY */}
            {currentRun.regeneration && (
                <div className="mt-8 p-6 bg-green-900/30 border-2 border-green-500/50 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <div className="text-sm text-green-400 font-black tracking-widest uppercase">QUALITY IMPROVEMENT</div>
                            <div className="text-xs text-gray-400 mt-1 uppercase tracking-[0.1em]">
                                Script regenerated with updated primitives
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Before</div>
                                <div className="text-3xl font-black text-red-500">
                                    {currentRun.regeneration.quality_before?.toFixed(1) || '—'}
                                </div>
                            </div>
                            <span className="text-3xl font-black text-green-500 animate-pulse">→</span>
                            <div className="text-center">
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">After</div>
                                <div className="text-3xl font-black text-green-500">
                                    {currentRun.regeneration.quality_after?.toFixed(1) || '—'}
                                </div>
                            </div>
                            <div className="ml-4 px-6 py-3 bg-green-500/20 border border-green-500 rounded-xl shadow-lg">
                                <div className="text-4xl font-black text-green-400">
                                    +{currentRun.regeneration.improvement?.toFixed(1) || '0'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
