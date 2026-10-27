import React, { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile, resetBaseline, getUsers } from "../api.js";

const AVATAR_OPTIONS = ["🌿", "🧘‍♂️", "🧘‍♀️", "🧠", "🌊", "⚡", "🌸", "🪐", "💎", "🦉", "🦊", "🕊️", "🍵", "⛰️", "🌙", "🎨"];

export default function ProfileManager({
  user,
  onUserUpdated,
  onRecalibrateBaseline,
  onSwitchUser,
}) {
  const [profileData, setProfileData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    avatar: "🌿",
    bio: "",
    wellness_goal: "",
    target_daily_checkins: 3,
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await getUserProfile(user.id);
      setProfileData(res);
      setFormData({
        name: res.user.name || "",
        avatar: res.user.avatar || "🌿",
        bio: res.user.bio || "",
        wellness_goal: res.user.wellness_goal || "",
        target_daily_checkins: res.user.target_daily_checkins || 3,
        email: res.user.email || "",
      });

      const usersList = await getUsers();
      setAllUsers(usersList.users || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, [user.id]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateUserProfile(user.id, formData);
      if (res.ok) {
        setIsEditing(false);
        onUserUpdated(res.user);
        loadProfile();
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  async function handleResetBaseline() {
    if (window.confirm("Are you sure you want to reset your baseline? You will need to complete a fresh 10-sample calibration.")) {
      await resetBaseline(user.id);
      onRecalibrateBaseline();
    }
  }

  if (loading || !profileData) {
    return <div className="card" style={{ textAlign: "center", padding: 40 }}>Loading profile & analytics...</div>;
  }

  const { stats, baseline } = profileData;

  return (
    <div>
      {/* Profile Overview Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
              }}
            >
              {profileData.user.avatar || "🌿"}
            </div>
            <div>
              <h2 className="card-title" style={{ fontSize: "1.35rem" }}>
                {profileData.user.name}
              </h2>
              <p className="card-subtitle">{profileData.user.wellness_goal}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)} style={{ padding: "8px 16px" }}>
              {isEditing ? "Cancel" : "✏️ Edit Profile"}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowSwitchModal(true)} style={{ padding: "8px 16px" }}>
              🔄 Switch User
            </button>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Choose Profile Avatar:
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: emoji })}
                    style={{
                      fontSize: 22,
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      border: formData.avatar === emoji ? "2px solid var(--normal)" : "1px solid var(--surface-glass-border)",
                      background: formData.avatar === emoji ? "var(--normal-bg)" : "var(--surface-glass)",
                      cursor: "pointer",
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  Primary Wellness Focus / Goal
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.wellness_goal}
                  onChange={(e) => setFormData({ ...formData, wellness_goal: e.target.value })}
                  placeholder="e.g. Maintain Calm & Steady Focus"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  Daily Check-in Target
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="input-field"
                  value={formData.target_daily_checkins}
                  onChange={(e) => setFormData({ ...formData, target_daily_checkins: parseInt(e.target.value, 10) || 3 })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                Personal Bio / Stress Context
              </label>
              <textarea
                className="input-field"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="What triggers or helps your stress levels?"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: 12 }}>
            <p>{profileData.user.bio || "No bio added yet. Click edit profile to add context."}</p>
          </div>
        )}
      </div>

      {/* Analytics & Stats Summary */}
      <div className="grid-2">
        <div className="card">
          <h3 className="card-title" style={{ fontSize: "1.05rem", marginBottom: 16 }}>
            📊 Lifetime Stress Analytics
          </h3>
          <div className="session-stat-grid" style={{ marginBottom: 16 }}>
            <div className="session-stat-item">
              <strong>{stats.totalSessions}</strong>
              Total Sessions
            </div>
            <div className="session-stat-item">
              <strong>{stats.totalReadings}</strong>
              Total Readings
            </div>
            <div className="session-stat-item">
              <strong>{stats.avgScore ? stats.avgScore.toFixed(1) : "—"}</strong>
              Lifetime Avg
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>
              Stress State Distribution:
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 2 }}>
                  <span style={{ color: "var(--calm)", fontWeight: 600 }}>Calm ({stats.calmPercentage}%)</span>
                  <span>{stats.calmPercentage}%</span>
                </div>
                <div className="metric-bar-track">
                  <div className="metric-bar-fill" style={{ width: `${stats.calmPercentage}%`, background: "var(--calm)" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 2 }}>
                  <span style={{ color: "var(--normal)", fontWeight: 600 }}>Normal ({stats.normalPercentage}%)</span>
                  <span>{stats.normalPercentage}%</span>
                </div>
                <div className="metric-bar-track">
                  <div className="metric-bar-fill" style={{ width: `${stats.normalPercentage}%`, background: "var(--normal)" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 2 }}>
                  <span style={{ color: "var(--elevated)", fontWeight: 600 }}>Elevated Tension ({stats.elevatedPercentage}%)</span>
                  <span>{stats.elevatedPercentage}%</span>
                </div>
                <div className="metric-bar-track">
                  <div className="metric-bar-fill" style={{ width: `${stats.elevatedPercentage}%`, background: "var(--elevated)" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 2 }}>
                  <span style={{ color: "var(--high)", fontWeight: 600 }}>High Tension ({stats.highPercentage}%)</span>
                  <span>{stats.highPercentage}%</span>
                </div>
                <div className="metric-bar-track">
                  <div className="metric-bar-fill" style={{ width: `${stats.highPercentage}%`, background: "var(--high)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Learned Baseline Diagnostics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: "1.05rem" }}>
              🎯 Personal Facial Baseline
            </h3>
            {baseline && (
              <button className="btn btn-secondary" onClick={handleResetBaseline} style={{ padding: "6px 12px", fontSize: "0.75rem" }}>
                Recalibrate
              </button>
            )}
          </div>

          {baseline ? (
            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 14 }}>
                Your baseline was computed across <strong>{baseline.sample_count} calibration samples</strong> on{" "}
                {new Date(baseline.finalized_at + "Z").toLocaleDateString()}.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "var(--surface-glass)", borderRadius: 6 }}>
                  <span>Brow-Eye Distance:</span>
                  <strong>{baseline.brow_eye_dist?.toFixed(4)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "var(--surface-glass)", borderRadius: 6 }}>
                  <span>Inter-Eyebrow Distance:</span>
                  <strong>{baseline.inter_brow_dist?.toFixed(4)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "var(--surface-glass)", borderRadius: 6 }}>
                  <span>Eye Aspect Ratio:</span>
                  <strong>{baseline.eye_aspect_ratio?.toFixed(4)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "var(--surface-glass)", borderRadius: 6 }}>
                  <span>Mouth Tension Ratio:</span>
                  <strong>{baseline.mouth_tension_ratio?.toFixed(4)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(16, 185, 129, 0.1)", borderRadius: 6, color: "var(--calm)" }}>
                  <span>Raw Stress Index Baseline:</span>
                  <strong>{baseline.raw_stress_index?.toFixed(2)} / 100</strong>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <p style={{ color: "var(--elevated)", fontSize: "0.875rem", marginBottom: 12 }}>
                ⚠️ No baseline calibrated yet for this user.
              </p>
              <button className="btn" onClick={onRecalibrateBaseline}>
                🎯 Run Baseline Calibration
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Switch User Modal */}
      {showSwitchModal && (
        <div className="modal-overlay" onClick={() => setShowSwitchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Switch User Profile</h3>
              <button className="btn-icon" onClick={() => setShowSwitchModal(false)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {allUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    onSwitchUser(u);
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
                        {u.hasBaseline ? "✅ Baseline Calibrated" : "⚠️ Calibration Needed"}
                      </div>
                    </div>
                  </div>
                  {u.id === user.id && <span style={{ color: "var(--normal)", fontSize: "0.8rem", fontWeight: 700 }}>Active</span>}
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--surface-glass-border)", paddingTop: 16 }}>
              <h4 style={{ fontSize: "0.85rem", marginBottom: 8, color: "var(--text-primary)" }}>
                + Create New Profile
              </h4>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="New profile name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
                <button
                  className="btn"
                  onClick={async () => {
                    if (!newUserName.trim()) return;
                    const res = await onSwitchUser({ name: newUserName.trim() });
                    setShowSwitchModal(false);
                    setNewUserName("");
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
