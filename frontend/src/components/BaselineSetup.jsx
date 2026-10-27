import React, { useRef, useState } from "react";
import WebcamCapture from "./WebcamCapture.jsx";
import { analyzeFrame, submitBaselineSample, finalizeBaseline } from "../api.js";

const TOTAL_SAMPLES = 10;
const INTERVAL_MS = 1100;

export default function BaselineSetup({ userId, onComplete }) {
  const camRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("Sit comfortably in good lighting, relax your facial muscles, and look naturally at the camera.");
  const [isFaceDetected, setIsFaceDetected] = useState(true);

  async function startCalibration() {
    setRunning(true);
    setCount(0);
    setStatus("Calibrating... Please maintain a relaxed neutral expression.");

    for (let i = 0; i < TOTAL_SAMPLES; i++) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
      const img = camRef.current?.captureBase64();
      if (!img) continue;

      try {
        const result = await analyzeFrame(img);
        if (result.faceDetected) {
          setIsFaceDetected(true);
          await submitBaselineSample(userId, result.features);
          setCount((c) => c + 1);
        } else {
          setIsFaceDetected(false);
          setStatus("⚠️ No face detected — please center your face in the camera frame.");
        }
      } catch (e) {
        setStatus("⚠️ Could not reach the ML service (port 5001). Please ensure it is running.");
        setRunning(false);
        return;
      }
    }

    setStatus("Finalizing and averaging your personalized baseline profile...");
    try {
      const finalRes = await finalizeBaseline(userId);
      setRunning(false);
      if (finalRes.ok) {
        onComplete(finalRes.baseline);
      } else {
        setStatus(finalRes.error || "Could not finalize baseline.");
      }
    } catch (e) {
      setStatus("Error finalizing baseline: " + e.message);
      setRunning(false);
    }
  }

  const progressPercent = Math.round((count / TOTAL_SAMPLES) * 100);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">🎯 Step 1 — Learn Your Personal Facial Baseline</h2>
          <p className="card-subtitle">
            Every face is unique. We establish your neutral, relaxed baseline to detect personal deviation rather than using universal generic thresholds.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 440px) 1fr", gap: 24, alignItems: "center" }}>
        <WebcamCapture ref={camRef} isLive={running} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: isFaceDetected ? "var(--surface-glass)" : "rgba(244, 63, 94, 0.1)",
              border: `1px solid ${isFaceDetected ? "var(--surface-glass-border)" : "var(--high-border)"}`,
              borderRadius: "var(--radius-md)",
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}>
              Calibration Status:
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {status}
            </p>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 6 }}>
              <span>Baseline Sample Collection</span>
              <strong>{count} / {TOTAL_SAMPLES} ({progressPercent}%)</strong>
            </div>
            <div className="metric-bar-track" style={{ height: 12, borderRadius: 6 }}>
              <div
                className="metric-bar-fill"
                style={{
                  width: `${progressPercent}%`,
                  background: "var(--accent-gradient)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn" onClick={startCalibration} disabled={running} style={{ padding: "12px 24px" }}>
              {running ? `Capturing (${count}/${TOTAL_SAMPLES})...` : "▶ Begin Baseline Calibration"}
            </button>
          </div>

          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            <strong>💡 Quick Tips for Accurate Baseline:</strong>
            <ul style={{ paddingLeft: 18, marginTop: 4 }}>
              <li>Ensure even frontal lighting on your face.</li>
              <li>Relax your jaw and smooth your eyebrows naturally.</li>
              <li>Look directly at the screen without forcing a smile.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
