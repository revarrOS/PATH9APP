# Vision Output Schema

## Overview

The `analyze-condition-letter` edge function returns structured JSON extracted from medical letter PDFs using Claude Vision API.

## Full Output Schema

```typescript
{
  metadata: {
    doc_date?: string;           // ISO date: "2026-01-15"
    author?: string;             // "Dr Jane Smith"
    clinic?: string;             // "Royal Hospital Haematology"
    doc_type?: string;           // "consultant_letter" | "clinic_summary" | etc.
  };
  diagnoses: string[];           // ["Diagnosis text", ...]
  medications: string[];         // ["Medication changes or mentions", ...]
  test_results: string[];        // ["Test result mentions", ...]
  clinical_assessment: string[]; // ["Clinical assessment statements", ...]
  recommended_actions: string[]; // ["Recommended next steps", ...]
  timeline_events: [
    {
      date: string;              // ISO date: "2026-01-10"
      event_type: string;        // "diagnosis" | "biopsy" | "treatment_change" | "review" | "milestone"
      description: string;       // "Bone marrow biopsy performed"
      significance: string;      // "high" | "medium" | "low"
    }
  ];
  contacts: [
    {
      name: string;              // "Dr Jane Smith"
      role: string;              // "Consultant Haematologist"
      institution: string;       // "Royal Hospital"
      phone?: string;            // "020 1234 5678"
      email?: string;            // "j.smith@hospital.nhs.uk"
      notes?: string;            // Additional notes
    }
  ];
  trend_signals: [
    {
      signal_date: string;       // ISO date: "2026-01-15"
      signal_type: string;       // "stability" | "improvement" | "progression" | "monitoring_change" | "other"
      polarity: string;          // "positive" | "negative" | "neutral"
      category: string;          // "clinical_marker" | "symptom" | "treatment_response" | "other"
      description: string;       // "Platelets remain stable at 150"
      confidence: number;        // 0.0 - 1.0
    }
  ];
  consultation_questions: [
    {
      question_text: string;     // "What does the platelet count mean for my treatment plan?"
      priority: string;          // "clinical" | "logistical" | "general"
    }
  ];
  pii_spans: [
    {
      type: string;              // "name" | "dob" | "address" | "phone" | "email" | "nhs_number" | "mrn"
      start: number;             // Character position start
      end: number;               // Character position end
      text: string;              // "John Smith"
    }
  ];
  full_text: string;             // Complete extracted text
  masked_text: string;           // Text with PII replaced by [NAME], [DOB], etc.
  confidence_score: number;      // 0.0 - 1.0 (overall extraction confidence)
  warnings: string[];            // ["Any extraction warnings"]
}
```

## Required Fields

- `full_text`: Always required (can be empty string if extraction completely fails)
- `masked_text`: Always required (can be same as full_text if no PII detected)
- `confidence_score`: Always required (0 if extraction fails)
- `warnings`: Always required (empty array if no warnings)

## Optional Fields

All other fields are optional. If a field cannot be extracted, it should be:
- Omitted entirely, OR
- Set to empty array `[]` for array fields, OR
- Set to empty object `{}` for object fields

## Error Modes

### Complete Failure

```json
{
  "full_text": "",
  "masked_text": "",
  "confidence_score": 0,
  "warnings": ["Could not confidently read this document. Please review manually."],
  "metadata": {},
  "diagnoses": [],
  "medications": [],
  "test_results": [],
  "clinical_assessment": [],
  "recommended_actions": [],
  "timeline_events": [],
  "contacts": [],
  "trend_signals": [],
  "consultation_questions": [],
  "pii_spans": []
}
```

### Partial Extraction

```json
{
  "full_text": "Extracted text...",
  "masked_text": "Extracted text with [NAME] masked...",
  "confidence_score": 0.65,
  "warnings": ["Low confidence on medication extraction", "No contact information found"],
  "metadata": {
    "doc_date": "2026-01-15"
  },
  "diagnoses": ["Chronic Lymphocytic Leukaemia"],
  "timeline_events": [],
  "contacts": [],
  ...
}
```

## Confidence Scoring

- **1.0**: Perfect extraction, all expected fields present
- **0.9 - 0.99**: High confidence, minor omissions
- **0.7 - 0.89**: Good extraction, some fields missing
- **0.5 - 0.69**: Partial extraction, significant gaps
- **0.0 - 0.49**: Poor extraction, major data missing

## PII Types

| Type | Description | Mask Replacement |
|------|-------------|------------------|
| `name` | Patient or provider name | `[NAME]` |
| `dob` | Date of birth | `[DOB]` |
| `address` | Postal address | `[ADDRESS]` |
| `phone` | Phone number | `[PHONE]` |
| `email` | Email address | `[EMAIL]` |
| `nhs_number` | NHS number (UK) | `[NHS_NUMBER]` |
| `mrn` | Medical record number | `[MRN]` |

## Timeline Event Types

| Type | Description |
|------|-------------|
| `diagnosis` | Initial or changed diagnosis |
| `biopsy` | Biopsy or tissue sample taken |
| `treatment_change` | Treatment plan modification |
| `review` | Scheduled review or follow-up |
| `milestone` | Significant milestone or outcome |

## Trend Signal Types

| Type | Description |
|------|-------------|
| `stability` | Condition remains stable |
| `improvement` | Positive change or improvement |
| `progression` | Disease progression |
| `monitoring_change` | Change in monitoring frequency or method |
| `other` | Other signal type |

## Example Real Output

```json
{
  "metadata": {
    "doc_date": "2026-01-15",
    "author": "Dr Sarah Johnson",
    "clinic": "Royal Marsden Hospital - Haematology",
    "doc_type": "consultant_letter"
  },
  "diagnoses": [
    "Chronic Lymphocytic Leukaemia (CLL) - Rai Stage II"
  ],
  "medications": [
    "Continuing watch and wait approach",
    "No active chemotherapy at this time"
  ],
  "test_results": [
    "White cell count: 35.2 x10^9/L (elevated)",
    "Platelets: 150 x10^9/L (stable)",
    "Lymphocytes: 28.1 x10^9/L (elevated)"
  ],
  "clinical_assessment": [
    "Patient remains asymptomatic with stable disease",
    "No B symptoms present",
    "Lymphadenopathy unchanged from previous examination"
  ],
  "recommended_actions": [
    "Continue with 3-monthly monitoring",
    "Repeat blood tests in 12 weeks",
    "Contact immediately if develops night sweats, weight loss, or fatigue"
  ],
  "timeline_events": [
    {
      "date": "2026-01-10",
      "event_type": "review",
      "description": "Routine 3-month follow-up appointment",
      "significance": "medium"
    }
  ],
  "contacts": [
    {
      "name": "Dr Sarah Johnson",
      "role": "Consultant Haematologist",
      "institution": "Royal Marsden Hospital",
      "phone": "020 7352 8171",
      "email": "sarah.johnson@rmh.nhs.uk"
    }
  ],
  "trend_signals": [
    {
      "signal_date": "2026-01-15",
      "signal_type": "stability",
      "polarity": "neutral",
      "category": "clinical_marker",
      "description": "Platelets stable at 150, no change from baseline",
      "confidence": 0.92
    },
    {
      "signal_date": "2026-01-15",
      "signal_type": "stability",
      "polarity": "neutral",
      "category": "symptom",
      "description": "Patient remains asymptomatic, no B symptoms",
      "confidence": 0.95
    }
  ],
  "consultation_questions": [
    {
      "question_text": "What does 'watch and wait' mean for my treatment plan?",
      "priority": "clinical"
    },
    {
      "question_text": "At what point would you recommend starting active treatment?",
      "priority": "clinical"
    },
    {
      "question_text": "Should I be concerned about the elevated white cell count?",
      "priority": "clinical"
    }
  ],
  "pii_spans": [
    {
      "type": "name",
      "start": 450,
      "end": 462,
      "text": "John Smith"
    },
    {
      "type": "dob",
      "start": 480,
      "end": 490,
      "text": "12/05/1965"
    },
    {
      "type": "nhs_number",
      "start": 510,
      "end": 520,
      "text": "485 777 3456"
    }
  ],
  "full_text": "...complete letter text...",
  "masked_text": "...letter text with [NAME] replacing John Smith, [DOB] replacing 12/05/1965, etc...",
  "confidence_score": 0.88,
  "warnings": []
}
```
