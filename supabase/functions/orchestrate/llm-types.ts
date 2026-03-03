export interface LLMConfig {
  provider: "openai" | "anthropic";
  model: string;
  temperature: number;
  max_tokens: number;
  timeout_ms: number;
  max_retries: number;
}

export interface LLMCallContext {
  request_id: string;
  user_id: string;
  enforcement_passed: boolean;
  prompt_order_valid: boolean;
  canon_appended_last: boolean;
}

export interface LLMResponse {
  success: boolean;
  response: string;
  metadata: {
    model: string;
    provider: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    timestamp: string;
  };
  error?: string;
}

export interface LLMAuditMetadata {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  prompt_count: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  retry_count?: number;
  error?: string;
}