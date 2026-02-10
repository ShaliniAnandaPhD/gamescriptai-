# GameScript AI

> An autonomous, self-improving AI generation pipeline with real-time profiling and observability, orchestrated by the Neuron cognitive agent framework.

## Overview

GameScript AI is a sophisticated multi-agent system designed to autonomously generate, evaluate, and refine AI-generated content. Built on the **Neuron cognitive agent framework**, the system orchestrates content creation through a circuit of specialized agents, each with distinct capabilities and responsibilities.

The pipeline operates as a **Neuron Circuit**, a directed graph of typed agents connected by a SynapticBus. Every stage (ingest, generate, evaluate, gate, learn) is a first-class agent with its own capabilities, memory access, and routing rules. A "True AI Profiling" layer captures ground-truth metrics from the Google Gemini API, enabling precise tracking of model performance, failure chains, and behavioral adaptations. (Neuron GitHub: https://github.com/ShaliniAnandaPhD/Neuron)

### Key Highlights

- **Zero-Touch Orchestration**: Define your agent topology once; Neuron handles routing, retries, and state management
- **Self-Improving**: Learns from failures and automatically tunes behavioral primitives across episodes
- **Production-Ready**: 100% uptime through multi-tier fallback strategies and emergency templates
- **Full Observability**: Every decision, every token, every microsecond traced to W&B Weave
- **Real-Time Dashboard**: Monitor system evolution, view traces, and manage primitives through a React interface

## Architecture

```
┌──────────┐   ┌───────────┐   ┌──────────┐   ┌──────┐   ┌───────┐
│ Topic In │──►│  Generate │──►│ Evaluate │──►│ Gate │──►│ Learn │
│  Ingest  │   │  (Gemini) │   │Check qual│   │Pass/ │   │Update │
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

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React (Vite) + Tailwind CSS + Plotly |
| **Backend** | Node.js (Express) + TSX |
| **Agent Orchestration** | Neuron (CircuitDefinition, SynapticBus, typed agents) |
| **Observability** | Python + W&B Weave (@weave.op) |
| **Memory** | Neuron episodic/semantic memory + Redis (Upstash) + Firebase Firestore |
| **Model Inference** | Google Gemini API |

## Core Features

### 🧠 Neuron Circuit Orchestration

The entire pipeline is declared as a single `CircuitDefinition`. Neuron handles agent routing (confidence based), fallback strategy (graceful degradation), and inter agent messaging via its SynapticBus. No manual wiring needed; the circuit self routes based on evaluation confidence.

### 📊 True AI Profiling

Real-time telemetry capturing:
- Time to First Byte (TTFB)
- Total latency
- Request IDs
- Specific model usage (Gemini Flash/Pro routing)

### 🎛️ Behavioral Primitives

Six tunable parameters that the system autonomously adjusts based on evaluation failures:

| Primitive | Default | Controls |
|-----------|---------|----------|
| **Fact Verification** | 0.65 | Penalty weight for hallucinated products; triggers "only mention real products" constraint at 0.8 or higher |
| **Anti Hyperbole** | 0.75 | Penalty weight for excessive superlatives; triggers "use measured language" constraint at 0.8 or higher |
| **Source Attribution** | 0.72 | Penalty weight for unsourced claims; triggers "include specific sources or dates" constraint at 0.8 or higher |
| **Temporal Accuracy** | 0.70 | Penalty weight for vague time references; triggers "use specific dates" constraint at 0.8 or higher |
| **Entertainment Value** | 0.80 | Reserved for style/engagement tuning |
| **Brevity** | 0.40 | Reserved for length tuning |

Primitives are persisted in Neuron's episodic memory across episodes and evolve based on detected patterns.

### 🔍 W&B Weave Integration

Insanely detailed tracing of every cycle step, providing full causality from draft failure to optimized final output. Each Weave trace includes:
- Neuron's step spans
- Redis telemetry
- Gemini API request profiles
- Primitive mutation diffs

### 🛡️ Fail Safe Orchestration

Automatic fallback logic between models (e.g., Gemini Pro to Flash) and emergency templates ensure 100% uptime. Neuron's `graceful_degradation` fallback strategy keeps the circuit alive even when individual agents error.

### 📱 Real Time Dashboard

A React based interface for:
- Monitoring the evolution of generated content
- Viewing detailed trace data
- Managing system primitives
- Observing learning patterns

## The Five-Agent Pipeline

### 1. Topic In (ReflexAgent, INPUT)

A fast pattern matching agent that ingests raw topic strings. It:
- Queries Neuron's episodic memory for cached context
- Runs Redis memory probes (hit/miss telemetry surfaces in W&B Weave)
- Attaches semantic context from previous similar topics

**Capabilities**: `intent_detection`, `sentiment_analysis`, `memory_retrieval`

### 2. Generate (DeliberativeAgent, PROCESSOR)

The heavyweight reasoning agent that constructs prompts dynamically based on current behavioral primitives. When any primitive exceeds 0.8, corresponding constraints are injected into the prompt before calling the Gemini API.

**Capabilities**: `text_generation`, `prompt_construction`, `model_routing`

**Modes**:
- **raw**: First generation pass
- **optimized**: Post learning regeneration with tighter constraints

### 3. Evaluate (ReflexAgent, PROCESSOR)

A fast, pattern based quality judge. No LLM call; it:
- Scans for hallucinated product names and non existent technologies
- Counts superlatives to detect hyperbole
- Checks for source attribution
- Flags vague temporal references

Returns a score in [0, 1] and a typed issues list. Scoring weights are the behavioral primitives themselves, so as the system learns, the same text can score differently.

**Capabilities**: `hallucination_detection`, `contradiction_detection`, `quality_scoring`

### 4. Gate (ReflexAgent, PROCESSOR)

Compares the evaluation score against the configured threshold (default 0.70). If the score passes, the draft becomes final and the circuit completes. If it fails, the gate routes to the Learn agent via a conditional connection (Neuron's `confidence_based` routing strategy).

**Capabilities**: `threshold_comparison`, `pass_fail_routing`

### 5. Learn (LearningAgent, OUTPUT)

The self optimization core. When the gate fails, this agent:
- Examines typed issues from Evaluate
- Computes deltas for relevant primitives (+0.10 to +0.15 per issue type)
- Writes updated weights back to memory
- Logs mutations as structured diffs (old weight to new weight + reason)
- Triggers second generation pass with new constraints

**Capabilities**: `pattern_recognition`, `strategy_evolution`, `state_persistence`

### 6. Trace

Every step is logged to W&B Weave via `@weave.op`-decorated Python functions. Traces include:
- Neuron's step spans (memory probe, generation, evaluation, learning, regeneration, final check)
- Redis telemetry
- Gemini API request profiles
- Primitive mutation diffs

After circuit completion, a SynapticBus message broadcasts the episode result to all agents.

## Agent Type Reference

```
ReflexAgent          fast, pattern based, low latency
                       Used for: Topic In, Evaluate, Gate

DeliberativeAgent    deep reasoning, prompt engineering, multi step logic
                       Used for: Generate

LearningAgent        detects patterns in failures, evolves strategy over time
                       Used for: Learn

CoordinatorAgent     orchestration and resource allocation (available)
                       Not currently used but available for multi agent extensions
```

## Neuron Framework Integration

GameScript AI leverages the following Neuron APIs:

| API | Where Used | Purpose |
|-----|------------|---------|
| `initialize()` | Sidecar startup | Boots Neuron core (memory manager, SynapticBus, agent manager) |
| `CircuitDefinition.create()` | `build_newsroom_circuit()` | Declares 5 agent topology, connections, routing, fallback |
| `core.circuit_designer.create_circuit()` | Startup | Compiles and deploys circuit graph |
| `BaseAgent` | All custom agents | Base class for plug in agents |
| `core.agent_manager.register()` | Startup | Registers custom agents into Neuron runtime |
| `ReflexAgent` | Topic In, Evaluate, Gate | Fast pattern matching agents |
| `DeliberativeAgent` | Generate | Deep reasoning agent |
| `LearningAgent` | Learn | Adaptation agent for primitive updates |
| `core.memory_manager.get_memory_system()` | Episode runner | Stores/queries episode history |
| `Message.create() + core.synaptic_bus.send()` | End of episode | Broadcasts `episode_complete` events |
| `core.neuro_monitor` | Health endpoint | Exposes real time circuit health |

## Getting Started

### Prerequisites

- Node.js v20+
- Python 3.11+
- Google Gemini API Key
- W&B API Key
- Neuron framework

### Installation

```bash
# 1. Clone and install Neuron (the agent framework)
git clone https://github.com/ShaliniAnandaPhD/Neuron.git
cd Neuron && pip install e . && cd ..

# 2. Clone GameScript AI
git clone https://github.com/ShaliniAnandaPhD/gamescriptai.git
cd gamescriptai

# 3. Install dependencies
npm install
pip install r server/requirements.txt
```

### Environment Setup

Create `.env.local` in the project root:

```env
# Model Configuration
GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_MODEL=gemini 1.5 pro

# Observability
WANDB_API_KEY=your_wandb_key
WANDB_PROJECT=gamescript ai

# Memory & State
REDIS_URL=rediss://your upstash url
```

### Running the System

```bash
# Start the full stack (Sidecar, Backend, Frontend)
npm run dev
```

Access the dashboard at `http://localhost:5173`

### Running the 52 Episode Soak Test

The soak test fires 52 carefully designed topics through the full circuit to stress-test all failure modes:

```bash
# Option A: Through Express (requires npm run dev + sidecar)
npx tsx server/run_52_episodes.ts

# Option B: Standalone (Python + Weave only)
python server/wandb_sidecar.py
```

#### Test Categories

| Episodes | Category | Purpose |
|----------|----------|---------|
| 1 to 8 | Hallucination bait | Topics with fake model names and non-existent products to trigger `fact_verification` learning |
| 9 to 16 | Source + temporal | Vague phrasing ("recently", "soon") to trigger `source_attribution` and `temporal_accuracy` |
| 17 to 24 | Combined failures | Multiple failure types stacked to stress-test learn, regenerate loop |
| 25 to 36 | Clean baseline | Properly sourced, dated topics that should pass first try |
| 37 to 44 | Production stress | Ambiguous real world topics testing evaluation edge cases |
| 45 to 52 | Edge cases | Extreme superlative stacking, mixed clean/dirty, system verification |

## Project Structure

```
gamescriptai/
├── server/
│   ├── index.ts                  # Express server forwards episodes to Weave sidecar
│   ├── runCycle.ts               # Core generate, evaluate, learn logic
│   ├── wandb_sidecar.py          # Python Weave sidecar with @weave.op, step builder
│   ├── run_52_episodes.ts        # TypeScript soak test driver
│   ├── primitives.ts             # Primitive definitions + learn()
│   ├── evaluate.ts               # Pattern based evaluator
│   ├── gemini.ts                 # Gemini API generation + fallback logic
│   └── requirements.txt          # Python dependencies
├── src/
│   ├── App.jsx                   # React dashboard root
│   └── lib/
│       └── runCycleClient.ts     # Frontend to Express client
├── neuron_circuit/               # Neuron circuit definitions
├── python-core/                  # Python core components
├── tests/                        # Test suite
├── api/                          # Vercel API routes
├── Neuron/                       # Neuron framework (cloned)
├── newsroom_circuit.py           # Standalone Neuron circuit runner
├── package.json
├── .env.local
└── README.md
```

## How It Works: Episode Lifecycle

1. **Topic Ingestion**: ReflexAgent receives topic, queries episodic memory for context
2. **First Generation**: DeliberativeAgent generates content using current primitive weights
3. **Evaluation**: ReflexAgent scores output, identifies specific failure types
4. **Gate Decision**: 
   - **Pass (at least 0.70)**: Content finalized, episode complete
   - **Fail (less than 0.70)**: Route to Learn agent
5. **Learning**: LearningAgent analyzes failures, updates primitives (+0.10 to +0.15 per issue)
6. **Regeneration**: DeliberativeAgent regenerates with tightened constraints
7. **Final Evaluation**: ReflexAgent re scores optimized output
8. **Trace & Broadcast**: Full episode logged to W&B Weave, SynapticBus notifies all agents

## Deployment

The project is configured for Vercel deployment with:
- Automatic esbuild bundling for Express backend
- Optimized static frontend builds
- Environment-based configuration
- Production-ready error handling

Visit the live demo: [gamescriptai.vercel.app](https://gamescriptai.vercel.app)

## Development Workflow

```bash
# Run tests
npm test

# Type checking
npm run typecheck

# Lint code
npm run lint

# Build for production
npm run build
```

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout b feature/amazing feature`)
3. Commit your changes (`git commit m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built on the [Neuron](https://github.com/ShaliniAnandaPhD/Neuron) cognitive agent framework
- Powered by [Google Gemini](https://ai.google.dev) API
- Observability through [Weights & Biases Weave](https://wandb.ai/weave)

## Support

For questions, issues, or feature requests, please [open an issue](https://github.com/ShaliniAnandaPhD/gamescriptai-/issues).

---

**GameScript AI** Autonomous content generation that learns from its mistakes.
