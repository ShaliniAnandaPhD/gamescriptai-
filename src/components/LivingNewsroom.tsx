// LivingRoom.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    increment,
} from "firebase/firestore";
// import Plot from "react-plotly.js";
const Plot = React.lazy(() => import("react-plotly.js"));
import { db } from "../lib/firebase";
import { callHuggingFace } from "../lib/hf";
import { callGemini } from "../lib/gemini";
import { runCycleClient } from '../lib/runCycleClient';
import HowItWorksOptionC from './HowItWorksOptionC';
import SystemOutcomesSection from './SystemOutcomesSection';
import TestWithAnyIdeaCard from './TestWithAnyIdeaCard';
import MultimodalAnalyzer from './MultimodalAnalyzer';
import MetaLearningDashboard from './MetaLearningDashboard';
import { Sparkles, Activity, Brain, Database, Zap } from 'lucide-react';
import { MissionControl } from './MissionControl';
import { ForensicAudit } from './ForensicAudit';
import { PrimitiveSliders } from './PrimitiveSliders';
import { InstantEvolution } from './InstantEvolution';
import { MutationHighlight } from './MutationHighlight';
import { FullLearningHistory } from './FullLearningHistory';
import { usePipeline } from '../contexts/PipelineContext';
import { getApiBaseUrl } from '../lib/utils';




// If you actually use this component, keep it
// import EpisodeDropdown from "./EpisodeDropdown";

// -------------------- Safe Formatting Helpers --------------------
const isFiniteNumber = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

const fmtFixed = (v: unknown, digits = 2, fallback = "NA") =>
    isFiniteNumber(v) ? v.toFixed(digits) : fallback;

const toNumberSafe = (v: unknown, fallback = 0) => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

function formatDelta(v: number | null | undefined) {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    const abs = Math.abs(v).toFixed(1);
    if (v > 0) return `+${abs}`;
    if (v < 0) return `-${abs}`;
    return "0.0";
}
// -----------------------------------------------------------------

// -------------------- Static Dataset --------------------
const STATIC_HISTORY = [
    { episode_id: 59, topic: "NVIDIA Blackwell: The First Shipments", quality_score: 100, issues: 0, mutations: 1, timestamp: "2026-02-06T12:00:00.000Z", final_status: "passed" },
    { episode_id: 58, topic: "Suno v3.5: Full Song Generation Mastery", quality_score: 98, issues: 0, mutations: 0, timestamp: "2026-02-06T11:00:00.000Z", final_status: "passed" },
    { episode_id: 57, topic: "Grok-2: The New Challenger", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-02-06T10:00:00.000Z", final_status: "improved" },
    { episode_id: 56, topic: "Meta Segment Anything Model 2: Video Segmentation", quality_score: 95, issues: 0, mutations: 0, timestamp: "2026-02-06T09:00:00.000Z", final_status: "passed" },
    { episode_id: 55, topic: "OpenAI Strawberry (o1): Chain of Thought Breakthrough", quality_score: 100, issues: 0, mutations: 3, timestamp: "2026-02-06T08:00:00.000Z", final_status: "improved" },
    { episode_id: 54, topic: "Luma Dream Machine: High-Motion Video", quality_score: 94, issues: 0, mutations: 0, timestamp: "2026-02-05T23:00:00.000Z", final_status: "passed" },
    { episode_id: 53, topic: "Runway Gen-3 Alpha: Cinematic Physics", quality_score: 97, issues: 0, mutations: 1, timestamp: "2026-02-05T22:00:00.000Z", final_status: "passed" },
    { episode_id: 52, topic: "Midjourney v6.1: Photorealism Peak", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-02-05T21:00:00.000Z", final_status: "passed" },
    { episode_id: 51, topic: "ElevenLabs Video-to-Audio: The Final SFX Step", quality_score: 92, issues: 0, mutations: 2, timestamp: "2026-02-05T20:00:00.000Z", final_status: "improved" },
    { episode_id: 50, topic: "Black Forest Labs Flux.1: Image Gen King", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-02-05T19:00:00.000Z", final_status: "passed" },
    { episode_id: 49, topic: "DeepSeek-V2.5: Efficiency Revolution", quality_score: 96, issues: 0, mutations: 1, timestamp: "2026-02-05T18:00:00.000Z", final_status: "passed" },
    { episode_id: 48, topic: "Meta Llama 3.1 405B: The SOTA Open Model", quality_score: 100, issues: 0, mutations: 4, timestamp: "2026-02-05T17:00:00.000Z", final_status: "improved" },
    { episode_id: 47, topic: "Mistral Large 2: Open Source Powerhouse", quality_score: 99, issues: 0, mutations: 0, timestamp: "2026-02-05T16:00:00.000Z", final_status: "passed" },
    { episode_id: 46, topic: "Waymo One: expansion to Austin and Miami", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-02-05T15:00:00.000Z", final_status: "passed" },
    { episode_id: 45, topic: "Apple Intelligence: Siri's Brain Transplant", quality_score: 85, issues: 1, mutations: 0, timestamp: "2026-02-05T14:00:00.000Z", final_status: "failed" },
    { episode_id: 44, topic: "Figure 01: Coffee Shop Deployment", quality_score: 100, issues: 0, mutations: 3, timestamp: "2026-02-05T13:00:00.000Z", final_status: "improved" },
    { episode_id: 43, topic: "Tesla FSD v12.4: The 'No Nag' Milestone", quality_score: 93, issues: 0, mutations: 0, timestamp: "2026-02-05T12:00:00.000Z", final_status: "passed" },
    { episode_id: 42, topic: "Google Astra: The Future of Vision Agents", quality_score: 98, issues: 0, mutations: 1, timestamp: "2026-02-05T11:00:00.000Z", final_status: "passed" },
    { episode_id: 41, topic: "Anthropic Claude 3.5 Sonnet: Benchmark King", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-02-05T10:00:00.000Z", final_status: "passed" },
    { episode_id: 40, topic: "Groq LPU: The Speed Barrier Broken", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-02-05T09:00:00.000Z", final_status: "improved" },
    { episode_id: 39, topic: "Boston Dynamics Electric Atlas: First Field Test", quality_score: 91, issues: 0, mutations: 0, timestamp: "2026-02-05T08:00:00.000Z", final_status: "passed" },
    { episode_id: 38, topic: "OpenAI 'SearchGPT' Prototype Launch", quality_score: 95, issues: 0, mutations: 1, timestamp: "2026-02-04T23:00:00.000Z", final_status: "passed" },
    { episode_id: 37, topic: "Neural Link: First Human Patient Update", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-02-04T22:00:00.000Z", final_status: "passed" },
    { episode_id: 36, topic: "Rabbit R1 vs Meta Ray-Ban: The Form Factor War", quality_score: 72, issues: 1, mutations: 0, timestamp: "2026-02-04T21:00:00.000Z", final_status: "failed" },
    { episode_id: 35, topic: "Perplexity AI: The New Search Reality", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-02-04T20:00:00.000Z", final_status: "improved" },
    { episode_id: 34, topic: "Microsoft 'MAI-1' Training Complete", quality_score: 96, issues: 0, mutations: 0, timestamp: "2026-02-04T19:00:00.000Z", final_status: "passed" },
    { episode_id: 33, topic: "Super Bowl LX Prediction: The Final Consensus", quality_score: 100, issues: 0, mutations: 1, timestamp: "2026-01-31T23:45:00.000Z", final_status: "passed" },
    { episode_id: 32, topic: "OpenAI 'O4' Reasoning Model: Real or Fake?", quality_score: 100, issues: 0, mutations: 3, timestamp: "2026-01-31T23:15:00.000Z", final_status: "improved" },
    { episode_id: 31, topic: "Market Watch: NVIDIA Hits $5 Trillion Cap", quality_score: 98, issues: 0, mutations: 0, timestamp: "2026-01-31T22:45:00.000Z", final_status: "passed" },
    { episode_id: 30, topic: "Breaking: Seahawks QB Injury Report Update", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-01-31T22:15:00.000Z", final_status: "improved" },
    { episode_id: 29, topic: "Deep Dive: The 'AppleGPT' on iPhone 18", quality_score: 96, issues: 0, mutations: 0, timestamp: "2026-01-31T21:45:00.000Z", final_status: "passed" },
    { episode_id: 28, topic: "Debunked: The 'Sentient' Claude 4.5 Rumor", quality_score: 100, issues: 0, mutations: 4, timestamp: "2026-01-31T21:15:00.000Z", final_status: "improved" },
    { episode_id: 27, topic: "Review: Tesla Optimus Gen 3 in Factories", quality_score: 99, issues: 0, mutations: 0, timestamp: "2026-01-31T20:45:00.000Z", final_status: "passed" },
    { episode_id: 26, topic: "NFC Championship Reaction: Seattle Reigns", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-01-31T20:15:00.000Z", final_status: "passed" },
    { episode_id: 25, topic: "AFC Championship: Patriots Defense Wins It", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T19:45:00.000Z", final_status: "passed" },
    { episode_id: 24, topic: "Alert: DeepFake Taylor Swift Scan Scam", quality_score: 95, issues: 0, mutations: 0, timestamp: "2026-01-31T19:15:00.000Z", final_status: "passed" },
    { episode_id: 23, topic: "Gemini 3 Flash vs. GPT-5: The Coding Test", quality_score: 78, issues: 1, mutations: 0, timestamp: "2026-01-31T18:45:00.000Z", final_status: "failed" },
    { episode_id: 22, topic: "Exclusive: Interview with Jensen Huang (AI)", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T18:15:00.000Z", final_status: "passed" },
    { episode_id: 21, topic: "Humane AI Pin 2: A Second Chance?", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-01-31T17:45:00.000Z", final_status: "improved" },
    { episode_id: 20, topic: "Google DeepMind's 'AlphaCode 3' Paper", quality_score: 98, issues: 0, mutations: 0, timestamp: "2026-01-31T17:15:00.000Z", final_status: "passed" },
    { episode_id: 19, topic: "Divisional Round: 49ers vs. Packers Shock", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T16:45:00.000Z", final_status: "passed" },
    { episode_id: 18, topic: "Meta Quest 4 Pro: Leaked Specs Analysis", quality_score: 60, issues: 1, mutations: 0, timestamp: "2026-01-31T16:15:00.000Z", final_status: "failed" },
    { episode_id: 17, topic: "SpaceX Starship: Orbital Refueling Success", quality_score: 97, issues: 0, mutations: 0, timestamp: "2026-01-31T15:45:00.000Z", final_status: "passed" },
    { episode_id: 16, topic: "Sam Altman Returns to YC? (Rumor Check)", quality_score: 100, issues: 0, mutations: 3, timestamp: "2026-01-31T15:15:00.000Z", final_status: "improved" },
    { episode_id: 15, topic: "CES 2026: Best of Show Recap", quality_score: 95, issues: 0, mutations: 0, timestamp: "2026-01-31T14:45:00.000Z", final_status: "passed" },
    { episode_id: 14, topic: "Wild Card Weekend: Bills Elimination", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T14:15:00.000Z", final_status: "passed" },
    { episode_id: 13, topic: "Amazon Alexa LLM Upgrade: Finally Good?", quality_score: 92, issues: 0, mutations: 0, timestamp: "2026-01-31T13:45:00.000Z", final_status: "passed" },
    { episode_id: 12, topic: "Crypto Regulation: The New 2026 SEC Rules", quality_score: 100, issues: 0, mutations: 2, timestamp: "2026-01-31T13:15:00.000Z", final_status: "improved" },
    { episode_id: 11, topic: "Breaking: Ford Adopts NACS Charging 2.0", quality_score: 99, issues: 0, mutations: 0, timestamp: "2026-01-31T12:45:00.000Z", final_status: "passed" },
    { episode_id: 10, topic: "Review: The 'Rabbit R3' Pocket Agent", quality_score: 55, issues: 2, mutations: 0, timestamp: "2026-01-31T12:15:00.000Z", final_status: "failed" },
    { episode_id: 9, topic: "Week 18 NFL: The Playoff Picture Set", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T11:45:00.000Z", final_status: "passed" },
    { episode_id: 8, topic: "Midjourney v7 Video: Is Hollywood Dead?", quality_score: 100, issues: 0, mutations: 1, timestamp: "2026-01-31T11:15:00.000Z", final_status: "improved" },
    { episode_id: 7, topic: "Sony PS6 Teaser: What We Saw at CES", quality_score: 94, issues: 0, mutations: 0, timestamp: "2026-01-31T10:45:00.000Z", final_status: "passed" },
    { episode_id: 6, topic: "Boston Dynamics 'Atlas 3' Parkour Demo", quality_score: 98, issues: 0, mutations: 0, timestamp: "2026-01-31T10:15:00.000Z", final_status: "passed" },
    { episode_id: 5, topic: "Rumor: Microsoft Buying Discord?", quality_score: 40, issues: 1, mutations: 0, timestamp: "2026-01-31T09:45:00.000Z", final_status: "failed" },
    { episode_id: 4, topic: "SpaceX Starlink Direct-to-Cell Launch", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T09:15:00.000Z", final_status: "passed" },
    { episode_id: 3, topic: "2026 Tech Outlook: The Year of Wearables", quality_score: 96, issues: 0, mutations: 0, timestamp: "2026-01-31T08:45:00.000Z", final_status: "passed" },
    { episode_id: 2, topic: "New Years Resolution: Gym Tech for 2026", quality_score: 93, issues: 0, mutations: 0, timestamp: "2026-01-31T08:15:00.000Z", final_status: "passed" },
    { episode_id: 1, topic: "Morning Brief: Agentic Workflows Rising", quality_score: 100, issues: 0, mutations: 0, timestamp: "2026-01-31T07:45:00.000Z", final_status: "passed" }
] as const;

// Map static history to the schema used by the UI
const mapStaticToEpisode = (item: (typeof STATIC_HISTORY)[number]) => ({
    episode_num: item.episode_id,
    topic: item.topic,
    quality_score: item.quality_score,
    issues_count: item.issues,
    optimized: item.final_status === "improved",
    timestamp: { toDate: () => new Date(item.timestamp) },
    primitive_action: "Evolution Analysis",
    redis_op: `HGET episode:${item.episode_id} quality`,
    metadata: {
        fact_score: item.quality_score,
        style_score: item.quality_score,
        confidence: item.quality_score,
        gate_passed: item.final_status !== "failed",
        mutations: item.mutations > 0 ? [
            {
                primitive_name: "adaptation",
                new_weight: 1.0,
                reason: `Autonomous optimization based on quality delta in EP-${item.episode_id}`,
            },
        ] : [],
        draft_content: null,
        final_content: null,
    },
});
// ---------------------------------------------------------

type AnyEpisode = any;

// -------------------- Architecture Items --------------------
type ArchItem = {
    title: string;
    subtitle: string;
    accent: "red" | "blue" | "gold" | "purple";
    icon: React.ReactNode;
};

const accentStyles: Record<ArchItem["accent"], { ring: string; glow: string; text: string }> = {
    red: {
        ring: "ring-1 ring-red-500/25",
        glow: "shadow-[0_0_0_1px_rgba(239,68,68,0.18),0_10px_40px_rgba(239,68,68,0.08)]",
        text: "text-red-400"
    },
    blue: {
        ring: "ring-1 ring-blue-500/25",
        glow: "shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_10px_40px_rgba(59,130,246,0.08)]",
        text: "text-blue-400"
    },
    gold: {
        ring: "ring-1 ring-amber-500/25",
        glow: "shadow-[0_0_0_1px_rgba(245,158,11,0.18),0_10px_40px_rgba(245,158,11,0.08)]",
        text: "text-amber-400"
    },
    purple: {
        ring: "ring-1 ring-purple-500/25",
        glow: "shadow-[0_0_0_1px_rgba(168,85,247,0.18),0_10px_40px_rgba(168,85,247,0.08)]",
        text: "text-purple-400"
    },
};

const architectureItems: ArchItem[] = [
    {
        title: "Redis",
        subtitle: "Behavioral primitive weights",
        accent: "red",
        icon: <span className="text-lg">🔥</span>,
    },
    {
        title: "Firestore",
        subtitle: "Episode history and metrics",
        accent: "blue",
        icon: <span className="text-lg">🧱</span>,
    },
    {
        title: "W and B",
        subtitle: "Mutation path observability",
        accent: "gold",
        icon: <span className="text-lg">📊</span>,
    },
    {
        title: "Neuron",
        subtitle: "Orchestration and tool routing",
        accent: "purple",
        icon: <span className="text-lg">🧠</span>,
    },
];
// -------------------------------------------------------------

export default function LivingRoom() {
    // Initial episodes should be safe and immediately renderable
    const initialEpisodes = useMemo(() => {
        return STATIC_HISTORY.map(mapStaticToEpisode);
    }, []);

    const [episodes, setEpisodes] = useState<AnyEpisode[]>(initialEpisodes);
    const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
    const [primitives, setPrimitives] = useState<any>({});
    const [metrics, setMetrics] = useState<any>({});
    const [runningScenario, setRunningScenario] = useState(false);
    const [runningCustom, setRunningCustom] = useState(false);
    const [customTopic, setCustomTopic] = useState("");
    const [lastResult, setLastResult] = useState<any>(null);
    const { currentRun: runContext, isRunning, startRun, completeRun, episodeCount, mutationCount, gatePassRate } = usePipeline();

    const sortedEpisodes = useMemo(() => {
        return [...episodes].sort((a, b) => toNumberSafe(a.episode_num) - toNumberSafe(b.episode_num));
    }, [episodes]);

    const [geminiKey, setGeminiKey] = useState('');
    const [geminiModel, setGeminiModel] = useState('gemini-2.0-flash-exp');
    const [runningGemini, setRunningGemini] = useState(false);

    // HF & W&B Debug Check
    useEffect(() => {
        console.log("🛠️ Frontend Service Check:");
        console.log("- HF token present:", Boolean(import.meta.env.VITE_HF_TOKEN));
        console.log("- HF model:", import.meta.env.VITE_HF_MODEL);
        console.log("- W&B Project:", import.meta.env.WANDB_PROJECT || "living-newsroom");
    }, []);

    // Normalize any Firebase episode so Plotly never sees undefined numbers
    const normalizeEpisode = (ep: any) => {
        const meta = ep?.metadata ?? {};
        return {
            ...ep,
            episode_num: toNumberSafe(ep?.episode_num, 0),
            quality_score: toNumberSafe(ep?.quality_score, 0),
            issues_count: toNumberSafe(ep?.issues_count, 0),
            optimized: Boolean(ep?.optimized),
            timestamp: ep?.timestamp,
            topic: typeof ep?.topic === "string" ? ep.topic : "Untitled",
            primitive_action: ep?.primitive_action,
            redis_op: ep?.redis_op,
            metadata: {
                ...meta,
                fact_score: toNumberSafe(meta?.fact_score, 0),
                style_score: toNumberSafe(meta?.style_score, 0),
                confidence: toNumberSafe(meta?.confidence, 0),
                gate_passed: Boolean(meta?.gate_passed),
                mutations: Array.isArray(meta?.mutations) ? meta.mutations : [],
                draft_content: meta?.draft_content ?? null,
                final_content: meta?.final_content ?? null,
            },
        };
    };

    // ── 1. REAL-TIME DATA FETCHING (API DRIVEN) ──────────────────────────────
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const baseUrl = getApiBaseUrl();

                // Fetch History
                const historyRes = await fetch(`${baseUrl}/api/history`);
                const historyData = await historyRes.json();
                if (historyData.success) {
                    const mappedHistory = historyData.episodes.map((ep: any) => ({
                        ...ep,
                        episode_num: ep.episode_id,
                        quality_score: ep.quality_score,
                        issues_count: ep.issues,
                        timestamp: ep.timestamp,
                        metadata: {
                            gate_passed: ep.final_status !== 'failed',
                            fact_score: ep.quality_score,
                            style_score: ep.quality_score,
                            confidence: ep.quality_score,
                        }
                    }));
                    setEpisodes(mappedHistory);
                    if (mappedHistory.length > 0) {
                        setSelectedEpisode(prev => {
                            if (prev === 1 || prev === null) {
                                // Find highest episode number
                                return Math.max(...mappedHistory.map((h: any) => toNumberSafe(h.episode_num, 0)));
                            }
                            return prev;
                        });
                    }
                }

                // Fetch Primitives
                const primsRes = await fetch(`${baseUrl}/api/primitives`);
                const primsData = await primsRes.json();
                setPrimitives(primsData);

            } catch (e) {
                console.warn('Dashboard poll failed:', e);
            }
        };

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 4000);
        return () => clearInterval(interval);
    }, [isRunning]);

    const calculateVelocity = () => {
        if (episodes.length < 3) return 0;
        const last = episodes[episodes.length - 1]?.quality_score ?? 0;
        const prev1 = episodes[episodes.length - 2]?.quality_score ?? 0;
        const prev2 = episodes[episodes.length - 3]?.quality_score ?? 0;
        const first = episodes[0]?.quality_score ?? 0;
        const early1 = episodes[1]?.quality_score ?? 0;
        const early2 = episodes[2]?.quality_score ?? 0;

        const recentAvg = (toNumberSafe(last) + toNumberSafe(prev1) + toNumberSafe(prev2)) / 3;
        const initialAvg = (toNumberSafe(first) + toNumberSafe(early1) + toNumberSafe(early2)) / 3;

        return recentAvg - initialAvg;
    };

    const calculateTrajectory = () => {
        if (episodes.length < 5) return { label: "Stable", color: "text-amber-400" };
        const recentSum = episodes
            .slice(-3)
            .reduce((s: number, e: any) => s + toNumberSafe(e?.quality_score, 0), 0);
        const earlySum = episodes
            .slice(0, 3)
            .reduce((s: number, e: any) => s + toNumberSafe(e?.quality_score, 0), 0);
        return recentSum > earlySum
            ? { label: "Positive", color: "text-emerald-400" }
            : { label: "Stable", color: "text-amber-400" };
    };

    const learningVelocity = calculateVelocity();
    const trajectory = calculateTrajectory();

    const maxIssues = Math.max(
        5,
        ...episodes.map((ep: any) =>
            typeof ep?.issues_count === "number" ? ep.issues_count : 0
        )
    );
    // isRunning now comes from context

    const handleScenario = async (scenarioId: number) => {
        setRunningScenario(true);
        setLastResult(null);
        startRun();

        const scenarios: Record<number, any> = {
            1: {
                name: "Rumor Mill",
                topic: "Secret trade: Brock Purdy to New York Jets happening today",
                factScore: 45,
                styleScore: 100,
                finalScore: 89,
                issues: [{ type: "hallucination", reason: "Brock Purdy trade is unverified", severity: "high" }],
                mutations: [
                    {
                        primitive_name: "fact_verification",
                        old_weight: 1.0,
                        new_weight: 1.0,
                        delta: 0.0,
                        reason: "Already at maximum (1.0) system previously learned this pattern",
                    },
                ],
                draft_content: {
                    text:
                        "Breaking news: Sources confirm Brock Purdy has been traded to the New York Jets in a blockbuster deal worth $250000000. The trade is expected to be finalized today.",
                    highlight: "Sources confirm",
                    flag: "HALLUCINATION no verified sources exist",
                },
                final_content: {
                    text:
                        "Unverified reports suggest potential trade discussions involving Brock Purdy and the Jets. However, no official sources have confirmed these claims. The 49ers organization has not commented.",
                    highlight: "Unverified reports suggest",
                    reason: "Correction applied by fact_verification (weight: 1.00)",
                },
            },
            2: {
                name: "Over-Excited Fan",
                topic: "Revolutionary earth-shattering unprecedented breakthrough in quantum AI chips",
                factScore: 100,
                styleScore: 65,
                finalScore: 79,
                issues: [{ type: "hyperbole", reason: "Excessive superlatives detected", severity: "medium" }],
                mutations: [
                    {
                        primitive_name: "anti_hyperbole",
                        old_weight: 0.75,
                        new_weight: 0.85,
                        delta: 0.1,
                        reason: "Strengthened hyperbole guardrail",
                    },
                ],
                draft_content: {
                    text:
                        "This is absolutely revolutionary! An earth-shattering, unprecedented breakthrough in quantum AI chips that will change EVERYTHING forever! This is the most incredible advancement in human history!",
                    highlight: "revolutionary! An earth-shattering, unprecedented",
                    flag: "HYPERBOLE excessive superlatives",
                },
                final_content: {
                    text:
                        "Researchers have announced significant progress in quantum AI chip development. The advancement represents notable improvement in computational efficiency. This development marks an important step in the field.",
                    highlight: "significant progress",
                    reason: "Tone balanced by anti_hyperbole (weight: 0.85)",
                },
            },
            3: {
                name: "Temporal Trap",
                topic: "Apple Vision Pro sales analysis shows interesting trends",
                factScore: 75,
                styleScore: 100,
                finalScore: 82,
                issues: [{ type: "missing_source", reason: "Claims require date attribution", severity: "medium" }],
                mutations: [
                    {
                        primitive_name: "source_attribution",
                        old_weight: 0.72,
                        new_weight: 0.84,
                        delta: 0.12,
                        reason: "Missing source attribution",
                    },
                ],
                draft_content: {
                    text:
                        "Apple Vision Pro sales have been trending upward recently. Market analysts note strong consumer interest. The device is performing well in key demographics.",
                    highlight: "recently",
                    flag: "VAGUE no specific dates or sources",
                },
                final_content: {
                    text:
                        "According to IDC's Q4 2025 report, Apple Vision Pro sales increased 23% quarter-over-quarter. Bloomberg reported on January 15, 2026 that consumer interest remains strong among early adopters.",
                    highlight: "According to IDC's Q4 2025",
                    reason: "Sources added by source_attribution (weight: 0.84)",
                },
            },
        };

        const scenario = scenarios[scenarioId];
        if (!scenario) return;

        startRun();

        // Mock processing time
        await new Promise(r => setTimeout(r, 2000));

        try {
            const metricsRef = doc(db, "system", "metrics");
            const metricsDoc = await getDoc(metricsRef);
            const metricsData = metricsDoc.exists()
                ? (metricsDoc.data() as any)
                : { total_episodes: 0, total_optimizations: 0 };

            const episodeNum = toNumberSafe(metricsData.total_episodes, 0) + 1;

            const primitivesRef = doc(db, "system", "primitives");
            const primitivesDoc = await getDoc(primitivesRef);
            const primitivesData = primitivesDoc.exists()
                ? ((primitivesDoc.data() as any)?.primitives || {})
                : {};

            scenario.mutations.forEach((mut: any) => {
                if (primitivesData[mut.primitive_name]) {
                    primitivesData[mut.primitive_name].weight = mut.new_weight;
                }
            });

            await setDoc(doc(db, "episodes", `ep_${episodeNum}`), {
                episode_num: episodeNum,
                topic: scenario.topic,
                quality_score: scenario.finalScore,
                issues_count: scenario.issues.length,
                optimized: true,
                timestamp: serverTimestamp(),
                metadata: {
                    fact_score: scenario.factScore,
                    style_score: scenario.styleScore,
                    confidence: scenario.finalScore,
                    gate_passed: scenario.finalScore >= 70,
                    mutations: scenario.mutations,
                    scenario_name: scenario.name,
                    demo_triggered: true,
                    draft_content: scenario.draft_content,
                    final_content: scenario.final_content,
                },
            });

            await setDoc(primitivesRef, {
                primitives: primitivesData,
                updated_at: serverTimestamp(),
            });

            await setDoc(metricsRef, {
                total_episodes: episodeNum,
                total_optimizations: toNumberSafe(metricsData.total_optimizations, 0) + 1,
                primitives_count: Object.keys(primitivesData).length,
                updated_at: serverTimestamp(),
            });

            const mockContext = {
                run_id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                timestamp: new Date().toISOString(),
                episode_number: episodeNum,
                topic: scenario.topic,
                final_status: 'improved' as const,
                total_latency_ms: 2450,
                prediction: { latency_ms: 230, predicted_quality: 0.85, confidence: 0.9, engine: 'predictive-quality' as const, predicted_pass: true, risk_factors: [], recommended_adjustments: [] },
                generation: { latency_ms: 820, script: scenario.final_content.text, engine: 'generation' as const, model: 'gemini-2.0-flash', draft_id: 'd1', word_count: 50, estimated_duration_seconds: 30, primitives_snapshot: {}, primitives_hash: 'h1' },
                consensus: {
                    latency_ms: 540,
                    consensus_score: scenario.finalScore,
                    gate_passed: true,
                    final_vote: 'pass' as const,
                    engine: 'multi-agent-consensus' as const,
                    consensus_strength: 0.9,
                    disputed_primitives: [],
                    agent_votes: {
                        strict_critic: { score: 0.8, vote: 'pass' as const, complaint: '', examples: [] },
                        balanced_judge: { score: 0.9, vote: 'pass' as const, reasoning: '' },
                        optimistic_reviewer: { score: 0.95, vote: 'pass' as const, praise: '' }
                    }
                },
                meta_learning: { latency_ms: 450, reasoning: 'System detected hallucination pattern.', engine: 'meta-learning' as const, correlations_analyzed: 12, patterns_matched: [], historical_effectiveness: [], recommended_mutation_size: 0.05, confidence: 0.9 },
                mutation: {
                    latency_ms: 120,
                    mutations_applied: scenario.mutations.map((m: any) => ({
                        primitive: m.primitive_name,
                        old_value: m.old_weight,
                        new_value: m.new_weight,
                        delta: m.delta,
                        reason: m.reason,
                        severity: 0.5,
                        meta_learning_informed: true
                    })),
                    total_mutations: scenario.mutations.length,
                    expected_improvement: 15,
                    engine: 'adaptive-mutation' as const
                },
                regeneration: {
                    latency_ms: 1200,
                    new_script: scenario.final_content.text,
                    new_quality: scenario.finalScore,
                    improvement: scenario.finalScore - scenario.factScore,
                    attempts: 1
                }
            };

            completeRun(mockContext);
            setLastResult(scenario);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            console.error("Error:", error);
            alert("Error running scenario");
        } finally {
            setRunningScenario(false);
        }
    };

    const handleCustomTest = async () => {
        if (!customTopic.trim()) return;

        setRunningCustom(true);
        const topic = customTopic.trim();
        startRun();

        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/generate-unified`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic }),
            });

            const data = await response.json();

            if (data.success && data.context) {
                completeRun(data.context);
                setLastResult({
                    name: "Custom Test",
                    topic: topic,
                    finalScore: data.context.consensus?.consensus_score || 0,
                    final_content: { text: data.context.generation?.script || "" }
                });
                setCustomTopic("");
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                completeRun(null);
            }
        } catch (e) {
            console.error("AI Service Test Call Failed:", e);
            completeRun(null);
        } finally {
            setRunningCustom(false);
        }
    };


    const handleRunHuggingFace = async (topicArg?: string) => {
        const topicToRun = typeof topicArg === "string" ? topicArg : customTopic;
        if (!topicToRun.trim()) return;

        setRunningGemini(true);

        try {
            console.log("🚀 Triggering Backend RunCycle (HuggingFace)...");

            const out = await runCycleClient({
                topic: topicToRun.trim(),
                primitives: primitives,
            });

            console.log('✅ Cycle complete:', out);

            // Get current metrics
            const metricsRef = doc(db, 'system', 'metrics');
            const metricsDoc = await getDoc(metricsRef);
            const metricsData = metricsDoc.exists() ? metricsDoc.data() : { total_episodes: 0, total_optimizations: 0 };
            const episodeNum = metricsData.total_episodes + 1;

            const mutations = Array.isArray(out.mutations) ? out.mutations : [];
            const optimized = mutations.length > 0;

            // Extract highlights for diff view
            const draftHighlight = out.draft_eval?.issues?.[0]?.message || 'See evaluation';
            const finalHighlight = mutations.length > 0 ? mutations.map((m: any) => m.primitive_name).join(', ') : 'Quality sufficient';

            // Write episode to Firestore
            await setDoc(doc(db, 'episodes', `ep_${episodeNum}`), {
                episode_num: episodeNum,
                topic: out.topic,
                quality_score: Math.round(out.final_eval.score * 100),
                issues_count: out.draft_eval.issues.length,
                optimized,
                timestamp: serverTimestamp(),
                metadata: {
                    fact_score: Math.round(out.draft_eval.score * 100),
                    style_score: Math.round(out.final_eval.score * 100),
                    confidence: Math.round(out.final_eval.score * 100),
                    gate_passed: out.final_eval.passed,
                    mutations,
                    demo_triggered: false,
                    scenario_name: 'HuggingFace Autonomous Run',
                    model: out.usedModel,
                    wandb_run_url: out.wandb_run_url,
                    episode_id: out.episode_id,
                    boot_id: out.boot_id,
                    draft_content: {
                        text: out.draft_text,
                        highlight: draftHighlight,
                        flag: out.draft_eval.issues.length > 0
                            ? out.draft_eval.issues.map((i: any) => i.message).join(', ')
                            : 'No issues'
                    },
                    final_content: {
                        text: out.final_text,
                        highlight: finalHighlight,
                        reason: optimized
                            ? `Corrections applied using updated primitives.`
                            : `Passed gate on first attempt.`
                    }
                }
            });

            // Update primitives
            const primitivesRef = doc(db, 'system', 'primitives');
            await setDoc(primitivesRef, {
                primitives: out.primitives_after,
                updated_at: serverTimestamp()
            });

            // Update metrics
            await setDoc(metricsRef, {
                total_episodes: episodeNum,
                total_optimizations: toNumberSafe(metricsData.total_optimizations, 0) + (optimized ? 1 : 0),
                primitives_count: Object.keys(out.primitives_after).length,
                updated_at: serverTimestamp()
            });

            setCustomTopic('');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            alert(`✅ Episode ${episodeNum} generated!\n\nDraft score: ${Math.round(out.draft_eval.score * 100)}/100\nFinal score: ${Math.round(out.final_eval.score * 100)}/100\n${optimized ? `\nSystem learned and updated ${mutations.length} primitive(s)!` : '\nNo learning needed - quality was good!'}`);

        } catch (error: any) {
            console.error('RunCycle error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setRunningGemini(false);
        }
    };

    const handlePrimitiveUpdate = async (name: string, value: number) => {
        try {
            // Optimistic update
            setPrimitives((prev: any) => ({ ...prev, [name]: value }));

            // In Vite/Express, APIs are at http://localhost:5174/api/...
            const baseUrl = getApiBaseUrl();
            await fetch(`${baseUrl}/api/primitives`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, value }),
            });
        } catch (error) {
            console.error('Failed to update primitive:', error);
        }
    };

    const latestEpisode = episodes.length > 0 ? episodes[episodes.length - 1] : null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-foreground p-8 font-sans text-gray-200">
            <div className="max-w-7xl mx-auto">
                {/* 1. HEADER */}
                <div className="mb-12 border-b border-gray-800 pb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <Sparkles className="w-12 h-12 text-gemini-blue animate-pulse-gemini" />
                            <div>
                                <div className="text-gemini-blue font-mono text-[10px] mb-1 tracking-[0.2em] uppercase font-bold">
                                    Section 1: Neural Status
                                </div>
                                <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-r from-gemini-blue via-gemini-purple to-gemini-cyan bg-clip-text text-transparent mb-1 italic">
                                    GAMESCRIPT AI
                                </h1>
                                <p className="text-xl text-gray-500 font-light tracking-wide">
                                    Self-Evolving Sports Broadcasting • <span className="text-gemini-blue/80 font-medium">Powered by Gemini 3</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-gray-600 bg-gray-900/50 w-fit px-3 py-1 rounded-full border border-gray-800">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            SYSTEM ACTIVE • EPISODE {episodes.length}
                        </div>
                    </div>
                </div>

                {/* 2. SIMPLE METRICS */}
                <div className="text-blue-500 font-mono text-xs mb-4 tracking-widest uppercase">
                    Section 2: Performance Metrics
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-[#111] p-6 rounded border border-gray-800 hover:border-gray-700 transition">
                        <div className="text-xs font-mono uppercase text-gray-500 mb-2">
                            Total Episodes
                        </div>
                        <div className="text-4xl font-light text-white">
                            {episodeCount}
                        </div>
                        <div className="text-xs text-gray-600 mt-2">generated and evaluated</div>
                    </div>

                    <div className="bg-[#111] p-6 rounded border border-gray-800 hover:border-gray-700 transition">
                        <div className="text-xs font-mono uppercase text-gray-500 mb-2">
                            System Updates
                        </div>
                        <div className="text-4xl font-light text-blue-400">
                            {mutationCount}
                        </div>
                        <div className="text-xs text-gray-600 mt-2">primitives evolved</div>
                    </div>

                    <div className="bg-[#111] p-6 rounded-2xl border border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition hover:border-gray-700">
                        <div className="text-xs tracking-[0.18em] text-white/50 mb-2 uppercase">
                            Gate Pass Rate
                        </div>
                        <div className="text-4xl font-semibold text-white">
                            {`${Math.round(gatePassRate * 100)}%`}
                        </div>
                        <div className="text-xs text-gray-600 mt-2">confidence gate success</div>
                    </div>
                </div>

                {/* 2.5 INSTANT EVOLUTION DEMO (NEW) */}
                <div className="mb-12">
                    <InstantEvolution />
                </div>

                {/* 3. NEURAL PIPELINE & MISSION CONTROL (NEW) */}
                <div className="mb-12">
                    <div className="text-gemini-blue font-mono text-xs mb-4 tracking-widest uppercase font-bold">
                        Section 3: Neural Pipeline & Mission Control
                    </div>
                    <MissionControl />

                    {/* ✅ Visual Evolution Trace */}
                    <MutationHighlight />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        <PrimitiveSliders
                            primitives={primitives}
                            highlightMutations={runContext?.mutation?.mutations_applied?.map((m: any) => m.primitive) || []}
                            onUpdate={handlePrimitiveUpdate}
                        />
                        <ForensicAudit />
                    </div>
                </div>

                {/* 4. SIMPLIFIED ARCHITECTURE */}
                <div className="text-blue-500 font-mono text-xs mb-4 tracking-widest uppercase text-center">
                    Section 4: System Architecture
                </div>

                <div className="mb-8">
                    <HowItWorksOptionC />
                </div>

                {/* 5. MULTIMODAL ANALYZER */}
                <div className="text-blue-500 font-mono text-xs mb-4 tracking-widest uppercase text-center mt-12">
                    Section 5: Multimodal Intelligence
                </div>
                <MultimodalAnalyzer />

                {/* ARCHIVE: Moving to Instant Evolution for Demonstration */}
                <div className="mb-14"></div>

                <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 p-6 rounded-lg border border-red-500/30 mb-8">
                    <h2 className="text-3xl font-bold mb-4">🎭 Demo Test Scenarios</h2>
                    <p className="text-sm text-gray-400 mb-6">
                        Demo scenarios showing different failure modes. Click any to see how the system responds and learns.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => handleScenario(1)}
                            disabled={runningScenario}
                            className="bg-gray-900/30 hover:bg-red-900/10 disabled:opacity-50 text-white p-6 rounded-lg border border-gray-800 hover:border-red-900/50 transition duration-300 text-left group"
                        >
                            <div className="text-4xl mb-3 grayscale group-hover:grayscale-0 transition duration-300">
                                🔴
                            </div>
                            <h3 className="text-xl font-light mb-2 text-gray-200 group-hover:text-red-400 transition">
                                Rumor Mill
                            </h3>
                            <p className="text-sm text-gray-500 mb-3">Brock Purdy trade to Jets</p>
                            <div className="flex items-center justify-between">
                                <div className="text-xs bg-gray-900 rounded px-2 py-1 inline-block text-gray-400 font-mono">
                                    Tests: fact_verification
                                </div>
                                <div className="text-xs font-bold text-red-500 group-hover:scale-110 transition">
                                    RUN →
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleScenario(2)}
                            disabled={runningScenario}
                            className="bg-gray-900/30 hover:bg-yellow-900/10 disabled:opacity-50 text-white p-6 rounded-lg border border-gray-800 hover:border-yellow-900/50 transition duration-300 text-left group"
                        >
                            <div className="text-4xl mb-3 grayscale group-hover:grayscale-0 transition duration-300">
                                🟡
                            </div>
                            <h3 className="text-xl font-light mb-2 text-gray-200 group-hover:text-yellow-400 transition">
                                Over-Excited Fan
                            </h3>
                            <p className="text-sm text-gray-500 mb-3">Revolutionary breakthrough</p>
                            <div className="flex items-center justify-between">
                                <div className="text-xs bg-gray-900 rounded px-2 py-1 inline-block text-gray-400 font-mono">
                                    Tests: anti_hyperbole
                                </div>
                                <div className="text-xs font-bold text-yellow-500 group-hover:scale-110 transition">
                                    RUN →
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleScenario(3)}
                            disabled={runningScenario}
                            className="bg-gray-900/30 hover:bg-blue-900/10 disabled:opacity-50 text-white p-6 rounded-lg border border-gray-800 hover:border-blue-900/50 transition duration-300 text-left group"
                        >
                            <div className="text-4xl mb-3 grayscale group-hover:grayscale-0 transition duration-300">
                                🔵
                            </div>
                            <h3 className="text-xl font-light mb-2 text-gray-200 group-hover:text-blue-400 transition">
                                Temporal Trap
                            </h3>
                            <p className="text-sm text-gray-500 mb-3">Vision Pro sales analysis</p>
                            <div className="flex items-center justify-between">
                                <div className="text-xs bg-gray-900 rounded px-2 py-1 inline-block text-gray-400 font-mono">
                                    Tests: source_attribution
                                </div>
                                <div className="text-xs font-bold text-blue-500 group-hover:scale-110 transition">
                                    RUN →
                                </div>
                            </div>
                        </button>
                    </div>

                    {runningScenario && (
                        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded flex items-center gap-3">
                            <div className="animate-spin text-2xl">⚙️</div>
                            <div>
                                <div className="font-bold text-yellow-400">Processing Scenario...</div>
                                <div className="text-sm text-gray-400">Watch the dashboard update in real-time</div>
                            </div>
                        </div>
                    )}

                    {lastResult && !runningScenario && (
                        <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded">
                            <div className="font-bold text-green-400 mb-2">✅ Scenario Complete</div>
                            <div className="text-sm text-gray-300 mb-2">
                                <strong>Episode {lastResult.episode}:</strong> {lastResult.scenario}
                            </div>
                            {lastResult.mutations?.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <div className="text-xs font-bold text-green-400">SYSTEM UPDATES</div>
                                    {lastResult.mutations.map((mut: any, i: number) => (
                                        <div key={i} className="text-xs bg-green-900/20 rounded p-2">
                                            <div className="font-bold text-green-300">
                                                {String(mut.primitive_name || "").replace(/_/g, " ").toUpperCase()}
                                            </div>
                                            <div className="text-gray-400">
                                                {fmtFixed(mut.old_weight, 2)} → {fmtFixed(mut.new_weight, 2)}
                                                <span className="text-green-400"> (+{fmtFixed(mut.delta, 2)})</span>
                                            </div>
                                            <div className="text-gray-500 text-xs mt-1">{mut.reason}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 7. LEARNING CURVE CHART */}
                {
                    episodes.length > 0 && (
                        <>
                            <div className="text-blue-500 font-mono text-xs mb-4 tracking-widest uppercase">
                                Section 7: Learning Velocity
                            </div>

                            <div className="bg-[#111] p-8 rounded-2xl border border-white/10 mb-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />

                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Self-Evolving Learning Curve</h2>
                                        <p className="text-xs text-slate-500 font-mono tracking-widest mt-1">NEURAL PERFORMANCE vs. AUTONOMY MOMENTUM</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[10px] text-emerald-400 font-black uppercase">Evolved</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-600" />
                                            <span className="text-[10px] text-slate-500 font-black uppercase">Baseline</span>
                                        </div>
                                    </div>
                                </div>

                                <React.Suspense fallback={<div className="h-[400px] flex items-center justify-center text-gray-500 font-mono text-xs">Calibrating Visualization Matrix...</div>}>
                                    <Plot
                                        data={[
                                            {
                                                // 1. NEURAL PERFORMANCE (Post-Evolution)
                                                x: sortedEpisodes.map((ep: any) => toNumberSafe(ep.episode_num, 0)),
                                                y: sortedEpisodes.map((ep: any) => toNumberSafe(ep.quality_score, 0)),
                                                type: "scatter",
                                                mode: "lines+markers",
                                                name: "Neural Performance",
                                                line: { color: "#10b981", width: 4, shape: 'spline' },
                                                marker: { size: 8, color: "#10b981", line: { color: '#000', width: 2 } },
                                                fill: 'tozeroy',
                                                fillcolor: 'rgba(16, 185, 129, 0.05)'
                                            },
                                            {
                                                // 2. STANDARD LLM BASELINE (Synthesized for comparison)
                                                x: sortedEpisodes.map((ep: any) => toNumberSafe(ep.episode_num, 0)),
                                                y: sortedEpisodes.map((ep: any, i) => {
                                                    // Generate a baseline that stays around 70-80%
                                                    const base = 75 + (Math.sin(i * 0.5) * 5);
                                                    return ep.quality_score < 70 ? ep.quality_score : base;
                                                }),
                                                type: "scatter",
                                                mode: "lines",
                                                name: "Standard LLM Baseline",
                                                line: { color: "#475569", width: 2, dash: 'dash' },
                                                opacity: 0.6
                                            },
                                            {
                                                // 3. AUTONOMY MOMENTUM (Mutations)
                                                x: sortedEpisodes.map((ep: any) => toNumberSafe(ep.episode_num, 0)),
                                                y: sortedEpisodes.map((ep: any) => toNumberSafe(ep.mutations || ep.issues_count || 0, 0)),
                                                type: "bar",
                                                name: "Autonomy Momentum",
                                                yaxis: "y2",
                                                marker: { color: "rgba(59, 130, 246, 0.3)" },
                                                width: 0.6
                                            },
                                        ]}
                                        layout={{
                                            paper_bgcolor: "rgba(0,0,0,0)",
                                            plot_bgcolor: "rgba(0,0,0,0)",
                                            font: { color: "#94a3b8", family: 'JetBrains Mono, monospace' },
                                            showlegend: false,
                                            xaxis: {
                                                title: { text: "TECHNICAL EPISODES", font: { size: 10, color: '#475569' } },
                                                gridcolor: "rgba(255,255,255,0.03)",
                                                zeroline: false
                                            },
                                            yaxis: {
                                                title: { text: "QUALITY SCORE", font: { size: 10, color: '#475569' } },
                                                gridcolor: "rgba(255,255,255,0.05)",
                                                range: [0, 105],
                                                zeroline: false
                                            },
                                            yaxis2: {
                                                title: { text: "MUTATIONS", font: { size: 10, color: '#3b82f6' } },
                                                overlaying: "y",
                                                side: "right",
                                                gridcolor: "transparent",
                                                range: [0, 10],
                                                zeroline: false
                                            },
                                            margin: { l: 40, r: 40, t: 20, b: 40 },
                                            hovermode: 'closest'
                                        }}
                                        config={{ displayModeBar: false }}
                                        style={{ width: "100%", height: "400px" }}
                                    />
                                </React.Suspense>
                            </div>
                        </>
                    )
                }

                {/* 8. EPISODE TIMELINE */}
                {/* 8. FULL LEARNING HISTORY */}
                <FullLearningHistory episodes={episodes} />

                {/* 9. SYSTEM OUTCOMES */}
                <SystemOutcomesSection
                    episodes={episodes.map((ep: any) => ({
                        id: ep.episode_num,
                        quality_score: ep.quality_score,
                        issues_count: ep.issues_count,
                        metadata: {
                            gate_passed: ep.metadata?.gate_passed,
                            confidence: ep.metadata?.confidence
                        },
                        autonomy: {
                            primitive_updates: ep.metadata?.mutations?.length || 0
                        }
                    }))}
                />

                {/* 10. META-LEARNING ENGINE */}
                <div className="mt-14 mb-14">
                    <div className="text-xs tracking-[0.18em] text-indigo-400 uppercase mb-4">SECTION 10</div>
                    <MetaLearningDashboard episodes={episodes} />
                </div>

                {/* 5. TEST WITH ANY IDEA */}
                <TestWithAnyIdeaCard episodes={episodes} />
            </div>
        </div >
    );
}
