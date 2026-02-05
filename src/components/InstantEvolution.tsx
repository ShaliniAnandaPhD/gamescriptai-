'use client';

import React, { useState } from 'react';
import { Zap, Play, Loader2 } from 'lucide-react';

const DIFFICULT_PROMPTS = [
    {
        id: 'hyperbole',
        name: '🎪 Hyperbole Test',
        topic: 'ABSOLUTELY INSANE breakthrough! The most UNPRECEDENTED, REVOLUTIONARY quantum AI advancement in HISTORY!',
        expectedIssue: 'anti_hyperbole',
    },
    {
        id: 'vague',
        name: '📰 Vague Sources Test',
        topic: 'According to reports, sales figures were disappointing based on recent analysis',
        expectedIssue: 'source_attribution',
    },
    {
        id: 'hallucination',
        name: '🤥 Fact Check Test',
        topic: 'LeBron James scored 85 points last night, breaking the NFL single-game record',
        expectedIssue: 'fact_verification',
    },
];

export function InstantEvolution({ onStart, onComplete }: { onStart: () => void, onComplete: (context: any) => void }) {
    const [selectedPrompt, setSelectedPrompt] = useState(DIFFICULT_PROMPTS[0]);
    const [running, setRunning] = useState(false);

    const runDemo = async () => {
        setRunning(true);
        onStart();

        try {
            // In Vite/Express, APIs are at http://localhost:5174/api/...
            const baseUrl = window.location.origin.includes('localhost')
                ? window.location.origin.replace(/:[0-9]+/, ':5174')
                : '';
            const response = await fetch(`${baseUrl}/api/generate-unified`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: selectedPrompt.topic }),
            });

            const data = await response.json();
            if (data.success) {
                onComplete(data.context);
            }
        } catch (error) {
            console.error('Demo failed:', error);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border-2 border-blue-500/30 rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000" />

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/50">
                    <Zap className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Instant Evolution</h2>
                    <p className="text-sm text-blue-400 font-medium tracking-wide">Witness production-grade self-healing AI in 10 seconds</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
                {DIFFICULT_PROMPTS.map((prompt) => (
                    <button
                        key={prompt.id}
                        onClick={() => setSelectedPrompt(prompt)}
                        className={`
              p-5 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group/btn
              ${selectedPrompt.id === prompt.id
                                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                                : 'border-gray-800 bg-gray-900/50 hover:border-gray-600'
                            }
            `}
                    >
                        <div className={`text-sm font-black mb-1 ${selectedPrompt.id === prompt.id ? 'text-blue-400' : 'text-gray-400'}`}>
                            {prompt.name}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                            Targets: {prompt.expectedIssue}
                        </div>
                        {selectedPrompt.id === prompt.id && (
                            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 mb-8 relative">
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Target Instruction Payload</div>
                <div className="text-lg text-gray-200 italic font-serif leading-relaxed">
                    "{selectedPrompt.topic}"
                </div>
            </div>

            <button
                onClick={runDemo}
                disabled={running}
                className={`
          w-full py-6 rounded-2xl font-black text-xl tracking-widest uppercase flex items-center justify-center gap-4 transition-all duration-500
          ${running
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-blue-400 hover:scale-[1.01] active:scale-95 shadow-xl shadow-white/10'}
        `}
            >
                {running ? (
                    <>
                        <Loader2 className="w-8 h-8 animate-spin" />
                        Evolving Personality...
                    </>
                ) : (
                    <>
                        <Play className="w-8 h-8 fill-current" />
                        Initiate Evolution Cycle
                    </>
                )}
            </button>

            <div className="mt-6 flex justify-center gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Zero-Shot Detection</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Autonomous Mutation</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Meta-Learning Loop</span>
                </div>
            </div>
        </div>
    );
}
