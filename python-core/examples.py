"""
Advanced Neuron AI Examples
Demonstrates different coordination strategies between two Gemini models
"""

import asyncio
from gemini_neuron_system import NeuronAI, NeuronConfig


async def example_parallel_analysis():
    """Example: Parallel processing for diverse perspectives"""
    print("\n" + "="*80)
    print("EXAMPLE 1: PARALLEL ANALYSIS")
    print("="*80)
    
    config = NeuronConfig(
        gemini_1_model="gemini-1.5-pro",
        gemini_2_model="gemini-1.5-flash",
        coordination_strategy="parallel"
    )
    
    neuron = NeuronAI(config)
    
    prompt = """
    Analyze the pros and cons of remote work vs office work.
    Model 1: Focus on employee perspective
    Model 2: Focus on employer perspective
    """
    
    results = await neuron.process(prompt)
    
    print("\n🎭 PARALLEL PERSPECTIVES:")
    print("\nEmployee Perspective (Model 1):")
    print(results['model_1_response'][:500] + "...")
    print("\nEmployer Perspective (Model 2):")
    print(results['model_2_response'][:500] + "...")


async def example_sequential_refinement():
    """Example: Sequential processing for iterative improvement"""
    print("\n" + "="*80)
    print("EXAMPLE 2: SEQUENTIAL REFINEMENT")
    print("="*80)
    
    config = NeuronConfig(
        coordination_strategy="sequential"
    )
    
    neuron = NeuronAI(config)
    
    prompt = "Write a professional email declining a job offer politely."
    
    results = await neuron.process(prompt)
    
    print("\n📝 ITERATIVE IMPROVEMENT:")
    print("\nInitial Draft:")
    print(results['initial_response'])
    print("\nRefined Version:")
    print(results['refined_response'])


async def example_consensus_building():
    """Example: Consensus for balanced responses"""
    print("\n" + "="*80)
    print("EXAMPLE 3: CONSENSUS BUILDING")
    print("="*80)
    
    config = NeuronConfig(
        coordination_strategy="consensus"
    )
    
    neuron = NeuronAI(config)
    
    prompt = "What are the best practices for cybersecurity in 2025?"
    
    results = await neuron.process(prompt)
    
    print("\n🤝 CONSENSUS RESPONSE:")
    print(results['consensus_response'])


async def example_creative_collaboration():
    """Example: Creative tasks with model collaboration"""
    print("\n" + "="*80)
    print("EXAMPLE 4: CREATIVE COLLABORATION")
    print("="*80)
    
    config = NeuronConfig(
        coordination_strategy="sequential"
    )
    
    neuron = NeuronAI(config)
    
    prompt = """
    Create a short story outline about AI and humanity.
    Keep it creative and thought-provoking.
    """
    
    results = await neuron.process(prompt)
    
    print("\n✨ CREATIVE COLLABORATION:")
    print("\nInitial Story Outline:")
    print(results['initial_response'])
    print("\n\nEnhanced Version:")
    print(results['refined_response'])


async def example_technical_problem_solving():
    """Example: Technical problem solving with dual models"""
    print("\n" + "="*80)
    print("EXAMPLE 5: TECHNICAL PROBLEM SOLVING")
    print("="*80)
    
    config = NeuronConfig(
        coordination_strategy="parallel"
    )
    
    neuron = NeuronAI(config)
    
    prompt = """
    Explain how to optimize a Python function that processes large CSV files.
    Provide both theoretical approaches and practical code examples.
    """
    
    results = await neuron.process(prompt)
    
    print("\n💻 TECHNICAL SOLUTIONS:")
    print("\nApproach 1:")
    print(results['model_1_response'][:600] + "...")
    print("\n\nApproach 2:")
    print(results['model_2_response'][:600] + "...")


async def run_all_examples():
    """Run all example scenarios"""
    examples = [
        example_parallel_analysis,
        example_sequential_refinement,
        example_consensus_building,
        example_creative_collaboration,
        example_technical_problem_solving
    ]
    
    for example in examples:
        await example()
        await asyncio.sleep(2)  # Brief pause between examples


if __name__ == "__main__":
    print("🧠 NEURON AI - ADVANCED EXAMPLES")
    print("Running multiple coordination strategy demonstrations...")
    
    asyncio.run(run_all_examples())
