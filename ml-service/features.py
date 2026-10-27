"""
Biometric Feature Extraction Module
Extracts 3D facial landmark metrics and computes personalized baseline delta vectors
based on Facial Action Coding System (FACS) Action Units:
- AU4: Brow Lowerer / Corrugator supercilii (Brow-to-eye distance & inter-brow distance)
- AU7: Lid Tightener / Orbicularis oculi (Eye Aspect Ratio / Squinting)
- AU14/AU24: Lip Pressor & Tenseness (Mouth aspect ratio)
- Tension Asymmetry & Eye/Brow Bilateral Balance
"""
import math
import numpy as np

# Landmark indices (MediaPipe FaceMesh topology)
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]
LEFT_EYEBROW_INNER = 55
RIGHT_EYEBROW_INNER = 285
LEFT_EYE_TOP = 159
RIGHT_EYE_TOP = 386
MOUTH_LEFT = 61
MOUTH_RIGHT = 291
MOUTH_TOP = 13
MOUTH_BOTTOM = 14
LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263


def dist_2d(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def eye_aspect_ratio(pts, idx):
    p = [pts[i] for i in idx]
    vertical1 = dist_2d(p[1], p[5])
    vertical2 = dist_2d(p[2], p[4])
    horizontal = dist_2d(p[0], p[3])
    if horizontal == 0:
        return 0.0
    return (vertical1 + vertical2) / (2.0 * horizontal)


def extract_raw_features_from_pts(pts):
    """
    Extracts normalized facial metrics from 2D pixel coordinates of landmarks.
    """
    face_width = dist_2d(pts[LEFT_EYE_OUTER], pts[RIGHT_EYE_OUTER])
    if face_width <= 0:
        return None

    # 1. Brow-to-eye distance (AU4: Brow Lowerer)
    left_brow_eye = dist_2d(pts[LEFT_EYEBROW_INNER], pts[LEFT_EYE_TOP]) / face_width
    right_brow_eye = dist_2d(pts[RIGHT_EYEBROW_INNER], pts[RIGHT_EYE_TOP]) / face_width
    brow_eye_dist = (left_brow_eye + right_brow_eye) / 2.0
    brow_asymmetry = abs(left_brow_eye - right_brow_eye)

    # 2. Inter-eyebrow distance (AU4: Corrugator supercilii contraction)
    inter_brow_dist = dist_2d(pts[LEFT_EYEBROW_INNER], pts[RIGHT_EYEBROW_INNER]) / face_width

    # 3. Eye aspect ratio (AU7: Lid tightener / squinting)
    left_ear = eye_aspect_ratio(pts, LEFT_EYE)
    right_ear = eye_aspect_ratio(pts, RIGHT_EYE)
    ear = (left_ear + right_ear) / 2.0
    eye_asymmetry = abs(left_ear - right_ear)

    # 4. Mouth tension ratio (AU14 / AU24: Lip pressor & compression)
    mouth_w = dist_2d(pts[MOUTH_LEFT], pts[MOUTH_RIGHT])
    mouth_h = dist_2d(pts[MOUTH_TOP], pts[MOUTH_BOTTOM])
    mouth_ratio = mouth_w / mouth_h if mouth_h > 0 else 0.0

    # Baseline Heuristic Raw Index (for backward compatibility)
    raw = (
        (1 - min(brow_eye_dist / 0.35, 1)) * 35
        + (1 - min(inter_brow_dist / 0.9, 1)) * 25
        + (1 - min(ear / 0.35, 1)) * 20
        + min(mouth_ratio / 6.0, 1) * 20
    )
    raw_stress_index = round(max(0, min(100, raw)), 2)

    return {
        "browEyeDist": round(brow_eye_dist, 4),
        "interBrowDist": round(inter_brow_dist, 4),
        "eyeAspectRatio": round(ear, 4),
        "mouthTensionRatio": round(mouth_ratio, 4),
        "browAsymmetry": round(brow_asymmetry, 4),
        "eyeAsymmetry": round(eye_asymmetry, 4),
        "rawStressIndex": raw_stress_index,
    }


def compute_delta_feature_vector(current, baseline):
    """
    Computes the personalized deviation feature vector Δ = Current - Baseline.
    This relative encoding makes the ML model invariant to anatomical baseline variations.
    
    Feature Vector (8 dimensions):
    [
      delta_brow_eye,
      delta_inter_brow,
      delta_ear,
      delta_mouth_ratio,
      delta_brow_asymmetry,
      delta_eye_asymmetry,
      rel_brow_eye,
      rel_mouth_ratio
    ]
    """
    cur_brow = float(current.get("browEyeDist", 0.25))
    base_brow = float(baseline.get("brow_eye_dist", baseline.get("browEyeDist", 0.25)))
    d_brow = cur_brow - base_brow
    rel_brow = d_brow / base_brow if base_brow > 0 else 0.0

    cur_inter = float(current.get("interBrowDist", 0.65))
    base_inter = float(baseline.get("inter_brow_dist", baseline.get("interBrowDist", 0.65)))
    d_inter = cur_inter - base_inter

    cur_ear = float(current.get("eyeAspectRatio", 0.28))
    base_ear = float(baseline.get("eye_aspect_ratio", baseline.get("eyeAspectRatio", 0.28)))
    d_ear = cur_ear - base_ear

    cur_mouth = float(current.get("mouthTensionRatio", 3.0))
    base_mouth = float(baseline.get("mouth_tension_ratio", baseline.get("mouthTensionRatio", 3.0)))
    d_mouth = cur_mouth - base_mouth
    rel_mouth = d_mouth / base_mouth if base_mouth > 0 else 0.0

    cur_brow_asym = float(current.get("browAsymmetry", 0.02))
    base_brow_asym = float(baseline.get("brow_asymmetry", baseline.get("browAsymmetry", 0.02)))
    d_brow_asym = cur_brow_asym - base_brow_asym

    cur_eye_asym = float(current.get("eyeAsymmetry", 0.02))
    base_eye_asym = float(baseline.get("eye_asymmetry", baseline.get("eyeAsymmetry", 0.02)))
    d_eye_asym = cur_eye_asym - base_eye_asym

    vector = [
        d_brow,
        d_inter,
        d_ear,
        d_mouth,
        d_brow_asym,
        d_eye_asym,
        rel_brow,
        rel_mouth,
    ]
    return np.array(vector, dtype=np.float32)


FEATURE_NAMES = [
    "delta_brow_eye",
    "delta_inter_brow",
    "delta_ear",
    "delta_mouth_ratio",
    "delta_brow_asymmetry",
    "delta_eye_asymmetry",
    "rel_brow_eye",
    "rel_mouth_ratio",
]

FEATURE_LABELS = {
    "delta_brow_eye": "AU4 Brow Lowering (Δ)",
    "delta_inter_brow": "AU4 Corrugator Furrow (Δ)",
    "delta_ear": "AU7 Eye Squint / Tension (Δ)",
    "delta_mouth_ratio": "AU24 Lip Compression (Δ)",
    "delta_brow_asymmetry": "Brow Bilateral Asymmetry (Δ)",
    "delta_eye_asymmetry": "Eye Bilateral Asymmetry (Δ)",
    "rel_brow_eye": "Relative Brow Descent (%)",
    "rel_mouth_ratio": "Relative Lip Compression (%)",
}
