const ML_SERVICE_URL = "http://localhost:5001";
const BACKEND_URL = "http://localhost:4000";

export async function analyzeFrame(imageBase64, baseline = null, sessionId = null) {
  const res = await fetch(`${ML_SERVICE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64, baseline, sessionId }),
  });
  return res.json();
}

export async function getUsers() {
  const res = await fetch(`${BACKEND_URL}/api/users`);
  return res.json();
}

export async function createOrGetUser(profileData) {
  const body = typeof profileData === "string" ? { name: profileData } : profileData;
  const res = await fetch(`${BACKEND_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getUserProfile(userId) {
  const res = await fetch(`${BACKEND_URL}/api/users/${userId}`);
  return res.json();
}

export async function updateUserProfile(userId, data) {
  const res = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitBaselineSample(userId, features) {
  const res = await fetch(`${BACKEND_URL}/api/baseline/sample`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, features }),
  });
  return res.json();
}

export async function finalizeBaseline(userId) {
  const res = await fetch(`${BACKEND_URL}/api/baseline/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function getBaseline(userId) {
  const res = await fetch(`${BACKEND_URL}/api/baseline/${userId}`);
  return res.json();
}

export async function resetBaseline(userId) {
  const res = await fetch(`${BACKEND_URL}/api/baseline/${userId}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function startSession(userId, sessionType = "live_monitoring", title) {
  const res = await fetch(`${BACKEND_URL}/api/sessions/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, sessionType, title }),
  });
  return res.json();
}

export async function endSession(sessionId, userNotes) {
  const res = await fetch(`${BACKEND_URL}/api/sessions/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, userNotes }),
  });
  return res.json();
}

export async function getSessions(userId) {
  const res = await fetch(`${BACKEND_URL}/api/sessions/${userId}`);
  return res.json();
}

export async function getSessionDetail(sessionId) {
  const res = await fetch(`${BACKEND_URL}/api/sessions/detail/${sessionId}`);
  return res.json();
}

export async function updateSessionRecommendations(sessionId, completedRecommendations, userNotes) {
  const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/recommendations`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completedRecommendations, userNotes }),
  });
  return res.json();
}

export async function estimateStress(userId, features, sessionId = null, authenticity = null) {
  const res = await fetch(`${BACKEND_URL}/api/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, features, sessionId, authenticity }),
  });
  return res.json();
}

export async function getHistory(userId, limit = 50) {
  const res = await fetch(`${BACKEND_URL}/api/history/${userId}?limit=${limit}`);
  return res.json();
}

export async function getStats(userId) {
  const res = await fetch(`${BACKEND_URL}/api/stats/${userId}`);
  return res.json();
}

export async function getModelInfo() {
  const res = await fetch(`${BACKEND_URL}/api/model-info`);
  return res.json();
}

export async function getAuthenticityInfo() {
  const res = await fetch(`${BACKEND_URL}/api/authenticity-info`);
  return res.json();
}

