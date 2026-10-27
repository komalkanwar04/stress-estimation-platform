import React, { useState, useEffect, useRef } from "react";

const TECHNIQUES = {
  "4-7-8": {
    name: "4-7-8 Relaxing Breath",
    description: "Stimulates the vagus nerve and switches the body into parasympathetic recovery mode.",
    phases: [
      { name: "Inhale", duration: 4, action: "inhale" },
      { name: "Hold", duration: 7, action: "hold" },
      { name: "Exhale", duration: 8, action: "exhale" },
    ],
  },
  box: {
    name: "Box Breathing (4-4-4-4)",
    description: "Equal-ratio square breathing used by peak performers to reset stress and sharpen focus.",
    phases: [
      { name: "Inhale", duration: 4, action: "inhale" },
      { name: "Hold", duration: 4, action: "hold" },
      { name: "Exhale", duration: 4, action: "exhale" },
      { name: "Hold", duration: 4, action: "hold" },
    ],
  },
  "4-6": {
    name: "4-6 HRV Calming Breath",
    description: "Extended exhalation protocol to slow heart rate and release immediate muscle tension.",
    phases: [
      { name: "Inhale", duration: 4, action: "inhale" },
      { name: "Exhale", duration: 6, action: "exhale" },
    ],
  },
};

export default function BreathworkStudio({ initialTechnique = "4-7-8", onPostCheckin }) {
  const [techKey, setTechKey] = useState(initialTechnique);
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [audioMuted, setAudioMuted] = useState(false);

  const activeTech = TECHNIQUES[techKey] || TECHNIQUES["4-7-8"];
  const currentPhase = activeTech.phases[phaseIndex] || activeTech.phases[0];

  // Sound generator using Web Audio API
  const playChime = (freq = 440, type = "sine") => {
    if (audioMuted) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  useEffect(() => {
    let timer;
    if (isActive) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Next phase
            const nextIndex = (phaseIndex + 1) % activeTech.phases.length;
            if (nextIndex === 0) {
              setCyclesCompleted((c) => c + 1);
            }
            setPhaseIndex(nextIndex);
            const nextDuration = activeTech.phases[nextIndex].duration;

            // Trigger acoustic cue based on phase
            if (activeTech.phases[nextIndex].action === "inhale") playChime(528, "sine");
            else if (activeTech.phases[nextIndex].action === "exhale") playChime(396, "sine");
            else playChime(440, "triangle");

            return nextDuration;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phaseIndex, activeTech, audioMuted]);

  function startSession() {
    setPhaseIndex(0);
    setSecondsLeft(activeTech.phases[0].duration);
    setCyclesCompleted(0);
    setIsActive(true);
    playChime(528, "sine");
  }

  function stopSession() {
    setIsActive(false);
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">🫁 Guided Breathwork Studio</h2>
          <p className="card-subtitle">
            Regulate autonomic nervous system tone and reduce facial muscle tension through paced respiration.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-icon"
            onClick={() => setAudioMuted(!audioMuted)}
            title={audioMuted ? "Unmute Chimes" : "Mute Chimes"}
          >
            {audioMuted ? "🔇" : "🔔"}
          </button>
        </div>
      </div>

      {/* Technique Selector */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {Object.entries(TECHNIQUES).map(([key, tech]) => (
          <button
            key={key}
            onClick={() => {
              if (isActive) stopSession();
              setTechKey(key);
            }}
            className={`btn ${techKey === key ? "" : "btn-secondary"}`}
            style={{ fontSize: "0.8125rem", padding: "8px 14px" }}
          >
            {tech.name}
          </button>
        ))}
      </div>

      <div className="breathwork-container">
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: 500, marginBottom: 20 }}>
          {activeTech.description}
        </p>

        {/* Pulsing Breathing Bubble Visualizer */}
        <div
          className={`breathing-orb-wrapper ${
            isActive ? `breathing-${currentPhase.action}` : ""
          }`}
        >
          <div className="breathing-orb-outer" />
          <div className="breathing-orb-core">
            <div className="breathing-phase-text">
              {isActive ? currentPhase.name : "Ready"}
            </div>
            <div className="breathing-counter">
              {isActive ? secondsLeft : "—"}
            </div>
          </div>
        </div>

        {/* Controls & Statistics */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {!isActive ? (
            <button className="btn" onClick={startSession} style={{ minWidth: 160, padding: "12px 24px" }}>
              ▶ Start Guided Session
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={stopSession} style={{ minWidth: 160, padding: "12px 24px" }}>
              ⏹ Stop Breathing
            </button>
          )}

          {cyclesCompleted > 0 && onPostCheckin && (
            <button
              className="btn btn-secondary"
              onClick={onPostCheckin}
              style={{ borderColor: "var(--calm)", color: "var(--calm)" }}
            >
              📊 Check Stress Post-Breathing
            </button>
          )}
        </div>

        <div style={{ marginTop: 24, fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Cycles Completed: <strong style={{ color: "var(--text-primary)" }}>{cyclesCompleted}</strong> • Phase:{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {isActive ? `${phaseIndex + 1} of ${activeTech.phases.length}` : "Idle"}
          </strong>
        </div>
      </div>
    </div>
  );
}
