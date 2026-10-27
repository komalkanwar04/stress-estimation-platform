# Personalized Stress Estimation & Mental Wellness Analytics Platform

A working prototype of the system described in the project poster: a webcam-based,
AI-assisted stress estimation tool that learns **each user's own facial baseline**
and flags deviations from it, rather than applying one universal threshold.

> ⚠️ For stress awareness & wellness support only — not a medical diagnostic system.

## Architecture

```
┌────────────┐      webcam frame       ┌────────────────┐
│   React     │ ───────────────────▶  │  ML Service     │
│  Frontend   │ ◀─────────────────── │  (Python/Flask) │
│ (Vite, :5173)│   facial features    │  MediaPipe +    │
└─────┬──────┘                        │  OpenCV (:5001) │
      │                               └────────────────┘
      │ userId + features
      ▼
┌────────────────┐
│  Node/Express   │   SQLite (data.db)
│  Backend (:4000)│──▶ users, baselines, readings
└────────────────┘
```

- **ml-service/** (Python) — receives a base64 JPEG frame, runs MediaPipe FaceMesh,
  computes 4 interpretable facial features (brow-eye distance, inter-eyebrow
  distance, eye aspect ratio, mouth tension ratio) and a raw composite
  "stress index" (0–100). This is the "Feature Extraction" + part of
  "AI/ML Estimation" from the poster's methodology.
- **backend/** (Node/Express + SQLite) — stores each user's calibration
  samples, computes and stores their **personal baseline** (average of raw
  features during a relaxed calibration session), and on each new reading
  computes the **deviation from that baseline** to produce a personalized
  stress score + label + wellness tips. This is the "Baseline Creation" +
  "Personalized Comparison" + "Wellness Support" steps.
- **frontend/** (React + Vite + Recharts) — guided calibration flow, live
  webcam capture, current stress score/label, and a time-series trend chart.
  This is the "Analytics Dashboard" from the poster.

## How the personalization works

1. **Calibration ("Learn Normal Facial Pattern")**: the user relaxes in front
   of the camera for ~10 samples. The average of their raw feature values
   becomes their personal baseline — stored per-user, not shared across users.
2. **Live estimation**: each new frame's raw stress index is compared to
   *that user's own* baseline. `stressScore = 50 + (deviation × scale)`,
   so 50 = "at your personal baseline", higher = more deviation toward tension.
3. **Trend + recommendations**: every reading is stored with a timestamp so
   the dashboard can chart change over time, and wellness tips are shown
   based on the resulting label (Calm / Normal / Elevated / High).

## Setup

You'll need **Node.js 18+** and **Python 3.9–3.11** (MediaPipe doesn't yet
support the very latest Python versions — 3.11 is safest).

### 1. ML Service
```bash
cd ml-service
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py                 # runs on http://localhost:5001
```

### 2. Backend
```bash
cd backend
npm install
npm start                     # runs on http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                   # runs on http://localhost:5173
```

Open `http://localhost:5173`, allow camera access, enter a name, complete
the ~12-second calibration, then click **Analyze Now** or **Start Live
Monitoring**.

## Known simplifications (vs. the full poster scope)

- SQLite instead of PostgreSQL, for zero-config local setup — swapping the
  `backend/db.js` driver is enough to move to Postgres later.
- No authentication — a name is used as a simple profile key. Add real auth
  (e.g. JWT + password/OAuth) before any real deployment.
- The "stress index" is a simple, interpretable heuristic over 4 facial
  features (brow, eyes, mouth), not a trained/validated ML classifier.
  Swapping in a trained model (e.g. an SVM or small CNN over AU features,
  trained on a labeled dataset) would replace the formula in
  `ml-service/app.py::extract_features` without changing the rest of the
  system — this is a good next step for your "AI/ML Evaluation" and
  "Model Comparison" poster sections.
- Everything runs locally (no cloud deployment). To match the poster's
  "Cloud-Based" framing, deploy: frontend to Vercel/Netlify, backend to
  Render/Railway, ML service to a small GPU/CPU instance, and Postgres to
  a managed DB (e.g. Supabase/Neon/RDS).
- No wearable, GSR, voice, or long-term (multi-day) analytics yet — see the
  poster's "Future Scope" section for these.

## Project structure
```
stress-estimation-platform/
├── ml-service/       # Python Flask + MediaPipe facial feature extraction
│   ├── app.py
│   └── requirements.txt
├── backend/          # Node/Express API + SQLite persistence
│   ├── server.js
│   ├── db.js
│   └── package.json
└── frontend/         # React + Vite dashboard
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   └── components/
    │       ├── WebcamCapture.jsx
    │       ├── BaselineSetup.jsx
    │       └── Dashboard.jsx
    └── package.json
```
