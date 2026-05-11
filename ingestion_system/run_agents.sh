#!/bin/bash
# run_agents.sh
# Script to run the NearbyNeed AI data gathering pipeline.

cd "$(dirname "$0")/.." || exit

# Activate Virtual Environment
source .venv/bin/activate

echo "==========================================="
echo "Starting NearbyNeed AI Data Gathering Pipeline"
echo "Time: $(date)"
echo "==========================================="

# Ensure API Key is available
if [ -z "$GEMINI_API_KEY" ]; then
    # Try to load from .env.local if present
    if [ -f ".env.local" ]; then
        export $(grep -v '^#' .env.local | xargs)
    fi
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ ERROR: GEMINI_API_KEY is not set."
    exit 1
fi

export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Check arguments
AGENT=$1

if [ "$AGENT" == "discovery" ]; then
    echo "--> Running Discovery Agent (Manual Trigger)..."
    python ingestion_system/agents/discovery_agent.py "$2"
elif [ "$AGENT" == "crawler" ]; then
    echo "--> Running Crawler Agent..."
    python ingestion_system/agents/crawler_agent.py
else
    echo "Usage: ./run_agents.sh [crawler|discovery] [limit]"
    echo "  crawler   - Runs the URL crawler (Recommended for cron)"
    echo "  discovery - Runs the web search discovery agent (Manual)"
    exit 1
fi

echo "==========================================="
echo "Pipeline Complete"
echo "==========================================="

# Setup Instructions for Cron:
# 1. chmod +x ingestion_system/run_agents.sh
# 2. crontab -e
# 3. Add the following line to run the CRAWLER every day at 3 AM:
# 0 3 * * * /path/to/nearbyneed/ingestion_system/run_agents.sh crawler >> /path/to/nearbyneed/data/cron.log 2>&1
