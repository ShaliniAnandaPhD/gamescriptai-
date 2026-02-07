'use client';

import { useState, useEffect } from 'react';
import { Activity, Zap, Users, Brain, Shuffle } from 'lucide-react';

interface PipelineStage {
    id: string;
    name: string;
    icon: any;
    status: 'idle' | 'active' | 'complete' | 'failed';
    latency?: number;
}

interface MissionControlProps {
    runContext?: any; // Pass run context from parent
    isRunning?: boolean;
}

export function MissionControl({ runContext, isRunning = false }: MissionControlProps) {
    const [stages, setStages] = useState<PipelineStage[]>([
        { id: 'predict', name: 'Predict', icon: Activity, status: 'idle' },
        { id: 'generate', name: 'Generate', icon: Zap, status: 'idle' },
        { id: 'evaluate', name: 'Evaluate', icon: Users, status: 'idle' },
        { id: 'meta-learn', name: 'Meta-Learn', icon: Brain, status: 'idle' },
        { id: 'mutate', name: 'Mutate', icon: Shuffle, status: 'idle' },
    ]);

    useEffect(() => {
        if (!runContext) return;

        // Update stages based on run context
        const updated = stages.map(stage => {
            if (runContext.prediction && stage.id === 'predict') {
                return { ...stage, status: 'complete' as const, latency: runContext.prediction.latency_ms };
            }
            if (runContext.generation && stage.id === 'generate') {
                return { ...stage, status: 'complete' as const, latency: runContext.generation.latency_ms };
            }
            if (runContext.consensus && stage.id === 'evaluate') {
                const status: 'complete' | 'failed' = runContext.consensus.gate_passed ? 'complete' : 'failed';
                return {
                    ...stage,
                    status,
                    latency: runContext.consensus.latency_ms
                };
            }
            if (runContext.meta_learning && stage.id === 'meta-learn') {
                return { ...stage, status: 'complete' as const, latency: runContext.meta_learning.latency_ms };
            }
            if (runContext.mutation && stage.id === 'mutate') {
                return { ...stage, status: 'complete' as const, latency: runContext.mutation.latency_ms };
            }
            return stage;
        });

        setStages(updated);
    }, [runContext]);

    useEffect(() => {
        if (isRunning) {
            // Simulate stage progression if running
            let currentStage = 0;
            const interval = setInterval(() => {
                if (currentStage < stages.length) {
                    setStages(prev => prev.map((stage, idx) => ({
                        ...stage,
                        status: idx === currentStage ? 'active' : idx < currentStage ? 'complete' : 'idle'
                    })));
                    currentStage++;
                } else {
                    clearInterval(interval);
                }
            }, 800);
            return () => clearInterval(interval);
        }
    }, [isRunning]);

    return (
        <div className="bg-gray-900/50 border border-blue-900/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Mission Control: Pipeline Status</h3>
            </div>

            <div className="flex flex-col gap-4">
                {stages.map((stage, idx) => {
                    const Icon = stage.icon;

                    return (
                        <div key={stage.id} className="flex items-center gap-4">
                            {/* Stage Icon */}
                            <div className={`
                w-16 h-16 rounded-xl flex items-center justify-center transition-all
                ${stage.status === 'idle' ? 'bg-gray-800 border-2 border-gray-700' : ''}
                ${stage.status === 'active' ? 'bg-blue-900/50 border-2 border-blue-500 animate-pulse' : ''}
                ${stage.status === 'complete' ? 'bg-green-900/50 border-2 border-green-500' : ''}
                ${stage.status === 'failed' ? 'bg-red-900/50 border-2 border-red-500' : ''}
              `}>
                                <Icon className={`w-8 h-8 ${stage.status === 'idle' ? 'text-gray-600' :
                                    stage.status === 'active' ? 'text-blue-400' :
                                        stage.status === 'complete' ? 'text-green-400' :
                                            'text-red-400'
                                    }`} />
                            </div>

                            {/* Stage Info */}
                            <div className="flex-1">
                                <div className="font-semibold text-white">{stage.name}</div>
                                <div className="text-sm text-gray-400">
                                    {stage.status === 'idle' && 'Waiting...'}
                                    {stage.status === 'active' && 'Processing...'}
                                    {stage.status === 'complete' && stage.latency && `Completed in ${stage.latency}ms`}
                                    {stage.status === 'complete' && !stage.latency && 'Completed'}
                                    {stage.status === 'failed' && 'Failed'}
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="text-right">
                                {stage.status === 'complete' && (
                                    <span className="text-2xl">✓</span>
                                )}
                                {stage.status === 'failed' && (
                                    <span className="text-2xl">✗</span>
                                )}
                                {stage.status === 'active' && (
                                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                )}
                            </div>

                            {/* Connector Line */}
                            {idx < stages.length - 1 && (
                                <div className="absolute left-8 mt-20 w-0.5 h-8 bg-gray-700" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            {runContext && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <div className="text-gray-500">Status</div>
                            <div className={`font-bold ${runContext.final_status === 'passed' ? 'text-green-400' :
                                runContext.final_status === 'improved' ? 'text-yellow-400' :
                                    'text-red-400'
                                }`}>
                                {runContext.final_status?.toUpperCase() || 'PENDING'}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-500">Total Time</div>
                            <div className="font-bold text-white">
                                {runContext.total_latency_ms || '—'}ms
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-500">Run ID</div>
                            <div className="font-mono text-xs text-gray-400">
                                {runContext.run_id?.substring(0, 8) || '—'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
