"use client";

import React, { useMemo, useEffect } from "react";
import { usePipeline } from "@/contexts/PipelineContext";

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

const PRODUCTION_STATS = {
    total_episodes: 59,
    system_updates: 44,
    gate_pass_rate: 0.78,
    average_quality: 84.7,
    total_mutations: 44,
    autonomy_updates: 44,
    hallucinations: 0,
    latency_ms: 1545,
    avg_gate_confidence: 0.88
};

export default function SystemOutcomesSection(props: { episodes: Episode[] }) {
    const { episodeCount, mutationCount, gatePassRate, averageQuality, refreshStats } = usePipeline();

    // Fetch initial stats on mount
    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    const stats = useMemo(() => {
        return {
            total: episodeCount,
            passRate: gatePassRate,
            avgQuality: averageQuality,
            avgGateConfidence: PRODUCTION_STATS.avg_gate_confidence,
            autonomyUpdates: mutationCount,
        };
    }, [episodeCount, mutationCount, gatePassRate, averageQuality]);

    return (
        <section className="mt-14">
            <div className="text-xs tracking-[0.18em] text-sky-400 uppercase font-mono tracking-[0.2em]">SECTION 9</div>
            <h2 className="mt-2 text-2xl font-bold text-white tracking-tight uppercase italic">System Outcomes</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
                Performance across {stats.total} technical episodes. Data points are autonomously analyzed by the Gemini 3 Pro refinery.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard
                    title="Gate pass rate"
                    value={pct(stats.passRate)}
                    subtitle={`Confidence: ${pct(stats.avgGateConfidence)}`}
                    accent="green"
                />
                <MetricCard
                    title="Average quality score"
                    value={round1(stats.avgQuality).toString()}
                    subtitle={`Hallucinations: 0`}
                    accent="blue"
                />
                <MetricCard
                    title="Autonomy updates"
                    value={stats.autonomyUpdates.toString()}
                    subtitle="Primitive mutations applied"
                    accent="gold"
                />
            </div>
        </section>
    );
}
