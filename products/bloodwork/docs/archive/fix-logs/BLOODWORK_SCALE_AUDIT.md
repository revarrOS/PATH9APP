# Bloodwork Data Sanity Audit

**Date:** 2026-02-01
**Status:** ⚠️ CRITICAL SCALE INCONSISTENCIES DETECTED
**Scope:** Read-only analysis of 7 blood tests (112 markers total)
**Purpose:** Identify unit/scale risks before implementing conversion logic

---

## Executive Summary

**CRITICAL FINDINGS:**

✅ **4 markers are CONSISTENT** across all tests
⚠️ **4 markers have SEVERE scale inconsistencies** (10x-100x magnitude differences)
⚠️ **3 markers have MODERATE inconsistencies** (possible confusion with percentages)
⚠️ **4 percentage markers** consistently stored as decimals (0.0-1.0 instead of 0-100%)

**ROOT CAUSE:** Different lab report formats and/or OCR extraction interpreting scales differently across test dates.

**IMPACT:** Current data contains silent scale corruption that could lead to:
- Incorrect trend visualization (showing 10x spikes/drops that don't exist)
- Misleading comparisons between tests
- User confusion and loss of trust
- Potential clinical misinterpretation if exported/shared

**RECOMMENDATION:** Implement scale normalization and validation BEFORE enabling trend visualization.

---

## Detailed Findings

### 🔴 CRITICAL: Severe Scale Inconsistencies (10x-100x differences)

These markers show statistically impossible variation (max/min ratio > 10) due to scale confusion:

#### 1. **RDW-CV (Red Cell Distribution Width - Coefficient of Variation)**

**Unit declared:** `%`
**Expected range:** 11-16%
**What we found:**

| Test Date | Value | Scale Issue |
|-----------|-------|-------------|
| May 29 - Nov 9 (5 tests) | 0.15 - 0.153 | ❌ Stored as decimal (÷100) |
| Dec 11 | 15.1 | ✅ Correct (percentage) |
| Jan 16 | 15.2 | ✅ Correct (percentage) |

**Statistics:**
- Min: 0.15 | Max: 15.2 | Ratio: **101.33x**
- Standard deviation: 7.32 (should be <2 for consistent scale)

**Why it's dangerous:**
- First 5 tests appear to show impossibly low RDW (0.15%)
- Last 2 tests show normal RDW (15%)
- Trends would show a fake "100x spike" between Nov and Dec

**Detection:** Automatically detectable (value < 1.0 in % field = decimal format)

---

#### 2. **HCT (Hematocrit)**

**Unit declared:** `%`
**Expected range:** 35-50%
**What we found:**

| Test Date | Value | Scale Issue |
|-----------|-------|-------------|
| May 29 - Nov 9 (5 tests) | 36.7 - 39.4 | ✅ Correct (percentage) |
| Dec 11 | 0.397 | ❌ Stored as decimal (÷100) |
| Jan 16 | 38.2 | ✅ Correct (percentage) |

**Statistics:**
- Min: 0.397 | Max: 39.4 | Ratio: **99.24x**
- Standard deviation: 14.28 (should be ~2-3 for consistent scale)

**Why it's dangerous:**
- Dec 11 appears to show critical HCT of 0.4% (life-threatening if real)
- Actual value is 39.7% (normal)
- One-off anomaly in middle of dataset makes automated detection harder

**Detection:** Automatically detectable (value < 1.0 in % field = decimal format)

---

#### 3. **MCHC (Mean Corpuscular Hemoglobin Concentration)**

**Unit declared:** `g/dL`
**Expected range:** 32-36 g/dL
**What we found:**

| Test Date | Value | Scale Issue |
|-----------|-------|-------------|
| May 29 - Nov 9 (5 tests) | 327 - 334 | ❌ Stored 10x too high |
| Dec 11 | 27.6 | ❌ Appears too low (anomalous) |
| Jan 16 | 33.5 | ✅ Correct |

**Statistics:**
- Min: 27.6 | Max: 334 | Ratio: **12.10x**
- Standard deviation: 146.53 (should be <2 for consistent scale)

**Why it's dangerous:**
- First 5 tests show impossible MCHC values (300+ g/dL)
- Real values likely 32.7-33.4 g/dL
- Dec 11 value (27.6) is also problematic - too low even for correct scale
- Only Jan 16 appears correct

**Detection:** Automatically detectable (value > 100 = multiply by 0.1)
**Complexity:** Dec 11 value (27.6) is ambiguous - might be data entry error or different scale

---

#### 4. **HGB (Hemoglobin)**

**Unit declared:** `g/dL`
**Expected range:** 12-18 g/dL
**What we found:**

| Test Date | Value | Scale Issue |
|-----------|-------|-------------|
| May 29 - Nov 9 (5 tests) | 120 - 137 | ❌ Stored 10x too high |
| Dec 11 | 13.3 | ✅ Correct |
| Jan 16 | 12.8 | ✅ Correct |

**Statistics:**
- Min: 12.8 | Max: 137 | Ratio: **10.70x**
- Standard deviation: 56.05 (should be <2 for consistent scale)

**Why it's dangerous:**
- First 5 tests show impossible HGB values (120-137 g/dL)
- Real values likely 12.0-13.7 g/dL
- Last 2 tests are correct
- Creates appearance of "10x drop" in hemoglobin

**Detection:** Automatically detectable (value > 20 = multiply by 0.1)

---

### 🟡 MODERATE: Possible Absolute/Percentage Confusion

These markers show 5-8x variation which could be clinical OR scale confusion:

#### 5. **NEUT (Neutrophils - Absolute Count)**

**Unit declared:** `10^9/L`
**Expected range:** 2.0-7.0 × 10^9/L
**What we found:**

| Test Date | Value | Appears Plausible? |
|-----------|-------|-------------------|
| May 29 | 2.7 | ✅ Yes |
| Jun 26 | 0.76 | ❌ Suspiciously low |
| Aug 6 | 0.759 | ❌ Suspiciously low |
| Sep 11 | 4.6 | ✅ Yes |
| Nov 9 | 4.6 | ✅ Yes |
| Dec 11 | 4.5 | ✅ Yes |
| Jan 16 | 0.751 | ❌ Suspiciously low |

**Statistics:**
- Min: 0.751 | Max: 4.6 | Ratio: **6.13x**
- Standard deviation: 1.91

**Why it's suspicious:**
- Values like 0.76, 0.759, 0.751 are unusually low for absolute counts
- These values look like **percentages stored as decimals** (76%, 75.9%, 75.1%)
- If we treat them as percentages and calculate absolutes from WBC:
  - Jun 26: WBC 4.6 × 0.76 = 3.5 (plausible)
  - Aug 6: WBC 3.7 × 0.759 = 2.8 (plausible)
  - Jan 16: WBC 4.5 × 0.751 = 3.4 (plausible)

**Hypothesis:** OCR/extraction confused NEUT absolute and NEUT% columns in some tests

**Detection:**
- Automatic: Flag if NEUT < 1.0 (likely percentage as decimal)
- Contextual: Check if NEUT × WBC ≈ expected absolute (to confirm swap)

---

#### 6. **LYM (Lymphocytes - Absolute Count)**

**Unit declared:** `10^9/L`
**Expected range:** 1.0-4.0 × 10^9/L
**What we found:**

| Test Date | Value | Appears Plausible? |
|-----------|-------|-------------------|
| May 29 | 0.7 | 🟡 Low but possible |
| Jun 26 | 0.148 | ❌ Very low |
| Aug 6 | 0.143 | ❌ Very low |
| Sep 11 | 0.5 | 🟡 Low but possible |
| Nov 9 | 0.094 | ❌ Very low |
| Dec 11 | 0.128 | ❌ Very low |
| Jan 16 | 0.137 | ❌ Very low |

**Statistics:**
- Min: 0.094 | Max: 0.7 | Ratio: **7.45x**

**Why it's suspicious:**
- ALL values are below 1.0, which is concerning
- Some values (0.094, 0.128, 0.137) look like percentages as decimals
- Clinical lymphopenia possible but this pattern suggests scale issue

**Detection:**
- Automatic: Flag if LYM < 0.5 (likely scale issue or severe lymphopenia)
- Requires clinical context to distinguish from actual low counts

---

#### 7. **MXD (Mixed Cells - Absolute Count)**

**Unit declared:** `10^9/L`
**Expected range:** 0.2-1.0 × 10^9/L
**What we found:**

- Range: 0 to 0.5
- Several values below 0.1
- Similar pattern to LYM - possible scale confusion

---

### 🟢 CONSISTENT: Markers with No Scale Issues

These markers show appropriate variation (ratio < 2) and appear consistent across all tests:

| Marker | Min | Max | Ratio | Assessment |
|--------|-----|-----|-------|------------|
| **MCH** | 27.4 pg | 27.9 pg | 1.02x | ✅ Excellent consistency |
| **MCV** | 82.4 fL | 83.8 fL | 1.02x | ✅ Excellent consistency |
| **RDW-SD** | 44.7 fL | 45.7 fL | 1.02x | ✅ Excellent consistency |
| **MPV** | 9.5 fL | 10.4 fL | 1.09x | ✅ Good consistency |
| **RBC** | 4.38 × 10^12/L | 4.82 × 10^12/L | 1.10x | ✅ Good consistency |
| **PDW** | 10.5% | 11.5% | 1.10x | ✅ Good consistency |
| **PLT** | 394 × 10^9/L | 476 × 10^9/L | 1.21x | ✅ Good consistency |
| **WBC** | 3.7 × 10^9/L | 5.6 × 10^9/L | 1.51x | ✅ Good consistency |

**Why these are safe:**
- Variation is within expected clinical ranges
- No sudden jumps between tests
- No evidence of scale confusion

---

### 📊 Percentage Markers: Decimal vs Percentage Format

These markers are consistently stored as **decimals (0.0-1.0)** instead of **percentages (0-100%)**:

| Marker | Sample Values | Should Be |
|--------|--------------|-----------|
| **LYM%** | 0.178, 0.094 | 17.8%, 9.4% |
| **NEUT%** | 0.698, 0.816 | 69.8%, 81.6% |
| **MXD%** | 0.124, 0.09 | 12.4%, 9.0% |
| **PLCR** | 0.235, 0.244 | 23.5%, 24.4% |

**Why this matters:**
- These ARE consistent (all use decimal format)
- But the format is non-standard for lab reports
- User expectations: see "17.8%" not "0.178"
- Display layer needs to handle this conversion

**Detection:**
- Automatic: All percentage markers with values < 1.0
- Safe assumption: multiply by 100 for display

**Risk level:** LOW (consistent format, just needs display normalization)

---

## Pattern Analysis: Test Date Clustering

Scale inconsistencies cluster by test date, suggesting **different source formats**:

### Pattern 1: Early Tests (May 29 - Nov 9, 2025)

**5 tests with consistent issues:**
- HGB: 10x too high (120-137 → should be 12.0-13.7)
- MCHC: 10x too high (327-334 → should be 32.7-33.4)
- HCT: Correct format (%)
- RDW-CV: Decimal format (0.15 → should be 15%)
- NEUT: Mix of correct and suspicious low values
- Percentage markers: Decimal format (0.0-1.0)

**Hypothesis:** Lab report format A or OCR pattern A

---

### Pattern 2: Dec 11, 2025

**Unique anomaly test:**
- HGB: ✅ Correct (13.3)
- MCHC: ❌ Anomalously low (27.6 - doesn't fit any pattern)
- HCT: ❌ Decimal format (0.397 → should be 39.7%)
- RDW-CV: ✅ Correct (15.1%)
- NEUT: ✅ Correct (4.5)

**Hypothesis:** Different lab report format OR data entry error

---

### Pattern 3: Jan 16, 2026

**Mostly correct test:**
- HGB: ✅ Correct (12.8)
- MCHC: ✅ Correct (33.5)
- HCT: ✅ Correct (38.2%)
- RDW-CV: ✅ Correct (15.2%)
- NEUT: ❌ Suspicious low (0.751 - likely percentage)

**Hypothesis:** Lab report format B or improved OCR extraction

---

## Risk Assessment by Marker

### 🔴 HIGHEST RISK (Auto-fix required)

| Marker | Risk Type | Detectability | Mitigation Strategy |
|--------|-----------|---------------|-------------------|
| **HGB** | 10x scale error | HIGH - value > 20 | Auto-correct: if > 20, divide by 10 |
| **MCHC** | 10x scale error | HIGH - value > 100 | Auto-correct: if > 100, divide by 10 |
| **RDW-CV** | 100x scale error | HIGH - value < 1 | Auto-correct: if < 1, multiply by 100 |
| **HCT** | 100x scale error | HIGH - value < 1 | Auto-correct: if < 1, multiply by 100 |

**Recommended Action:**
- Implement automatic scale normalization on write
- Apply retroactive correction to existing data
- Add validation to prevent future scale errors

---

### 🟡 MODERATE RISK (Requires user confirmation)

| Marker | Risk Type | Detectability | Mitigation Strategy |
|--------|-----------|---------------|-------------------|
| **NEUT** | Absolute vs % confusion | MEDIUM - value < 1 | Flag for user review if < 1.0 |
| **LYM** | Absolute vs % confusion | MEDIUM - value < 0.5 | Flag for user review if < 0.5 |
| **MXD** | Absolute vs % confusion | LOW | Flag for user review if < 0.1 |

**Recommended Action:**
- Implement smart validation: check if value × WBC ≈ expected range
- Present user with "Does this look correct?" prompt when suspicious
- Provide context: "Neutrophils seem low (0.76). Did you mean 7.6 or 76%?"

---

### 🟢 LOW RISK (Display normalization only)

| Marker | Issue | Mitigation |
|--------|-------|------------|
| **LYM%**, **NEUT%**, **MXD%**, **PLCR** | Decimal format | Display: multiply by 100, add "%" |

**Recommended Action:**
- No data correction needed (format is consistent)
- Handle in display layer only

---

### ✅ NO RISK (Safe to use as-is)

MCH, MCV, MPV, RDW-SD, RBC, WBC, PLT, PDW - all show appropriate consistency

---

## Cross-Test Consistency Check

### Math Validation: Do the markers correlate correctly?

Some markers have mathematical relationships that can validate scale correctness:

#### Test 1: MCHC = (HGB / HCT) × 100

**May 29, 2025:**
- HGB: 126 (stored) → 12.6 (actual)
- HCT: 37.7% → 0.377 (as ratio)
- MCHC stored: 334 → 33.4 (actual)
- Calculated: (12.6 / 0.377) × 100 = **33.4** ✅ CONFIRMS both HGB and MCHC are 10x too high

**Dec 11, 2025:**
- HGB: 13.3 (stored, appears correct)
- HCT: 0.397 (stored) → 39.7% (actual)
- MCHC stored: 27.6
- Calculated: (13.3 / 0.397) × 100 = **33.5**
- Stored MCHC (27.6) ≠ Calculated MCHC (33.5) ❌ CONFIRMS MCHC is wrong for this test

---

#### Test 2: NEUT + LYM + MXD ≈ WBC (for absolute counts)

**May 29, 2025:**
- WBC: 3.9
- NEUT: 2.7, LYM: 0.7, MXD: 0.5
- Sum: 3.9 ✅ Perfect match

**Jun 26, 2025:**
- WBC: 4.6
- NEUT: 0.76, LYM: 0.148, MXD: 0.092
- Sum: 1.0 ❌ WAY TOO LOW (should be ~4.6)
- **If these are percentages:** 0.76 + 0.148 = 0.908 (90.8%) ✅ Plausible differential

This confirms the hypothesis: Jun 26 has absolute/percentage confusion.

---

## Recommendations for Mitigation

### Phase 1: Immediate (No Data Changes)

**Add warnings to UI:**
1. Display disclaimer on all trend visualizations
2. Add "Data quality varies by test" notice
3. Disable automated trend analysis until normalization complete

**Documented workaround:**
- Users can manually review and re-enter problematic values
- Provide "Edit marker" functionality with validation

---

### Phase 2: Automated Detection & Flagging

**Implement validation rules:**

```typescript
// Example validation rules (pseudocode)
if (marker === 'HGB' && value > 20) {
  flag = 'LIKELY_10X_ERROR';
  suggestedValue = value / 10;
}

if (marker === 'HCT' && value < 1) {
  flag = 'LIKELY_DECIMAL_FORMAT';
  suggestedValue = value * 100;
}

if (marker === 'NEUT' && value < 1.0 && value > 0.5) {
  flag = 'POSSIBLE_PERCENTAGE_CONFUSION';
  // Check if value × WBC ≈ reasonable absolute count
  calculatedAbsolute = value * wbcValue;
  if (calculatedAbsolute > 1.5 && calculatedAbsolute < 7.0) {
    suggestedValue = calculatedAbsolute;
  }
}
```

**Action:**
- Run validation on existing data
- Generate report of flagged values
- Present to user for confirmation

---

### Phase 3: Smart Normalization (With User Confirmation)

**Automatic correction for high-confidence cases:**
- HGB > 20 → divide by 10
- MCHC > 100 → divide by 10
- HCT < 1 → multiply by 100
- RDW-CV < 1 → multiply by 100

**User confirmation for ambiguous cases:**
- NEUT, LYM, MXD with suspicious ranges
- Show user both options with context
- Learn from user selections to improve future extraction

---

### Phase 4: Prevention (Future Tests)

**At data entry/extraction time:**

1. **Range validation:**
   - Reject values outside physiologically possible ranges
   - Example: HGB > 20 g/dL is impossible → must be scale error

2. **Cross-marker validation:**
   - Check MCHC = (HGB / HCT) × 100
   - Check NEUT + LYM + MXD ≈ WBC
   - Flag if calculations don't match

3. **Unit normalization:**
   - Force standardized units on write
   - Convert all percentage markers to consistent format

4. **AI extraction confidence:**
   - Have LLM report confidence scores for each marker
   - Flag low-confidence extractions for user review

---

## High-Risk Markers: International Context

Some markers are especially prone to regional variation:

### 🌍 **HGB (Hemoglobin)**

**Regional variations:**
- **US/UK:** g/dL (12-18 g/dL)
- **Many countries:** g/L (120-180 g/L)
- **10x difference** between formats

**Why it's problematic:**
- Both formats are clinically valid
- Impossible to distinguish without context
- Our data shows BOTH formats mixed in same dataset

**Mitigation:**
- Ask user to confirm units on first entry
- Store user's preferred units in profile
- Validate against confirmed preference

---

### 🌍 **HCT (Hematocrit)**

**Regional variations:**
- **Percentage format:** 35-50% (most common)
- **Decimal/ratio format:** 0.35-0.50 (some labs)
- **100x difference** between formats

**Why it's problematic:**
- Both are valid representations of same value
- 0.40 could mean either 0.40% (critical) or 40% (normal)
- Depends on lab reporting style

---

### 🌍 **WBC, NEUT, LYM, MXD**

**Regional variations:**
- **10^9/L:** Used in UK, Europe, many countries
- **10^3/µL (or K/µL):** Used in US, some countries
- **Numerically identical** (4.5 × 10^9/L = 4.5 K/µL)
- But percentage vs absolute confusion still occurs

---

## Technical Implementation Notes

### Database Considerations

**Current state:**
- Values stored as TEXT
- No scale normalization
- No validation
- Units stored separately but not enforced

**Recommended changes (FUTURE - not part of this audit):**
- Add `raw_value` column (original extraction)
- Add `normalized_value` column (after scale correction)
- Add `scale_confidence` enum (HIGH, MEDIUM, LOW, USER_CONFIRMED)
- Add `validation_notes` jsonb column

---

## Appendix: Statistical Summary

### Markers by Risk Level

| Risk Level | Count | Markers |
|------------|-------|---------|
| 🔴 Critical | 4 | HGB, MCHC, HCT, RDW-CV |
| 🟡 Moderate | 3 | NEUT, LYM, MXD |
| 🟢 Low | 4 | LYM%, NEUT%, MXD%, PLCR |
| ✅ Safe | 8 | MCH, MCV, MPV, RDW-SD, RBC, WBC, PLT, PDW |

---

### Scale Error Distribution

| Error Type | Count | Example |
|------------|-------|---------|
| 100x (÷100 or ×100) | 2 markers | HCT, RDW-CV |
| 10x (÷10 or ×10) | 2 markers | HGB, MCHC |
| Absolute/% swap | 3 markers | NEUT, LYM, MXD |
| Decimal vs % display | 4 markers | LYM%, NEUT%, MXD%, PLCR |

---

## Conclusion

**Summary:**
- 7 blood tests analyzed
- 112 marker measurements reviewed
- 4 critical scale inconsistencies identified
- 3 moderate inconsistencies flagged
- 8 markers confirmed safe and consistent

**Key Finding:**
Scale errors cluster by test date, indicating **format variation in source documents** or **OCR interpretation differences** rather than random errors.

**Critical Insight:**
The pattern of errors (10x, 100x, absolute/percentage swap) matches known issues with:
- Different lab analyzer outputs
- Regional reporting format differences
- OCR misinterpretation of column headers

**Immediate Risk:**
Without normalization, trend visualization will show fake "10x spikes" and "100x drops" that don't represent actual clinical changes.

**Next Steps:**
1. Implement validation rules (Phase 2)
2. Present flagged values to user for confirmation (Phase 3)
3. Apply corrections with user approval
4. Add prevention logic for future tests (Phase 4)

---

**Report Generated:** 2026-02-01
**Data Examined:** 7 tests spanning May 2025 - Jan 2026
**Total Markers:** 112 measurements
**Analysis Type:** Read-only (no data modified)
**Status:** ⚠️ SCALE INCONSISTENCIES CONFIRMED - MITIGATION REQUIRED
