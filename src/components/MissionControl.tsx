'use client';

import { useEffect, useState, useRef } from 'react';
import { Activity, Zap, Users, Brain, Shuffle } from 'lucide-react';
import { usePipeline } from '../contexts/PipelineContext';

interface Stage {
    id: string;
    name: string;
    icon: any;
    status: 'idle' | 'active' | 'complete' | 'failed';
    latency?: number;
}

const INITIAL_STAGES: Stage[] = [
    { id: 'predict', name: 'Predict', icon: Activity, status: 'idle' },
    { id: 'generate', name: 'Generate', icon: Zap, status: 'idle' },
    { id: 'evaluate', name: 'Evaluate', icon: Users, status: 'idle' },
    { id: 'meta-learn', name: 'Meta-Learn', icon: Brain, status: 'idle' },
    { id: 'mutate', name: 'Mutate', icon: Shuffle, status: 'idle' },
];

export function MissionControl() {
    const { currentRun, isRunning } = usePipeline();
    const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
    const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Effect 1: React to final run results
    useEffect(() => {
        if (!currentRun) {
            if (!isRunning) {
                setStages(INITIAL_STAGES);
            }
            return;
        }

        // Stop any ongoing simulation
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }

        // Map results to stages
        setStages(prev => prev.map(stage => {
            if (stage.id === 'predict' && currentRun.prediction) {
                return { ...stage, status: 'complete' as const, latency: currentRun.prediction.latency_ms };
            }
            if (stage.id === 'generate' && currentRun.generation) {
                return { ...stage, status: 'complete' as const, latency: currentRun.generation.latency_ms };
            }
            if (stage.id === 'evaluate' && currentRun.consensus) {
                return {
                    ...stage,
                    status: (currentRun.consensus.gate_passed ? 'complete' : 'failed') as 'complete' | 'failed',
                    latency: currentRun.consensus.latency_ms,
                };
            }
            if (stage.id === 'meta-learn' && currentRun.meta_learning) {
                return { ...stage, status: 'complete' as const, latency: currentRun.meta_learning.latency_ms };
            }
            if (stage.id === 'mutate' && currentRun.mutation) {
                return { ...stage, status: 'complete' as const, latency: currentRun.mutation.latency_ms };
            }
            // If run complete but stage not in result (skipped), mark as complete if it's before a completed stage
            return stage;
        }));
    }, [currentRun, isRunning]);

    // Effect 2: Simulation loop while running
    useEffect(() => {
        if (isRunning && !currentRun) {
            let currentStageIdx = 0;

            // Reset to idle before starting simulation
            setStages(INITIAL_STAGES);

            simulationIntervalRef.current = setInterval(() => {
                setStages(prev => {
                    if (currentStageIdx >= prev.length) {
                        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
                        return prev;
                    }

                    const newState = prev.map((s, idx) => {
                        if (idx === currentStageIdx) return { ...s, status: 'active' as const };
                        if (idx < currentStageIdx) return { ...s, status: 'complete' as const };
                        return s;
                    });

                    currentStageIdx++;
                    return newState;
                });
            }, 800);

            return () => {
                if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            };
        }
    }, [isRunning, !!currentRun]);

    return (
        <div className="bg-gray-900/50 border border-blue-900/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white tracking-tight">Mission Control: Pipeline Status</h3>
            </div>

            <div className="flex flex-col gap-4">
                {stages.map((stage) => {
                    const Icon = stage.icon;

                    return (
                        <div key={stage.id} className="flex items-center gap-4">
                            <div
                                className={`
                w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300
                ${stage.status === 'idle' ? 'bg-gray-800/50 border-2 border-gray-700/50' : ''}
                ${stage.status === 'active' ? 'bg-blue-900/40 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse' : ''}
                ${stage.status === 'complete' ? 'bg-green-900/40 border-2 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : ''}
                ${stage.status === 'failed' ? 'bg-red-900/40 border-2 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}
              `}
                            >
                                <Icon
                                    className={`w-8 h-8 ${stage.status === 'idle'
                                            ? 'text-gray-600'
                                            : stage.status === 'active'
                                                ? 'text-blue-400'
                                                : stage.status === 'complete'
                                                    ? 'text-green-400'
                                                    : 'text-red-400'
                                        }`}
                                />
                            </div>

                            <div className="flex-1">
                                <div className="font-bold text-white tracking-tight">{stage.name}</div>
                                <div className="text-[10px] font-mono uppercase tracking-widest mt-1">
                                    {stage.status === 'idle' && <span className="text-gray-600">Waiting...</span>}
                                    {stage.status === 'active' && <span className="text-blue-400">Processing...</span>}
                                    {stage.status === 'complete' && (
                                        <span className="text-green-500/80">
                                            {stage.latency ? `Completed in ${stage.latency}ms` : 'Success'}
                                        </span>
                                    )}
                                    {stage.status === 'failed' && <span className="text-red-400">Failed</span>}
                                </div>
                            </div>

                            <div className="text-right">
                                {stage.status === 'complete' && <span className="text-2xl text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">✓</span>}
                                {stage.status === 'failed' && <span className="text-2xl text-red-400">✗</span>}
                                {stage.status === 'active' && (
                                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-8 pt-6 border-t border-gray-800/50">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-black">Status</div>
                        <div
                            className={`text-xs font-black tracking-widest uppercase ${isRunning
                                    ? 'text-blue-400 animate-pulse'
                                    : currentRun?.final_status === 'passed'
                                        ? 'text-green-400'
                                        : currentRun?.final_status === 'improved'
                                            ? 'text-yellow-400'
                                            : currentRun?.final_status === 'failed'
                                                ? 'text-red-400'
                                                : 'text-gray-600'
                                }`}
                        >
                            {isRunning ? 'IN_PROGRESS' : currentRun?.final_status?.toUpperCase() || 'IDLE'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-black">Total Time</div>
                        <div className="text-xs font-black text-white">
                            {currentRun?.total_latency_ms ? `${currentRun.total_latency_ms}ms` : '—'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-black">Run ID</div>
                        <div className="font-mono text-[10px] text-gray-400 truncate">
                            {currentRun?.run_id ? currentRun.run_id.substring(0, 12) : 'pending—'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
