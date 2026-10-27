# Hybrid Personalized Stress Estimation: Machine Learning Evaluation Report

## 1. Overview & Methodology
The MindPulse Hybrid Stress Estimation model blends **Computer Vision Landmark Extraction** with **Personalized Physiological Normalization (Δ = f_current - f_baseline)** and a **Trained Machine Learning Ensemble**.

By training the model on relative Action Unit deviations rather than absolute coordinates, the system is robust against differences in baseline facial morphology, demographic variations, and subtle webcam angles.

- **Trained Model**: `Random Forest Ensemble`
- **Training Timestamp**: `2026-09-26T13:33:09.974822Z`
- **Input Dimensions**: 8 biometric Action Unit deviation features
- **Dataset Size**: 8,400 synthesized FACS-grounded samples across 140 subjects

---

## 2. Test Set Performance Metrics

| Metric | Score | Percentage |
| :--- | :--- | :--- |
| **Accuracy** | `0.9464` | **94.64%** |
| **Balanced Accuracy** | `0.9467` | **94.67%** |
| **Macro F1-Score** | `0.9466` | **94.66%** |
| **Weighted F1-Score** | `0.9465` | **94.65%** |
| **Macro Precision** | `0.9467` | **94.67%** |
| **Macro Recall** | `0.9467` | **94.67%** |
| **Multi-Class ROC-AUC (OvR)** | `0.9955` | **99.55%** |

---

## 3. Per-Class Precision, Recall & F1

| Class Label | Precision | Recall | F1-Score |
| :--- | :--- | :--- | :--- |
| **Calm** | 0.9141 | 0.8907 | **0.9022** |
| **Normal (near baseline)** | 0.8871 | 0.9128 | **0.8998** |
| **Elevated Tension** | 0.9951 | 0.9879 | **0.9915** |
| **High Tension** | 0.9906 | 0.9953 | **0.9930** |

---

## 4. Facial Action Unit Feature Importances

The Random Forest ensemble automatically learned the following Gini feature importance ranking:

- **AU4 Corrugator Furrow (Δ)**: `27.0%` (Importance: 0.27)
- **AU24 Lip Compression (Δ)**: `17.55%` (Importance: 0.1755)
- **AU7 Eye Squint / Tension (Δ)**: `14.82%` (Importance: 0.1482)
- **AU4 Brow Lowering (Δ)**: `13.15%` (Importance: 0.1315)
- **Relative Lip Compression (%)**: `12.35%` (Importance: 0.1235)
- **Relative Brow Descent (%)**: `10.52%` (Importance: 0.1052)
- **Brow Bilateral Asymmetry (Δ)**: `3.08%` (Importance: 0.0308)
- **Eye Bilateral Asymmetry (Δ)**: `1.52%` (Importance: 0.0152)

---

## 5. Candidate Model Comparison (5-Fold Stratified CV)

| Model Candidate | 5-Fold Macro F1 | Std Deviation |
| :--- | :--- | :--- |
| **Random Forest Ensemble** | `0.9553` | `±0.0022` |
| **Gradient Boosting (GBM)** | `0.9523` | `±0.0029` |
| **Support Vector Machine (RBF)** | `0.9587` | `±0.0022` |
| **Multi-Layer Perceptron (MLP)** | `0.9569` | `±0.0029` |

---

## 6. Confusion Matrix

```
Predicted ->   Calm    Normal    Elevated    High
Actual
Calm           383     47        0           0
Normal         36      377       0           0
Elevated       0       1         407         4
High           0       0         2           423
```
