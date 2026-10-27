import React from "react";

export default function StressGauge({ score = 50, label = "Normal", deviation = 0, authenticity = null }) {
  // Score is between 0 and 100
  // Map score (0 - 100) to gauge angle (-90deg to +90deg, or 0 to 180deg arc)
  const clampedScore = Math.max(0, Math.min(100, score || 50));
  
  // Radius and Arc calculation
  const radius = 80;
  const cx = 110;
  const cy = 100;
  const circumference = Math.PI * radius; // 180 degree semi-circle
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Determine color and state
  let stateColor = "#06b6d4";
  let stateKey = "Normal";
  if (clampedScore < 32) {
    stateColor = "#10b981";
    stateKey = "Calm";
  } else if (clampedScore < 56) {
    stateColor = "#06b6d4";
    stateKey = "Normal";
  } else if (clampedScore < 75) {
    stateColor = "#f59e0b";
    stateKey = "Elevated";
  } else {
    stateColor = "#f43f5e";
    stateKey = "High";
  }

  // Needle angle (-90deg at 0, 0deg at 50, +90deg at 100)
  const needleAngle = -90 + (clampedScore / 100) * 180;

  return (
    <div className="gauge-container">
      <svg className="gauge-svg" viewBox="0 0 220 125">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="35%" stopColor="#06b6d4" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={stateColor} floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Background Track Arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          className="gauge-arc-bg"
        />

        {/* Active Value Arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          className="gauge-arc-fill"
          stroke="url(#gaugeGradient)"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter="url(#gaugeGlow)"
        />

        {/* Center Pivot & Needle */}
        <g transform={`rotate(${needleAngle} ${cx} ${cy})`} className="gauge-needle">
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - radius + 14}
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="6" fill="#ffffff" />
          <circle cx={cx} cy={cy} r="3" fill={stateColor} />
        </g>
      </svg>

      <div className="gauge-score-value" style={{ color: stateColor }}>
        {Math.round(clampedScore)}
      </div>

      <div className={`gauge-label-pill state-${stateKey}-bg`}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: stateColor }} />
        {label}
      </div>

      {authenticity && (
        <div
          style={{
            marginTop: 6,
            fontSize: "0.72rem",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 10,
            background: authenticity.isFake ? "rgba(244, 63, 94, 0.2)" : clampedScore >= 56 ? "rgba(245, 158, 11, 0.18)" : "rgba(16, 185, 129, 0.15)",
            border: `1px solid ${authenticity.isFake ? "var(--high)" : clampedScore >= 56 ? "var(--elevated)" : "var(--calm)"}`,
            color: authenticity.isFake ? "var(--high)" : clampedScore >= 56 ? "var(--elevated)" : "var(--calm)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>
            {authenticity.isFake
              ? "⚠️ Simulated / Posed Stress"
              : clampedScore >= 56
              ? "✅ Genuine Stress (Verified)"
              : "🌿 Normal Baseline"}
          </span>
        </div>
      )}

      <div className="gauge-deviation-badge">
        {deviation === 0
          ? "Exact baseline match (0.00)"
          : deviation > 0
          ? `▲ +${deviation.toFixed(2)} tension vs baseline`
          : `▼ ${deviation.toFixed(2)} relaxed vs baseline`}
      </div>
    </div>
  );
}
