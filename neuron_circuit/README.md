# Living Newsroom — Neuron Circuit

A self-optimizing podcast agent built on [ShaliniAnandaPhD/Neuron](https://github.com/ShaliniAnandaPhD/Neuron).

## Architecture (matches the screenshot)

```
┌──────────┐   ┌───────────┐   ┌──────────┐   ┌──────┐   ┌───────┐
│ Topic In │──►│ Mistral-7B│──►│ Evaluate │──►│ Gate │──►│ Learn │
│  Ingest  │   │  Generate │   │Check qual│   │Pass/ │   │Update │
│          │   │           │   │          │   │ Fail │   │prims. │
└──────────┘   └───────────┘   └──────────┘   └──────┘   └───────┘
                                                   │            │
                                                   └────────────┘
                                                   (loop on fail)

┌─────────────────────────────────────────────────────────────┐
│  Neuron Orchestration Layer                                 │
│  Plan episode · Route models · Retry logic · Tool calls     │
│  Persist state                                              │
└─────────────────────────────────────────────────────────────┘
```

## How it works

1. **Topic In** — A `ReflexAgent` ingests the topic, checks episodic memory for prior runs on the same topic, and routes to generation.

2. **Generate** — A `DeliberativeAgent` calls HuggingFace (Llama-3.2-3B-Instruct) with either a *raw* prompt (first attempt) or an *optimized* prompt (after learning). The optimized prompt injects constraints based on which of the 6 behavioral primitives have been raised above 0.8.

3. **Evaluate** — A `ReflexAgent` runs pattern-based checks for hallucinations (fake model names like GPT-7), hyperbole (3+ superlatives), missing source attribution, and vague temporal references. Returns a score in [0, 1].

4. **Gate** — Compares the score to the 0.72 threshold. Pass → done. Fail → trigger learning.

5. **Learn** — A `LearningAgent` bumps the relevant primitives (+0.10–+0.15 each) based on which issues were detected, then loops back to Generate with the updated constraints.

### The 6 Behavioral Primitives

| Primitive | Default | What it controls |
|---|---|---|
| `fact_verification` | 0.65 | Penalty weight for hallucinated products |
| `anti_hyperbole` | 0.75 | Penalty weight for excessive superlatives |
| `source_attribution` | 0.72 | Penalty weight for unsourced claims |
| `temporal_accuracy` | 0.70 | Penalty weight for vague time references |
| `entertainment_value` | 0.80 | (reserved for style tuning) |
| `brevity` | 0.40 | (reserved for length tuning) |

## Install & Run

```bash
# One command — clones Neuron, installs everything, runs the demo
bash setup.sh
```

Or manually:

```bash
git clone https://github.com/ShaliniAnandaPhD/Neuron.git
cd Neuron && pip install -e . && cd ..

pip install requests python-dotenv

# Edit .env with your HF_API_KEY, then:
python newsroom_circuit.py
```

## Neuron APIs used

| API | Where | Purpose |
|---|---|---|
| `initialize()` | `main()` | Boots the Neuron core (memory manager, synaptic bus, agent manager) |
| `CircuitDefinition.create(…)` | `build_newsroom_circuit()` | Declares agents, connections, routing & fallback strategy |
| `core.circuit_designer` | `build_newsroom_circuit()` | Creates and deploys the circuit |
| `BaseAgent` | All custom agents | Base class for plug-in microservices |
| `core.agent_manager.register()` | `main()` | Registers custom agents into the framework |
| `core.memory_manager.get_memory_system("EPISODIC")` | `main()` | Stores/queries episode history |
| `Message.create() + synaptic_bus.send()` | `run_episode()` | Broadcasts episode-complete events to all agents |
| `core.neuro_monitor` | Available for health checks | Real-time circuit health (not called in demo but wired) |

## Files

| File | Role |
|---|---|
| `newsroom_circuit.py` | Everything — agents, circuit, runner, helpers |
| `setup.sh` | One-shot install + run |
| `requirements.txt` | pip deps (Neuron installed separately via `-e`) |
| `.env` | HF_API_KEY and model selection |
