import { LLMConfig } from "./llm-types.ts";

const DEFAULT_TEMPERATURE = 0.3;
const MAX_ALLOWED_TEMPERATURE = 0.3;
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

export function loadLLMConfig(): LLMConfig {
  const provider = (Deno.env.get("LLM_PROVIDER") || "anthropic") as "openai" | "anthropic";

  let model: string;
  if (provider === "openai") {
    model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  } else {
    model = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-20250514";
  }

  const temperature = Math.min(
    parseFloat(Deno.env.get("LLM_TEMPERATURE") || String(DEFAULT_TEMPERATURE)),
    MAX_ALLOWED_TEMPERATURE
  );

  const max_tokens = parseInt(
    Deno.env.get("LLM_MAX_TOKENS") || "2000",
    10
  );

  const timeout_ms = parseInt(
    Deno.env.get("LLM_TIMEOUT_MS") || String(DEFAULT_TIMEOUT_MS),
    10
  );

  const max_retries = parseInt(
    Deno.env.get("LLM_MAX_RETRIES") || String(MAX_RETRIES),
    10
  );

  return {
    provider,
    model,
    temperature,
    max_tokens,
    timeout_ms,
    max_retries,
  };
}

export function validateLLMConfig(config: LLMConfig): { valid: boolean; error?: string } {
  if (config.temperature > MAX_ALLOWED_TEMPERATURE) {
    return {
      valid: false,
      error: `Temperature ${config.temperature} exceeds maximum ${MAX_ALLOWED_TEMPERATURE}`,
    };
  }

  if (config.max_tokens < 100 || config.max_tokens > 4000) {
    return {
      valid: false,
      error: `Max tokens ${config.max_tokens} out of range (100-4000)`,
    };
  }

  if (config.max_retries < 0 || config.max_retries > 5) {
    return {
      valid: false,
      error: `Max retries ${config.max_retries} out of range (0-5)`,
    };
  }

  return { valid: true };
}