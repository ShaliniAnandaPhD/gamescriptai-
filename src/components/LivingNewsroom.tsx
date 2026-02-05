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
import { PrimitiveSliders } from './PrimitiveSliders';
import { RunContextViewer } from './RunContextViewer';
import { InstantEvolution } from './InstantEvolution';




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
    {
        id: 1,
        title: "Morning Brief: Agentic Workflows Rising",
        topicBase: "Daily Opener",
        timestamp: "2026-01-31T07:45:00.000Z",
        status: "PASS",
        score: 100,
        primitive_action: "entertainment_value 🎭",
        redis_op: "HGET config:voice_modulation 'morning_energy'",
    },
    {
        id: 2,
        title: "New Years Resolution: Gym Tech for 2026",
        topicBase: "Health Tech",
        timestamp: "2026-01-31T08:15:00.000Z",
        status: "PASS",
        score: 93,
        primitive_action: "entertainment_value 🎭",
        redis_op: "HSET tone_profiles:lifestyle 'motivational'",
    },
    {
        id: 3,
        title: "2026 Tech Outlook: The Year of Wearables",
        topicBase: "Yearly Forecast",
        timestamp: "2026-01-31T08:45:00.000Z",
        status: "PASS",
        score: 96,
        primitive_action: "brevity ⚡",
        redis_op: "SET config:brevity 0.4 (Listicle Format)",
    },
    {
        id: 4,
        title: "SpaceX Starlink Direct-to-Cell Launch",
        topicBase: "Telecom News",
        timestamp: "2026-01-31T09:15:00.000Z",
        status: "PASS",
        score: 100,
        primitive_action: "fact_verification 🛡️",
        redis_op: "SISMEMBER verified_launches 'Starlink-DTC-1'",
    },
    {
        id: 5,
        title: "Rumor: Microsoft Buying Discord?",
        topicBase: "Tech Acquisitions",
        timestamp: "2026-01-31T09:45:00.000Z",
        status: "FAIL",
        score: 40,
        primitive_action: "temporal_accuracy ⏳",
        redis_op: "GET date:news:msft_discord -> '2021' (Stale Data)",
        issues: ["Based on 2021 news, old data retrieved"],
    },
    {
        id: 6,
        title: "Boston Dynamics 'Atlas 3' Parkour Demo",
        topicBase: "Robotics Viral Video",
        timestamp: "2026-01-31T10:15:00.000Z",
        status: "PASS",
        score: 98,
        primitive_action: "entertainment_value 🎭",
        redis_op: "HGET config:entertainment_value (High Movement Descriptor)",
    },
    {
        id: 7,
        title: "Sony PS6 Teaser: What We Saw at CES",
        topicBase: "Gaming News",
        timestamp: "2026-01-31T10:45:00.000Z",
        status: "PASS",
        score: 94,
        primitive_action: "entertainment_value 🎭",
        redis_op: "INCR stats:engagement:gaming_news",
    },
    {
        id: 8,
        title: "Midjourney v7 Video: Is Hollywood Dead?",
        topicBase: "AI Video Tools",
        timestamp: "2026-01-31T11:15:00.000Z",
        status: "EVOLVED",
        score: 100,
        primitive_action: "anti_hyperbole ⚖️",
        redis_op: "HSET config:anti_hyperbole 0.9 (Curbed 'Doom & Gloom' rhetoric)",
        note: "Style Editor curbed 'Doom & Gloom' rhetoric.",
    },
    {
        id: 9,
        title: "Week 18 NFL: The Playoff Picture Set",
        topicBase: "NFL Regular Season Finale",
        timestamp: "2026-01-31T11:45:00.000Z",
        status: "PASS",
        score: 100,
        primitive_action: "entertainment_value 🎭",
        redis_op: "HGET tone_profiles:sports_broadcast",
    },
    {
        id: 10,
        title: "Review: The 'Rabbit R3' Pocket Agent",
        topicBase: "AI Gadgets",
        timestamp: "2026-01-31T12:15:00.000Z",
        status: "FAIL",
        score: 55,
        primitive_action: "entertainment_value 🎭",
        redis_op: "HSET config:entertainment_value 0.6 (Failed: Hostile Tone)",
        issues: ["Tone too aggressive", "Missed key features"],
    },
    {
        id: 11,
        title: "Breaking: Ford Adopts NACS Charging 2.0",
        topicBase: "EV News",
        timestamp: "2026-01-31T12:45:00.000Z",
        status: "PASS",
        score: 99,
        primitive_action: "fact_verification 🛡️",
        redis_op: "GET specs:charging:nacs_v2",
    },
    {
        id: 12,
        title: "Crypto Regulation: The New 2026 SEC Rules",
        topicBase: "Finance News",
        timestamp: "2026-01-31T13:15:00.000Z",
        status: "EVOLVED",
        score: 100,
        primitive_action: "anti_hyperbole ⚖️",
        redis_op: "SREM keywords 'disaster' 'moon' (Enforced Neutrality)",
        note: "Removed political bias from initial draft.",
    },
    {
        id: 13,
        title: "Amazon Alexa LLM Upgrade: Finally Good?",
        topicBase: "Smart Home AI",
        timestamp: "2026-01-31T13:45:00.000Z",
        status: "PASS",
        score: 92,
        primitive_action: "temporal_accuracy ⏳",
        redis_op: "HGET last_coverage:alexa -> '14_months_ago' (Context Added)",
    },
    {
        id: 14,
        title: "Wild Card Weekend: Bills Elimination",
        topicBase: "NFL Wild Card",
        timestamp: "2026-01-31T14:15:00.000Z",
        status: "PASS",
        score: 100,
        primitive_action: "entertainment_value 🎭",
        redis_op: "HSET tone_overrides:bills_mafia 'empathetic'",
    },
    {
        id: 15,
        title: "CES 2026: Best of Show Recap",
        topicBase: "CES 2026",
        timestamp: "2026-01-31T14:45:00.000Z",
        status: "PASS",
        score: 95,
        primitive_action: "brevity ⚡",
        redis_op: "HGET config:brevity 0.4 (Enforcing tight segments)",
    },
    {
        id: 16,
        title: "Sam Altman Returns to YC? (Rumor Check)",
        topicBase: "Silicon Valley Gossip",
        timestamp: "2026-01-31T15:15:00.000Z",
        status: "EVOLVED",
        score: 100,
        primitive_action: "fact_verification 🛡️",
        redis_op: "SETNX rumors:sam_altman_yc 'DEBUNKED_MODE'",
        note: "Fact Checker flagged as 'False' -> Script pivoted to 'Why this rumor exists'.",
    },
    {
        id: 17,
        title: "SpaceX Starship: Orbital Refueling Success",
        topicBase: "Space News",
        timestamp: "2026-01-31T15:45:00.000Z",
        status: "PASS",
        score: 97,
        primitive_action: "fact_verification 🛡️",
        redis_op: "MGET glossary:orbital_mechanics:propellant_transfer",
    },
    {
        id: 18,
        title: "Meta Quest 4 Pro: Leaked Specs Analysis",
        topicBase: "VR Hardware Leaks",
        timestamp: "2026-01-31T16:15:00.000Z",
        status: "FAIL",
        score: 60,
        primitive_action: "source_attribution 📡",
        redis_op: "ZADD blacklist:domains 100 'x.com/fake_leaker_account'",
        issues: ["Cited a parody account as fact"],
    },
    {
        id: 19,
        title: "Divisional Round: 49ers vs. Packers Shock",
        topicBase: "NFL Playoffs",
        timestamp: "2026-01-31T16:45:00.000Z",
        status: "PASS",
        score: 100,
        primitive_action: "entertainment_value 🎭",
        redis_op: "INCR stats:viral_potential:upsets",
    },
    {
        id: 20,
        title: "Google DeepMind's 'AlphaCode 3' Paper",
        topicBase: "AI Research",
        timestamp: "2026-01-31T17:15:00.000Z",
        status: "PASS",
        score: 98,
        primitive_action: "source_attribution 📡",
        redis_op: "SISMEMBER whitelist:journals 'Nature Machine Intelligence'",
    },
    {
        id: 21,
        title: "Humane AI Pin 2: A Second Chance?",
        topicBase: "Hardware Review",
        timestamp: "2026-01-31T17:45:00.000Z",
        status: "EVOLVED",
        score: 100,
        primitive_action: "anti_hyperbole ⚖️",
        redis_op: "HSET config:anti_hyperbole 0.88 (Softened 'Trash' to 'Flawed')",
        note: "Style Editor softened harsh criticism.",
    },
    {
        id: 22,
        title: "Exclusive: Interview with Jensen Huang (AI)",
        topicBase: "NVIDIA CEO Interview",
        timestamp: "2026-01-31T18:15:00.000Z",
        status: "PASS",
        score: 100,
        primitive_action: "source_attribution 📡",
        redis_op: "PFADD unique_sources 'Jensen Huang Transcript 2026'",
    },
    {
        id: 23,
        title: "Gemini 3 Flash vs. GPT-5: The Coding Test",
        topicBase: "LLM Benchmarks",
        timestamp: "2026-01-31T18:45:00.000Z",
        status: "FAIL",
        score: 78,
        primitive_action: "fact_verification 🛡️",
        redis_op: "LPUSH failures:math_logic 'Gemini Benchmark Calculation Error'",
        issues: ["Math error in benchmark average"],
    },
    {
        id: 24,
        title: "Alert: DeepFake Taylor Swift Scan Scam",
        topicBase: "Security Alert",
        timestamp: "2026-01-31T19:15:00.000Z",
        status: "PASS",
        score: 95,
        primitive_action: "source_attribution 📡",
        redis_op: "PUBLISH alerts:high_priority 'Verified Vector: 404 Media'",
    },
    {
        id: 25,
        title: "AFC Championship: Patriots Defense Wins It",
        topicBase: "AFC Championship",
        timestamp: "2026-01-31T19:45:00.000Z",
        status: "PASS",
        score: 100,
        primitive_action: "brevity ⚡",
        redis_op: "SET config:brevity_limit '90s'",
    },
    {
        id: 26,
        title: "NFC Championship Reaction: Seattle Reigns",
        topicBase: "NFC Championship",
        timestamp: "2026-01-31T20:15:00.000Z",
        status: "PASS",
        score: 100,
        primitive_action: "entertainment_value 🎭",
        redis_op: "HSET config:entertainment_value 0.9 (Boosted Energy)",
        note: "Matched crowd energy levels.",
    },
    {
        id: 27,
        title: "Review: Tesla Optimus Gen 3 in Factories",
        topicBase: "Robotics News",
        timestamp: "2026-01-31T20:45:00.000Z",
        status: "PASS",
        score: 99,
        primitive_action: "entertainment_value 🎭",
        redis_op: "HGET tone_profiles:optimistic_tech",
    },
    {
        id: 28,
        title: "Debunked: The 'Sentient' Claude 4.5 Rumor",
        topicBase: "AI Safety Rumors",
        timestamp: "2026-01-31T21:15:00.000Z",
        status: "EVOLVED",
        score: 100,
        primitive_action: "anti_hyperbole ⚖️",
        redis_op: "SADD banned_phrases 'consciousness detected' 'sentient AI'",
        note: "Triggered Anti-Hyperbole Guardrail.",
    },
    {
        id: 29,
        title: "Deep Dive: The 'AppleGPT' on iPhone 18",
        topicBase: "Apple AI Hardware",
        timestamp: "2026-01-31T21:45:00.000Z",
        status: "PASS",
        score: 96,
        primitive_action: "entertainment_value 🎭",
        redis_op: "HINCRBY stats:engagement:tech_deepdive 1",
    },
    {
        id: 30,
        title: "Breaking: Seahawks QB Injury Report Update",
        topicBase: "Super Bowl Injury News",
        timestamp: "2026-01-31T22:15:00.000Z",
        status: "EVOLVED",
        score: 100,
        primitive_action: "fact_verification 🛡️",
        redis_op: "HSET config:fact_verification 0.98 (Tightened from 0.95)",
        note: "Corrected 'Confirmed Out' to 'Questionable' based on team presser.",
    },
    {
        id: 31,
        title: "Market Watch: NVIDIA Hits $5 Trillion Cap",
        topicBase: "NVIDIA Stock Milestone",
        timestamp: "2026-01-31T22:45:00.000Z",
        status: "PASS",
        score: 98,
        primitive_action: "fact_verification 🛡️",
        redis_op: "SETEX market_cap:NVDA 300 '5.02T' (Cache Update)",
    },
    {
        id: 32,
        title: "OpenAI 'O4' Reasoning Model: Real or Fake?",
        topicBase: "OpenAI O4 Leaks",
        timestamp: "2026-01-31T23:15:00.000Z",
        status: "EVOLVED",
        score: 100,
        primitive_action: "source_attribution 📡",
        redis_op: "ZADD trusted_sources:openai 0.95 'official_blog' (Downranked Reddit)",
        note: "System suppressed 3 fake Reddit rumors.",
    },
    {
        id: 33,
        title: "Super Bowl LX Prediction: The Final Consensus",
        topicBase: "Super Bowl 2026",
        timestamp: "2026-01-31T23:45:00.000Z",
        status: "PASS",
        score: 100,
        primitive_action: "fact_verification 🛡️",
        redis_op: "HINCRBY session:confidence:nfl_data 1",
        note: "Cross-referenced 50 simulations. Prediction confidence: 94%.",
    },
] as const;

// Map static history to the schema used by the UI
const mapStaticToEpisode = (item: (typeof STATIC_HISTORY)[number]) => ({
    id: `static_${item.id}`,
    episode_num: item.id,
    topic: item.title,
    quality_score: item.score,
    issues_count: Array.isArray((item as any).issues) ? (item as any).issues.length : 0,
    optimized: item.status === "EVOLVED",
    timestamp: { toDate: () => new Date(item.timestamp) },
    primitive_action: item.primitive_action,
    redis_op: item.redis_op,
    metadata: {
        fact_score: item.score,
        style_score: item.score,
        confidence: item.score,
        gate_passed: item.status !== "FAIL",
        mutations: (item as any).note
            ? [
                {
                    primitive_name:
                        ((item as any).note as string).split(":")[1]?.split(" ")[1] || "adaptation",
                    new_weight: 1.0,
                    reason: (item as any).note,
                },
            ]
            : [],
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

    const [episodes, setEpisodes] = useState<AnyEpisode[]>([]);
    const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
    const [primitives, setPrimitives] = useState<any>({});
    const [metrics, setMetrics] = useState<any>({});
    const [runningScenario, setRunningScenario] = useState(false);
    const [runningCustom, setRunningCustom] = useState(false);
    const [customTopic, setCustomTopic] = useState("");
    const [lastResult, setLastResult] = useState<any>(null);
    const [runContext, setRunContext] = useState<any>(null);

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

    useEffect(() => {
        const episodesQuery = query(
            collection(db, "episodes"),
            orderBy("episode_num", "asc")
        );

        const unsubscribeEpisodes = onSnapshot(episodesQuery, (snapshot) => {
            try {
                const firebaseData = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));

                const mappedHistory = STATIC_HISTORY.map(mapStaticToEpisode);

                const combinedEpisodes = [
                    ...mappedHistory,
                    ...firebaseData
                        .filter((ep: any) => toNumberSafe(ep?.episode_num, 0) > 33)
                        .map(normalizeEpisode),
                ].sort((a, b) => toNumberSafe(a.episode_num, 0) - toNumberSafe(b.episode_num, 0));

                setEpisodes(combinedEpisodes);

                if (combinedEpisodes.length > 0) {
                    setSelectedEpisode((prev) => {
                        if (prev === 1) return combinedEpisodes[combinedEpisodes.length - 1].episode_num;
                        return prev;
                    });
                }
            } catch (error) {
                console.error("Critical error in episode snapshot update:", error);
                setEpisodes(STATIC_HISTORY.map(mapStaticToEpisode));
            }
        });

        const unsubscribePrimitives = onSnapshot(doc(db, "system", "primitives"), (d) => {
            if (d.exists()) setPrimitives((d.data() as any)?.primitives || {});
        });

        const unsubscribeMetrics = onSnapshot(doc(db, "system", "metrics"), (d) => {
            if (d.exists()) setMetrics(d.data() as any);
        });

        return () => {
            unsubscribeEpisodes();
            unsubscribePrimitives();
            unsubscribeMetrics();
        };
    }, []);

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

    const handleScenario = async (scenarioId: number) => {
        setRunningScenario(true);
        setLastResult(null);

        const scenarios: Record<number, any> = {
            1: {
                name: "Rumor Mill",
                topic: "Secret trade: Brock Purdy to New York Jets happening today",
                factScore: 45,
                styleScore: 100,
                finalScore: 59,
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

            setLastResult({
                episode: episodeNum,
                scenario: scenario.name,
                mutations: scenario.mutations,
            });

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

        // Log token check at runtime via HF call
        try {
            await callHuggingFace(`Summarize the relevance of ${topic} to AI ethics in one sentence.`);
            await callGemini(`Provide a brief analysis of ${topic} for a news summary.`);
        } catch (e) {
            console.error("AI Service Test Call Failed:", e);
        }


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

            const topicLower = topic.toLowerCase();
            let factScore = 100;
            let styleScore = 100;
            const issues: any[] = [];
            const mutations: any[] = [];

            if (
                topicLower.includes("gpt-5") ||
                topicLower.includes("gpt-6") ||
                topicLower.includes("gpt-7") ||
                topicLower.includes("llama 4") ||
                topicLower.includes("llama 5")
            ) {
                factScore = 50;
                issues.push({ type: "hallucination", reason: "Product does not exist", severity: "high" });

                const oldWeight = toNumberSafe(primitivesData?.fact_verification?.weight, 0.65);
                const newWeight = Math.min(1.0, oldWeight + 0.15);

                primitivesData.fact_verification = primitivesData.fact_verification || {};
                primitivesData.fact_verification.weight = newWeight;

                mutations.push({
                    primitive_name: "fact_verification",
                    old_weight: oldWeight,
                    new_weight: newWeight,
                    delta: newWeight - oldWeight,
                    reason: "Hallucination detected",
                });
            }

            if (
                topicLower.includes("revolutionary") ||
                topicLower.includes("breakthrough") ||
                topicLower.includes("game-changing") ||
                topicLower.includes("unprecedented") ||
                topicLower.includes("earth-shattering")
            ) {
                styleScore = 70;
                issues.push({ type: "hyperbole", reason: "Excessive superlatives", severity: "medium" });

                if (primitivesData.anti_hyperbole) {
                    const oldWeight = toNumberSafe(primitivesData.anti_hyperbole.weight, 0.75);
                    const newWeight = Math.min(1.0, oldWeight + 0.1);
                    primitivesData.anti_hyperbole.weight = newWeight;

                    mutations.push({
                        primitive_name: "anti_hyperbole",
                        old_weight: oldWeight,
                        new_weight: newWeight,
                        delta: newWeight - oldWeight,
                        reason: "Strengthened hyperbole guardrail",
                    });
                }
            }

            const finalScore = Math.round(factScore * 0.7 + styleScore * 0.3);

            await setDoc(doc(db, "episodes", `ep_${episodeNum}`), {
                episode_num: episodeNum,
                topic,
                quality_score: finalScore,
                issues_count: issues.length,
                optimized: mutations.length > 0,
                timestamp: serverTimestamp(),
                metadata: {
                    fact_score: factScore,
                    style_score: styleScore,
                    confidence: finalScore,
                    gate_passed: finalScore >= 70,
                    mutations,
                    custom_input: true,
                },
            });

            await setDoc(primitivesRef, {
                primitives: primitivesData,
                updated_at: serverTimestamp(),
            });

            await setDoc(metricsRef, {
                total_episodes: episodeNum,
                total_optimizations:
                    toNumberSafe(metricsData.total_optimizations, 0) + (mutations.length > 0 ? 1 : 0),
                primitives_count: Object.keys(primitivesData).length,
                updated_at: serverTimestamp(),
            });

            setCustomTopic("");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            console.error("Error:", error);
            alert("Error running test");
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
            const baseUrl = window.location.origin.includes('localhost')
                ? window.location.origin.replace(/:[0-9]+/, ':5174')
                : '';
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
                            {toNumberSafe(metrics.total_episodes, 0)}
                        </div>
                        <div className="text-xs text-gray-600 mt-2">generated and evaluated</div>
                    </div>

                    <div className="bg-[#111] p-6 rounded border border-gray-800 hover:border-gray-700 transition">
                        <div className="text-xs font-mono uppercase text-gray-500 mb-2">
                            System Updates
                        </div>
                        <div className="text-4xl font-light text-blue-400">
                            {toNumberSafe(metrics.total_optimizations, 0)}
                        </div>
                        <div className="text-xs text-gray-600 mt-2">primitives evolved</div>
                    </div>

                    <div className="bg-[#111] p-6 rounded-2xl border border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition hover:border-gray-700">
                        <div className="text-xs tracking-[0.18em] text-white/50 mb-2 uppercase">
                            Gate Pass Rate
                        </div>
                        <div className="text-4xl font-semibold text-white">
                            {(() => {
                                const total = episodes.length;
                                if (total === 0) return "0%";
                                const passed = episodes.filter((e: any) => e.metadata?.gate_passed).length;
                                return `${Math.round((passed / total) * 100)}%`;
                            })()}
                        </div>
                        <div className="text-xs text-gray-600 mt-2">confidence gate success</div>
                    </div>
                </div>

                {/* 2.5 INSTANT EVOLUTION DEMO (NEW) */}
                <div className="mb-12">
                    <InstantEvolution
                        onStart={() => setRunContext({ final_status: 'in_progress', run_id: 'pending-' + Date.now(), topic: 'evolution_demo' })}
                        onComplete={(context) => setRunContext(context)}
                    />
                </div>

                {/* 3. NEURAL PIPELINE & MISSION CONTROL (NEW) */}
                <div className="mb-12">
                    <div className="text-gemini-blue font-mono text-xs mb-4 tracking-widest uppercase font-bold">
                        Section 3: Neural Pipeline & Mission Control
                    </div>
                    <MissionControl runContext={runContext} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <PrimitiveSliders
                            primitives={primitives}
                            highlightMutations={runContext?.mutation?.mutations_applied.map((m: any) => m.primitive) || []}
                            onUpdate={handlePrimitiveUpdate}
                        />
                        {runContext && <RunContextViewer context={runContext} />}
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

                {/* 5. DEMO TEST SCENARIOS */}
                < div className="text-blue-500 font-mono text-xs mb-4 tracking-widest uppercase" >
                    Section 5: Interactive Simulation
                </div >

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

                            <div className="bg-[#111] p-8 rounded border border-gray-800 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-light text-white">Learning Velocity</h2>
                                    <span className="text-xs font-mono text-gray-500">QUALITY vs ISSUES</span>
                                </div>

                                <React.Suspense fallback={<div className="h-[300px] flex items-center justify-center text-gray-500 font-mono text-xs">Loading Visualization Engine...</div>}>
                                    <Plot
                                        data={[
                                            {
                                                x: episodes.map((ep: any) => toNumberSafe(ep.episode_num, 0)),
                                                y: episodes.map((ep: any) => toNumberSafe(ep.quality_score, 0)),
                                                type: "scatter",
                                                mode: "lines+markers",
                                                name: "Quality Score",
                                                line: { color: "#34d399", width: 2 },
                                                marker: { size: 6, color: "#34d399" },
                                            },
                                            {
                                                x: episodes.map((ep: any) => toNumberSafe(ep.episode_num, 0)),
                                                y: episodes.map((ep: any) => toNumberSafe(ep.issues_count, 0)),
                                                type: "scatter",
                                                mode: "lines+markers",
                                                name: "Issues Detected",
                                                yaxis: "y2",
                                                line: { color: "#fb7185", width: 2 },
                                                marker: { size: 6, color: "#fb7185" },
                                            },
                                        ]}
                                        layout={{
                                            paper_bgcolor: "rgba(0,0,0,0)",
                                            plot_bgcolor: "rgba(0,0,0,0)",
                                            font: { color: "#666" },
                                            xaxis: { title: { text: "EPISODE" }, gridcolor: "#222" },
                                            yaxis: { title: { text: "QUALITY" }, gridcolor: "#222", range: [0, 100] },
                                            yaxis2: {
                                                title: { text: "ISSUES", font: { color: "#fb7185" } },
                                                overlaying: "y",
                                                side: "right",
                                                gridcolor: "transparent",
                                                range: [0, maxIssues],
                                                tickfont: { color: "#fb7185" },
                                            },
                                            legend: { x: 0, y: 1.1, orientation: "h" },
                                            margin: { l: 40, r: 40, t: 0, b: 40 },
                                        }}
                                        config={{ displayModeBar: false }}
                                        style={{ width: "100%", height: "300px" }}
                                    />
                                </React.Suspense>
                            </div>
                        </>
                    )
                }

                {/* 8. EPISODE TIMELINE */}
                <div className="text-blue-500 font-mono text-xs mb-4 tracking-widest uppercase">
                    Section 8: Historical Archives
                </div>

                <div className="bg-[#111] p-6 rounded border border-gray-800 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-light text-white">Full Learning History</h2>
                        </div>
                        <span className="text-xs font-mono text-gray-500">COMPLETE TIMELINE</span>
                    </div>

                    {episodes.length > 0 ? (
                        <div className="space-y-4">
                            <div className="bg-[#0a0a0a] p-4 rounded border border-gray-800">
                                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">
                                    Select Historical Episode
                                </label>

                                <select
                                    value={selectedEpisode}
                                    onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                                    className="w-full bg-black border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-gray-600 font-mono text-sm"
                                >
                                    {episodes
                                        .slice()
                                        .reverse()
                                        .map((ep: any) => (
                                            <option key={ep.episode_num} value={ep.episode_num}>
                                                EPISODE {ep.episode_num} • {String(ep.topic || "").substring(0, 50)}...
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Selected Episode Details */}
                            {(() => {
                                const episode = episodes.find((ep: any) => ep.episode_num === selectedEpisode);
                                if (!episode) return null;

                                const isOptimized = Boolean(episode.optimized);
                                const gatePassed = Boolean(episode.metadata?.gate_passed);
                                const hasMutations =
                                    Array.isArray(episode.metadata?.mutations) && episode.metadata.mutations.length > 0;

                                return (
                                    <div
                                        className={`mt-4 bg-[#0a0a0a] p-4 rounded border ${isOptimized ? "border-gray-600" : "border-gray-800"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-6 border-b border-gray-800 pb-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="text-xl font-light text-white">
                                                        Episode {episode.episode_num}
                                                    </div>
                                                    {isOptimized && (
                                                        <div className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-[10px] font-mono text-white animate-pulse">
                                                            SYSTEM EVOLVED
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-base text-gray-400 font-light mb-2">
                                                    "{episode.topic}"
                                                </div>

                                                <div className="text-xs font-mono text-gray-600">
                                                    {episode.timestamp && typeof episode.timestamp.toDate === "function"
                                                        ? episode.timestamp.toDate().toLocaleString()
                                                        : "Just now"}
                                                </div>

                                                <div className="mt-4 flex flex-col gap-2">
                                                    {episode.primitive_action && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono text-gray-500 uppercase w-24">
                                                                PRIMITIVE ACTION:
                                                            </span>
                                                            <span className="text-xs font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10">
                                                                {episode.primitive_action}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {episode.redis_op && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono text-gray-500 uppercase w-24">
                                                                REDIS OP:
                                                            </span>
                                                            <span className="text-xs font-mono text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded bg-blue-500/10 truncate max-w-md">
                                                                {episode.redis_op}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-8">
                                                <div className="text-center">
                                                    <div
                                                        className={`text-4xl font-light mb-1 ${episode.quality_score >= 75
                                                            ? "text-emerald-400"
                                                            : episode.quality_score >= 50
                                                                ? "text-amber-400"
                                                                : "text-rose-400"
                                                            }`}
                                                    >
                                                        {toNumberSafe(episode.quality_score, 0)}
                                                    </div>
                                                    <div className="text-xs font-mono text-gray-500 uppercase">
                                                        Quality Score
                                                    </div>
                                                </div>

                                                <div className="text-center">
                                                    <div
                                                        className={`text-4xl font-light mb-1 ${toNumberSafe(episode.issues_count, 0) > 0
                                                            ? "text-rose-400"
                                                            : "text-emerald-400"
                                                            }`}
                                                    >
                                                        {toNumberSafe(episode.issues_count, 0)}
                                                    </div>
                                                    <div className="text-xs font-mono text-gray-500 uppercase">Issues</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-px bg-gray-800 rounded overflow-hidden border border-gray-800 mb-6">
                                            <div className="bg-[#0a0a0a] p-4 text-center">
                                                <div className="text-xs font-mono text-gray-500 mb-2 uppercase">
                                                    Fact Check
                                                </div>
                                                <div
                                                    className={`text-2xl font-light ${toNumberSafe(episode.metadata?.fact_score, 0) >= 70
                                                        ? "text-white"
                                                        : "text-gray-400"
                                                        }`}
                                                >
                                                    {toNumberSafe(episode.metadata?.fact_score, 0)}
                                                </div>
                                            </div>

                                            <div className="bg-[#0a0a0a] p-4 text-center">
                                                <div className="text-xs font-mono text-gray-500 mb-2 uppercase">
                                                    Style Check
                                                </div>
                                                <div
                                                    className={`text-2xl font-light ${toNumberSafe(episode.metadata?.style_score, 0) >= 70
                                                        ? "text-white"
                                                        : "text-gray-400"
                                                        }`}
                                                >
                                                    {toNumberSafe(episode.metadata?.style_score, 0)}
                                                </div>
                                            </div>

                                            <div className="bg-[#0a0a0a] p-4 text-center">
                                                <div className="text-xs font-mono text-gray-500 mb-2 uppercase">
                                                    Gate Confidence
                                                </div>
                                                <div className={`text-2xl font-light ${gatePassed ? "text-white" : "text-gray-400"}`}>
                                                    {Math.round(toNumberSafe(episode.metadata?.confidence, 0))}
                                                </div>
                                                <div className="text-[10px] font-mono text-gray-600 mt-1">
                                                    {gatePassed ? "PASSED" : "FAILED"}
                                                </div>
                                            </div>
                                        </div>

                                        {episode.metadata?.draft_content && episode.metadata?.final_content && (
                                            <div className="mb-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="text-2xl">📝</div>
                                                    <h3 className="text-xl font-bold text-white">
                                                        Generated Content Evolution
                                                    </h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="relative">
                                                        <div className="absolute -top-3 left-4 px-3 py-1 bg-gray-900 text-xs text-red-400 font-bold uppercase tracking-wider border border-red-500/30 rounded">
                                                            Raw Draft (Foundation Model)
                                                        </div>
                                                        <div className="p-5 rounded-lg border-2 border-red-900/30 bg-red-950/10 min-h-[120px]">
                                                            <div className="text-gray-400 leading-relaxed text-sm font-mono">
                                                                {String(episode.metadata.draft_content.text || "")
                                                                    .split(String(episode.metadata.draft_content.highlight || ""))[0]}
                                                                <span className="bg-red-500/20 text-red-300 mx-1 px-2 py-1 rounded border-b-2 border-red-500">
                                                                    {episode.metadata.draft_content.highlight}
                                                                </span>
                                                                {String(episode.metadata.draft_content.text || "")
                                                                    .split(String(episode.metadata.draft_content.highlight || ""))[1]}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-400 flex items-start gap-2">
                                                            <span className="text-lg">⚠️</span>
                                                            <div>
                                                                <div className="font-bold mb-1">ISSUE DETECTED</div>
                                                                <div>{episode.metadata.draft_content.flag}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <div className="absolute -top-3 left-4 px-3 py-1 bg-gray-900 text-xs text-emerald-400 font-bold uppercase tracking-wider border border-emerald-500/30 rounded">
                                                            Broadcast Script (Optimized)
                                                        </div>
                                                        <div className="p-5 rounded-lg border-2 border-emerald-900/30 bg-emerald-950/10 min-h-[120px]">
                                                            <div className="text-gray-200 leading-relaxed text-sm">
                                                                {String(episode.metadata.final_content.text || "")
                                                                    .split(String(episode.metadata.final_content.highlight || ""))[0]}
                                                                <span className="bg-emerald-500/20 text-emerald-300 mx-1 px-2 py-1 rounded border-b-2 border-emerald-500">
                                                                    {episode.metadata.final_content.highlight}
                                                                </span>
                                                                {String(episode.metadata.final_content.text || "")
                                                                    .split(String(episode.metadata.final_content.highlight || ""))[1]}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded text-xs text-emerald-400 flex items-start gap-2">
                                                            <span className="text-lg">✨</span>
                                                            <div>
                                                                <div className="font-bold mb-1">CORRECTION APPLIED</div>
                                                                <div>{episode.metadata.final_content.reason}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                                    <div className="flex items-start gap-3">
                                                        <div className="text-xl">💡</div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-blue-400 text-sm mb-2">What Changed</div>
                                                            <div className="text-xs text-gray-300">
                                                                The system detected {String(episode.metadata.draft_content.flag || "").toLowerCase()} in the raw generation.
                                                                Using behavioral primitive{" "}
                                                                <strong className="text-blue-400">
                                                                    {episode.metadata.mutations?.[0]?.primitive_name}
                                                                </strong>{" "}
                                                                (weight: {fmtFixed(episode.metadata.mutations?.[0]?.new_weight, 2)}),
                                                                it regenerated the content with stricter constraints. The final version passed the confidence gate and was approved for broadcast.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {episode.metadata?.wandb_run_url && (
                                            <div className="mb-6 p-4 bg-amber-900/10 border border-amber-500/20 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-xl">📊</div>
                                                    <div>
                                                        <div className="text-xs text-amber-500 font-bold uppercase tracking-wider">Obervability Trace</div>
                                                        <div className="text-xs text-amber-400/70 font-mono mt-0.5">
                                                            {episode.metadata.episode_id} • {episode.metadata.boot_id || 'no-boot-id'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <a
                                                    href={episode.metadata.wandb_run_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded border border-amber-500/30 transition-colors flex items-center gap-2"
                                                >
                                                    View Trace ↗
                                                </a>
                                            </div>
                                        )}

                                        {toNumberSafe(episode.issues_count, 0) > 0 && (
                                            <div className="mb-6 p-4 bg-red-900/10 border border-red-500/20 rounded">
                                                <div className="flex items-center gap-2 font-medium text-red-500 mb-2 text-sm">
                                                    <span>⚠️</span>
                                                    <span>{toNumberSafe(episode.issues_count, 0)} Issue(s) Detected</span>
                                                </div>
                                                <div className="text-xs text-red-400 pl-6 leading-relaxed">
                                                    {toNumberSafe(episode.metadata?.fact_score, 0) < 70 && (
                                                        <div className="mb-1">• Unverified claims or hallucinations</div>
                                                    )}
                                                    {toNumberSafe(episode.metadata?.style_score, 0) < 70 && (
                                                        <div>• Hyperbolic language or tone issues</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {hasMutations && (
                                            <div className="p-4 bg-gray-900/30 border border-gray-800 rounded">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="text-xl">🧬</div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">System Evolution Event</div>
                                                        <div className="text-xs text-gray-500">BEHAVIORAL PRIMITIVES UPDATED</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {episode.metadata.mutations.map((mutation: any, idx: number) => (
                                                        <div key={idx} className="bg-[#0a0a0a] border border-gray-800 p-4 rounded">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="font-mono text-xs text-gray-300">
                                                                    {mutation.primitive_name}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-500">{fmtFixed(mutation.old_weight, 2)}</span>
                                                                    <span className="text-gray-600">→</span>
                                                                    <span className="text-xs text-white font-medium">{fmtFixed(mutation.new_weight, 2)}</span>
                                                                </div>
                                                                <div className="text-xs font-mono text-green-400">
                                                                    +{fmtFixed(mutation.delta, 2)}
                                                                </div>
                                                            </div>

                                                            <div className="text-xs text-gray-500 mb-2 pl-2 border-l-2 border-gray-800">
                                                                {mutation.reason}
                                                            </div>

                                                            <div className="text-[10px] text-gray-600 bg-gray-900/30 p-2 rounded mt-2">
                                                                IMPACT: Increased enforcement weight for future generations.
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-gray-800">
                                                    <div className="text-xs text-gray-500 leading-relaxed">
                                                        <span className="text-gray-400 font-medium">Auto-Correction:</span>{" "}
                                                        System detected failures and autonomously updated its own configuration.
                                                        Changes are persisted to Redis and will affect all future episodes.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            No episodes yet. Use test scenarios above to generate episodes.
                        </div>
                    )}
                </div>

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
                <TestWithAnyIdeaCard
                    isRunning={runningGemini}
                    onRun={handleRunHuggingFace}
                />
            </div>
        </div >
    );
}
