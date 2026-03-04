export interface PromptMetadata {
  version: string;
  id: string;
  created: string;
  immutable: boolean;
}

export interface Prompt {
  metadata: PromptMetadata;
  content: string;
  raw: string;
}

export interface PromptRegistry {
  coreSystem: Prompt;
  boundarySafety: Prompt;
  stateTemplate: Prompt;
  knowledgeCanon: Prompt;
}

export interface AssembledPrompts {
  prompts: string[];
  metadata: {
    prompt_versions: string[];
    assembly_timestamp: string;
    state_hydrated: boolean;
  };
}

export interface StateContext {
  journey_phase?: string;
  session_count?: number;
  last_interaction_date?: string;
  user_goals?: string;
  focus_areas?: string;
  recent_topics?: string;
  pending_questions?: string;
  conversation_tone?: string;
  [key: string]: unknown;
}

export interface EnforcementResult {
  valid: boolean;
  violations: EnforcementViolation[];
  assembled_prompts?: AssembledPrompts;
}

export interface EnforcementViolation {
  code: string;
  message: string;
  field?: string;
}

export interface LLMResponse {
  success: boolean;
  response: string;
  metadata: {
    model: string;
    prompt_count: number;
    timestamp: string;
  };
}
