import os, weave
api_key = "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"
os.environ["WANDB_API_KEY"] = api_key
entity = "nlpvisionio-university-of-california"
project = "living-newsroom"

try:
    print(f"Attempting weave.init('{entity}/{project}')...")
    weave.init(f"{entity}/{project}")
    print("Weave initialized successfully!")
except Exception as e:
    print(f"Weave init failed: {e}")
