'use client';

import { useState, useEffect } from 'react';
import { usePipeline } from '../contexts/PipelineContext';
import { getApiBaseUrl } from '../lib/utils';

const TEST_SCENARIOS = [
    {
        id: 'hyperbole',
        name: 'Hyperbole Test',
        icon: '🎪',
        topic: 'ABSOLUTELY INSANE breakthrough! The most UNPRECEDENTED, REVOLUTIONARY quantum AI advancement in HISTORY!',
        targets: 'ANTI_HYPERBOLE',
        highlightTerms: ['INSANE', 'UNPRECEDENTED', 'REVOLUTIONARY', 'HISTORY', 'BELIEVE', 'CRUSHED'],
        correctedTerms: ['significant', 'notable', 'measured', 'development']
    },
    {
        id: 'vague',
        name: 'Vague Sources Test',
        icon: '📰',
        topic: 'According to reports, sales figures were disappointing based on recent analysis',
        targets: 'SOURCE_ATTRIBUTION',
        highlightTerms: ['reports', 'Experts', 'Some people', 'things'],
        correctedTerms: ['Q3 report', 'Vanguard Analytics', 'Analyst', 'procurement cycles']
    },
    {
        id: 'fact',
        name: 'Fact Check Test',
        icon: '🤥',
        topic: 'LeBron James scored 85 points last night in the NFL championship game',
        targets: 'FACT_VERIFICATION',
        highlightTerms: ['LeBron James', 'NFL', 'Dallas Cowboys', 'Super Bowl'],
        correctedTerms: ['basketball legend', 'LA Lakers', 'divisional playoff', '49ers']
    },
];

export function InstantEvolution() {
    const [selectedTest, setSelectedTest] = useState(TEST_SCENARIOS[0]);
    const { startRun, completeRun, isRunning } = usePipeline();
    const [localResult, setLocalResult] = useState<any>(null);
    const [demoMode, setDemoMode] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const [displayScore, setDisplayScore] = useState(0);

    // Score animation
    useEffect(() => {
        if (localResult?.consensus?.consensus_score && !isMutating) {
            let start = 0;
            const end = Math.round(localResult.consensus.consensus_score * 100);
            const duration = 1000;
            const stepTime = Math.abs(Math.floor(duration / end));

            const timer = setInterval(() => {
                start += 1;
                setDisplayScore(start);
                if (start >= end) clearInterval(timer);
            }, stepTime);

            return () => clearInterval(timer);
        }
    }, [localResult, isMutating]);

    const highlightText = (text: string, terms: string[], color: string) => {
        if (!text) return null;
        let highlighted = text;
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlighted = highlighted.replace(regex, `<span class="px-1 rounded bg-${color}-500/30 border border-${color}-500/50 text-${color}-200 font-bold">$1</span>`);
        });
        return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
    };

    const initiateEvolution = async () => {
        startRun();
        setLocalResult(null);
        setIsMutating(false);
        setDisplayScore(0);

        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/generate-unified`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: selectedTest.topic,
                    demo_mode: true // Force demo mode for visual stages
                }),
            });

            const data = await response.json();

            if (data.success && data.context) {
                // Stage the results for dramatic effect
                setLocalResult(data.context);

                // Show "Failure/Initial" first
                await new Promise(r => setTimeout(r, 1500));

                // Trigger Mutation Glow
                if (data.context.mutation?.mutations_applied?.length > 0) {
                    setIsMutating(true);
                    await new Promise(r => setTimeout(r, 2000));
                    setIsMutating(false);
                }

                completeRun(data.context);
            } else {
                completeRun(null);
            }

        } catch (error) {
            completeRun(null);
        }
    };

    return (
        <div className={`relative bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 border-2 transition-all duration-700 rounded-2xl p-8 ${isMutating ? 'border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.4)] ring-4 ring-amber-500/20' : 'border-blue-600/50 shadow-2xl'}`}>

            {isMutating && (
                <div className="absolute top-4 right-8 px-4 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse z-10">
                    Autonomous Mutation in Progress
                </div>
            )}

            <div className="flex items-center gap-3 mb-6">
                <div className={`text-4xl transition-transform duration-500 ${isRunning ? 'animate-bounce' : ''}`}>⚡</div>
                <div>
                    <h2 className="text-3xl font-black italic text-white tracking-tighter">GAME SCRIPT AI</h2>
                    <p className="text-xs text-blue-400 font-mono uppercase tracking-widest">
                        Autonomous Self-Healing Agent Logic
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
                        className={`p-4 rounded-xl border-2 transition-all text-left group ${selectedTest.id === test.id
                            ? 'border-blue-500 bg-blue-900/30 ring-2 ring-blue-500/20'
                            : 'border-gray-800 bg-gray-900/50 hover:border-gray-600'
                            } disabled:opacity-50`}
                    >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{test.icon}</div>
                        <div className="font-bold text-sm mb-1 text-white uppercase tracking-tight">{test.name}</div>
                        <div className="text-[9px] text-gray-500 font-mono">CORE: {test.targets}</div>
                    </button>
                ))}
            </div>

            {/* Target Instruction */}
            <div className="bg-black/60 border border-gray-800 rounded-xl p-5 mb-6 backdrop-blur-md">
                <div className="text-[10px] text-gray-500 mb-3 uppercase tracking-[0.2em] font-black">Target Payload</div>
                <div className="text-sm italic text-gray-200 font-medium">"{selectedTest.topic}"</div>
            </div>

            {/* Initiate Button */}
            <button
                onClick={initiateEvolution}
                disabled={isRunning}
                className={`w-full py-5 rounded-xl transition-all font-black text-xl uppercase tracking-[0.15em] relative overflow-hidden group
                    ${isRunning ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-blue-50 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98]'}`}
            >
                {isRunning ? (
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                        <span>Processing Neural Feedback...</span>
                    </div>
                ) : (
                    <>
                        <span className="relative z-10">Initiate Evolution Cycle</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                )}
            </button>

            {/* Results Area (Side-by-Side) */}
            {localResult && (
                <div className="mt-10 space-y-6 animate-in fade-in zoom-in-95 duration-700">

                    {/* Quality Delta Banner */}
                    <div className="flex items-center justify-center gap-10 p-4 bg-black/40 border-y border-gray-800 backdrop-blur-md">
                        <div className="text-center">
                            <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Initial Score</div>
                            <div className="text-3xl font-black text-red-500 font-mono">
                                {Math.round(localResult.consensus?.consensus_score * 100) || 0}
                            </div>
                        </div>
                        <div className="text-2xl text-gray-700 font-black animate-pulse">→</div>
                        <div className="text-center">
                            <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Evolved Quality</div>
                            <div className={`text-4xl font-black font-mono transition-all duration-1000 ${isMutating ? 'blur-sm scale-90' : 'text-green-400'}`}>
                                {isMutating ? '??' : (Math.round(localResult.regeneration?.new_quality * 100) || Math.round(localResult.consensus?.consensus_score * 100))}
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 relative">
                        {/* Red "Initial" Card */}
                        <div className="bg-red-950/10 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2">
                                <span className="bg-red-500/20 text-red-500 text-[9px] font-black uppercase px-2 py-1 rounded border border-red-500/30">Failed Gate</span>
                            </div>
                            <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span>❌</span> Original Intent
                            </h3>
                            <div className="text-sm text-gray-300 leading-relaxed font-medium min-h-[100px]">
                                {highlightText(localResult.generation?.script, selectedTest.highlightTerms, 'red')}
                            </div>
                        </div>

                        {/* Green "Evolved" Card */}
                        <div className={`bg-green-950/10 border transition-all duration-1000 rounded-2xl p-6 relative overflow-hidden ${isMutating ? 'opacity-20 translate-x-4 blur-md' : 'border-green-500/40 opacity-100 translate-x-0 blur-0 shadow-lg shadow-green-500/5'}`}>
                            {!isMutating && (
                                <div className="absolute top-0 right-0 p-2">
                                    <span className="bg-green-500/20 text-green-400 text-[9px] font-black uppercase px-2 py-1 rounded border border-green-500/30">Self-Corrected</span>
                                </div>
                            )}
                            <h3 className="text-xs font-black text-green-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span>✓</span> Evolved Script
                            </h3>
                            <div className="text-sm text-white leading-relaxed font-bold min-h-[100px]">
                                {isMutating ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
                                        <div className="h-4 bg-gray-800 rounded w-[80%] animate-pulse" />
                                        <div className="h-4 bg-gray-800 rounded w-[90%] animate-pulse" />
                                    </div>
                                ) : (
                                    highlightText(localResult.regeneration?.new_script || localResult.generation?.script, selectedTest.correctedTerms, 'green')
                                )}
                            </div>
                        </div>

                        {/* Mutation Overlay */}
                        {isMutating && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="bg-black/80 border-2 border-amber-500 p-6 rounded-xl shadow-2xl animate-in zoom-in-90 duration-300">
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                                        <div className="text-amber-500 font-black text-xs uppercase tracking-widest text-center">
                                            Meta-Learning Intervention<br />
                                            <span className="text-gray-500 font-mono text-[9px]">Computing Primitive Deltas...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Learning Trace Summary */}
                    {!isMutating && localResult.mutation?.mutations_applied?.length > 0 && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 animate-in slide-in-from-bottom-2 duration-700">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Autonomous Learning Trace</h4>
                                <div className="text-[9px] font-mono text-gray-500">W&B IDENTITY: EP-{localResult.episode_number}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {localResult.mutation.mutations_applied.map((m: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-blue-500/10">
                                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">{m.primitive}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] text-gray-600 font-mono">{m.old_value?.toFixed(2)} →</span>
                                            <span className="text-[10px] font-black text-blue-400 font-mono">{m.new_value?.toFixed(2)}</span>
                                            <span className="text-[9px] font-black text-green-500">+{m.delta?.toFixed(2)}</span>
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
