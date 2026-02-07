'use client';

import { useState } from 'react';
import { Database, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { usePipeline } from '../contexts/PipelineContext';

export function ForensicAudit() {
    const { currentRun } = usePipeline();
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const downloadJSON = () => {
        if (!currentRun) return;

        const dataStr = JSON.stringify(currentRun, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `forensic-audit-${currentRun.run_id || 'unknown'}.json`;
        link.click();
    };

    if (!currentRun) {
        return (
            <div className="bg-gray-900/50 border border-purple-900/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Database className="w-6 h-6 text-purple-400" />
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white italic">Forensic System Audit</h3>
                        <p className="text-sm text-gray-500 font-mono">RUNID: PENDING</p>
                    </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
                    <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold tracking-tight">No run data available</p>
                    <p className="text-xs text-gray-600 mt-2 uppercase tracking-widest font-black">Execute a test to generate forensic audit trail</p>
                </div>
            </div>
        );
    }

    const sections = [
        { id: 'prediction', title: 'Stage 1: Prediction', data: currentRun.prediction, icon: '🔮' },
        { id: 'generation', title: 'Stage 2: Generation', data: currentRun.generation, icon: '⚡' },
        { id: 'consensus', title: 'Stage 3: Consensus', data: currentRun.consensus, icon: '👥' },
        { id: 'meta_learning', title: 'Stage 4: Meta-Learning', data: currentRun.meta_learning, icon: '🧠' },
        { id: 'mutation', title: 'Stage 5: Mutation', data: currentRun.mutation, icon: '🔄' },
        { id: 'regeneration', title: 'Stage 6: Regeneration', data: currentRun.regeneration, icon: '✨' },
    ];

    return (
        <div className="bg-gray-900/50 border border-purple-900/50 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-purple-400" />
                    <div>
                        <h3 className="text-xl font-bold text-white italic tracking-tight">Forensic System Audit</h3>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">RUNID: {currentRun.run_id || 'UNKNOWN'}</p>
                    </div>
                </div>

                <button
                    onClick={downloadJSON}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
                >
                    <Download className="w-3.5 h-3.5" />
                    Export JSON
                </button>
            </div>

            {/* Expandable Sections */}
            <div className="space-y-3">
                {sections.map((section) => {
                    if (!section.data) return null;

                    const isExpanded = expandedSections.has(section.id);

                    return (
                        <div key={section.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/70 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{section.icon}</span>
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-white tracking-tight">{section.title}</div>
                                        {section.data.latency_ms && (
                                            <div className="text-[10px] text-gray-500 font-mono">{section.data.latency_ms}ms</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {section.data.gate_passed !== undefined && (
                                        <span className={`text-lg ${section.data.gate_passed ? 'text-green-400' : 'text-red-400'}`}>
                                            {section.data.gate_passed ? '✓' : '✗'}
                                        </span>
                                    )}
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                    )}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="border-t border-gray-700/50 p-4 bg-black/40">
                                    <pre className="text-[10px] text-gray-400 overflow-x-auto font-mono leading-relaxed">
                                        {JSON.stringify(section.data, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="mt-6 pt-6 border-t border-gray-700/50">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-bold">Final Status</div>
                        <div
                            className={`text-xs font-black tracking-widest uppercase ${currentRun.final_status === 'passed'
                                    ? 'text-green-400'
                                    : currentRun.final_status === 'improved'
                                        ? 'text-yellow-400'
                                        : 'text-red-400'
                                }`}
                        >
                            {currentRun.final_status?.toUpperCase() || 'UNKNOWN'}
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-bold">Total Latency</div>
                        <div className="text-xs font-black text-white uppercase tracking-tight">{currentRun.total_latency_ms || 0}ms</div>
                    </div>

                    {currentRun.consensus && (
                        <div>
                            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-bold">Quality Score</div>
                            <div className="text-xs font-black text-blue-400 tracking-tight">
                                {currentRun.consensus.consensus_score?.toFixed(1) || '—'}
                            </div>
                        </div>
                    )}

                    {currentRun.mutation && (
                        <div>
                            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-bold">Mutations</div>
                            <div className="text-xs font-black text-yellow-400 tracking-tight">
                                {currentRun.mutation.mutations_applied?.length || 0}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
