import os, wandb
api_key = "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"
os.environ["WANDB_API_KEY"] = api_key
wandb.login(key=api_key)
try:
    print("Attempting to init run in nlpvisionio-university-of-california/living-newsroom-test...")
    run = wandb.init(entity="nlpvisionio-university-of-california", project="living-newsroom-test", name="test-run")
    print(f"Run created: {run.url}")
    run.finish()
except Exception as e:
    print(f"Failed: {e}")
