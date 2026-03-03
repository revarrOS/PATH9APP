export interface BloodworkKeyContact {
  id: string;
  user_id: string;
  contact_name: string;
  role: string;
  establishment?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateKeyContactInput {
  contact_name: string;
  role: string;
  establishment?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateKeyContactInput {
  contact_name?: string;
  role?: string;
  establishment?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export const CONTACT_ROLES = [
  'consultant',
  'nurse',
  'lab',
  'gp',
  'secretary',
  'pharmacist',
  'other',
] as const;

export type ContactRole = (typeof CONTACT_ROLES)[number];
