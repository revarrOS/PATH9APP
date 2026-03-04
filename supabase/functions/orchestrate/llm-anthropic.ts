import { LLMConfig, LLMResponse } from "./llm-types.ts";

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  system: Array<{ type: string; text: string }>;
  messages: AnthropicMessage[];
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

async function callAnthropicWithTimeout(
  url: string,
  body: AnthropicRequest,
  apiKey: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function callAnthropic(
  prompts: string[],
  config: LLMConfig,
  userMessage?: string,
  conversationHistory?: AnthropicMessage[]
): Promise<LLMResponse> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return {
      success: false,
      response: "",
      metadata: {
        model: config.model,
        provider: "anthropic",
        timestamp: new Date().toISOString(),
      },
      error: "ANTHROPIC_API_KEY not configured",
    };
  }

  const messages: AnthropicMessage[] = conversationHistory || [];

  messages.push({
    role: "user",
    content: userMessage || "Please respond based on the system context provided.",
  });

  const requestBody: AnthropicRequest = {
    model: config.model,
    max_tokens: config.max_tokens,
    temperature: config.temperature,
    system: prompts.map(text => ({ type: "text", text })),
    messages: messages,
  };

  let lastError: Error | null = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= config.max_retries; attempt++) {
    try {
      const response = await callAnthropicWithTimeout(
        "https://api.anthropic.com/v1/messages",
        requestBody,
        apiKey,
        config.timeout_ms
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data: AnthropicResponse = await response.json();

      return {
        success: true,
        response: data.content[0].text,
        metadata: {
          model: data.model,
          provider: "anthropic",
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens: data.usage.input_tokens + data.usage.output_tokens,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      lastError = error as Error;
      retryCount = attempt;

      if (attempt < config.max_retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  return {
    success: false,
    response: "",
    metadata: {
      model: config.model,
      provider: "anthropic",
      timestamp: new Date().toISOString(),
    },
    error: lastError?.message || "Unknown error",
  };
}