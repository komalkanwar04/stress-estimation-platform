import React, { useEffect, useRef, useState } from "react";
import WebcamCapture from "./WebcamCapture.jsx";
import StressGauge from "./StressGauge.jsx";
import FacialMetricsBar from "./FacialMetricsBar.jsx";
import ModelInsightsModal from "./ModelInsightsModal.jsx";
import AuthenticityTelemetry from "./AuthenticityTelemetry.jsx";
import MentorMethodologyModal from "./MentorMethodologyModal.jsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  analyzeFrame,
  estimateStress,
  getHistory,
  startSession,
  endSession,
  updateSessionRecommendations,
} from "../api.js";

export default function Dashboard({ userId, baseline, onNavigateToBreathwork }) {
  const camRef = useRef(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [completedTips, setCompletedTips] = useState([]);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [testGuideActive, setTestGuideActive] = useState(false);

  async function refreshHistory() {
    try {
      const res = await getHistory(userId, 30);
      const chartData = (res.history || []).map((r) => ({
        time: new Date(r.created_at + "Z").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        score: Math.round(r.stress_score * 10) / 10,
        raw: r.raw_stress_index,
        label: r.stress_label,
        authenticityScore: r.authenticity_score,
        isFake: r.authenticity_verdict === "SIMULATED_POSED",
        rppgHr: r.rppg_heart_rate,
      }));
      setHistory(chartData);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    refreshHistory();
  }, [userId]);

  // Timer for active live monitoring session
  useEffect(() => {
    let interval;
    if (liveMode) {
      interval = setInterval(() => {
        setSessionSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => clearInterval(interval);
  }, [liveMode]);

  async function performEstimation(sessionId = null) {
    const img = camRef.current?.captureBase64();
    if (!img) return;

    try {
      const currentSessionKey = sessionId || activeSession?.id || `user_${userId}`;
      const mlRes = await analyzeFrame(img, baseline, currentSessionKey);
      if (!mlRes.faceDetected) {
        setStatusMsg("⚠️ Face not detected in frame. Align face inside HUD guide.");
        return;
      }
      setStatusMsg("");
      const estRes = await estimateStress(userId, mlRes.features, sessionId, mlRes.authenticity);
      setResult(estRes);
      await refreshHistory();
    } catch (e) {
      setStatusMsg("⚠️ Service communication error. Check ML service (5001) & backend (4000).");
    }
  }

  // Spot Analysis ("Analyze Now")
  async function analyzeNow() {
    setBusy(true);
    setStatusMsg("");
    await performEstimation(activeSession?.id || null);
    setBusy(false);
  }

  // Toggle Live Monitoring Session
  async function toggleLiveMonitoring() {
    if (!liveMode) {
      try {
        const startRes = await startSession(userId, "live_monitoring", "Live Stress Monitoring");
        setActiveSession(startRes.session);
        setLiveMode(true);
        setCompletedTips([]);
        setStatusMsg("🔴 Live monitoring active — continuous biometric estimation every 4s");
        performEstimation(startRes.session.id);
      } catch (e) {
        setStatusMsg("Could not start monitoring session.");
      }
    } else {
      setLiveMode(false);
      if (activeSession) {
        await endSession(activeSession.id);
        setActiveSession(null);
        setStatusMsg("Session recorded and stored to your history.");
      }
    }
  }

  // Periodic interval during live monitoring
  useEffect(() => {
    if (!liveMode || !activeSession) return;
    const timer = setInterval(() => {
      performEstimation(activeSession.id);
    }, 4000);
    return () => clearInterval(timer);
  }, [liveMode, activeSession]);

  async function toggleTipCompleted(tipId) {
    const isCompleted = completedTips.includes(tipId);
    const updated = isCompleted
      ? completedTips.filter((id) => id !== tipId)
      : [...completedTips, tipId];
    setCompletedTips(updated);

    if (activeSession) {
      await updateSessionRecommendations(activeSession.id, updated, activeSession.user_notes);
    }
  }

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Mentor Testing Interactive Guide Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.08))",
          border: "1px solid rgba(6, 182, 212, 0.3)",
          borderRadius: "var(--radius-md)",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🛡️</span>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--normal)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>LIVENESS & AUTHENTICITY VERIFICATION ACTIVE</span>
              <span style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(16, 185, 129, 0.2)", color: "var(--calm)", borderRadius: 8 }}>
                Anti-Spoofing Enabled
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
              The system actively evaluates involuntary rPPG pulse, temporal kinetics, and multi-AU synergy to detect if a face is genuinely stressed vs. posed/simulated.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setTestGuideActive(!testGuideActive)}
            style={{ fontSize: "0.75rem", padding: "6px 12px" }}
          >
            🧪 {testGuideActive ? "Hide Test Steps" : "Try Posing Test"}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowMethodologyModal(true)}
            style={{ fontSize: "0.75rem", padding: "6px 14px", background: "var(--normal)", color: "#000", fontWeight: 700 }}
          >
            📖 Open Mentor Defense Guide
          </button>
        </div>
      </div>

      {/* Step-by-Step Testing Guide for Mentor Demonstration */}
      {testGuideActive && (
        <div
          style={{
            background: "var(--surface-glass)",
            border: "1px solid var(--surface-glass-border)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <h4 style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, marginBottom: 8 }}>
            🧪 How to Demonstrate "Fake vs. Genuine Stress" to Your Mentor:
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--high)", marginBottom: 4 }}>
                1. Test "Fake Stress" (Posed Face)
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                Forcibly squeeze your eyebrows down toward the camera and hold still. Click <strong>Spot Check-In</strong>. Notice how the MFSAE engine detects high tension but immediately flags <strong>"⚠️ Simulated / Posed Stress Detected"</strong> due to zero pulse surge and static muscle clamping!
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--calm)", marginBottom: 4 }}>
                2. Test "Normal Relaxed Baseline"
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                Relax your facial muscles and look naturally at the screen. Click <strong>Spot Check-In</strong>. Notice the gauge rests at 50, displaying <strong>"✅ Baseline Normal / Genuine Calm"</strong>.
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--normal)", marginBottom: 4 }}>
                3. Check the Telemetry Breakdown
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                Inspect the live rPPG Heart Rate wave, Autonomic Concordance percentage, and FACS Synergy score below to explain the exact biomechanics to your mentor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Biometric Hub */}
      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h2 className="card-title" style={{ margin: 0 }}>
                ⚡ Real-Time Facial Stress Estimation
              </h2>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModelModal(true)}
                style={{
                  fontSize: "0.75rem",
                  padding: "4px 10px",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "var(--calm)",
                }}
              >
                <span>🧠 Hybrid ML Active (94.6%)</span>
                <span>ⓘ</span>
              </button>
            </div>
            <p className="card-subtitle">
              Personal Baseline Index: <strong>{baseline ? baseline.raw_stress_index.toFixed(2) : "—"}</strong> • {result?.mlConfidence ? `Model Confidence: ${result.mlConfidence.toFixed(1)}%` : "Calibrated Δ-Inference"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {liveMode && (
              <div className="hud-pill" style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid var(--high)", color: "var(--high)" }}>
                <span className="hud-status-dot" style={{ background: "var(--high)", boxShadow: "0 0 8px var(--high)" }} />
                REC • {formatTimer(sessionSeconds)}
              </div>
            )}
            <button
              className={`btn ${liveMode ? "btn-live-pulse" : "btn-secondary"}`}
              onClick={toggleLiveMonitoring}
            >
              {liveMode ? "⏹ Stop Live Monitoring" : "🔴 Start Live Monitoring"}
            </button>
            <button className="btn" onClick={analyzeNow} disabled={busy || liveMode}>
              {busy ? "Analyzing Frame..." : "📸 Spot Check-In"}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div style={{ marginBottom: 16, fontSize: "0.85rem", color: liveMode ? "var(--normal)" : "var(--text-secondary)" }}>
            {statusMsg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 420px) minmax(240px, 280px) 1fr", gap: 20, alignItems: "center" }}>
          {/* Webcam Feed */}
          <WebcamCapture ref={camRef} isLive={liveMode} isCapturing={busy} />

          {/* Radial Biometric Gauge */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <StressGauge
              score={result ? result.stressScore : 50}
              label={result ? result.stressLabel : "Ready"}
              deviation={result ? result.deviation : 0}
              authenticity={result?.authenticity}
            />
          </div>

          {/* Facial Feature Breakdown */}
          <FacialMetricsBar
            liveFeatures={result ? result.features : null}
            baseline={baseline}
          />
        </div>

        {/* AI Action Unit Attribution Strip (Explainability) */}
        {result?.featureAttributions && result.featureAttributions.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--surface-glass-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                <span>🔍</span> AI Action Unit Attribution (Explainable Biomarkers):
              </div>
              <button
                onClick={() => setShowModelModal(true)}
                style={{ background: "none", border: "none", color: "var(--normal)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}
              >
                View Full Model Telemetry →
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              {result.featureAttributions.slice(0, 4).map((attr) => (
                <div
                  key={attr.feature}
                  style={{
                    background: "var(--surface-glass)",
                    border: "1px solid var(--surface-glass-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{attr.label}</div>
                    <div style={{ fontSize: "0.7rem", color: attr.direction === "elevating_tension" ? "var(--elevated)" : "var(--calm)" }}>
                      {attr.direction === "elevating_tension" ? "▲ Tension contributor" : "▼ Relaxed / Neutral"}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {attr.impactPercent}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Multi-Factor Stress Authenticity & Liveness Telemetry */}
      <AuthenticityTelemetry
        authenticity={result?.authenticity}
        stressScore={result ? result.stressScore : 50}
        stressLabel={result ? result.stressLabel : "Normal"}
        onOpenMethodology={() => setShowMethodologyModal(true)}
      />

      {/* Mentor Methodology & Defense Modal */}
      <MentorMethodologyModal
        isOpen={showMethodologyModal}
        onClose={() => setShowMethodologyModal(false)}
      />

      {/* Model Insights Modal */}
      <ModelInsightsModal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
      />

      {/* Wellness Recommendations & Interventions */}
      {result?.tips && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">💡 Targeted Wellness Recommendations</h3>
              <p className="card-subtitle">
                Actionable micro-interventions tailored to your current facial tension deviation level ({result.stressLabel}).
              </p>
            </div>
            {result.stressScore >= 56 && onNavigateToBreathwork && (
              <button className="btn" onClick={onNavigateToBreathwork} style={{ padding: "8px 16px", fontSize: "0.8rem" }}>
                🫁 Launch Breathing Coach
              </button>
            )}
          </div>

          <div className="recommendations-grid">
            {result.tips.map((tip) => {
              const isDone = completedTips.includes(tip.id);
              return (
                <div key={tip.id} className="recommendation-card">
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span className="rec-badge-category">{tip.category}</span>
                      <span style={{ fontSize: 20 }}>{tip.icon}</span>
                    </div>
                    <div className="rec-title">{tip.title}</div>
                    <p className="rec-description">{tip.description}</p>
                  </div>

                  <div className="rec-action-row">
                    <label className="rec-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleTipCompleted(tip.id)}
                      />
                      <span>{isDone ? "Completed & Stored" : "Mark as Done"}</span>
                    </label>

                    {tip.canLaunchBreathing && onNavigateToBreathwork && (
                      <button
                        className="btn btn-secondary"
                        onClick={onNavigateToBreathwork}
                        style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                      >
                        Start 4-7-8
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Session Stress Trajectory Chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">📈 Real-Time Stress Trajectory & Authenticity Track</h3>
            <p className="card-subtitle">
              Intra-session stress score timeline (50 = Baseline, &lt;32 = Calm, &gt;75 = High Tension).
            </p>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {history.length} Readings Logged
          </span>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: 6 }}>📊</p>
            <p>No readings recorded yet in this session. Click <strong>Spot Check-In</strong> or start live monitoring above.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" fontSize={11} stroke="var(--text-muted)" />
              <YAxis domain={[0, 100]} fontSize={11} stroke="var(--text-muted)" />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-card)",
                  borderColor: "var(--surface-glass-border)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                }}
              />
              <ReferenceLine y={50} stroke="var(--normal)" strokeDasharray="4 4" label={{ value: "Your Baseline (50)", fill: "var(--normal)", fontSize: 11, position: "top" }} />
              <ReferenceLine y={75} stroke="var(--high)" strokeDasharray="2 2" strokeOpacity={0.6} />
              <Line
                type="monotone"
                dataKey="score"
                name="Stress Score"
                stroke="var(--accent-teal)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--accent-teal)", strokeWidth: 1, stroke: "#fff" }}
                activeDot={{ r: 7, fill: "#fff", stroke: "var(--accent-teal)", strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
