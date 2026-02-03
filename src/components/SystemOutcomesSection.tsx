"use client";

import React, { useMemo } from "react";

type Episode = {
    id: string | number;
    quality_score: number;
    issues_count: number;
    metadata: {
        gate_passed: boolean;
        confidence: number;
    };
    autonomy?: {
        primitive_updates?: number;
    };
    [key: string]: any;
};

function clamp01(n: number) {
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(1, n));
}

function pct(n01: number) {
    return `${Math.round(clamp01(n01) * 100)}%`;
}

function round1(n: number) {
    return Math.round(n * 10) / 10;
}

function safeAvg(nums: number[]) {
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function MetricCard(props: {
    title: string;
    value: string;
    subtitle?: string;
    accent?: "green" | "blue" | "gold" | "neutral";
}) {
    const gradientClass =
        props.accent === "green"
            ? "from-green-400 to-emerald-500"
            : props.accent === "blue"
                ? "from-gemini-blue to-gemini-cyan"
                : props.accent === "gold"
                    ? "from-yellow-400 to-orange-500"
                    : "from-slate-200 to-slate-400";

    return (
        <div className="rounded-2xl border border-white/10 bg-gray-800/50 backdrop-blur-sm p-6 shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-xs tracking-[0.18em] text-slate-400 uppercase font-medium">{props.title}</div>
            <div className={`mt-3 text-5xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
                {props.value}
            </div>
            {props.subtitle ? <div className="mt-2 text-sm text-slate-400">{props.subtitle}</div> : null}
            {props.accent === "blue" && (
                <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-gemini-blue/10 border border-gemini-blue/20 rounded-full text-gemini-blue">
                        Gemini 3 Pro Evaluated
                    </span>
                </div>
            )}
        </div>
    );
}

export default function SystemOutcomesSection(props: { episodes: Episode[] }) {
    const stats = useMemo(() => {
        const eps = props.episodes ?? [];
        const total = eps.length;

        const passRate =
            total === 0 ? 0 : eps.filter((e) => Boolean(e.metadata?.gate_passed)).length / total;

        const avgQuality = safeAvg(eps.map((e) => e.quality_score ?? 0));
        const avgGateConfidence = safeAvg(eps.map((e) => e.metadata?.confidence ?? 0));
        const totalIssues = eps.reduce((sum, e) => sum + (e.issues_count ?? 0), 0);
        const issuesPerEp = total === 0 ? 0 : totalIssues / total;

        const autonomyUpdates = eps.reduce(
            (sum, e) => sum + (e.autonomy?.primitive_updates ?? 0),
            0
        );

        return {
            total,
            passRate,
            avgQuality,
            avgGateConfidence,
            issuesPerEp,
            autonomyUpdates,
        };
    }, [props.episodes]);

    return (
        <section className="mt-14">
            <div className="text-xs tracking-[0.18em] text-sky-400 uppercase">SECTION 9</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">System Outcomes</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
                Summary of how the pipeline is performing across episodes. These numbers stay interpretable as your dataset grows.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard
                    title="Gate pass rate"
                    value={pct(stats.passRate)}
                    subtitle={`Avg gate confidence ${round1(stats.avgGateConfidence)}`}
                    accent="green"
                />
                <MetricCard
                    title="Average quality score"
                    value={round1(stats.avgQuality).toString()}
                    subtitle={`Issues per episode ${round1(stats.issuesPerEp)}`}
                    accent="blue"
                />
                <MetricCard
                    title="Autonomy updates"
                    value={stats.autonomyUpdates.toString()}
                    subtitle="Total behavioral primitive updates applied"
                    accent="gold"
                />
            </div>
        </section>
    );
}
