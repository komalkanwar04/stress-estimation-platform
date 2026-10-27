import React from "react";

export default function AuthenticityTelemetry({
  authenticity,
  stressScore = 50,
  stressLabel = "Normal",
  onOpenMethodology,
}) {
  if (!authenticity) {
    return (
      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Stress Authenticity & Liveness Telemetry
              </h4>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Discerning genuine autonomic stress from posed/simulated facial expressions.
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={onOpenMethodology}
            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
          >
            📖 Mentor Methodology Guide
          </button>
        </div>
        <div style={{ marginTop: 14, textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
          Perform a spot check-in or start live monitoring to activate 5-Pillar Authenticity Verification.
        </div>
      </div>
    );
  }

  const {
    authenticityStatus,
    authenticityVerdict,
    authenticityScore = 85,
    confidencePercent = 90,
    isGenuine,
    isFake,
    rppgHeartRate = 72,
    rppgSurge = 0,
    biomarkerBreakdown = {},
    actionUnitDynamics = {},
    diagnosticFlags = [],
  } = authenticity;

  // Visual status theme
  let statusBadgeBg = "rgba(16, 185, 129, 0.15)";
  let statusBorder = "rgba(16, 185, 129, 0.4)";
  let statusColor = "var(--calm)";
  let statusIcon = "✅";
  let statusTitle = "Genuine Affect Verified";

  if (isFake) {
    statusBadgeBg = "rgba(244, 63, 94, 0.18)";
    statusBorder = "rgba(244, 63, 94, 0.5)";
    statusColor = "var(--high)";
    statusIcon = "⚠️";
    statusTitle = "Simulated / Posed Stress Detected";
  } else if (authenticityVerdict === "INCONCLUSIVE") {
    statusBadgeBg = "rgba(245, 158, 11, 0.15)";
    statusBorder = "rgba(245, 158, 11, 0.4)";
    statusColor = "var(--elevated)";
    statusIcon = "🔍";
    statusTitle = "Ambiguous / Inconclusive Affect";
  } else if (stressScore < 45) {
    statusTitle = "Genuine Relaxed Baseline";
  }

  const pillars = [
    {
      id: "autonomic",
      name: "Autonomic rPPG Concordance",
      icon: "🫀",
      score: biomarkerBreakdown.autonomicConcordance ?? 85,
      desc: "Green-channel hemoglobin pulse alignment with facial tension",
    },
    {
      id: "temporal",
      name: "Temporal Kinetics & Micro-Tremors",
      icon: "⚡",
      score: biomarkerBreakdown.temporalKinetics ?? 80,
      desc: "8–12 Hz involuntary muscle jitter vs. rigid static clamp",
    },
    {
      id: "synergy",
      name: "Multi-AU FACS Harmony",
      icon: "🎭",
      score: biomarkerBreakdown.multiActionUnitSynergy ?? 88,
      desc: "AU4 (Brow) + AU7 (Eye) + AU24 (Lip) anatomical synergy",
    },
    {
      id: "oculomotor",
      name: "Oculomotor & Palpebral Dynamics",
      icon: "👁️",
      score: biomarkerBreakdown.oculomotorNaturalness ?? 82,
      desc: "Spontaneous blink modulation & micro-fissure flutter",
    },
    {
      id: "bilateral",
      name: "Bilateral Hemispheric Balance",
      icon: "⚖️",
      score: biomarkerBreakdown.bilateralHarmony ?? 86,
      desc: "Limbic extrapyramidal balance vs. unilateral cortical posing",
    },
  ];

  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      {/* Background glow when fake is detected */}
      {isFake && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #f43f5e, #fb7185, #f43f5e)",
            boxShadow: "0 0 12px #f43f5e",
          }}
        />
      )}

      {/* Header */}
      <div className="card-header" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: "1.05rem" }}>
                Multi-Factor Stress Authenticity & Liveness Engine
              </h3>
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: "rgba(6, 182, 212, 0.15)",
                  color: "var(--normal)",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                MFSAE v2.0
              </span>
            </div>
            <p className="card-subtitle" style={{ marginTop: 2 }}>
              Scientific liveness verification discerning genuine autonomic distress from voluntary facial posing.
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onOpenMethodology}
          style={{
            fontSize: "0.75rem",
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.05)",
          }}
        >
          <span>📖</span>
          <span>Mentor Methodology Guide</span>
        </button>
      </div>

      {/* Primary Authenticity Status Card */}
      <div
        style={{
          background: statusBadgeBg,
          border: `1px solid ${statusBorder}`,
          borderRadius: "var(--radius-md)",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              border: `1px solid ${statusBorder}`,
            }}
          >
            {statusIcon}
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: statusColor, fontWeight: 800 }}>
              Authenticity Classification
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
              {statusTitle}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>
              Status: <strong>{authenticityStatus}</strong> • Confidence: <strong>{confidencePercent}%</strong>
            </div>
          </div>
        </div>

        {/* Live rPPG Cardiac Telemetry Pill */}
        <div
          style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid var(--surface-glass-border)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div className="rppg-pulse-indicator">
            <span className="rppg-heart-icon">🫀</span>
            <div className="rppg-wave-animation" />
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
              rPPG Involuntary Pulse
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f43f5e", fontFamily: "var(--font-mono)" }}>
              {Math.round(rppgHeartRate)} <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>BPM</span>
            </div>
          </div>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 12, textAlign: "right" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Autonomic Shift</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: rppgSurge > 5 ? "var(--high)" : "var(--calm)" }}>
              {rppgSurge > 0 ? `+${rppgSurge.toFixed(1)} bpm` : "Baseline"}
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Flags (Explainability) */}
      {diagnosticFlags.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--high)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠️</span> Explainable Diagnostic Findings (Posing Signatures Detected):
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {diagnosticFlags.map((flag, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(244, 63, 94, 0.08)",
                  border: "1px solid rgba(244, 63, 94, 0.25)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 16, marginTop: 1 }}>🚩</span>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {flag.title}
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.4 }}>
                    {flag.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 Scientific Pillars Breakdown Grid */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🔬 5-Pillar Biometric Authenticity Breakdown:
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Composite Authenticity Score: <strong>{authenticityScore}%</strong>
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {pillars.map((p) => {
            const scoreVal = Math.round(p.score);
            let pillColor = "var(--calm)";
            if (scoreVal < 50) pillColor = "var(--high)";
            else if (scoreVal < 70) pillColor = "var(--elevated)";

            return (
              <div
                key={p.id}
                style={{
                  background: "var(--surface-glass)",
                  border: "1px solid var(--surface-glass-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{p.icon}</span> {p.name}
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: pillColor, fontFamily: "var(--font-mono)" }}>
                    {scoreVal}%
                  </span>
                </div>
                
                {/* Progress bar */}
                <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                  <div
                    style={{
                      width: `${scoreVal}%`,
                      height: "100%",
                      background: pillColor,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                  {p.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
