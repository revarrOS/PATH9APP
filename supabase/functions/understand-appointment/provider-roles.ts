export interface ProviderRole {
  role: string;
  description: string;
  typical_appointment_types: string[];
}

export const providerRoles: Record<string, ProviderRole> = {
  oncologist: {
    role: "Oncologist",
    description: "Cancer specialist who coordinates your overall cancer treatment",
    typical_appointment_types: ["consultation", "treatment", "follow-up"],
  },
  "medical oncologist": {
    role: "Medical Oncologist",
    description: "Doctor who specializes in chemotherapy and other drug treatments for cancer",
    typical_appointment_types: ["consultation", "treatment", "follow-up"],
  },
  surgeon: {
    role: "Surgeon",
    description: "Doctor who performs operations to remove tumors or affected tissue",
    typical_appointment_types: ["consultation", "pre-op", "surgery", "post-op"],
  },
  "surgical oncologist": {
    role: "Surgical Oncologist",
    description: "Surgeon who specializes in cancer operations",
    typical_appointment_types: ["consultation", "pre-op", "surgery", "post-op"],
  },
  radiologist: {
    role: "Radiologist",
    description: "Doctor who interprets imaging scans like mammograms, CT scans, and MRIs",
    typical_appointment_types: ["imaging", "results"],
  },
  "radiation oncologist": {
    role: "Radiation Oncologist",
    description: "Specialist who uses radiation therapy to treat cancer",
    typical_appointment_types: ["consultation", "planning", "treatment", "follow-up"],
  },
  "nurse navigator": {
    role: "Nurse Navigator",
    description: "Specialized nurse who helps coordinate your care and answer questions",
    typical_appointment_types: ["consultation", "check-in", "education"],
  },
  pathologist: {
    role: "Pathologist",
    description: "Doctor who examines tissue samples to diagnose cancer type and characteristics",
    typical_appointment_types: ["results"],
  },
  "plastic surgeon": {
    role: "Plastic Surgeon",
    description: "Surgeon who performs reconstructive surgery after cancer surgery",
    typical_appointment_types: ["consultation", "surgery", "follow-up"],
  },
  "primary care": {
    role: "Primary Care Doctor",
    description: "Your main doctor who coordinates overall health and refers to specialists",
    typical_appointment_types: ["check-up", "consultation", "referral"],
  },
  nutritionist: {
    role: "Nutritionist/Dietitian",
    description: "Specialist who helps you maintain good nutrition during treatment",
    typical_appointment_types: ["consultation", "follow-up"],
  },
  "social worker": {
    role: "Social Worker",
    description: "Professional who helps with emotional support and practical resources",
    typical_appointment_types: ["consultation", "support"],
  },
  psychologist: {
    role: "Psychologist",
    description: "Mental health professional who provides counseling and coping strategies",
    typical_appointment_types: ["consultation", "therapy"],
  },
};

export function getProviderRole(roleName: string): ProviderRole | null {
  const normalized = roleName.toLowerCase().trim();
  return providerRoles[normalized] || null;
}
