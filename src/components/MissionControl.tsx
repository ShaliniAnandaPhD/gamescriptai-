'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Zap, Users, Brain, Shuffle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Stage {
    id: string;
    name: string;
    icon: any;
    status: 'pending' | 'active' | 'complete' | 'failed';
    latency?: number;
}

export function MissionControl({ runContext }: { runContext: any }) {
    const [stages, setStages] = useState<Stage[]>([
        { id: 'predict', name: 'Predict', icon: Activity, status: 'pending' },
        { id: 'generate', name: 'Generate', icon: Zap, status: 'pending' },
        { id: 'evaluate', name: 'Evaluate', icon: Users, status: 'pending' },
        { id: 'meta', name: 'Meta-Learn', icon: Brain, status: 'pending' },
        { id: 'mutate', name: 'Mutate', icon: Shuffle, status: 'pending' },
    ]);

    useEffect(() => {
        if (!runContext) return;

        setStages(prev => prev.map(stage => {
            if (stage.id === 'predict' && runContext.prediction) {
                return { ...stage, status: 'complete', latency: runContext.prediction.latency_ms };
            }
            if (stage.id === 'generate' && runContext.generation) {
                return { ...stage, status: 'complete', latency: runContext.generation.latency_ms };
            }
            if (stage.id === 'evaluate' && runContext.consensus) {
                const status = runContext.consensus.final_vote === 'pass' ? 'complete' : 'failed';
                return { ...stage, status, latency: runContext.consensus.latency_ms };
            }
            if (stage.id === 'meta' && runContext.meta_learning) {
                return { ...stage, status: 'complete', latency: runContext.meta_learning.latency_ms };
            }
            if (stage.id === 'mutate' && runContext.mutation) {
                return { ...stage, status: 'complete', latency: runContext.mutation.latency_ms };
            }

            // Handle active state
            if (runContext.final_status === 'in_progress') {
                if (!runContext.prediction && stage.id === 'predict') return { ...stage, status: 'active' };
                if (runContext.prediction && !runContext.generation && stage.id === 'generate') return { ...stage, status: 'active' };
                if (runContext.generation && !runContext.consensus && stage.id === 'evaluate') return { ...stage, status: 'active' };
                if (runContext.consensus?.final_vote === 'fail' && !runContext.meta_learning && stage.id === 'meta') return { ...stage, status: 'active' };
                if (runContext.meta_learning && !runContext.mutation && stage.id === 'mutate') return { ...stage, status: 'active' };
            }

            return stage;
        }));
    }, [runContext]);

    return (
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl p-6 mb-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                    <Activity className="w-6 h-6" />
                    Mission Control: Pipeline Status
                </h3>
                {runContext?.total_latency_ms && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                        <Clock className="w-4 h-4" />
                        Total: {(runContext.total_latency_ms / 1000).toFixed(2)}s
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                {/* Connection Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -z-10 hidden md:block" />

                {stages.map((stage, idx) => (
                    <div key={stage.id} className="flex flex-col items-center gap-3 w-full md:w-32">
                        <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border-2
              ${stage.status === 'complete' ? 'bg-green-500/10 border-green-500 text-green-500 shadow-lg shadow-green-500/20' :
                                stage.status === 'failed' ? 'bg-red-500/10 border-red-500 text-red-500 shadow-lg shadow-red-500/20' :
                                    stage.status === 'active' ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/20 animate-pulse' :
                                        'bg-gray-800 border-gray-700 text-gray-500'}
            `}>
                            <stage.icon className="w-8 h-8" />
                            {stage.status === 'complete' && <CheckCircle className="w-5 h-5 absolute top-1 right-1 bg-gray-900 rounded-full" />}
                            {stage.status === 'failed' && <XCircle className="w-5 h-5 absolute top-1 right-1 bg-gray-900 rounded-full" />}
                        </div>
                        <div className="text-center">
                            <div className={`text-sm font-bold capitalize ${stage.status !== 'pending' ? 'text-white' : 'text-gray-600'}`}>
                                {stage.name}
                            </div>
                            {stage.latency && (
                                <div className="text-[10px] text-blue-400 font-mono">
                                    {stage.latency}ms
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
