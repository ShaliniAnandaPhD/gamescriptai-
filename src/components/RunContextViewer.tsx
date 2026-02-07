'use client';

import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Database } from 'lucide-react';

export function RunContextViewer({ context }: { context: any }) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['consensus', 'meta']));

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    if (!context) return null;

    return (
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 shadow-3x">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-4">
                <Database className="w-6 h-6 text-purple-500" />
                <div>
                    <h3 className="text-xl font-bold text-gray-100 italic tracking-tight">Forensic System Audit</h3>
                    <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mt-1">RunID: {context.run_id}</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Prediction Section */}
                {context.prediction && (
                    <AuditSection
                        title="Stage 1: Adaptive Prediction"
                        isExpanded={expandedSections.has('prediction')}
                        onToggle={() => toggleSection('prediction')}
                        status="complete"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <Metric label="Forecast Quality" value={`${(context.prediction.predicted_quality * 100).toFixed(1)}%`} color="text-blue-400" />
                            <Metric label="Confidence" value={`${(context.prediction.confidence * 100).toFixed(0)}%`} color="text-purple-400" />
                            <Metric label="Latency" value={`${context.prediction.latency_ms}ms`} color="text-gray-400" />
                            <Metric label="Pass Probability" value={context.prediction.predicted_pass ? 'HIGH' : 'LOW'} color={context.prediction.predicted_pass ? 'text-green-400' : 'text-red-400'} />
                        </div>

                        {context.prediction.risk_factors.length > 0 && (
                            <div className="mt-2 text-sm">
                                <div className="text-gray-500 mb-2 uppercase text-[10px] font-bold">Detected Risks</div>
                                <div className="space-y-2">
                                    {context.prediction.risk_factors.map((risk: any, idx: number) => (
                                        <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                                            <div className="text-red-400 font-bold capitalize text-xs">{risk.primitive}</div>
                                            <div className="text-gray-400 text-xs mt-1">{risk.reason}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </AuditSection>
                )}

                {/* Consensus Section */}
                {context.consensus && (
                    <AuditSection
                        title="Stage 3: Multi-Agent Debate"
                        isExpanded={expandedSections.has('consensus')}
                        onToggle={() => toggleSection('consensus')}
                        status={context.consensus.final_vote === 'pass' ? 'complete' : 'failed'}
                    >
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-3xl font-black text-white italic">
                                    {(context.consensus.consensus_score * 100).toFixed(1)}
                                    <span className="text-sm text-gray-600 ml-2 not-italic font-normal">AVG SCORE</span>
                                </div>
                                <div className={`px-4 py-1 rounded-full text-xs font-black tracking-widest ${context.consensus.final_vote === 'pass' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                                    }`}>
                                    {context.consensus.final_vote.toUpperCase()}
                                </div>
                            </div>

                            {/* Predicted vs Actual */}
                            {context.prediction && (
                                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                                    <div className="text-[10px] text-gray-500 font-bold uppercase">System Accuracy Check</div>
                                    <div className="flex gap-4">
                                        <div className="text-right">
                                            <div className="text-[9px] text-gray-600 font-bold">PREDICTED</div>
                                            <div className="text-xs font-mono text-gray-400">{(context.prediction.predicted_quality * 100).toFixed(1)}%</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] text-gray-600 font-bold">ACTUAL</div>
                                            <div className="text-xs font-mono text-white">{(context.consensus.consensus_score * 100).toFixed(1)}%</div>
                                        </div>
                                        <div className="text-right border-l border-gray-800 pl-4">
                                            <div className="text-[9px] text-gray-600 font-bold">VARIANCE</div>
                                            <div className={`text-xs font-mono ${Math.abs(context.prediction.predicted_quality - context.consensus.consensus_score) < 0.1 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {((context.consensus.consensus_score - context.prediction.predicted_quality) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <AgentCard name="STRICT CRITIC" icon="😠" data={context.consensus.agent_votes.strict_critic} color="red" />
                            <AgentCard name="BALANCED JUDGE" icon="⚖️" data={context.consensus.agent_votes.balanced_judge} color="blue" />
                            <AgentCard name="OPTIMISTIC FAN" icon="😊" data={context.consensus.agent_votes.optimistic_reviewer} color="green" />
                        </div>
                    </AuditSection>
                )}

                {/* Meta-Learning Section */}
                {context.meta_learning && (
                    <AuditSection
                        title="Stage 4: Meta-Learning Extraction"
                        isExpanded={expandedSections.has('meta')}
                        onToggle={() => toggleSection('meta')}
                        status="complete"
                    >
                        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                            <div className="text-purple-400 text-xs font-bold uppercase mb-3">Visible AI Reasoning</div>
                            <p className="text-gray-300 text-sm italic leading-relaxed">
                                "{context.meta_learning.reasoning}"
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="text-xs bg-black/40 p-2 rounded border border-gray-800">
                                    <span className="text-gray-500">Mutation Target:</span>
                                    <span className="ml-2 text-purple-400 font-bold">+{context.meta_learning.recommended_mutation_size.toFixed(3)}</span>
                                </div>
                                <div className="text-xs bg-black/40 p-2 rounded border border-gray-800">
                                    <span className="text-gray-500">Historical Success:</span>
                                    <span className="ml-2 text-green-400 font-bold">{(context.meta_learning.confidence * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </AuditSection>
                )}

                {/* Mutation & Regeneration */}
                {(context.mutation || context.regeneration) && (
                    <AuditSection
                        title="Stage 5-6: Self-Correction Flow"
                        isExpanded={expandedSections.has('flow')}
                        onToggle={() => toggleSection('flow')}
                        status="complete"
                    >
                        <div className="space-y-4">
                            {context.mutation?.mutations_applied?.map((mut: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                                    <div className="text-xs font-bold text-yellow-500 uppercase">{mut.primitive}</div>
                                    <div className="text-xs font-mono text-gray-400">
                                        {mut.old_value.toFixed(2)} <span className="text-gray-600 mx-2">→</span>
                                        <span className="text-yellow-400">{mut.new_value.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}

                            {context.regeneration && (
                                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 mt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-green-500">REGENERATION RESULT</span>
                                        <span className="text-xs text-green-400 font-bold">+{context.regeneration.improvement.toFixed(1)} POINTS</span>
                                    </div>
                                    <div className="text-xs text-gray-400 italic">
                                        "{context.regeneration.new_script?.substring(0, 150)}..."
                                    </div>
                                </div>
                            )}
                        </div>
                    </AuditSection>
                )}

                {/* Raw Context JSON */}
                <AuditSection
                    title="Forensic JSON Export"
                    isExpanded={expandedSections.has('json')}
                    onToggle={() => toggleSection('json')}
                    status="complete"
                >
                    <div className="bg-black/40 border border-gray-800 rounded-xl p-4 overflow-hidden">
                        <pre className="text-[10px] text-gray-500 font-mono overflow-auto max-h-60 custom-scrollbar">
                            {JSON.stringify(context, null, 2)}
                        </pre>
                    </div>
                </AuditSection>
            </div>
        </div>
    );
}

function Metric({ label, value, color }: any) {
    return (
        <div className="bg-black/30 p-2 rounded border border-gray-800 text-center">
            <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">{label}</div>
            <div className={`text-sm font-bold ${color}`}>{value}</div>
        </div>
    );
}

function AuditSection({ title, children, isExpanded, onToggle, status }: any) {
    return (
        <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30">
            <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-3">
                    {status === 'complete' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                    <span className="text-sm font-black text-gray-300 tracking-wide">{title}</span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
            {isExpanded && <div className="p-4 border-t border-gray-800 bg-black/20">{children}</div>}
        </div>
    );
}

function AgentCard({ name, icon, data, color }: any) {
    const colors: any = {
        red: 'border-red-500/30 text-red-400 bg-red-500/5',
        blue: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
        green: 'border-green-500/30 text-green-400 bg-green-500/5'
    };

    return (
        <div className={`border rounded-xl p-3 ${colors[color]}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{name}</span>
            </div>
            <div className="text-2xl font-black mb-1">{(data.score * 100).toFixed(0)}</div>
            <div className="text-[10px] italic leading-tight opacity-80 line-clamp-3">
                "{data.complaint || data.reasoning || data.praise}"
            </div>
        </div>
    );
}
