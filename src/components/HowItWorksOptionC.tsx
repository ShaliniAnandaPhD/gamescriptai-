import React from "react";

function Step({
    title,
    subtitle,
    emoji,
    className,
}: {
    title: string;
    subtitle: string;
    emoji: string;
    className: string;
}) {
    return (
        <div
            className={[
                "relative flex h-[150px] w-[170px] flex-col items-center justify-center rounded-3xl",
                "bg-gradient-to-b from-white/5 to-white/0",
                "shadow-[0_0_80px_rgba(0,0,0,0.6)]",
                "border",
                className,
            ].join(" ")}
        >
            <div className="text-4xl">{emoji}</div>
            <div className="mt-3 text-xl font-semibold text-white">{title}</div>
            <div className="text-sm text-white/45">{subtitle}</div>
        </div>
    );
}

function Arrow() {
    return (
        <div className="mx-5 flex items-center">
            <div className="h-px w-12 bg-white/15" />
            <div className="ml-2 text-white/25">→</div>
        </div>
    );
}

function Chip({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/70">
            <span className="text-white/60">{icon}</span>
            <span>{text}</span>
        </div>
    );
}

/* OPTION C: Neuron orchestrates around the steps */
export default function HowItWorksOptionC() {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A1020] via-[#0B0B12] to-[#120A1A] p-10">
            {/* glow */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-44 left-1/4 h-[420px] w-[760px] rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">🏗️</div>
                    <div className="text-5xl font-semibold tracking-tight text-white">
                        How It Works
                    </div>
                </div>

                {/* Ring container */}
                <div className="relative mt-10 rounded-[32px] border border-white/10 bg-black/20 p-10">
                    {/* Neuron halo */}
                    <div className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />
                    <div className="pointer-events-none absolute left-1/2 top-8 h-[120px] w-[520px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-2xl" />

                    {/* Neuron badge on top, orchestrating around */}
                    <div className="mb-8 flex items-center justify-center">
                        <div className="flex items-center gap-3 rounded-full border border-violet-300/15 bg-violet-500/10 px-5 py-2">
                            <div className="text-lg">🧠</div>
                            <div className="text-sm font-semibold tracking-wide text-white">
                                Neuron
                            </div>
                            <div className="text-sm text-white/55">Orchestration</div>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="flex flex-wrap items-center justify-center gap-y-6">
                        <Step
                            emoji="📥"
                            title="Topic In"
                            subtitle="Ingest"
                            className="border-gray-700 bg-gray-900 shadow-lg shadow-black/40"
                        />
                        <Arrow />
                        <Step
                            emoji="⚡"
                            title="Gemini 3 Flash"
                            subtitle="Generate (780ms)"
                            className="border-gemini-blue bg-gradient-to-br from-gemini-blue to-gemini-purple shadow-glow-gemini"
                        />
                        <Arrow />
                        <Step
                            emoji="🔎"
                            title="Gemini 3 Pro"
                            subtitle="Evaluate (520ms)"
                            className="border-purple-500 bg-gradient-to-br from-purple-600 to-pink-600 shadow-xl shadow-purple-500/20"
                        />
                        <Arrow />
                        <Step
                            emoji="🚦"
                            title="Gate"
                            subtitle="Pass or Fail"
                            className="border-green-600 bg-gray-900 shadow-xl shadow-green-500/10"
                        />
                        <Arrow />
                        <Step
                            emoji="🧠"
                            title="Learn"
                            subtitle="Update primitives"
                            className="border-yellow-500 bg-gradient-to-br from-yellow-600 to-orange-600 shadow-xl shadow-yellow-500/20"
                        />
                    </div>

                    {/* Gemini 3 Attribution */}
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gemini-blue/10 border border-gemini-blue/30 rounded-full">
                            <span className="text-sm text-gemini-blue font-medium">
                                ✨ Powered by Gemini 3 Flash + Pro
                            </span>
                        </div>
                    </div>

                    {/* Neuron orchestration tray */}
                    <div className="mt-10 rounded-2xl border border-violet-300/15 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                                🧠
                            </div>
                            <div>
                                <div className="text-base font-semibold text-white">Neuron</div>
                                <div className="text-sm text-white/55">
                                    Orchestration and tool routing
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <Chip icon="🧭" text="Plan episode" />
                            <Chip icon="🧬" text="Route models" />
                            <Chip icon="🔁" text="Retry logic" />
                            <Chip icon="🛠️" text="Tool calls" />
                            <Chip icon="💾" text="Persist state" />
                        </div>

                        <div className="mt-5 text-sm text-white/55">
                            Neuron coordinates the episode at runtime by selecting models,
                            triggering tools, retrying failures, and persisting state between
                            runs.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
