"use client";

import React, { useState } from "react";

export default function TestWithAnyIdeaCard(props: {
    onRun: (topic: string) => Promise<void> | void;
    isRunning?: boolean;
}) {
    const [topic, setTopic] = useState("");

    const canRun = topic.trim().length > 0 && !props.isRunning;

    return (
        <section className="mt-10">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-950/40 via-violet-950/20 to-black/20 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset]">
                <div className="flex items-start gap-3">
                    <div className="mt-1 text-xl">🧪</div>
                    <div>
                        <h3 className="text-2xl font-semibold text-white">Test With Any Idea</h3>
                        <p className="mt-1 text-sm text-slate-300/80">
                            Run a topic through the pipeline and watch issue detection, gate confidence, and learning events.
                        </p>
                        <p className="mt-2 text-xs font-mono text-emerald-400/80 tracking-wide">
                            Runs 6 steps: Generate, Evaluate, Learn, Regenerate, Verify, Trace.
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <label className="text-xs tracking-[0.18em] text-slate-400 uppercase">
                        Topic idea
                    </label>
                    <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && canRun && props.onRun(topic.trim())}
                        placeholder="e.g., New model release, acquisition rumor, product launch, earnings surprise"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/20"
                    />
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        disabled={!canRun}
                        onClick={() => props.onRun(topic.trim())}
                        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                    >
                        {props.isRunning ? "Running..." : "Run test"}
                    </button>
                </div>
            </div>
        </section>
    );
}
