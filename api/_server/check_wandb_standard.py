import os, wandb
api_key = "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"
os.environ["WANDB_API_KEY"] = api_key
wandb.login(key=api_key)
try:
    print("Attempting to init standard wandb run...")
    run = wandb.init(entity="nlpvisionio", project="living-newsroom", name="test-run")
    print(f"Run created: {run.url}")
    run.finish()
except Exception as e:
    print(f"Standard wandb.init failed: {e}")
