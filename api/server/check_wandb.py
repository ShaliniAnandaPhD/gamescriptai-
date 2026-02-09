import os, wandb
api_key = "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"
os.environ["WANDB_API_KEY"] = api_key
wandb.login(key=api_key)
api = wandb.Api()
try:
    print(f"Logged in user: {api.viewer.username}")
    print("Available entities:")
    # This might fail if too many, but worth a shot
    entities = [e.name for e in api.viewer.teams] # Not strictly correct in all API versions
    print(f"Teams: {entities}")
except Exception as e:
    print(f"Error checking viewer: {e}")
