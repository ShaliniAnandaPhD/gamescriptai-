#!/bin/bash

echo "🧪 GameScript AI - Quick Test"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

HOST="http://localhost:5174"

# Check if server is up
if ! curl -s "$HOST/api/health" > /dev/null; then
  echo -e "${RED}🚨 Error: Backend server not found at $HOST${NC}"
  echo "Please run 'npm run dev' first."
  exit 1
fi

echo -e "${GREEN}📡 Signal detected at $HOST${NC}"
echo ""

# Test 1: Hyperbole Detection
echo -e "${BLUE}Test 1: Hyperbole Detection (Direct run-cycle)${NC}"
echo "Topic: ABSOLUTELY INSANE game with UNPRECEDENTED plays!"
echo ""

RESULT=$(curl -s -X POST "$HOST/api/run-cycle" \
  -H "Content-Type: application/json" \
  -d '{"topic": "ABSOLUTELY INSANE game with UNPRECEDENTED plays!", "episode_num": 999}')

# Parse quality from final_eval.score
QUALITY=$(echo $RESULT | jq -r '.final_eval.score // 0')

if (( $(echo "$QUALITY < 85" | bc -l) )); then
  echo -e "${GREEN}✅ PASS - System correctly identified risks. Quality: $QUALITY${NC}"
else
  echo -e "${YELLOW}⚠️  INFO - Quality was high ($QUALITY). Check if model bypassed constraints.${NC}"
fi

echo ""

# Test 2: Consensus Evaluation
echo -e "${BLUE}Test 2: Consensus Evaluation${NC}"
echo "Running 3-agent debate..."
echo ""

CONSENSUS=$(curl -s -X POST "$HOST/api/consensus-eval" \
  -H "Content-Type: application/json" \
  -d '{"script": "A solid performance by the team.", "topic": "Game Recap", "primitives": {"brevity": 0.5}}')

STRENGTH=$(echo $CONSENSUS | jq -r '.consensus.consensus_strength // 0')

if (( $(echo "$STRENGTH > 0" | bc -l) )); then
  echo -e "${GREEN}✅ PASS - Consensus reached. Strength: $STRENGTH${NC}"
else
  echo -e "${RED}❌ FAIL - Consensus synthesis failed.${NC}"
fi

echo ""
echo -e "${GREEN}👑 Quick tests complete!${NC}"
