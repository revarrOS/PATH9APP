# Reference Range Sources

This document lists all legitimate sources used to establish blood marker reference ranges in the Path9 Bloodwork feature.

## Primary Sources

### 1. NHS (National Health Service, UK)
- **Organization**: UK National Health Service
- **URL**: https://www.nhs.uk/conditions/blood-tests/
- **Coverage**: Complete blood count (CBC) markers
- **Notes**:
  - Conservative ranges based on UK population
  - Regularly updated clinical guidelines
  - Age-adjusted ranges for elderly populations

### 2. Mayo Clinic
- **Organization**: Mayo Clinic Laboratories
- **URL**: https://www.mayoclinic.org/tests-procedures/complete-blood-count/about/pac-20384919
- **Coverage**: WBC, RBC, HGB, HCT, PLT, NEUT, MCH, MCHC, MONO, BASO
- **Notes**:
  - US-based reference ranges
  - Extensive population sampling
  - Sex-specific ranges for RBC, HGB, HCT

### 3. Cleveland Clinic
- **Organization**: Cleveland Clinic
- **URL**: https://my.clevelandclinic.org/health/diagnostics/
- **Coverage**: RBC, MCV, RDW, LYMPH, BASO
- **Notes**:
  - US clinical standards
  - Age-adjusted ranges where applicable
  - Conservative bounds for safety

### 4. LabCorp (Laboratory Corporation of America)
- **Organization**: LabCorp
- **URL**: https://www.labcorp.com/test-menu
- **Coverage**: HCT, RDW, MPV, EOS
- **Notes**:
  - Commercial lab reference ranges
  - Large US population data
  - Regularly validated against current populations

### 5. Quest Diagnostics
- **Organization**: Quest Diagnostics
- **URL**: https://www.questdiagnostics.com/
- **Coverage**: MCHC, MPV, MONO
- **Notes**:
  - Commercial lab standards
  - US population data
  - Clinical validation protocols

## Regional Variance Notes

### US vs UK Differences

**Units:**
- US and UK both use SI units for most blood markers
- No unit conversion needed for WBC, RBC, PLT (×10⁹/L or ×10¹²/L)
- HGB typically in g/dL (both regions)
- HCT in % (both regions)

**Range Differences:**
- **WBC**: UK ranges slightly narrower (4.0-11.0) vs US (4.5-11.0)
  - **Our approach**: Used conservative overlap (4.5-11.0 for younger, 4.0-11.0 for 60+)
- **RBC**: Minimal variance between UK and US
  - **Our approach**: Used Mayo Clinic ranges (well-documented sex/age splits)
- **HGB**: UK ranges slightly wider for females
  - **Our approach**: Used conservative median of UK/US ranges
- **PLT**: Both regions align (150-400 ×10⁹/L)
  - **Our approach**: Used consistent 150-400 across all sources

### Age Adjustments

**Conservative Approach:**
- For markers with minimal age variance (PLT, MCV, MCH, MCHC), ranges are consistent across age groups
- For markers with known age decline (WBC, RBC, HGB, HCT), ranges gradually lower for 60+ and 70+ age bands
- All age adjustments based on clinical literature from Mayo, NHS, Cleveland Clinic

**Sex-Specific Ranges:**
- **RBC, HGB, HCT**: Clear sex differences documented across all sources
  - Males: Higher ranges (more muscle mass, testosterone effects)
  - Females: Lower ranges (menstruation, lower muscle mass)
- **All other markers**: Sex-neutral ranges used (no clinically significant differences)

## Typical (Median) Values

The "typical" value represents a conservative mid-point within the normal range, not a strict clinical median. It serves as a visual reference point on trend charts.

**Calculation approach:**
- For symmetric ranges: Simple midpoint
- For asymmetric ranges: Weighted toward clinical norms
- **Purpose**: Visualization aid only, not diagnostic

## Data Quality & Validation

**Source Selection Criteria:**
1. Peer-reviewed clinical standards
2. Large population sampling (>10,000 individuals)
3. Regular updates (within last 5 years)
4. Institutional credibility (NHS, Mayo, Cleveland, LabCorp, Quest)

**Conservative Bias:**
- When sources conflict, we use the **wider range** to avoid false alarms
- Age ranges use **lower bounds** for older populations (safety-first)
- Sex-neutral defaults when sex is unspecified

## Disclaimer

These reference ranges are for **visualization and tracking purposes only**. They are **not medical advice** and should not be used for diagnosis or treatment decisions.

**Users should:**
- Consult their healthcare provider for interpretation
- Use lab-provided reference ranges from their specific test facility
- Not make medical decisions based on these visualizations

**Limitations:**
- Reference ranges vary by:
  - Lab methodology
  - Population demographics
  - Altitude (for RBC, HGB, HCT)
  - Pregnancy status (for many markers)
  - Ethnicity (for some markers)
- Our ranges are **population averages** and may not apply to all individuals
- Lab-specific ranges should always take precedence

## Updates & Maintenance

**Last Updated**: 2026-02-01

**Review Schedule**: Annual review of all sources and ranges

**Change Log**:
- 2026-02-01: Initial reference range dataset created
  - 15 blood markers covered
  - 6 age ranges per marker
  - Sex-specific ranges for RBC, HGB, HCT
  - Conservative overlap approach for US/UK variance
