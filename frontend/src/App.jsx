import React, { useState, useEffect } from "react";
import { createOrGetUser, getUsers } from "./api.js";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import BaselineSetup from "./components/BaselineSetup.jsx";
import SessionsHistory from "./components/SessionsHistory.jsx";
import BreathworkStudio from "./components/BreathworkStudio.jsx";
import ProfileManager from "./components/ProfileManager.jsx";

const AVATARS = ["🌿", "🧘‍♂️", "🧘‍♀️", "🧠", "🌊", "⚡", "🌸", "🪐", "💎", "🦉", "🍵", "🎨"];

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("mindpulse_theme") || "dark");
  const [user, setUser] = useState(null);
  const [hasBaseline, setHasBaseline] = useState(false);
  const [baseline, setBaseline] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Onboarding / Login form states
  const [nameInput, setNameInput] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🌿");
  const [wellnessGoalInput, setWellnessGoalInput] = useState("Maintain Calm & Steady Focus");
  const [existingUsers, setExistingUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mindpulse_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Fetch initial users list for quick pick
  useEffect(() => {
    getUsers()
      .then((res) => {
        if (res.users && res.users.length > 0) {
          setExistingUsers(res.users);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  async function handleLoginOrSignup(profileData) {
    setLoading(true);
    try {
      const res = await createOrGetUser(profileData);
      setUser(res.user);
      setHasBaseline(res.hasBaseline);
      setBaseline(res.baseline || null);
      if (!res.hasBaseline) {
        setIsRecalibrating(true);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function handleBaselineComplete(newBaseline) {
    setBaseline(newBaseline);
    setHasBaseline(true);
    setIsRecalibrating(false);
    setActiveTab("dashboard");
  }

  return (
    <div className="app-container">
      {/* Navbar */}
      <Navbar
        user={user}
        hasBaseline={hasBaseline}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfileSwitcher={() => setShowSwitchModal(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Wellness & Disclaimer Banner */}
      <div className="disclaimer-banner">
        <span className="disclaimer-badge">Wellness Tool</span>
        <span>
          MindPulse estimates facial expression patterns relative to your individual learned baseline. For awareness and wellness support only — not a clinical medical diagnosis.
        </span>
      </div>

      {/* 1. Onboarding / User Selection Screen */}
      {!user && (
        <div className="card" style={{ maxWidth: 640, margin: "0 auto 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Welcome to MindPulse
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Personalized AI stress estimation calibrated to your unique facial expression baseline.
            </p>
          </div>

          {/* Quick Select Existing Profiles */}
          {existingUsers.length > 0 && (
            <div style={{ marginBottom: 28, background: "var(--surface-glass)", padding: 18, borderRadius: "var(--radius-md)", border: "1px solid var(--surface-glass-border)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Existing Profiles:
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {existingUsers.map((u) => (
                  <button
                    key={u.id}
                    className="btn btn-secondary"
                    onClick={() => handleLoginOrSignup({ name: u.name })}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px" }}
                  >
                    <span>{u.avatar || "🌿"}</span>
                    <span>{u.name}</span>
                    {u.hasBaseline && <span style={{ color: "var(--calm)", fontSize: 10 }}>●</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create or Resume Profile Form */}
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
              Create New or Enter Profile Name:
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Choose Your Avatar:
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    style={{
                      fontSize: 20,
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      border: selectedAvatar === emoji ? "2px solid var(--normal)" : "1px solid var(--surface-glass-border)",
                      background: selectedAvatar === emoji ? "var(--normal-bg)" : "var(--surface-glass)",
                      cursor: "pointer",
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Your name or handle (e.g. Alex)"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLoginOrSignup({ name: nameInput, avatar: selectedAvatar, wellness_goal: wellnessGoalInput })}
                />
              </div>
              <div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Wellness Goal (e.g. Maintain Calm & Focus)"
                  value={wellnessGoalInput}
                  onChange={(e) => setWellnessGoalInput(e.target.value)}
                />
              </div>
              <button
                className="btn"
                onClick={() => handleLoginOrSignup({ name: nameInput, avatar: selectedAvatar, wellness_goal: wellnessGoalInput })}
                disabled={loading || !nameInput.trim()}
                style={{ padding: "12px", width: "100%", marginTop: 6 }}
              >
                {loading ? "Loading..." : "Enter Workspace →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Step 1: Baseline Calibration Flow */}
      {user && (!hasBaseline || isRecalibrating) && (
        <BaselineSetup
          userId={user.id}
          onComplete={handleBaselineComplete}
        />
      )}

      {/* 3. Main Application Views (When calibrated) */}
      {user && hasBaseline && !isRecalibrating && (
        <>
          {activeTab === "dashboard" && (
            <Dashboard
              userId={user.id}
              baseline={baseline}
              onNavigateToBreathwork={() => setActiveTab("breathwork")}
            />
          )}

          {activeTab === "sessions" && (
            <SessionsHistory
              userId={user.id}
              onLaunchBreathing={() => setActiveTab("breathwork")}
            />
          )}

          {activeTab === "breathwork" && (
            <BreathworkStudio
              onPostCheckin={() => setActiveTab("dashboard")}
            />
          )}

          {activeTab === "profile" && (
            <ProfileManager
              user={user}
              onUserUpdated={(updated) => setUser(updated)}
              onRecalibrateBaseline={() => setIsRecalibrating(true)}
              onSwitchUser={async (u) => {
                await handleLoginOrSignup(u);
              }}
            />
          )}
        </>
      )}

      {/* Profile Switcher Modal from Navbar */}
      {showSwitchModal && user && (
        <div className="modal-overlay" onClick={() => setShowSwitchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Switch Active Profile</h3>
              <button className="btn-icon" onClick={() => setShowSwitchModal(false)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {existingUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    handleLoginOrSignup({ name: u.name });
                    setShowSwitchModal(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: u.id === user.id ? "var(--normal-bg)" : "var(--surface-glass)",
                    border: `1px solid ${u.id === user.id ? "var(--normal)" : "var(--surface-glass-border)"}`,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{u.avatar || "🌿"}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{u.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {u.hasBaseline ? "✅ Baseline Calibrated" : "⚠️ Needs Calibration"}
                      </div>
                    </div>
                  </div>
                  {u.id === user.id && <span style={{ color: "var(--normal)", fontSize: "0.8rem", fontWeight: 700 }}>Active</span>}
                </div>
              ))}
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setUser(null);
                setShowSwitchModal(false);
              }}
              style={{ width: "100%" }}
            >
              + Create or Switch to Different Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
