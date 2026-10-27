#!/usr/bin/env bash
# ==============================================================================
# MindPulse - Start All Services (ML Service, Backend, Frontend)
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🌿 Starting MindPulse Platform from: $PROJECT_DIR"

# Cleanup function on Ctrl+C
cleanup() {
  echo ""
  echo "🛑 Stopping all MindPulse background services..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start ML Service (Python / Flask / MediaPipe on port 5001)
echo "--------------------------------------------------------"
echo "🧠 [1/3] Starting ML Microservice on http://localhost:5001 ..."
cd "$PROJECT_DIR/ml-service"
"$PROJECT_DIR/ml-service/venv/bin/python" app.py &
ML_PID=$!

# Wait briefly for ML service to start
sleep 2

# 2. Start Backend API (Node / Express on port 4000)
echo "--------------------------------------------------------"
echo "⚙️ [2/3] Starting Backend API on http://localhost:4000 ..."
cd "$PROJECT_DIR/backend"
node server.js &
BACKEND_PID=$!

# Wait briefly for backend to start
sleep 1

# 3. Start Frontend (Vite on http://localhost:5173)
echo "--------------------------------------------------------"
echo "💻 [3/3] Starting Frontend Dashboard on http://localhost:5173 ..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "========================================================"
echo "✨ All services launched successfully!"
echo "🌐 Open your browser at: http://localhost:5173"
echo "📌 Press Ctrl+C in this terminal to stop all servers."
echo "========================================================"

wait
