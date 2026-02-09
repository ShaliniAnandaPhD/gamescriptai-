"""
Multi-Gemini Neuron System
A coordination system for running two Gemini models in tandem
"""

import os
import asyncio
from typing import List, Dict, Optional
from dataclasses import dataclass
import google.generativeai as genai


@dataclass
class NeuronConfig:
    """Configuration for the Neuron coordination system"""
    gemini_1_model: str = "gemini-1.5-pro"
    gemini_2_model: str = "gemini-1.5-flash"
    api_key: Optional[str] = None
    coordination_strategy: str = "parallel"  # parallel, sequential, or consensus


class NeuronAI:
    """
    Neuron coordination layer that manages multiple Gemini models
    working together for enhanced AI capabilities
    """
    
    def __init__(self, config: NeuronConfig):
        self.config = config
        self.api_key = config.api_key or os.getenv("GOOGLE_API_KEY")
        
        if not self.api_key:
            raise ValueError("Google API key required. Set GOOGLE_API_KEY env variable or pass in config")
        
        # Initialize the API
        genai.configure(api_key=self.api_key)
        
        # Create two Gemini model instances
        self.gemini_1 = genai.GenerativeModel(config.gemini_1_model)
        self.gemini_2 = genai.GenerativeModel(config.gemini_2_model)
        
        print(f"🧠 Neuron AI initialized with:")
        print(f"   Model 1: {config.gemini_1_model}")
        print(f"   Model 2: {config.gemini_2_model}")
        print(f"   Strategy: {config.coordination_strategy}")
    
    async def process_parallel(self, prompt: str) -> Dict[str, str]:
        """Run both models in parallel and return both responses"""
        print(f"\n⚡ Running parallel processing...")
        
        # Create tasks for both models
        tasks = [
            self._generate_async(self.gemini_1, prompt, "Model 1"),
            self._generate_async(self.gemini_2, prompt, "Model 2")
        ]
        
        # Wait for both to complete
        results = await asyncio.gather(*tasks)
        
        return {
            "model_1_response": results[0],
            "model_2_response": results[1],
            "strategy": "parallel"
        }
    
    async def _generate_async(self, model, prompt: str, model_name: str) -> str:
        """Async wrapper for model generation"""
        print(f"   {model_name} processing...")
        response = await model.generate_content_async(prompt)
        print(f"   {model_name} completed ✓")
        return response.text
    
    async def process_sequential(self, prompt: str) -> Dict[str, str]:
        """
        Run models sequentially - Model 2 refines Model 1's output
        """
        print(f"\n🔄 Running sequential processing...")
        
        # First model generates initial response
        print("   Model 1 generating initial response...")
        response_1 = await self._generate_async(self.gemini_1, prompt, "Model 1")
        
        # Second model refines or builds upon first response
        refinement_prompt = f"""
        Based on this initial response, provide an enhanced or refined answer:
        
        Initial Response:
        {response_1}
        
        Original Question: {prompt}
        
        Please refine, expand, or improve upon this response.
        """
        
        print("   Model 2 refining response...")
        response_2 = await self._generate_async(self.gemini_2, refinement_prompt, "Model 2")
        
        return {
            "initial_response": response_1,
            "refined_response": response_2,
            "strategy": "sequential"
        }
    
    async def process_consensus(self, prompt: str) -> Dict[str, str]:
        """
        Run both models and synthesize a consensus response
        """
        print(f"\n🤝 Running consensus processing...")
        
        # Get both responses in parallel
        parallel_results = await self.process_parallel(prompt)
        
        # Create consensus prompt
        consensus_prompt = f"""
        Two AI models have provided responses to this question: "{prompt}"
        
        Response 1:
        {parallel_results['model_1_response']}
        
        Response 2:
        {parallel_results['model_2_response']}
        
        Please synthesize these into a single, best answer that captures the strengths of both.
        """
        
        print("   Synthesizing consensus...")
        consensus = await self._generate_async(self.gemini_1, consensus_prompt, "Consensus")
        
        return {
            "model_1_response": parallel_results['model_1_response'],
            "model_2_response": parallel_results['model_2_response'],
            "consensus_response": consensus,
            "strategy": "consensus"
        }
    
    async def process(self, prompt: str) -> Dict[str, str]:
        """
        Main processing method that uses the configured strategy
        """
        if self.config.coordination_strategy == "parallel":
            return await self.process_parallel(prompt)
        elif self.config.coordination_strategy == "sequential":
            return await self.process_sequential(prompt)
        elif self.config.coordination_strategy == "consensus":
            return await self.process_consensus(prompt)
        else:
            raise ValueError(f"Unknown strategy: {self.config.coordination_strategy}")


async def main():
    """Example usage of the Neuron AI system"""
    
    # Configure the neuron system
    config = NeuronConfig(
        gemini_1_model="gemini-1.5-pro",
        gemini_2_model="gemini-1.5-flash",
        coordination_strategy="consensus"  # Try: parallel, sequential, or consensus
    )
    
    # Initialize the neuron
    neuron = NeuronAI(config)
    
    # Example prompt
    prompt = "Explain quantum computing in simple terms and provide a practical use case."
    
    print(f"\n📝 Prompt: {prompt}")
    print("=" * 80)
    
    # Process with the neuron system
    results = await neuron.process(prompt)
    
    # Display results
    print("\n" + "=" * 80)
    print("📊 RESULTS")
    print("=" * 80)
    
    for key, value in results.items():
        print(f"\n{key.upper().replace('_', ' ')}:")
        print("-" * 80)
        print(value)
        print()


if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())
