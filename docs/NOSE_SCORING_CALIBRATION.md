# Nose Scoring Calibration Report (v2.3)

## 1. Problem Statement
The nose analysis scoring system suffers from "Score Inflation". Despite accurate geometric calculations, the final scores are numerically too high compared to human perception of "crookedness".
Even noses with visible deviation (Case 3) are receiving "Good" scores (6.7 - 7.3), whereas the user assesses them as "Defective" (4.5 max).

### User Feedback & Strict Targets
The user has defined precise score ranges for 3 specific test cases:

| Case | Key Defect (Deviation) | User Target Score | Why? |
| :--- | :--- | :--- | :--- |
| **Case 1** | **~3.4 - 5.3%** | **6.0 - 7.0** | Visible but mild. "Kusurlu ama 8 alacak kadar iyi değil." |
| **Case 2** | **~3.8 - 4.0%** | **5.0 - 6.0** | More noticeable. Should be clearly lower than Case 1. |
| **Case 3** | **~4.0 - 5.0%** | **4.0 - 5.0** | "Bu burun max 4.5 almalı." Significant deviation needs heavy penalty. |

---

## 2. Attempt History & Results

### Attempt 1: Smooth Scoring (Linear Interpolation)
**Logic:** Moved from hard cutoffs (if < 3.5 return 8) to a single linear decay.
**Result:** **FAILED**. The decay was too slow. It treated 3.4% and 3.8% too similarly.
- Case 1: ~7.2 (Acceptable)
- Case 3: ~6.0 (Too High - Target 4.5)

### Attempt 2: Dual-Slope Scoring (Segmented)
**Logic:** Introduced a "pivot point" to make the score crash after 3.5% deviation.
*   Zone 1 (0-3.5%): Score 10 → 6.5
*   Zone 2 (3.5-6.0%): Score 6.5 → 3.0 (Steep Drop)

**Result:** **FAILED**. Scores remained inflated, primarily because the **Weighted Average** calculation (Overall Score) dilutes the penalty. Even if `Tip Score` drops to 5.7, high scores in Nostril/Depth/Proportion pull the average back up to ~6.7.

**Observed Data (Latest Run):**

| Case | Tip Deviation Ratio | Tip Score | Combined Rotation | Rotation Score | **OVERALL SCORE** | **TARGET** | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Case 1** | 5.31% (Changed?) | 4.0 | 3.31° | 7.3 | **6.2** | 6.0 - 7.0 | ✅ PASS |
| **Case 2** | 3.95% | 5.9 | 5.31° | 5.4 | **6.7** | 5.0 - 6.0 | ❌ FAIL (High) |
| **Case 3** | 4.05% | 5.7 | 4.02° | 6.5 | **6.7** | Max 4.5 | ❌ **CRITICAL FAIL** |

### Analysis of Failure (Case 3)
Why did Case 3 get **6.7** when target is **< 4.5**?
1.  **Metric Stability:** The input image analysis seems to vary (Tip deviation changed between runs).
2.  **Rotation "Forgiveness":** Combined Rotation was 4.02°. Our Pivot was 4.0°. So it barely entered the penalty zone, scoring **6.5** (Pivot Score). It should have been punished harder.
3.  **Averaging Problem:**
    *   Tip Score: 5.7 (Poor)
    *   Rotation Score: 6.5 (Mediocre)
    *   Nostril Score: 8.3 (Good)
    *   Depth Score: 8.0 (Good)
    *   **Average:** (5.7 * 0.4) + (6.5 * 0.3) + (8.3 * 0.2) + (8.0 * 0.1) = **6.7**

**Conclusion:** A simple weighted average is flawed. If the Tip Deviation is bad, the nose is bad. "Great Nostrils" shouldn't save a "Crooked Nose" score.


