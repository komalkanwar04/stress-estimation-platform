import React, { useState, useEffect } from "react";
import { getSessions, getSessionDetail, updateSessionRecommendations } from "../api.js";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function SessionsHistory({ userId, onLaunchBreathing }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterLabel, setFilterLabel] = useState("all");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await getSessions(userId);
      setSessions(res.sessions || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSessions();
  }, [userId]);

  async function handleOpenDetail(id) {
    setSelectedSessionId(id);
    setDetailLoading(true);
    try {
      const res = await getSessionDetail(id);
      setSessionDetail(res);
      setNotesInput(res.session?.user_notes || "");
    } catch (e) {
      console.error(e);
    }
    setDetailLoading(false);
  }

  function handleCloseDetail() {
    setSelectedSessionId(null);
    setSessionDetail(null);
    loadSessions(); // refresh list with updated notes/completed recs
  }

  async function toggleRecommendation(recId) {
    if (!sessionDetail) return;
    const currentCompleted = sessionDetail.session.completed_recommendations || [];
    const isCompleted = currentCompleted.includes(recId);
    const updated = isCompleted
      ? currentCompleted.filter((id) => id !== recId)
      : [...currentCompleted, recId];

    // Optimistic UI update
    setSessionDetail({
      ...sessionDetail,
      session: {
        ...sessionDetail.session,
        completed_recommendations: updated,
      },
    });

    await updateSessionRecommendations(sessionDetail.session.id, updated, sessionDetail.session.user_notes);
  }

  async function handleSaveNotes() {
    if (!sessionDetail) return;
    setSavingNotes(true);
    await updateSessionRecommendations(
      sessionDetail.session.id,
      sessionDetail.session.completed_recommendations,
      notesInput
    );
    setSavingNotes(false);
  }

  function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mindpulse_sessions_${userId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  const filteredSessions = sessions.filter((s) => {
    if (filterType !== "all" && s.session_type !== filterType) return false;
    if (filterLabel !== "all" && !s.dominant_label?.toLowerCase().includes(filterLabel.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">📜 Session History & Wellness Logs</h2>
            <p className="card-subtitle">
              Comprehensive record of all facial stress monitoring runs and personalized wellness interventions.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={loadSessions} style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
              🔄 Refresh
            </button>
            <button className="btn btn-secondary" onClick={exportJSON} style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
              💾 Export JSON
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
              style={{ padding: "6px 12px", width: "auto", fontSize: "0.8rem" }}
            >
              <option value="all">All Sessions</option>
              <option value="live_monitoring">Live Monitoring</option>
              <option value="single_checkin">Spot Check-In</option>
              <option value="breathwork">Breathwork</option>
              <option value="calibration">Baseline Calibration</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Level:</span>
            <select
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              className="input-field"
              style={{ padding: "6px 12px", width: "auto", fontSize: "0.8rem" }}
            >
              <option value="all">All Levels</option>
              <option value="calm">Calm</option>
              <option value="normal">Normal</option>
              <option value="elevated">Elevated Tension</option>
              <option value="high">High Tension</option>
            </select>
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading session archives...</div>
        ) : filteredSessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: 8 }}>📋</p>
            <p>No sessions match your filter criteria.</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {filteredSessions.map((s) => {
              const dateStr = new Date(s.started_at + "Z").toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const dominantKey = s.dominant_label?.split(" ")[0] || "Normal";
              const recCount = s.recommendations_given?.length || 0;
              const completedCount = s.completed_recommendations?.length || 0;

              return (
                <div key={s.id} className="session-card" onClick={() => handleOpenDetail(s.id)}>
                  <div className="session-card-header">
                    <span className="session-type-badge">
                      {s.session_type === "live_monitoring"
                        ? "🔴 Live Monitoring"
                        : s.session_type === "single_checkin"
                        ? "⚡ Spot Check-In"
                        : s.session_type === "calibration"
                        ? "🎯 Calibration"
                        : "🫁 Breathwork"}
                    </span>
                    <span className={`gauge-label-pill state-${dominantKey}-bg`} style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                      {s.dominant_label || "Normal"}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                    {s.title || `Session #${s.id}`}
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 12 }}>{dateStr}</p>

                  <div className="session-stat-grid">
                    <div className="session-stat-item">
                      <strong>{s.avg_stress_score}</strong>
                      Avg Score
                    </div>
                    <div className="session-stat-item">
                      <strong>{s.avg_rppg_heart_rate ? `${Math.round(s.avg_rppg_heart_rate)} bpm` : "—"}</strong>
                      rPPG Pulse
                    </div>
                    <div className="session-stat-item">
                      <strong>{s.dominant_authenticity ? (s.dominant_authenticity.includes("Simulated") ? "⚠️ Posed" : "✅ Genuine") : "Verified"}</strong>
                      Liveness
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <span>
                      {recCount > 0 ? `💡 ${completedCount}/${recCount} Wellness Actions Done` : "No specific tips logged"}
                    </span>
                    <span style={{ color: "var(--normal)", fontWeight: 600 }}>View Details →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSessionId && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {detailLoading || !sessionDetail ? (
              <div style={{ textAlign: "center", padding: 40 }}>Loading session details...</div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <span className="session-type-badge" style={{ marginBottom: 6, display: "inline-block" }}>
                      {sessionDetail.session.session_type}
                    </span>
                    <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: 700 }}>
                      {sessionDetail.session.title || `Session #${sessionDetail.session.id}`}
                    </h2>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Started: {new Date(sessionDetail.session.started_at + "Z").toLocaleString()} • Duration:{" "}
                      {sessionDetail.session.duration_seconds}s • Readings: {sessionDetail.readings?.length || 0}
                    </p>
                  </div>
                  <button className="btn-icon" onClick={handleCloseDetail}>✕</button>
                </div>

                {/* Aggregate Summary */}
                <div className="session-stat-grid" style={{ marginBottom: 20 }}>
                  <div className="session-stat-item">
                    <strong>{sessionDetail.session.avg_stress_score}</strong>
                    Average Stress
                  </div>
                  <div className="session-stat-item">
                    <strong>{sessionDetail.session.peak_stress_score}</strong>
                    Peak Stress Recorded
                  </div>
                  <div className="session-stat-item">
                    <strong>{sessionDetail.session.dominant_label}</strong>
                    Dominant State
                  </div>
                </div>

                {/* Session Chart */}
                {sessionDetail.readings && sessionDetail.readings.length > 1 && (
                  <div style={{ marginBottom: 24 }}>
                    <h4 style={{ fontSize: "0.875rem", marginBottom: 10, color: "var(--text-primary)" }}>
                      📈 Intra-Session Stress Timeline
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart
                        data={sessionDetail.readings.map((r, i) => ({
                          index: i + 1,
                          time: new Date(r.created_at + "Z").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                          score: r.stress_score,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="time" fontSize={11} stroke="var(--text-muted)" />
                        <YAxis domain={[0, 100]} fontSize={11} stroke="var(--text-muted)" />
                        <Tooltip
                          contentStyle={{
                            background: "var(--surface-card)",
                            borderColor: "var(--surface-glass-border)",
                            borderRadius: 8,
                            color: "var(--text-primary)",
                          }}
                        />
                        <Line type="monotone" dataKey="score" stroke="var(--normal)" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recommendations Provided During This Session */}
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: "0.875rem", marginBottom: 12, color: "var(--text-primary)" }}>
                    💡 Recommendations Provided Based on Session Stress
                  </h4>

                  {sessionDetail.session.recommendations_given?.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      No recommendations triggered for this session.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {sessionDetail.session.recommendations_given.map((rec) => {
                        const isDone = (sessionDetail.session.completed_recommendations || []).includes(rec.id);
                        return (
                          <div
                            key={rec.id}
                            style={{
                              background: isDone ? "rgba(16, 185, 129, 0.08)" : "var(--surface-glass)",
                              border: `1px solid ${isDone ? "var(--calm-border)" : "var(--surface-glass-border)"}`,
                              borderRadius: "var(--radius-sm)",
                              padding: "12px 16px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <span style={{ fontSize: "1.2rem" }}>{rec.icon || "💡"}</span>
                              <div>
                                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                  {rec.title}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                  {rec.description}
                                </div>
                              </div>
                            </div>

                            <label className="rec-checkbox-label" style={{ whiteSpace: "nowrap" }}>
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => toggleRecommendation(rec.id)}
                              />
                              <span>{isDone ? "Completed" : "Mark Done"}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Session Notes / Reflections */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", marginBottom: 8, color: "var(--text-primary)" }}>
                    📝 Session Reflection & Context
                  </h4>
                  <textarea
                    className="input-field"
                    placeholder="Add notes about what you were working on or how you felt..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                  />
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button className="btn" onClick={handleSaveNotes} disabled={savingNotes} style={{ padding: "8px 16px", fontSize: "0.8rem" }}>
                      {savingNotes ? "Saving..." : "Save Reflection"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
