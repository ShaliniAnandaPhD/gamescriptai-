#!/usr/bin/env bash
# setup.sh — install Neuron + deps, then launch the Living Newsroom circuit
# Usage:  bash setup.sh
# ─────────────────────────────────────────────────────────────────────────

set -e

echo "=============================================="
echo "  🧠 Living Newsroom — Neuron Setup"
echo "=============================================="

# ── 1. Clone Neuron (skip if already present) ─────────────────────────
if [ ! -d "Neuron" ]; then
    echo ""
    echo "📦 Cloning ShaliniAnandaPhD/Neuron …"
    git clone https://github.com/ShaliniAnandaPhD/Neuron.git
    echo "   ✅ Cloned"
else
    echo "📦 Neuron/ already present — skipping clone"
fi

# ── 2. Install Neuron in editable mode ────────────────────────────────
echo ""
echo "📦 Installing Neuron (pip install -e ./Neuron) …"
pip install -e ./Neuron --quiet
echo "   ✅ Neuron installed"

# ── 3. Install remaining deps ─────────────────────────────────────────
echo ""
echo "📦 Installing requirements.txt …"
pip install -r requirements.txt --quiet
echo "   ✅ Dependencies installed"

# ── 4. Create .env if missing ─────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Creating .env …"
    cat > .env <<'EOF'
# HuggingFace API key — paste yours here
HF_API_KEY=your_hf_api_key_here

# Model — Llama-3.2-3B-Instruct is the default; swap for any HF model
HF_MODEL=meta-llama/Llama-3.2-3B-Instruct
EOF
    echo "   ✅ .env created  (edit HF_API_KEY if needed)"
else
    echo "⚙️  .env already exists — skipping"
fi

# ── 5. Run the circuit ────────────────────────────────────────────────
echo ""
echo "=============================================="
echo "  🚀 Launching Living Newsroom Circuit …"
echo "=============================================="
echo ""
python newsroom_circuit.py
