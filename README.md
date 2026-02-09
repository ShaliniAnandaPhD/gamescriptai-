# GameScript AI

An autonomous, self-improving AI generation pipeline with real-time profiling and observability, orchestrated by the [Neuron](https://github.com/ShaliniAnandaPhD/Neuron) cognitive agent framework.



## Overview

GameScript AI is a sophisticated AI agent system designed to generate, evaluate, and refine content autonomously. The pipeline is structured as a **Neuron Circuit** — a graph of typed agents connected by a SynapticBus, so every stage (ingest, generate, evaluate, gate, learn) is a first-class agent with its own capabilities, memory access, and routing rules. On top of that, a "True AI Profiling" layer captures ground-truth metrics from the Hugging Face Inference API, enabling precise tracking of model performance, failure chains, and behavioral primitive adaptations.

---

## Core Features

- **Neuron Circuit Orchestration** — The entire pipeline is declared as a single `CircuitDefinition`. Neuron handles agent routing (`confidence_based`), fallback strategy (`graceful_degradation`), and inter-agent messaging via its `SynapticBus`. No manual wiring needed; the circuit self-routes based on evaluation confidence.
- **True AI Profiling** — Real-time telemetry capturing TTFB, total latency, request IDs, and specific model usage (including fallbacks).
- **Behavioral Primitives** — Six tunable "knobs" (Fact Verification, Anti-Hyperbole, Source Attribution, Temporal Accuracy, Entertainment Value, Brevity) that the system tunes autonomously based on evaluation failures. Primitives are persisted in Neuron's episodic memory across episodes.
- **W&B Weave Integration** — Insanely detailed tracing of every cycle step, providing full causality from draft failure to optimized final broadcast script. Each Weave trace includes Neuron's step spans, Redis telemetry, and mutation diffs.
- **Fail-Safe Orchestration** — Automatic fallback logic between models (e.g., Llama-3 70B to 3B) and emergency templates to ensure 100% uptime. Neuron's `graceful_degradation` fallback strategy keeps the circuit alive even when individual agents error.
- **Real-Time Dashboard** — A React-based interface for monitoring the "evolution" of stories, viewing trace data, and managing system primitives.

---

## Architecture

```
┌──────────┐   ┌───────────┐   ┌──────────┐   ┌──────┐   ┌───────┐
│ Topic In │──►│  Generate │──►│ Evaluate │──►│ Gate │──►│ Learn │
│  Ingest  │   │ (Llama-3) │   │Check qual│   │Pass/ │   │Update │
│ReflexAgent   │Deliberative   │ReflexAgent   │Reflex│   │Learning
│          │   │   Agent   │   │          │   │Agent │   │ Agent │
└──────────┘   └───────────┘   └──────────┘   └──────┘   └───┬───┘
                                                   │          │
                                                   └──────────┘
                                                   (loop on fail)

┌─────────────────────────────────────────────────────────────────┐
│  Neuron Orchestration Layer                                     │
│  Plan episode · Route models · Retry logic · Tool calls         │
│  Persist state · SynapticBus messaging · Episodic memory        │
└─────────────────────────────────────────────────────────────────┘
```

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS + Plotly |
| Backend | Node.js (Express) + TSX |
| Agent Orchestration | **Neuron** (`CircuitDefinition`, `SynapticBus`, typed agents) |
| Observability Sidecar | Python + W&B Weave (`@weave.op`) |
| Memory | **Neuron episodic/semantic memory** + Redis (Upstash) + Firebase Firestore |
| Model Inference | Hugging Face Inference API (Llama-3.2-3B / 70B) |

---

## Getting Started

### 1. Prerequisites

- Node.js (v20+)
- Python 3.11+
- Hugging Face API Token
- W&B API Key
- **Neuron** (cloned from GitHub — see install step below)

### 2. Installation

```bash
# 1. Clone and install Neuron (the agent framework)
git clone https://github.com/ShaliniAnandaPhD/Neuron.git
cd Neuron && pip install -e . && cd ..

# 2. Install project dependencies
npm install
pip install -r server/requirements.txt
```

### 3. Environment Setup

Create a `.env.local` in the root:

```env
# Model
HF_TOKEN=your_token
VITE_HF_MODEL=meta-llama/Llama-3.3-70B-Instruct

# Observability
WANDB_API_KEY=your_key
WANDB_PROJECT=living-newsroom

# Memory
REDIS_URL=rediss://your-upstash-url
```

### 4. Running the System

```bash
# Start the full stack (Sidecar, Backend, Frontend)
npm run dev
```

To run the standalone 52-episode soak test (traces directly into W&B, no Express needed):

```bash
python server/wandb_sidecar.py
```

---

## How It Works

The pipeline is a **Neuron Circuit** with five agents wired as a directed graph. Neuron's `CircuitDefinition` declares the topology; the framework handles routing, retries, and state persistence automatically.

### 1. Topic In — `ReflexAgent` (INPUT)

A fast pattern-matching agent that ingests the raw topic string. It queries **Neuron's episodic memory** to check whether this topic (or a semantically similar one) has been seen before, and attaches any cached context. It also runs a Redis memory probe, recording hit/miss telemetry that surfaces in the W&B Weave trace.

**Capabilities:** `intent_detection`, `sentiment_analysis`, `memory_retrieval`

### 2. Generate — `DeliberativeAgent` (PROCESSOR)

The heavyweight reasoning agent. It constructs the prompt dynamically based on the current state of the six behavioral primitives — if any primitive has been raised above 0.8 by prior learning, the corresponding constraint (e.g., "only mention products that actually exist") is injected into the prompt before calling HuggingFace. On the first pass the mode is `raw`; after learning fires, it regenerates with mode `optimized` and the tighter constraints.

**Capabilities:** `text_generation`, `prompt_construction`, `model_routing`

### 3. Evaluate — `ReflexAgent` (PROCESSOR)

A fast, pattern based quality judge. No LLM call — it scans the draft for hallucinated product names (GPT-7, Llama 5, etc.), counts superlatives to detect hyperbole, checks for source attribution, and flags vague temporal references. Returns a score in [0, 1] and a typed issues list. The scoring weights are the behavioral primitives themselves, so as the system learns, the same text can score differently next time.

**Capabilities:** `hallucination_detection`, `contradiction_detection`, `quality_scoring`

### 4. Gate — `ReflexAgent` (PROCESSOR)

Compares the evaluation score against the configured threshold (default 0.70). If the score passes, the draft becomes the final broadcast script and the circuit finishes. If it fails, the gate routes to the Learn agent via a conditional connection — this is where Neuron's `confidence_based` routing strategy kicks in.

**Capabilities:** `threshold_comparison`, `pass_fail_routing`

### 5. Learn — `LearningAgent` (OUTPUT)

The self-optimization core. When the gate fails, this agent examines the typed issues from Evaluate, computes deltas for the relevant primitives (+0.10 to +0.15 per issue type), and writes the updated weights back. The mutations are logged as a structured diff (old weight → new weight + reason). The updated primitives are then persisted to **Neuron's episodic memory** so they carry forward into the next episode, and a second generation pass is triggered with the new constraints.

**Capabilities:** `pattern_recognition`, `strategy_evolution`, `state_persistence`

### 6. Trace

The entire circuit — every step, every input, every output — is logged to **W&B Weave** via a `@weave.op`-decorated Python function. The trace includes Neuron's step spans (memory probe, generation, evaluation, learning, regeneration, final check), Redis telemetry, HuggingFace request profiles, and primitive mutation diffs. After the circuit completes, a **SynapticBus** message is broadcast to all agents notifying them of the episode result.

---

## Neuron API Surface

This is the subset of the Neuron framework that Living Newsroom uses:

| API | Where it's used | What it does |
|---|---|---|
| `initialize()` | Sidecar startup | Boots the Neuron core — memory manager, SynapticBus, agent manager |
| `CircuitDefinition.create(…)` | `build_newsroom_circuit()` | Declares the 5-agent topology, connections, routing strategy, and fallback |
| `core.circuit_designer.create_circuit()` / `.deploy_circuit()` | Startup | Compiles and deploys the circuit graph |
| `BaseAgent` | `MemoryProbeAgent`, `GenerationAgent`, `EvaluationAgent`, `LearningCircuitAgent` | Base class for all custom plug-in agents |
| `core.agent_manager.register()` | Startup | Registers each custom agent into the Neuron runtime |
| `ReflexAgent` | Topic In, Evaluate, Gate | Fast pattern-matching agents for input processing and scoring |
| `DeliberativeAgent` | Generate | Deep reasoning agent for prompt construction and model calls |
| `LearningAgent` | Learn | Adaptation agent that updates primitives based on detected patterns |
| `core.memory_manager.get_memory_system("EPISODIC")` | Episode runner | Stores and queries episode history across runs |
| `Message.create()` + `core.synaptic_bus.send()` | End of each episode | Broadcasts `episode_complete` events to all agents in the circuit |
| `core.neuro_monitor` | Health endpoint | Exposes real-time circuit health and per-agent metrics |

### Agent Types at a Glance

```
ReflexAgent          — fast, pattern-based, low latency
                       used for: Topic In, Evaluate, Gate

DeliberativeAgent    — deep reasoning, prompt engineering, multi-step logic
                       used for: Generate

LearningAgent        — detects patterns in failures, evolves strategy over time
                       used for: Learn

CoordinatorAgent     — (available) orchestration and resource allocation
                       not currently used but available for multi-agent debate extensions
```

---

## The 6 Behavioral Primitives

| Primitive | Default | Controls |
|---|---|---|
| `fact_verification` | 0.65 | Penalty weight for hallucinated products; triggers "only mention real products" constraint at ≥ 0.8 |
| `anti_hyperbole` | 0.75 | Penalty weight for excessive superlatives; triggers "use measured language" constraint at ≥ 0.8 |
| `source_attribution` | 0.72 | Penalty weight for unsourced claims; triggers "include specific sources or dates" constraint at ≥ 0.8 |
| `temporal_accuracy` | 0.70 | Penalty weight for vague time references; triggers "use specific dates" constraint at ≥ 0.8 |
| `entertainment_value` | 0.80 | Reserved for style/engagement tuning |
| `brevity` | 0.40 | Reserved for length tuning |

Primitives are persisted in Neuron's episodic memory and Redis, and evolve across episodes as the system learns from evaluation failures.

---

## 52-Episode Soak Test

The soak test fires 52 carefully designed topics through the full circuit. Topics are grouped by failure mode:

| Episodes | Category | What they test |
|---|---|---|
| 1–8 | Hallucination bait | Topics containing fake model names (GPT-7, GPT-9, Llama 5) to trigger `fact_verification` learning |
| 9–16 | Source + temporal | Vague phrasing ("recently", "soon", "lately") to trigger `source_attribution` and `temporal_accuracy` |
| 17–24 | Combined failures | Multiple failure types stacked in a single topic — stress-tests the learn→regenerate loop |
| 25–36 | Clean (baseline) | Properly sourced, dated topics that should pass the gate on the first try |
| 37–44 | Production stress | Ambiguous real-world topics that test edge cases in evaluation |
| 45–52 | Edge cases | Extreme superlative stacking, mixed clean/dirty, and system verification topics |

Run it:

```bash
# Option A: through Express (requires npm run dev + sidecar)
npx tsx server/run_52_episodes.ts

# Option B: standalone (just Python + Weave)
python server/wandb_sidecar.py
```

---

## Project Structure

```
living-newsroom/
├── server/
│   ├── index.ts                  # Express server — forwards episodes to Weave sidecar
│   ├── runCycle.ts               # Core generate→evaluate→learn logic
│   ├── wandb_sidecar.py          # Python Weave sidecar — @weave.op, step builder
│   ├── run_52_episodes.ts        # TypeScript soak test driver
│   ├── primitives.ts             # Primitive definitions + learn()
│   ├── evaluate.ts               # Pattern-based evaluator
│   ├── gemini.ts                 # Generation (HF + fallback)
│   └── requirements.txt          # Python deps (weave, requests, dotenv)
├── src/
│   ├── App.jsx                   # React dashboard root
│   └── lib/
│       └── runCycleClient.ts     # Frontend → Express client
├── Neuron/                       # Cloned from github.com/ShaliniAnandaPhD/Neuron
├── newsroom_circuit.py           # Standalone Neuron circuit runner 
├── package.json
├── .env.local
└── README.md
```
