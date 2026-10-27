import React from "react";

export default function Navbar({
  user,
  hasBaseline,
  activeTab,
  setActiveTab,
  onOpenProfileSwitcher,
  theme,
  toggleTheme,
}) {
  return (
    <nav className="navbar">
      <div className="brand">
        <div className="brand-icon">🌿</div>
        <div>
          <h1 className="brand-title">MindPulse</h1>
          <p className="brand-subtitle">Personalized Biometric Stress Platform</p>
        </div>
      </div>

      {user && (
        <div className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => setActiveTab("sessions")}
          >
            <span>📜</span> Session Logs
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "breathwork" ? "active" : ""}`}
            onClick={() => setActiveTab("breathwork")}
          >
            <span>🫁</span> Breathwork Coach
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span>👤</span> Profile & Analytics
          </button>
        </div>
      )}

      <div className="nav-actions">
        {user && (
          <div
            className="user-chip"
            onClick={onOpenProfileSwitcher}
            title="Click to switch profile or edit goals"
          >
            <span className="user-avatar-sm">{user.avatar || "🌿"}</span>
            <span className="user-name-sm">{user.name}</span>
            <span
              className={`baseline-indicator-dot ${hasBaseline ? "" : "missing"}`}
              title={hasBaseline ? "Personal Baseline Active" : "Baseline Not Calibrated"}
            />
          </div>
        )}

        <button
          className="btn-icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}
