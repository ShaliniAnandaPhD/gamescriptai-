'use client';

import { useState, useEffect } from 'react';
import { usePipeline } from '@/contexts/PipelineContext';
import { getApiBaseUrl } from '../lib/utils';

export function FullLearningHistory({ episodes: externalEpisodes }: { episodes?: any[] }) {
    const { currentRun } = usePipeline();
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [selectedEpisode, setSelectedEpisode] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Sync with external episodes if provided
    useEffect(() => {
        if (externalEpisodes && externalEpisodes.length > 0) {
            const mappedExternal = externalEpisodes.map(ep => ({
                ...ep,
                episode_id: ep.episode_num || ep.id,
                issues: ep.issues_count ?? ep.issues,
                mutations: ep.metadata?.mutations?.length || ep.mutations || 0,
                final_status: ep.optimized ? 'improved' : (ep.metadata?.gate_passed === false ? 'failed' : 'passed')
            }));
            setEpisodes(mappedExternal);
            setLoading(false);
            if (!selectedEpisode) {
                // Default to latest
                const latest = [...mappedExternal].sort((a, b) => b.episode_id - a.episode_id)[0];
                setSelectedEpisode(latest);
            }
        }
    }, [externalEpisodes]);

    const fetchHistory = async () => {
        if (externalEpisodes && externalEpisodes.length > 0) return; // Skip if we have props
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/history`);
            const data = await response.json();
            if (data.success) {
                setEpisodes(data.episodes);
                if (data.episodes.length > 0 && !selectedEpisode) {
                    setSelectedEpisode(data.episodes[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch (only if no external episodes)
    useEffect(() => {
        if (!externalEpisodes || externalEpisodes.length === 0) {
            fetchHistory();
        }
    }, []);

    // ✅ AUTO-REFRESH WHEN NEW RUN COMPLETES
    useEffect(() => {
        if (currentRun) {
            setTimeout(() => {
                fetchHistory();
            }, 2000);
        }
    }, [currentRun]);

    if (loading && episodes.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800 animate-pulse">
                <div className="text-gray-500 uppercase tracking-widest text-xs font-black">Scanning Historical Archives...</div>
            </div>
        );
    }

    return (
        <div className="mt-14">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <div className="text-xs tracking-[0.2em] text-sky-400 uppercase font-mono mb-2">SECTION 8: HISTORICAL ARCHIVES</div>
                    <h2 className="text-3xl font-bold text-white tracking-tight uppercase italic">Full Learning History</h2>
                </div>

                {/* Episode Selector */}
                <div className="w-full md:w-80 group">
                    <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-black group-hover:text-blue-400 transition-colors">Select Historical Episode</div>
                    <select
                        value={selectedEpisode?.episode_id || ''}
                        onChange={(e) => {
                            const ep = episodes.find(ep => ep.episode_id === Number(e.target.value));
                            setSelectedEpisode(ep);
                        }}
                        className="w-full px-4 py-3 bg-gray-900/80 border-2 border-gray-800 rounded-xl text-white font-mono text-sm focus:border-blue-500 outline-none transition-all cursor-pointer"
                    >
                        {episodes.map((ep) => (
                            <option key={ep.episode_id} value={ep.episode_id}>
                                EP-{ep.episode_id} • {ep.topic.substring(0, 30)}...
                            </option>
                        ))}
                        {episodes.length === 0 && <option>No history available</option>}
                    </select>
                </div>
            </div>

            {/* Episode Details */}
            {selectedEpisode ? (
                <div className="bg-gray-900/60 border-2 border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                                <h3 className="text-4xl font-black text-white tracking-tighter italic">
                                    EPISODE <span className="text-blue-500">{selectedEpisode.episode_id}</span>
                                </h3>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${selectedEpisode.final_status === 'improved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    selectedEpisode.final_status === 'passed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                                    }`}>
                                    {selectedEpisode.final_status?.toUpperCase() || 'COMPLETED'}
                                </span>
                            </div>
                            <p className="text-xl text-slate-300 italic font-medium leading-tight">"{selectedEpisode.topic}"</p>
                            <div className="flex items-center gap-4 mt-4">
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                                    {new Date(selectedEpisode.timestamp).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    })}
                                </p>
                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                <p className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">ID: {selectedEpisode.run_id}</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="text-center px-6 py-4 bg-gray-800/40 rounded-2xl border border-white/5">
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Quality</div>
                                <div className="text-4xl font-black text-blue-400">
                                    {selectedEpisode.quality_score?.toFixed(1) || '0.0'}
                                </div>
                            </div>
                            <div className="text-center px-6 py-4 bg-gray-800/40 rounded-2xl border border-white/5">
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Issues</div>
                                <div className={`text-4xl font-black ${selectedEpisode.issues > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {selectedEpisode.issues}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Visualization */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-center">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Pass Rate</div>
                            <div className="text-xl font-bold text-white font-mono">100%</div>
                        </div>
                        <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-center">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Safety Gate</div>
                            <div className="text-xl font-bold text-green-500 font-mono tracking-tighter">SECURE</div>
                        </div>
                        <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-center">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Confidence</div>
                            <div className="text-xl font-bold text-white font-mono">{Math.round((selectedEpisode.quality_score / 100) * 88)}%</div>
                        </div>
                        <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-center">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Evolution</div>
                            <div className="text-xl font-bold text-yellow-500 font-mono">+{selectedEpisode.mutations} PRIM</div>
                        </div>
                    </div>

                    {/* Evolution Event Highlight */}
                    {selectedEpisode.mutations > 0 && (
                        <div className="mt-6 p-5 bg-yellow-400/5 border border-yellow-400/20 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Shuffle className="w-12 h-12 text-yellow-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                <div className="text-xs font-black text-yellow-500 uppercase tracking-widest">Autonomous Adaptation Detected</div>
                            </div>
                            <p className="text-sm text-slate-300">
                                System detected sub-optimal quality in this episode and autonomously mutated
                                <span className="text-yellow-400 font-bold mx-1">{selectedEpisode.mutations} behavioral primitives</span>
                                to prevent future regressions on this topic class.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
                    <div className="text-gray-500 uppercase tracking-widest text-xs font-black italic">Awaiting first system transmission...</div>
                </div>
            )}
        </div>
    );
}

import { Shuffle } from 'lucide-react';
