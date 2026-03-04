export interface TimelinePhase {
  phase_name: string;
  phase_order: number;
  typical_duration_weeks: number;
  description: string;
  key_milestones: string[];
  typical_challenges: string[];
}

export interface TimelineInference {
  phases: TimelinePhase[];
  total_estimated_weeks: number;
  current_phase: string;
  next_milestone: string;
  personalized_note: string;
}

export class TimelineInferencer {
  async infer(
    diagnosisInfo: Record<string, unknown>,
    userId: string
  ): Promise<TimelineInference> {
    const stage = (diagnosisInfo.stage_or_severity || "unknown") as string;
    const cancerType = (diagnosisInfo.diagnosis_name || "unknown") as string;
    const lowerStage = stage.toLowerCase();
    const lowerType = cancerType.toLowerCase();

    if (lowerType.includes("breast") && (lowerStage.includes("iia") || lowerStage.includes("iib"))) {
      return this.breastCancerEarlyStageTimeline(stage, cancerType);
    }

    if (lowerType.includes("breast")) {
      return this.breastCancerGeneralTimeline(stage, cancerType);
    }

    return this.genericCancerTimeline(stage, cancerType);
  }

  private breastCancerEarlyStageTimeline(stage: string, type: string): TimelineInference {
    const phases: TimelinePhase[] = [
      {
        phase_name: "Diagnosis & Testing",
        phase_order: 1,
        typical_duration_weeks: 2,
        description: "Additional tests to understand your cancer fully. May include imaging scans, biopsies, and blood work.",
        key_milestones: [
          "Complete imaging (MRI, CT, or PET scan)",
          "Genetic testing consultation",
          "Meet with surgical oncologist",
          "Meet with medical oncologist",
        ],
        typical_challenges: [
          "Waiting for test results can be anxiety-inducing",
          "Information overload from multiple appointments",
          "Difficulty sleeping or concentrating",
        ],
      },
      {
        phase_name: "Surgery",
        phase_order: 2,
        typical_duration_weeks: 4,
        description: "Surgical removal of the tumor. May be lumpectomy (breast-conserving) or mastectomy (full breast removal).",
        key_milestones: [
          "Pre-surgery consultation and planning",
          "Surgery day",
          "Post-surgery pathology results",
          "Surgical recovery (1-2 weeks)",
        ],
        typical_challenges: [
          "Surgical recovery pain and limitations",
          "Waiting for final pathology",
          "Adjusting to body changes",
          "Managing drains (if applicable)",
        ],
      },
      {
        phase_name: "Chemotherapy",
        phase_order: 3,
        typical_duration_weeks: 16,
        description: "Systemic treatment to kill cancer cells throughout your body. Typically given in cycles every 2-3 weeks.",
        key_milestones: [
          "Port placement (if needed)",
          "First infusion",
          "Mid-treatment scans",
          "Final infusion",
        ],
        typical_challenges: [
          "Fatigue and low energy",
          "Nausea (usually manageable with meds)",
          "Hair loss",
          "Increased infection risk",
          "Emotional ups and downs",
        ],
      },
      {
        phase_name: "Radiation Therapy",
        phase_order: 4,
        typical_duration_weeks: 6,
        description: "Targeted radiation to kill any remaining cancer cells in the breast area. Usually 5 days/week.",
        key_milestones: [
          "Radiation planning session (mapping)",
          "First treatment",
          "Mid-treatment check-in",
          "Final treatment",
        ],
        typical_challenges: [
          "Skin irritation in treatment area",
          "Fatigue (cumulative)",
          "Daily treatment schedule",
        ],
      },
      {
        phase_name: "Hormone Therapy",
        phase_order: 5,
        typical_duration_weeks: 260,
        description: "Daily medication for 5-10 years to block hormones that fuel cancer growth.",
        key_milestones: [
          "Start daily medication",
          "3-month follow-up",
          "6-month follow-up",
          "Annual check-ins",
        ],
        typical_challenges: [
          "Medication side effects (hot flashes, joint pain)",
          "Remembering daily medication",
          "Long-term commitment",
        ],
      },
      {
        phase_name: "Survivorship & Monitoring",
        phase_order: 6,
        typical_duration_weeks: 520,
        description: "Regular monitoring for recurrence. Focus shifts to long-term health and wellness.",
        key_milestones: [
          "3-month check-ups (first 2 years)",
          "6-month check-ups (years 3-5)",
          "Annual mammograms",
          "Return to 'normal' life",
        ],
        typical_challenges: [
          "Scanxiety (anxiety before scans)",
          "Finding new normal",
          "Late side effects from treatment",
        ],
      },
    ];

    return {
      phases,
      total_estimated_weeks: 806,
      current_phase: "Diagnosis & Testing",
      next_milestone: "Complete imaging (MRI, CT, or PET scan)",
      personalized_note: `This timeline is typical for ${stage} breast cancer, but your specific timeline may vary based on your body's response to treatment and your oncologist's recommendations. The good news: you're in an early stage with excellent treatment options.`,
    };
  }

  private breastCancerGeneralTimeline(stage: string, type: string): TimelineInference {
    const phases: TimelinePhase[] = [
      {
        phase_name: "Diagnosis & Planning",
        phase_order: 1,
        typical_duration_weeks: 2,
        description: "Completing tests and developing your personalized treatment plan.",
        key_milestones: [
          "Complete diagnostic testing",
          "Meet with oncology team",
          "Finalize treatment plan",
        ],
        typical_challenges: [
          "Uncertainty while waiting for results",
          "Processing the diagnosis",
        ],
      },
      {
        phase_name: "Active Treatment",
        phase_order: 2,
        typical_duration_weeks: 24,
        description: "May include surgery, chemotherapy, and/or radiation therapy.",
        key_milestones: [
          "Begin treatment",
          "Mid-treatment evaluation",
          "Complete active treatment",
        ],
        typical_challenges: [
          "Managing side effects",
          "Maintaining quality of life",
          "Emotional resilience",
        ],
      },
      {
        phase_name: "Recovery & Monitoring",
        phase_order: 3,
        typical_duration_weeks: 52,
        description: "Recovering from treatment and establishing new routines.",
        key_milestones: [
          "Post-treatment scans",
          "Regular follow-ups",
          "Return to activities",
        ],
        typical_challenges: [
          "Rebuilding strength",
          "Adjusting to life after treatment",
          "Managing fear of recurrence",
        ],
      },
    ];

    return {
      phases,
      total_estimated_weeks: 78,
      current_phase: "Diagnosis & Planning",
      next_milestone: "Complete diagnostic testing",
      personalized_note: `Treatment timelines vary based on cancer type and stage. Your oncologist will create a detailed, personalized treatment plan based on your specific situation.`,
    };
  }

  private genericCancerTimeline(stage: string, type: string): TimelineInference {
    const phases: TimelinePhase[] = [
      {
        phase_name: "Diagnosis",
        phase_order: 1,
        typical_duration_weeks: 2,
        description: "Understanding your diagnosis and planning next steps.",
        key_milestones: [
          "Complete diagnostic testing",
          "Meet with oncologist",
          "Develop treatment plan",
        ],
        typical_challenges: [
          "Processing the news",
          "Learning about your condition",
        ],
      },
      {
        phase_name: "Treatment",
        phase_order: 2,
        typical_duration_weeks: 12,
        description: "Active cancer treatment based on your specific type and stage.",
        key_milestones: [
          "Begin treatment",
          "Regular monitoring",
          "Complete treatment",
        ],
        typical_challenges: [
          "Side effect management",
          "Maintaining energy and mood",
        ],
      },
      {
        phase_name: "Follow-Up Care",
        phase_order: 3,
        typical_duration_weeks: 52,
        description: "Ongoing monitoring and wellness focus.",
        key_milestones: [
          "Post-treatment evaluation",
          "Regular check-ups",
          "Lifestyle adjustments",
        ],
        typical_challenges: [
          "Adjusting to new normal",
          "Managing uncertainty",
        ],
      },
    ];

    return {
      phases,
      total_estimated_weeks: 66,
      current_phase: "Diagnosis",
      next_milestone: "Meet with oncologist to discuss treatment plan",
      personalized_note: `Treatment timelines vary significantly based on cancer type and stage. Your oncologist will create a personalized treatment plan for you.`,
    };
  }
}
