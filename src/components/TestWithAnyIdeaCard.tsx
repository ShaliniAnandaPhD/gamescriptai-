"use client";

import { useState } from "react";

export default function TestWithAnyIdeaCard({ episodes }: { episodes: any[] }) {
    const [topic, setTopic] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<any>(null);

    const onRun = async (topic: string) => {
        setIsRunning(true);
        setResult(null);

        try {
            const baseUrl = window.location.origin.includes('localhost')
                ? window.location.origin.replace(/:[0-9]+/, ':5174')
                : '';

            const response = await fetch(`${baseUrl}/api/generate-unified`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });

            const data = await response.json();
            if (data.success) {
                setResult(data.context);
            } else {
                alert('Pipeline failed: ' + data.error);
            }
        } catch (error) {
            console.error('Test failed:', error);
            alert('Test failed. Check console.');
        } finally {
            setIsRunning(false);
        }
    };

    const canRun = topic.trim().length > 0 && !isRunning;

    return (
        <section className="mt-10">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-950/40 via-violet-950/20 to-black/20 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-md">
                <div className="flex items-start gap-4">
                    <div className="mt-1 p-3 bg-fuchsia-500/20 rounded-2xl border border-fuchsia-500/50 text-2xl">🧪</div>
                    <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight uppercase italic">Test With Any Idea</h3>
                        <p className="mt-1 text-sm text-slate-300/80 font-medium">
                            Run a topic through the pipeline and watch issue detection, gate confidence, and learning events.
                        </p>
                        <p className="mt-2 text-[10px] font-black font-mono text-emerald-400 uppercase tracking-widest">
                            ⚡ LIVE Pipeline: Generate → Evaluate → Learn → Verify → Trace
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                        Target instruction payload
                    </label>
                    <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && canRun && onRun(topic.trim())}
                        placeholder="e.g., New model release, acquisition rumor, product launch, earnings surprise"
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/20 transition-all font-serif italic"
                    />
                </div>

                <div className="mt-8 flex items-center justify-between gap-6">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Gemini 2.0 Flash</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Gemini 3 Pro</span>
                        </div>
                    </div>
                    <button
                        disabled={!canRun}
                        onClick={() => onRun(topic.trim())}
                        className="group relative overflow-hidden rounded-2xl bg-white px-8 py-4 text-sm font-black text-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 uppercase tracking-widest"
                    >
                        <span className="relative z-10">{isRunning ? "Running Analysis..." : "Initiate Test"}</span>
                    </button>
                </div>

                {/* Results Display */}
                {result && (
                    <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Pipeline Status */}
                            <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Pipeline Result</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                                        <span className="text-xs text-gray-400 uppercase font-bold">Status</span>
                                        <span className={`text-xs font-black uppercase tracking-widest ${result.final_status === 'passed' ? 'text-emerald-400' :
                                                result.final_status === 'improved' ? 'text-yellow-400' :
                                                    'text-rose-400'
                                            }`}>
                                            {result.final_status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                                        <span className="text-xs text-gray-400 uppercase font-bold">Quality</span>
                                        <span className="text-sm font-black text-blue-400">{result.final_quality?.toFixed(1) || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400 uppercase font-bold">Latency</span>
                                        <span className="text-xs font-mono text-gray-300">{result.total_latency_ms}ms</span>
                                    </div>
                                </div>
                            </div>

                            {/* Gen Script */}
                            <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6 overflow-hidden">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Final Output</h4>
                                <div className="text-sm text-gray-300 font-serif italic leading-relaxed line-clamp-4">
                                    "{result.generation?.script || result.regeneration?.new_script}"
                                </div>
                            </div>
                        </div>

                        {/* Learning Event */}
                        {result.mutation && (
                            <div className="mt-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
                                <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="animate-pulse">🔄</span> System Learned
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {result.mutation.mutations_applied.map((mut: any, idx: number) => (
                                        <div key={idx} className="bg-gray-950/40 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-yellow-500 uppercase">{mut.primitive}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-gray-500">{mut.old_value.toFixed(2)} →</span>
                                                <span className="text-[10px] font-black text-emerald-400">{mut.new_value.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
