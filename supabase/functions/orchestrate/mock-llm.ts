import { LLMResponse } from "./llm-types.ts";

export async function callMockLLM(
  userMessage?: string
): Promise<LLMResponse> {
  const stubResponse = userMessage
    ? `Hey. I'm here.`
    : `Hi. I'm Gemma. I'm here to support you through your health journey, at whatever pace feels right.`;

  return {
    success: true,
    response: stubResponse,
    metadata: {
      model: "mock-gemma-v1",
      provider: "mock",
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
      timestamp: new Date().toISOString(),
    },
  };
}