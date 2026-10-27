import React from "react";

export default function FacialMetricsBar({ liveFeatures, baseline }) {
  if (!liveFeatures) {
    return (
      <div className="metrics-panel" style={{ textAlign: "center", padding: "28px 16px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          No frame analyzed yet. Click <strong>Analyze Now</strong> or start live monitoring to view facial biometric breakdown.
        </p>
      </div>
    );
  }

  const metrics = [
    {
      id: "browEye",
      name: "Brow-to-Eye Distance",
      icon: "👁️",
      tooltip: "Furrowed brows pull down toward eyes during concentration or frustration",
      live: liveFeatures.browEyeDist,
      base: baseline?.brow_eye_dist || 0.25,
      max: 0.45,
      format: (v) => v?.toFixed(3) || "—",
      // For brow-eye distance: lower than baseline indicates more furrowing/tension
      isTense: liveFeatures.browEyeDist < (baseline?.brow_eye_dist || 0.25) * 0.95,
    },
    {
      id: "interBrow",
      name: "Inter-Eyebrow Distance",
      icon: "↔️",
      tooltip: "Frowning pulls both brows closer horizontally",
      live: liveFeatures.interBrowDist,
      base: baseline?.inter_brow_dist || 0.35,
      max: 0.6,
      format: (v) => v?.toFixed(3) || "—",
      isTense: liveFeatures.interBrowDist < (baseline?.inter_brow_dist || 0.35) * 0.95,
    },
    {
      id: "ear",
      name: "Eye Aspect Ratio (EAR)",
      icon: "✨",
      tooltip: "Measures eye opening height vs width. Squinting or fatigue lowers ratio",
      live: liveFeatures.eyeAspectRatio,
      base: baseline?.eye_aspect_ratio || 0.28,
      max: 0.45,
      format: (v) => v?.toFixed(3) || "—",
      isTense: liveFeatures.eyeAspectRatio < (baseline?.eye_aspect_ratio || 0.28) * 0.95,
    },
    {
      id: "mouth",
      name: "Mouth Tension Ratio",
      icon: "👄",
      tooltip: "Pressed or strained lips create a wider/thinner ratio",
      live: liveFeatures.mouthTensionRatio,
      base: baseline?.mouth_tension_ratio || 3.5,
      max: 8.0,
      format: (v) => v?.toFixed(2) || "—",
      isTense: liveFeatures.mouthTensionRatio > (baseline?.mouth_tension_ratio || 3.5) * 1.1,
    },
  ];

  return (
    <div className="metrics-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h4 style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 700 }}>
          Facial Feature Deviations
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.7rem", color: "var(--text-muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--normal)" }} /> Live
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 2, height: 10, background: "#fff" }} /> Learned Baseline
          </span>
        </div>
      </div>

      {metrics.map((m) => {
        const livePercent = Math.min(100, Math.max(0, (m.live / m.max) * 100));
        const basePercent = Math.min(100, Math.max(0, (m.base / m.max) * 100));
        const barColor = m.isTense ? "var(--elevated)" : "var(--calm)";

        return (
          <div key={m.id} className="metric-row">
            <div className="metric-header">
              <span className="metric-title" title={m.tooltip}>
                {m.icon} {m.name}
              </span>
              <span className="metric-values">
                <strong>{m.format(m.live)}</strong>{" "}
                <span style={{ color: "var(--text-muted)" }}>(Base: {m.format(m.base)})</span>
              </span>
            </div>
            <div className="metric-bar-track">
              <div
                className="metric-bar-fill"
                style={{
                  width: `${livePercent}%`,
                  background: barColor,
                }}
              />
              {baseline && (
                <div
                  className="metric-baseline-marker"
                  style={{ left: `${basePercent}%` }}
                  title={`Baseline: ${m.format(m.base)}`}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
