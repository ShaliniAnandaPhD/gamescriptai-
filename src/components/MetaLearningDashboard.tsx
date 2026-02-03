import React, { useState } from 'react';
import { Brain, Network, TrendingUp, Cpu, Activity } from 'lucide-react';

interface MetaLearningDashboardProps {
    episodes: any[];
}

export default function MetaLearningDashboard({ episodes }: MetaLearningDashboardProps) {
    const [correlations, setCorrelations] = useState<any[]>([]);
    const [patterns, setPatterns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'correlations' | 'patterns'>('correlations');

    const runAnalysis = async (action: string) => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5174/api/meta-learn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, episodes }),
            });
            const data = await res.json();

            if (data.success) {
                if (action === 'discover_correlations') setCorrelations(data.result);
                else if (action === 'identify_patterns') setPatterns(data.result);
            }
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gray-900/50 p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Brain className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-medium text-white tracking-tight">Meta-Learning Engine</h2>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mt-1">Version 2.5 Sophistication</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <Activity className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] font-mono text-green-400">ONLINE</span>
                </div>
            </div>

            {/* Controls */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-800 bg-[#0c0c0c]">
                <button
                    onClick={() => runAnalysis('discover_correlations')}
                    disabled={loading || episodes.length < 5}
                    className="group relative flex flex-col items-start p-4 bg-gray-900/30 hover:bg-gray-900/60 border border-gray-800 hover:border-indigo-500/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Network className="w-5 h-5 text-indigo-400" />
                        <span className="font-medium text-gray-200">Discover Correlations</span>
                    </div>
                    <p className="text-xs text-gray-500 text-left">Map how primitives influence each other across ${episodes.length} episodes.</p>
                </button>

                <button
                    onClick={() => runAnalysis('identify_patterns')}
                    disabled={loading || episodes.length < 5}
                    className="group relative flex flex-col items-start p-4 bg-gray-900/30 hover:bg-gray-900/60 border border-gray-800 hover:border-emerald-500/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="font-medium text-gray-200">Identify Patterns</span>
                    </div>
                    <p className="text-xs text-gray-500 text-left">Extract success patterns and configuration guardrails.</p>
                </button>
            </div>

            {/* Content Area */}
            <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar bg-black/40">
                {episodes.length < 5 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <Cpu className="w-12 h-12 text-gray-600 mb-4" />
                        <p className="text-sm text-gray-400">Meta-Learning requires at least 5 episodes of data.</p>
                        <p className="text-xs text-gray-600 mt-1 font-mono uppercase tracking-widest">Awaiting signal...</p>
                    </div>
                ) : loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-xs text-indigo-400 font-mono uppercase tracking-widest">Analyzing Neural Weights...</p>
                    </div>
                ) : correlations.length > 0 || patterns.length > 0 ? (
                    <div className="space-y-6">
                        {/* Tabs */}
                        <div className="flex gap-6 border-b border-gray-800 mb-6">
                            <button
                                onClick={() => setActiveTab('correlations')}
                                className={`pb-2 text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === 'correlations' ? 'text-indigo-400 border-b border-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Correlations
                            </button>
                            <button
                                onClick={() => setActiveTab('patterns')}
                                className={`pb-2 text-xs font-mono uppercase tracking-widest transition-colors ${activeTab === 'patterns' ? 'text-emerald-400 border-b border-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Success Patterns
                            </button>
                        </div>

                        {activeTab === 'correlations' && (
                            <div className="grid grid-cols-1 gap-3">
                                {correlations.map((corr, i) => (
                                    <div key={i} className="p-4 bg-gray-900/20 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-gray-800 rounded text-[10px] font-mono text-gray-300 uppercase">{corr.primitive_a.replace(/_/g, ' ')}</span>
                                                <span className="text-gray-600">↔</span>
                                                <span className="px-2 py-0.5 bg-gray-800 rounded text-[10px] font-mono text-gray-300 uppercase">{corr.primitive_b.replace(/_/g, ' ')}</span>
                                            </div>
                                            <div className={`text-sm font-mono ${corr.correlation_strength < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {(corr.correlation_strength * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed italic">"{corr.explanation}"</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'patterns' && (
                            <div className="grid grid-cols-1 gap-3">
                                {patterns.map((p, i) => (
                                    <div key={i} className="p-4 bg-gray-900/20 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-medium text-emerald-400">Insight #{i + 1}</span>
                                            <div className="text-[10px] font-mono text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded">n={p.frequency}</div>
                                        </div>
                                        <p className="text-sm text-gray-200 mb-3">{p.pattern}</p>
                                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded flex items-center gap-3">
                                            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <p className="text-xs text-emerald-300 font-mono uppercase tracking-tight">REC: {p.recommendation}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <p className="text-sm text-gray-500 mb-2">Ready for analysis.</p>
                        <p className="text-xs text-gray-700 font-mono uppercase tracking-widest">Select an engine above</p>
                    </div>
                )}
            </div>
        </div>
    );
}
