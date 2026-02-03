import os, wandb
api_key = "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"
os.environ["WANDB_API_KEY"] = api_key
wandb.login(key=api_key)
api = wandb.Api()
print(f"Logged in as: {api.viewer.username}")
try:
    projects = api.projects(entity="nlpvisionio-university-of-california")
    print(f"Projects in nlpvisionio-university-of-california: {[p.name for p in projects]}")
except Exception as e:
    print(f"Error listing nlpvisionio-university-of-california: {e}")

try:
    projects = api.projects(entity="nlpvisionio")
    print(f"Projects in nlpvisionio: {[p.name for p in projects]}")
except Exception as e:
    print(f"Error listing nlpvisionio: {e}")
