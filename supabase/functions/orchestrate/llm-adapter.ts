import { AssembledPrompts } from "./types.ts";
import { LLMConfig, LLMResponse, LLMCallContext } from "./llm-types.ts";
import { loadLLMConfig, validateLLMConfig } from "./llm-config.ts";
import { validateLLMCallContext, createLLMCallContext } from "./llm-guards.ts";
import { callOpenAI } from "./llm-openai.ts";
import { callAnthropic, type AnthropicMessage } from "./llm-anthropic.ts";
import { callMockLLM } from "./mock-llm.ts";

export async function callLLM(
  assembled: AssembledPrompts,
  request_id: string,
  user_id: string,
  userMessage?: string,
  conversationHistory?: AnthropicMessage[]
): Promise<LLMResponse> {
  const config = loadLLMConfig();

  const configValidation = validateLLMConfig(config);
  if (!configValidation.valid) {
    return {
      success: false,
      response: "",
      metadata: {
        model: config.model,
        provider: config.provider,
        timestamp: new Date().toISOString(),
      },
      error: `Configuration validation failed: ${configValidation.error}`,
    };
  }

  const context = createLLMCallContext(assembled, request_id, user_id);

  const guardResult = validateLLMCallContext(context);
  if (!guardResult.valid) {
    const errorMessage = guardResult.violations.map((v) => v.message).join("; ");
    return {
      success: false,
      response: "",
      metadata: {
        model: config.model,
        provider: config.provider,
        timestamp: new Date().toISOString(),
      },
      error: errorMessage,
    };
  }

  try {
    if (config.provider === "openai") {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiKey) {
        console.log("OPENAI_API_KEY not found, using mock LLM");
        return await callMockLLM(userMessage);
      }
      return await callOpenAI(assembled.prompts, config, userMessage);
    } else if (config.provider === "anthropic") {
      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!anthropicKey) {
        console.log("ANTHROPIC_API_KEY not found, using mock LLM");
        return await callMockLLM(userMessage);
      }
      return await callAnthropic(assembled.prompts, config, userMessage, conversationHistory);
    } else if (config.provider === "mock") {
      return await callMockLLM(userMessage);
    } else {
      return {
        success: false,
        response: "",
        metadata: {
          model: config.model,
          provider: config.provider,
          timestamp: new Date().toISOString(),
        },
        error: `Unsupported provider: ${config.provider}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      response: "",
      metadata: {
        model: config.model,
        provider: config.provider,
        timestamp: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function getLLMConfig(): LLMConfig {
  return loadLLMConfig();
}