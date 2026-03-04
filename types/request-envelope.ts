export interface RequestEnvelope {
  user_id: string;
  journey_state: Record<string, unknown>;
  consent_flags: {
    data_processing: boolean;
    analytics: boolean;
    third_party_sharing: boolean;
  };
  request_id: string;
}

export interface GemmaRequestEnvelope extends RequestEnvelope {
  user_message: string;
}

export interface PolicyViolation {
  code: string;
  message: string;
  field?: string;
}

export interface StandardError {
  error: string;
  code: string;
  request_id?: string;
  violations?: PolicyViolation[];
}

export interface OrchestrationResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: StandardError;
  request_id: string;
}
