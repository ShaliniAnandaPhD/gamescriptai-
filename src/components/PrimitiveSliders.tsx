'use client';

import React from 'react';
import { Brain, TrendingUp } from 'lucide-react';

interface PrimitiveSlidersProps {
    primitives: Record<string, number>;
    highlightMutations?: string[];
    onUpdate?: (name: string, newValue: number) => void;
}

export function PrimitiveSliders({ primitives, highlightMutations = [], onUpdate }: PrimitiveSlidersProps) {
    const sortedKeys = Object.keys(primitives).sort();

    return (
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <Brain className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-gray-200">Behavioral Primitives</h3>
                <span className="text-xs text-gray-500 ml-auto uppercase tracking-widest">Manual Override Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedKeys.map((key) => {
                    const value = primitives[key] || 0;
                    const isMutated = highlightMutations.includes(key);

                    return (
                        <div
                            key={key}
                            className={`p-4 rounded-xl border transition-all duration-700 ${isMutated
                                ? 'bg-yellow-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/10'
                                : 'bg-gray-800/30 border-gray-700/50'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-gray-400 capitalize truncate max-w-[120px]">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-black/40 rounded-lg border border-gray-700 overflow-hidden">
                                        <button
                                            onClick={() => onUpdate?.(key, Math.max(0, value - 0.05))}
                                            className="px-2 py-1 hover:bg-white/10 text-gray-400 font-bold border-r border-gray-700"
                                        >
                                            -
                                        </button>
                                        <span className="px-2 py-1 text-[10px] font-mono text-blue-400 min-w-[35px] text-center">
                                            {(value * 100).toFixed(0)}%
                                        </span>
                                        <button
                                            onClick={() => onUpdate?.(key, Math.min(1, value + 0.05))}
                                            className="px-2 py-1 hover:bg-white/10 text-gray-400 font-bold border-l border-gray-700"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-700 ease-out rounded-full ${isMutated ? 'bg-yellow-400' :
                                        value > 0.8 ? 'bg-green-500' :
                                            value > 0.6 ? 'bg-blue-500' :
                                                'bg-red-500'
                                        }`}
                                    style={{ width: `${value * 100}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
