const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "data.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT,
    avatar TEXT DEFAULT '🌿',
    bio TEXT DEFAULT 'Focusing on mindful productivity & stress awareness',
    wellness_goal TEXT DEFAULT 'Maintain Calm & Steady Focus',
    target_daily_checkins INTEGER DEFAULT 3,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS baseline_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    brow_eye_dist REAL,
    inter_brow_dist REAL,
    eye_aspect_ratio REAL,
    mouth_tension_ratio REAL,
    raw_stress_index REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS baselines (
    user_id INTEGER PRIMARY KEY,
    brow_eye_dist REAL,
    inter_brow_dist REAL,
    eye_aspect_ratio REAL,
    mouth_tension_ratio REAL,
    raw_stress_index REAL,
    sample_count INTEGER,
    finalized_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_type TEXT DEFAULT 'live_monitoring',
    title TEXT,
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT,
    duration_seconds INTEGER DEFAULT 0,
    avg_stress_score REAL DEFAULT 50,
    peak_stress_score REAL DEFAULT 50,
    min_stress_score REAL DEFAULT 50,
    dominant_label TEXT DEFAULT 'Normal',
    reading_count INTEGER DEFAULT 0,
    recommendations_given TEXT DEFAULT '[]',
    completed_recommendations TEXT DEFAULT '[]',
    user_notes TEXT DEFAULT '',
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    raw_stress_index REAL,
    deviation REAL,
    stress_score REAL,
    stress_label TEXT,
    features_json TEXT,
    recommendations_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL
  );
`);

function ensureColumn(table, colName, colType) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = info.some((c) => c.name === colName);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${colName} ${colType}`);
  }
}

ensureColumn("users", "email", "TEXT");
ensureColumn("users", "avatar", "TEXT DEFAULT '🌿'");
ensureColumn("users", "bio", "TEXT DEFAULT 'Focusing on mindful productivity & stress awareness'");
ensureColumn("users", "wellness_goal", "TEXT DEFAULT 'Maintain Calm & Steady Focus'");
ensureColumn("users", "target_daily_checkins", "INTEGER DEFAULT 3");
ensureColumn("users", "updated_at", "TEXT");

ensureColumn("readings", "session_id", "INTEGER");
ensureColumn("readings", "features_json", "TEXT");
ensureColumn("readings", "recommendations_json", "TEXT");
ensureColumn("readings", "ml_probability", "REAL");
ensureColumn("readings", "ml_confidence", "REAL");
ensureColumn("readings", "feature_attributions_json", "TEXT");
ensureColumn("readings", "model_type", "TEXT");
ensureColumn("readings", "authenticity_status", "TEXT");
ensureColumn("readings", "authenticity_score", "REAL");
ensureColumn("readings", "authenticity_verdict", "TEXT");
ensureColumn("readings", "authenticity_json", "TEXT");
ensureColumn("readings", "rppg_heart_rate", "REAL");
ensureColumn("readings", "diagnostic_flags_json", "TEXT");

ensureColumn("sessions", "dominant_authenticity", "TEXT");
ensureColumn("sessions", "avg_authenticity_score", "REAL");
ensureColumn("sessions", "avg_rppg_heart_rate", "REAL");

// Populate any null updated_at with created_at
db.exec("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL");


module.exports = db;
