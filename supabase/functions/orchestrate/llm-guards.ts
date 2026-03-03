import { AssembledPrompts } from "./types.ts";
import { LLMCallContext } from "./llm-types.ts";

export interface GuardViolation {
  code: string;
  message: string;
}

export interface GuardResult {
  valid: boolean;
  violations: GuardViolation[];
}

export function validateLLMCallContext(context: LLMCallContext): GuardResult {
  const violations: GuardViolation[] = [];

  if (!context.enforcement_passed) {
    violations.push({
      code: "ENFORCEMENT_NOT_PASSED",
      message: "LLM call refused: enforcement must pass before calling LLM",
    });
  }

  if (!context.prompt_order_valid) {
    violations.push({
      code: "INVALID_PROMPT_ORDER",
      message: "LLM call refused: prompt order validation failed",
    });
  }

  if (context.canon_appended_last === false) {
    violations.push({
      code: "CANON_NOT_LAST",
      message: "LLM call refused: canon context must be appended last",
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

export function validatePromptOrder(assembled: AssembledPrompts): boolean {
  const expectedOrder = [
    "gemma-core-system-v4",
    "boundary-safety-v4",
    "state-template-v2",
    "knowledge-canon-v2",
  ];

  if (assembled.metadata.prompt_versions.length < expectedOrder.length) {
    return false;
  }

  for (let i = 0; i < expectedOrder.length; i++) {
    if (assembled.metadata.prompt_versions[i] !== expectedOrder[i]) {
      return false;
    }
  }

  return true;
}

export function validateCanonPosition(assembled: AssembledPrompts): boolean {
  if (!assembled.metadata.canon_included) {
    return true;
  }

  if (assembled.prompts.length < 5) {
    return false;
  }

  const canonPrompt = assembled.prompts[assembled.prompts.length - 1];

  if (!canonPrompt.includes("KNOWLEDGE CANON CONTEXT")) {
    return false;
  }

  return true;
}

export function createLLMCallContext(
  assembled: AssembledPrompts,
  request_id: string,
  user_id: string
): LLMCallContext {
  const promptOrderValid = validatePromptOrder(assembled);
  const canonPositionValid = validateCanonPosition(assembled);

  return {
    request_id,
    user_id,
    enforcement_passed: true,
    prompt_order_valid: promptOrderValid,
    canon_appended_last: canonPositionValid,
  };
}