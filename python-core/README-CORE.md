# 🧠 Neuron AI - Multi-Gemini Coordination System

A Python framework for orchestrating multiple Google Gemini models to work in tandem, providing enhanced AI capabilities through parallel processing, sequential refinement, and consensus building.

## Features

- **Parallel Processing**: Run two Gemini models simultaneously for diverse perspectives
- **Sequential Refinement**: Chain models for iterative improvement
- **Consensus Building**: Synthesize responses from multiple models
- **Async/Await Support**: Efficient concurrent processing
- **Flexible Configuration**: Easy model and strategy selection

## Architecture

```
┌─────────────────────────────────────┐
│         Neuron AI Layer             │
│  (Coordination & Orchestration)     │
└──────────┬──────────────────┬───────┘
           │                  │
    ┌──────▼──────┐    ┌─────▼───────┐
    │  Gemini 1   │    │  Gemini 2   │
    │ (Model 1.5  │    │ (Model 1.5  │
    │    Pro)     │    │   Flash)    │
    └─────────────┘    └─────────────┘
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your Google API key:
```bash
export GOOGLE_API_KEY='your-api-key-here'
```

Or create a `.env` file:
```
GOOGLE_API_KEY=your-api-key-here
```

## Quick Start

### Basic Usage

```python
import asyncio
from gemini_neuron_system import NeuronAI, NeuronConfig

async def main():
    # Configure the neuron system
    config = NeuronConfig(
        gemini_1_model="gemini-1.5-pro",
        gemini_2_model="gemini-1.5-flash",
        coordination_strategy="consensus"
    )
    
    # Initialize
    neuron = NeuronAI(config)
    
    # Process a prompt
    results = await neuron.process(
        "Explain machine learning in simple terms"
    )
    
    print(results['consensus_response'])

asyncio.run(main())
```

## Coordination Strategies

### 1. Parallel Processing
Both models process the same prompt simultaneously and return independent responses.

**Use Cases:**
- Getting diverse perspectives
- A/B testing responses
- Comparing different model strengths

```python
config = NeuronConfig(coordination_strategy="parallel")
neuron = NeuronAI(config)
results = await neuron.process(prompt)

# Access responses
print(results['model_1_response'])
print(results['model_2_response'])
```

### 2. Sequential Refinement
Model 1 generates an initial response, then Model 2 refines or improves it.

**Use Cases:**
- Iterative content improvement
- Draft → Final version workflows
- Multi-stage problem solving

```python
config = NeuronConfig(coordination_strategy="sequential")
neuron = NeuronAI(config)
results = await neuron.process(prompt)

# Access responses
print(results['initial_response'])
print(results['refined_response'])
```

### 3. Consensus Building
Both models respond independently, then their responses are synthesized into a consensus.

**Use Cases:**
- Balanced decision-making
- Comprehensive analysis
- Reducing bias

```python
config = NeuronConfig(coordination_strategy="consensus")
neuron = NeuronAI(config)
results = await neuron.process(prompt)

# Access responses
print(results['model_1_response'])
print(results['model_2_response'])
print(results['consensus_response'])
```

## Configuration Options

```python
@dataclass
class NeuronConfig:
    gemini_1_model: str = "gemini-1.5-pro"
    gemini_2_model: str = "gemini-1.5-flash"
    api_key: Optional[str] = None
    coordination_strategy: str = "parallel"
```

### Available Models
- `gemini-1.5-pro` - Most capable model
- `gemini-1.5-flash` - Faster, efficient model
- `gemini-1.0-pro` - Earlier version

## Advanced Examples

See `examples.py` for comprehensive demonstrations:

```bash
python examples.py
```

Examples include:
1. Parallel analysis with different perspectives
2. Sequential refinement for content improvement
3. Consensus building for balanced responses
4. Creative collaboration
5. Technical problem solving

## API Reference

### NeuronAI Class

#### `__init__(config: NeuronConfig)`
Initialize the Neuron AI system with configuration.

#### `async process(prompt: str) -> Dict[str, str]`
Process a prompt using the configured coordination strategy.

#### `async process_parallel(prompt: str) -> Dict[str, str]`
Run both models in parallel.

#### `async process_sequential(prompt: str) -> Dict[str, str]`
Run models sequentially with refinement.

#### `async process_consensus(prompt: str) -> Dict[str, str]`
Generate consensus from both models.

## Performance Considerations

- **Parallel**: Fastest for getting multiple responses
- **Sequential**: Slower but better for refinement
- **Consensus**: Slowest but most comprehensive

## Error Handling

```python
try:
    neuron = NeuronAI(config)
    results = await neuron.process(prompt)
except ValueError as e:
    print(f"Configuration error: {e}")
except Exception as e:
    print(f"Processing error: {e}")
```

## Best Practices

1. **Choose the Right Strategy**
   - Use parallel for diverse perspectives
   - Use sequential for iterative improvement
   - Use consensus for balanced responses

2. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables or .env files

3. **Rate Limiting**
   - Be mindful of API rate limits
   - Implement delays for bulk processing

4. **Model Selection**
   - Use Pro for complex tasks
   - Use Flash for speed
   - Mix models based on task requirements

## Troubleshooting

### "API key required" error
```bash
export GOOGLE_API_KEY='your-key-here'
```

### Import errors
```bash
pip install -r requirements.txt
```

### Async errors
Ensure you're using `asyncio.run()` or running within an async context.

## Contributing

Contributions welcome! Areas for enhancement:
- Additional coordination strategies
- More model options
- Performance optimizations
- Extended error handling

## License

MIT License

## Support

For issues or questions:
1. Check the examples in `examples.py`
2. Review Google's Gemini API documentation
3. Ensure your API key is properly configured

---

Built with ❤️ using Google's Gemini AI models
