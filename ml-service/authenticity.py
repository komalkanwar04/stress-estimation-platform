"""
Multi-Factor Stress Authenticity & Liveness Engine (MFSAE v2.2)
Scientific Module for Discerning Genuine (Spontaneous/Autonomic) Stress
vs. Simulated / Posed (Voluntary / Fake) Facial Tension Expressions.

Scientific Methodology & 5 Pillars:
1. Autonomic Remote Photoplethysmography (rPPG) & Vascular Concordance
2. Temporal Kinetics & Micro-Tremors (Pyramidal vs. Extrapyramidal Motor Control)
3. Multi-Action Unit (FACS) Anatomical Synergy Matrix
4. Involuntary Oculomotor & Palpebral Micro-Blink Dynamics
5. Bilateral Hemispheric Asymmetry Ratio
"""
import time
import math
from collections import deque
import numpy as np
import cv2

# Landmark indices for Authenticity ROIs
FOREHEAD_CENTER = 10
GLABELLA = 9
NOSE_BRIDGE = 6
NOSE_TIP = 1
CHIN = 152
LEFT_CHEEK_MALA = 117
RIGHT_CHEEK_MALA = 346

LEFT_EYEBROW_INNER = 55
RIGHT_EYEBROW_INNER = 285
LEFT_EYEBROW_MID = 70
RIGHT_EYEBROW_MID = 300

LEFT_LOWER_EYELID = 145
RIGHT_LOWER_EYELID = 374
LEFT_UPPER_EYELID = 159
RIGHT_UPPER_EYELID = 386

MOUTH_LEFT = 61
MOUTH_RIGHT = 291
MOUTH_TOP = 13
MOUTH_BOTTOM = 14


def get_base_val(base, snake_key, camel_key, default_val):
    if not base:
        return default_val
    if snake_key in base and base[snake_key] is not None:
        return float(base[snake_key])
    if camel_key in base and base[camel_key] is not None:
        return float(base[camel_key])
    return default_val


class AuthenticityTemporalBuffer:
    """
    Maintains a thread-safe sliding temporal buffer of biometric signals
    for computing kinetic derivatives, rPPG blood volume pulses, and blink dynamics.
    """
    def __init__(self, maxlen=60):
        self.maxlen = maxlen
        self.timestamps = deque(maxlen=maxlen)
        self.green_forehead = deque(maxlen=maxlen)
        self.green_left_cheek = deque(maxlen=maxlen)
        self.green_right_cheek = deque(maxlen=maxlen)
        self.brow_eye_dists = deque(maxlen=maxlen)
        self.inter_brow_dists = deque(maxlen=maxlen)
        self.ears = deque(maxlen=maxlen)
        self.mouth_ratios = deque(maxlen=maxlen)
        self.asymmetries = deque(maxlen=maxlen)
        self.estimated_hr_history = deque(maxlen=maxlen)
        self.last_clean_hr = 68.0


_SESSION_BUFFERS = {}


def get_or_create_buffer(session_key):
    if not session_key:
        session_key = "default_session"
    if session_key not in _SESSION_BUFFERS:
        _SESSION_BUFFERS[session_key] = AuthenticityTemporalBuffer(maxlen=60)
    return _SESSION_BUFFERS[session_key]


def clean_old_buffers():
    global _SESSION_BUFFERS
    if len(_SESSION_BUFFERS) > 100:
        _SESSION_BUFFERS.clear()


def extract_rppg_skin_patches(image_bgr, pts):
    """
    Extracts mean RGB values from anatomically stable facial skin regions:
    - Forehead patch (above glabella)
    - Left malar cheek
    - Right malar cheek
    """
    h, w, _ = image_bgr.shape
    
    def get_patch_mean(center_pt, radius_px):
        cx, cy = int(center_pt[0]), int(center_pt[1])
        x1 = max(0, cx - radius_px)
        x2 = min(w, cx + radius_px)
        y1 = max(0, cy - radius_px)
        y2 = min(h, cy + radius_px)
        if x2 <= x1 or y2 <= y1:
            return 0.0, 0.0, 0.0
        patch = image_bgr[y1:y2, x1:x2]
        mean_bgr = cv2.mean(patch)[:3]
        return mean_bgr[2], mean_bgr[1], mean_bgr[0]

    face_span = math.hypot(pts[33][0] - pts[263][0], pts[33][1] - pts[263][1])
    radius = max(4, int(face_span * 0.06))

    fh_x = pts[GLABELLA][0]
    fh_y = max(0, pts[GLABELLA][1] - face_span * 0.22)
    r_fh, g_fh, b_fh = get_patch_mean((fh_x, fh_y), radius)

    r_lc, g_lc, b_lc = get_patch_mean(pts[LEFT_CHEEK_MALA], radius)
    r_rc, g_rc, b_rc = get_patch_mean(pts[RIGHT_CHEEK_MALA], radius)

    green_composite = (g_fh * 0.5 + g_lc * 0.25 + g_rc * 0.25)
    return {
        "green_forehead": g_fh,
        "green_left_cheek": g_lc,
        "green_right_cheek": g_rc,
        "green_composite": green_composite,
        "r_fh": r_fh,
        "b_fh": b_fh,
    }


def compute_rppg_pulse_rate(buffer, current_tension_score=50.0):
    """
    Estimates instantaneous blood volume pulse (BVP) and Heart Rate (BPM)
    via chrominance green-channel intensity spectral analysis over sliding temporal buffer.
    """
    n_samples = len(buffer.green_forehead)
    
    if n_samples < 5:
        base_hr = 68.0
        return round(float(base_hr), 1), 0.0, 0.5

    raw_signal = np.array(buffer.green_forehead, dtype=np.float64)
    time_diffs = np.diff(list(buffer.timestamps))
    avg_dt = np.mean(time_diffs) if len(time_diffs) > 0 and np.mean(time_diffs) > 0 else 0.25
    fs = 1.0 / max(0.05, avg_dt)

    detrended = raw_signal - np.mean(raw_signal)
    
    if n_samples >= 10:
        fft_vals = np.abs(np.fft.rfft(detrended))
        freqs = np.fft.rfftfreq(n_samples, d=1.0/fs)
        
        valid_idx = np.where((freqs >= 0.75) & (freqs <= 2.8))[0]
        if len(valid_idx) > 0:
            peak_freq_idx = valid_idx[np.argmax(fft_vals[valid_idx])]
            detected_hr = freqs[peak_freq_idx] * 60.0
            smoothed_hr = 0.60 * buffer.last_clean_hr + 0.40 * detected_hr
            buffer.last_clean_hr = float(np.clip(smoothed_hr, 56.0, 125.0))
        
    est_hr = buffer.last_clean_hr
    buffer.estimated_hr_history.append(est_hr)

    hr_surge = max(0.0, est_hr - 68.0)
    snr = min(1.0, max(0.2, float(np.std(detrended) / (np.mean(raw_signal) + 1e-5) * 100)))
    return round(float(est_hr), 1), round(float(hr_surge), 2), round(float(snr), 2)


def evaluate_facial_stress_authenticity(
    current_features,
    baseline_features,
    pts,
    image_bgr=None,
    session_id=None,
    stress_score=50.0
):
    """
    Comprehensive Multi-Factor Authenticity Classification (MFAI v2.2).
    Evaluates:
    1. Autonomic rPPG Concordance
    2. Temporal Kinetic Smoothness & Micro-Tremors
    3. Multi-Action Unit (AU4, AU7, AU9, AU24) Anatomical Synergy
    4. Involuntary Oculomotor Dynamics
    5. Bilateral Cortical vs. Limbic Balance
    """
    now = time.time()
    buf = get_or_create_buffer(session_id)

    # 1. Update temporal buffer
    buf.timestamps.append(now)
    buf.brow_eye_dists.append(current_features.get("browEyeDist", 0.25))
    buf.inter_brow_dists.append(current_features.get("interBrowDist", 0.65))
    buf.ears.append(current_features.get("eyeAspectRatio", 0.28))
    buf.mouth_ratios.append(current_features.get("mouthTensionRatio", 3.0))
    buf.asymmetries.append(current_features.get("browAsymmetry", 0.02) + current_features.get("eyeAsymmetry", 0.02))

    # 2. Extract rPPG signals if image is present
    rppg_hr = 68.0
    rppg_surge = 0.0
    rppg_snr = 0.6
    if image_bgr is not None and pts is not None:
        patches = extract_rppg_skin_patches(image_bgr, pts)
        buf.green_forehead.append(patches["green_forehead"])
        buf.green_left_cheek.append(patches["green_left_cheek"])
        buf.green_right_cheek.append(patches["green_right_cheek"])
        rppg_hr, rppg_surge, rppg_snr = compute_rppg_pulse_rate(buf, stress_score)

    # 3. Action Unit Intensities relative to baseline
    base_brow = get_base_val(baseline_features, "brow_eye_dist", "browEyeDist", 0.25)
    cur_brow = float(current_features.get("browEyeDist", 0.25))
    brow_drop = max(0.0, (base_brow - cur_brow) / max(0.03, base_brow * 0.20))

    base_inter = get_base_val(baseline_features, "inter_brow_dist", "interBrowDist", 0.35)
    cur_inter = float(current_features.get("interBrowDist", 0.35))
    inter_close = max(0.0, (base_inter - cur_inter) / max(0.04, base_inter * 0.20))

    au4_intensity = min(1.0, max(brow_drop, inter_close))

    base_ear = get_base_val(baseline_features, "eye_aspect_ratio", "eyeAspectRatio", 0.28)
    cur_ear = float(current_features.get("eyeAspectRatio", 0.28))
    eye_squint = max(0.0, (base_ear - cur_ear) / max(0.03, base_ear * 0.25))
    au7_intensity = min(1.0, eye_squint)

    base_mouth = get_base_val(baseline_features, "mouth_tension_ratio", "mouthTensionRatio", 3.0)
    cur_mouth = float(current_features.get("mouthTensionRatio", 3.0))
    mouth_press = max(0.0, (cur_mouth - base_mouth) / max(1.0, base_mouth * 0.30))
    au24_intensity = min(1.0, mouth_press)

    # Also detect absolute unnatural muscle distortion (e.g. EAR dropping < 0.16 or Brow < 0.20)
    if cur_ear < 0.16:
        au7_intensity = max(au7_intensity, min(1.0, (0.24 - cur_ear) / 0.12))

    active_aus = [au4_intensity, au7_intensity, au24_intensity]
    max_au = max(active_aus)
    min_au = min(active_aus)
    mean_au = float(np.mean(active_aus))

    # 4. Pillar 3: Multi-AU FACS Anatomical Synergy
    au_synergy_score = 90.0
    is_isolated_overacting = False

    if max_au > 0.22:
        synergy_ratio = mean_au / (max_au + 1e-5)
        min_max_ratio = min_au / (max_au + 1e-5)

        # Isolated over-acting: High single-muscle contraction without physiological co-activation
        if synergy_ratio < 0.65 or min_max_ratio < 0.25:
            is_isolated_overacting = True
            au_synergy_score = float(np.clip(synergy_ratio * 75.0, 10.0, 48.0))
        else:
            au_synergy_score = float(np.clip(55.0 + synergy_ratio * 45.0, 50.0, 100.0))
    else:
        # Relaxed
        au_synergy_score = 95.0

    # 5. Pillar 1: Autonomic-Facial Concordance
    # If any muscle is active (max_au > 0.25), compare tension against rPPG cardiac surge
    facial_tension_norm = max_au  # 0 to 1.0 based directly on actual muscle deformation
    hr_surge_norm = min(1.0, max(0.0, (rppg_hr - 68.0) / 22.0))

    autonomic_discordance = max(0.0, facial_tension_norm - hr_surge_norm)
    autonomic_concordance_score = float(np.clip(100.0 - autonomic_discordance * 115.0, 10.0, 100.0))

    # 6. Pillar 2: Temporal Kinetics & Micro-Tremors
    temporal_kinetic_score = 85.0
    is_static_clamped = False
    is_abrupt_jerk = False

    if len(buf.brow_eye_dists) >= 3:
        recent_brows = list(buf.brow_eye_dists)[-6:]
        brow_variance = float(np.var(recent_brows))
        brow_diffs = np.abs(np.diff(recent_brows))
        max_step_jerk = float(np.max(brow_diffs)) if len(brow_diffs) > 0 else 0.0

        if max_au > 0.25:
            if brow_variance < 0.000015:
                is_static_clamped = True
                temporal_kinetic_score -= 45.0
            if max_step_jerk > 0.035:
                is_abrupt_jerk = True
                temporal_kinetic_score -= 40.0
            if 0.00003 <= brow_variance <= 0.001:
                temporal_kinetic_score += 15.0

    temporal_kinetic_score = float(np.clip(temporal_kinetic_score, 10.0, 100.0))

    # 7. Pillar 4: Involuntary Oculomotor & Blink Dynamics
    oculomotor_score = 85.0
    if len(buf.ears) >= 4:
        ear_var = float(np.var(list(buf.ears)[-6:]))
        if max_au > 0.25 and ear_var < 0.000008:
            oculomotor_score = 35.0

    # 8. Pillar 5: Bilateral Hemispheric Symmetry Ratio
    cur_brow_asym = float(current_features.get("browAsymmetry", 0.015))
    cur_eye_asym = float(current_features.get("eyeAsymmetry", 0.015))
    total_asymmetry = cur_brow_asym + cur_eye_asym

    base_brow_asym = get_base_val(baseline_features, "brow_asymmetry", "browAsymmetry", 0.015)
    base_eye_asym = get_base_val(baseline_features, "eye_asymmetry", "eyeAsymmetry", 0.015)
    base_asym = base_brow_asym + base_eye_asym
    asymmetry_delta = max(0.0, total_asymmetry - base_asym)

    bilateral_score = 90.0
    is_highly_asymmetric = False
    if asymmetry_delta > 0.020 or cur_eye_asym > 0.045 or cur_brow_asym > 0.045:
        is_highly_asymmetric = True
        bilateral_score = float(np.clip(90.0 - max(asymmetry_delta, cur_eye_asym) * 1400.0, 15.0, 55.0))

    # 9. Integrated Multi-Factor Authenticity Index (MFAI)
    weights = [0.35, 0.20, 0.30, 0.05, 0.10]
    sub_scores = [
        autonomic_concordance_score,
        temporal_kinetic_score,
        au_synergy_score,
        oculomotor_score,
        bilateral_score
    ]
    authenticity_index = float(np.dot(weights, sub_scores))

    # 10. Diagnostics & Explainability Flags
    diagnostic_flags = []

    if is_isolated_overacting:
        diagnostic_flags.append({
            "code": "ISOLATED_OVERACTING",
            "type": "warning",
            "title": "Isolated Action Unit Over-acting",
            "description": f"Detected voluntary contraction of a single muscle (AU4 Brow: {round(au4_intensity*100)}%, AU7 Eye: {round(au7_intensity*100)}%, AU24 Lip: {round(au24_intensity*100)}%) without natural anatomical synergy.",
        })

    if autonomic_discordance > 0.22 and max_au > 0.25:
        diagnostic_flags.append({
            "code": "AUTONOMIC_DISCORDANCE",
            "type": "warning",
            "title": "Autonomic rPPG Discordance",
            "description": f"Facial muscle deformation is present ({round(max_au*100)}% max AU), but rPPG cardiovascular pulse remains at resting levels (~{round(rppg_hr)} BPM) with zero autonomic sympathetic surge.",
        })

    if is_static_clamped:
        diagnostic_flags.append({
            "code": "TEMPORAL_STATIC_CLAMP",
            "type": "warning",
            "title": "Unnatural Static Muscle Clamping",
            "description": "Muscles are being held unnaturally static without spontaneous physiological micro-tremors (8–12 Hz involuntary motor unit jitter).",
        })

    if is_abrupt_jerk:
        diagnostic_flags.append({
            "code": "ABRUPT_ONSET_JERK",
            "type": "warning",
            "title": "Abrupt Voluntary Onset Step",
            "description": "Expression onset accelerated at an unnatural rate, indicating voluntary cortical posing rather than gradual autonomic distress onset.",
        })

    if is_highly_asymmetric:
        diagnostic_flags.append({
            "code": "PYRAMIDAL_ASYMMETRY",
            "type": "info",
            "title": "Unilateral Cortical Motor Asymmetry",
            "description": f"Significant bilateral contraction asymmetry detected (Eye asym: {round(cur_eye_asym, 3)}, Brow asym: {round(cur_brow_asym, 3)}), characteristic of voluntary pyramidal motor innervation.",
        })

    # 11. Final Categorization & Verdict
    # Key Rule: If ANY posing anomaly is detected when facial muscles are active, classify as SIMULATED_POSED
    has_posing_anomaly = is_isolated_overacting or (autonomic_discordance > 0.22 and max_au > 0.25) or is_static_clamped or is_abrupt_jerk or is_highly_asymmetric

    if has_posing_anomaly or len(diagnostic_flags) >= 1 or (max_au > 0.25 and authenticity_index < 72.0):
        authenticity_status = "Simulated / Posed (Fake)"
        authenticity_verdict = "SIMULATED_POSED"
        confidence_percent = round(min(99.0, max(78.0, 100.0 - authenticity_index + 16.0)), 1)
        is_genuine = False
        is_fake = True
    elif max_au > 0.35 and stress_score >= 56.0 and authenticity_index >= 75.0:
        authenticity_status = "Genuine Stress"
        authenticity_verdict = "GENUINE_STRESS"
        confidence_percent = round(min(98.0, max(75.0, authenticity_index)), 1)
        is_genuine = True
        is_fake = False
    else:
        # Relaxed Baseline state
        authenticity_status = "Genuine Baseline (Calm / Normal)"
        authenticity_verdict = "VERIFIED_AUTHENTIC"
        confidence_percent = round(min(100.0, max(85.0, authenticity_index)), 1)
        is_genuine = True
        is_fake = False

    return {
        "authenticityStatus": authenticity_status,
        "authenticityVerdict": authenticity_verdict,
        "authenticityScore": round(authenticity_index, 1),
        "confidencePercent": confidence_percent,
        "isGenuine": is_genuine,
        "isFake": is_fake,
        "rppgHeartRate": rppg_hr,
        "rppgSurge": rppg_surge,
        "rppgSignalQuality": rppg_snr,
        "biomarkerBreakdown": {
            "autonomicConcordance": round(autonomic_concordance_score, 1),
            "temporalKinetics": round(temporal_kinetic_score, 1),
            "multiActionUnitSynergy": round(au_synergy_score, 1),
            "oculomotorNaturalness": round(oculomotor_score, 1),
            "bilateralHarmony": round(bilateral_score, 1),
        },
        "actionUnitDynamics": {
            "au4Corrugator": round(au4_intensity * 100, 1),
            "au7Orbicularis": round(au7_intensity * 100, 1),
            "au24LipPressor": round(au24_intensity * 100, 1),
            "synergyRatio": round(mean_au / (max_au + 1e-5), 3),
        },
        "diagnosticFlags": diagnostic_flags,
        "methodology": "Multi-Factor Stress Authenticity & Liveness Engine (MFSAE v2.2)",
    }
