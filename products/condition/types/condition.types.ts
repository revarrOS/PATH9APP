export type DocumentType =
  | 'consultant_letter'
  | 'clinic_summary'
  | 'biopsy_report'
  | 'diagnostic_update'
  | 'follow_up'
  | 'other';

export interface ConditionEntry {
  id: string;
  user_id: string;
  document_date: string;
  document_type: DocumentType;
  clinician_name: string;
  institution: string;
  document_body: string;
  summary?: string;
  attachments?: AttachmentMetadata[];
  created_at: string;
  updated_at: string;
}

export interface AttachmentMetadata {
  filename: string;
  file_size: number;
  mime_type: string;
  upload_url?: string;
}

export interface CreateConditionEntryInput {
  document_date: string;
  document_type: DocumentType;
  clinician_name: string;
  institution: string;
  document_body: string;
  summary?: string;
  attachments?: AttachmentMetadata[];
}

export interface UpdateConditionEntryInput {
  document_date?: string;
  document_type?: DocumentType;
  clinician_name?: string;
  institution?: string;
  document_body?: string;
  summary?: string;
  attachments?: AttachmentMetadata[];
}

export interface ConsultationQuestion {
  id: string;
  user_id: string;
  entry_id?: string;
  question_text: string;
  priority: 'clinical' | 'logistical' | 'general';
  source: 'ai_suggested' | 'user_added';
  is_answered: boolean;
  created_at: string;
}

export interface CreateConsultationQuestionInput {
  entry_id?: string;
  question_text: string;
  priority: 'clinical' | 'logistical' | 'general';
  source: 'ai_suggested' | 'user_added';
}

export interface CareTeamMember {
  id: string;
  user_id: string;
  name: string;
  role: string;
  institution: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
}

export interface CreateCareTeamMemberInput {
  name: string;
  role: string;
  institution: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface UpdateCareTeamMemberInput {
  name?: string;
  role?: string;
  institution?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface SupportAccess {
  id: string;
  owner_id: string;
  support_email: string;
  support_name?: string;
  access_level: 'view_timeline' | 'view_full';
  status: 'pending' | 'active' | 'revoked';
  invite_token: string;
  created_at: string;
  accepted_at?: string;
}

export interface CreateSupportAccessInput {
  support_email: string;
  support_name?: string;
  access_level: 'view_timeline' | 'view_full';
}

export interface UpdateSupportAccessInput {
  access_level?: 'view_timeline' | 'view_full';
  status?: 'active' | 'revoked';
}

// Timeline marker types
export interface TimelineMarker {
  date: string;
  type: 'diagnosis' | 'biopsy' | 'treatment_change' | 'review' | 'milestone';
  label: string;
  entry_id?: string;
}

export interface ConditionChange {
  entry_id: string;
  document_date: string;
  change_type: 'new_finding' | 'stability' | 'progression' | 'regression' | 'monitoring_change';
  description: string;
  significance: 'high' | 'medium' | 'low';
}

export interface ConditionTimeline {
  entries: ConditionEntry[];
  markers: TimelineMarker[];
  changes: ConditionChange[];
}

// Document type display metadata
export interface DocumentTypeMetadata {
  type: DocumentType;
  display_name: string;
  description: string;
  icon: string;
}

export const DOCUMENT_TYPES: DocumentTypeMetadata[] = [
  {
    type: 'consultant_letter',
    display_name: 'Consultant Letter',
    description: 'Letter from specialist after consultation',
    icon: 'FileText'
  },
  {
    type: 'clinic_summary',
    display_name: 'Clinic Summary',
    description: 'Summary from clinic visit or follow-up',
    icon: 'Clipboard'
  },
  {
    type: 'biopsy_report',
    display_name: 'Biopsy Report',
    description: 'Pathology or biopsy results',
    icon: 'Microscope'
  },
  {
    type: 'diagnostic_update',
    display_name: 'Diagnostic Update',
    description: 'New diagnosis or diagnostic information',
    icon: 'AlertCircle'
  },
  {
    type: 'follow_up',
    display_name: 'Follow-up Letter',
    description: 'Follow-up correspondence or update',
    icon: 'Mail'
  },
  {
    type: 'other',
    display_name: 'Other',
    description: 'Other clinical documentation',
    icon: 'File'
  }
];

// Common clinician roles
export const CLINICIAN_ROLES = [
  'Oncologist',
  'Hematologist',
  'Surgeon',
  'Radiologist',
  'Pathologist',
  'Clinical Nurse Specialist',
  'GP / Primary Care',
  'Registrar',
  'Consultant',
  'Other Specialist'
];
