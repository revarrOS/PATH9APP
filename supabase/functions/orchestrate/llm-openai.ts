import { LLMConfig, LLMResponse } from "./llm-types.ts";

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature: number;
  max_tokens: number;
}

interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callOpenAIWithTimeout(
  url: string,
  body: OpenAIChatRequest,
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
        "Authorization": `Bearer ${apiKey}`,
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

export async function callOpenAI(
  prompts: string[],
  config: LLMConfig,
  userMessage?: string
): Promise<LLMResponse> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return {
      success: false,
      response: "",
      metadata: {
        model: config.model,
        provider: "openai",
        timestamp: new Date().toISOString(),
      },
      error: "OPENAI_API_KEY not configured",
    };
  }

  const messages: OpenAIMessage[] = prompts.map((prompt) => ({
    role: "system",
    content: prompt,
  }));

  if (userMessage) {
    messages.push({
      role: "user",
      content: userMessage,
    });
  }

  const requestBody: OpenAIChatRequest = {
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.max_tokens,
  };

  let lastError: Error | null = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= config.max_retries; attempt++) {
    try {
      const response = await callOpenAIWithTimeout(
        "https://api.openai.com/v1/chat/completions",
        requestBody,
        apiKey,
        config.timeout_ms
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data: OpenAIChatResponse = await response.json();

      return {
        success: true,
        response: data.choices[0].message.content,
        metadata: {
          model: data.model,
          provider: "openai",
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
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
      provider: "openai",
      timestamp: new Date().toISOString(),
    },
    error: lastError?.message || "Unknown error",
  };
}