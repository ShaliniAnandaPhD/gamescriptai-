'use client';

import { useState } from 'react';
import { Database, ChevronDown, ChevronRight, Download } from 'lucide-react';

interface ForensicAuditProps {
    runContext?: any;
}

export function ForensicAudit({ runContext }: ForensicAuditProps) {
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
        if (!runContext) return;

        const dataStr = JSON.stringify(runContext, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `forensic-audit-${runContext.run_id || 'unknown'}.json`;
        link.click();
    };

    if (!runContext) {
        return (
            <div className="bg-gray-900/50 border border-purple-900/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Database className="w-6 h-6 text-purple-400" />
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white italic">Forensic System Audit</h3>
                        <p className="text-sm text-gray-500 font-mono">
                            RUNID: PENDING
                        </p>
                    </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
                    <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No run data available</p>
                    <p className="text-sm text-gray-600 mt-1">
                        Execute a test to generate forensic audit trail
                    </p>
                </div>
            </div>
        );
    }

    const sections = [
        {
            id: 'prediction',
            title: 'Stage 1: Prediction',
            color: 'blue',
            data: runContext.prediction,
            icon: '🔮',
        },
        {
            id: 'generation',
            title: 'Stage 2: Generation',
            color: 'green',
            data: runContext.generation,
            icon: '⚡',
        },
        {
            id: 'consensus',
            title: 'Stage 3: Consensus Evaluation',
            color: 'purple',
            data: runContext.consensus,
            icon: '👥',
        },
        {
            id: 'meta_learning',
            title: 'Stage 4: Meta-Learning',
            color: 'yellow',
            data: runContext.meta_learning,
            icon: '🧠',
        },
        {
            id: 'mutation',
            title: 'Stage 5: Mutation',
            color: 'orange',
            data: runContext.mutation,
            icon: '🔄',
        },
        {
            id: 'regeneration',
            title: 'Stage 6: Regeneration',
            color: 'cyan',
            data: runContext.regeneration,
            icon: '✨',
        },
    ];

    return (
        <div className="bg-gray-900/50 border border-purple-900/50 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-purple-400" />
                    <div>
                        <h3 className="text-xl font-bold text-white italic">Forensic System Audit</h3>
                        <p className="text-sm text-gray-500 font-mono">
                            RUNID: {runContext.run_id || 'UNKNOWN'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={downloadJSON}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold transition-all"
                >
                    <Download className="w-4 h-4" />
                    Export JSON
                </button>
            </div>

            {/* Expandable Sections */}
            <div className="space-y-3">
                {sections.map(section => {
                    if (!section.data) return null;

                    const isExpanded = expandedSections.has(section.id);

                    return (
                        <div
                            key={section.id}
                            className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden"
                        >
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/70 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{section.icon}</span>
                                    <div className="text-left">
                                        <div className="font-semibold text-white">{section.title}</div>
                                        {section.data.latency_ms && (
                                            <div className="text-xs text-gray-500">
                                                {section.data.latency_ms}ms
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {section.data.gate_passed !== undefined && (
                                        <span className={`text-xl ${section.data.gate_passed ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {section.data.gate_passed ? '✓' : '✗'}
                                        </span>
                                    )}
                                    {isExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Section Content */}
                            {isExpanded && (
                                <div className="border-t border-gray-700 p-4 bg-gray-900/30">
                                    <pre className="text-xs text-gray-300 overflow-x-auto font-mono">
                                        {JSON.stringify(section.data, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <div className="text-gray-500 mb-1">Final Status</div>
                        <div className={`font-bold ${runContext.final_status === 'passed' ? 'text-green-400' :
                                runContext.final_status === 'improved' ? 'text-yellow-400' :
                                    'text-red-400'
                            }`}>
                            {runContext.final_status?.toUpperCase() || 'UNKNOWN'}
                        </div>
                    </div>

                    <div>
                        <div className="text-gray-500 mb-1">Total Latency</div>
                        <div className="font-bold text-white">
                            {runContext.total_latency_ms || 0}ms
                        </div>
                    </div>

                    {runContext.consensus && (
                        <div>
                            <div className="text-gray-500 mb-1">Quality Score</div>
                            <div className="font-bold text-blue-400">
                                {runContext.consensus.consensus_score?.toFixed(1) || '—'}
                            </div>
                        </div>
                    )}

                    {runContext.mutation && (
                        <div>
                            <div className="text-gray-500 mb-1">Mutations</div>
                            <div className="font-bold text-yellow-400">
                                {runContext.mutation.mutations_applied?.length || 0}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
