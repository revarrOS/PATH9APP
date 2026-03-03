import {
  PromptRegistry,
  StateContext,
  EnforcementResult,
  EnforcementViolation,
  AssembledPrompts,
} from "./types.ts";
import { assemblePrompts, validatePromptOrder } from "./prompt-assembly.ts";

const REQUIRED_STATE_FIELDS = ["journey_phase"];

function validateStateContext(state: StateContext): EnforcementViolation[] {
  const violations: EnforcementViolation[] = [];

  if (!state || typeof state !== "object") {
    violations.push({
      code: "MISSING_STATE",
      message: "State context is required",
    });
    return violations;
  }

  for (const field of REQUIRED_STATE_FIELDS) {
    if (!(field in state) || state[field] === undefined || state[field] === null) {
      violations.push({
        code: "MISSING_STATE_FIELD",
        message: `Required state field missing: ${field}`,
        field,
      });
    }
  }

  return violations;
}

function validatePromptRegistry(registry: PromptRegistry): EnforcementViolation[] {
  const violations: EnforcementViolation[] = [];

  if (!registry.coreSystem) {
    violations.push({
      code: "MISSING_PROMPT",
      message: "Core system prompt is missing",
      field: "coreSystem",
    });
  }

  if (!registry.boundarySafety) {
    violations.push({
      code: "MISSING_PROMPT",
      message: "Boundary safety prompt is missing",
      field: "boundarySafety",
    });
  }

  if (!registry.stateTemplate) {
    violations.push({
      code: "MISSING_PROMPT",
      message: "State template prompt is missing",
      field: "stateTemplate",
    });
  }

  if (!registry.knowledgeCanon) {
    violations.push({
      code: "MISSING_PROMPT",
      message: "Knowledge canon prompt is missing",
      field: "knowledgeCanon",
    });
  }

  return violations;
}

function validateAssembledPrompts(assembled: AssembledPrompts): EnforcementViolation[] {
  const violations: EnforcementViolation[] = [];

  const minPrompts = 4;
  const maxPrompts = 6;
  if (!assembled.prompts || assembled.prompts.length < minPrompts || assembled.prompts.length > maxPrompts) {
    violations.push({
      code: "INCOMPLETE_PROMPTS",
      message: `Expected ${minPrompts}-${maxPrompts} prompts, got ${assembled.prompts?.length || 0}`,
    });
  }

  if (!validatePromptOrder(assembled)) {
    violations.push({
      code: "INCORRECT_PROMPT_ORDER",
      message: "Prompts are not in the required order",
    });
  }

  if (!assembled.metadata.state_hydrated) {
    violations.push({
      code: "STATE_NOT_HYDRATED",
      message: "State template was not hydrated",
    });
  }

  return violations;
}

export function enforcePrompts(
  registry: PromptRegistry,
  state: StateContext,
  canonContext?: string,
  domainContext?: string
): EnforcementResult {
  const violations: EnforcementViolation[] = [];

  const registryViolations = validatePromptRegistry(registry);
  violations.push(...registryViolations);

  if (registryViolations.length > 0) {
    return { valid: false, violations };
  }

  const stateViolations = validateStateContext(state);
  violations.push(...stateViolations);

  if (stateViolations.length > 0) {
    return { valid: false, violations };
  }

  let assembled: AssembledPrompts;
  try {
    assembled = assemblePrompts(registry, state, canonContext, domainContext);
  } catch (error) {
    violations.push({
      code: "ASSEMBLY_FAILED",
      message: error instanceof Error ? error.message : "Failed to assemble prompts",
    });
    return { valid: false, violations };
  }

  const assemblyViolations = validateAssembledPrompts(assembled);
  violations.push(...assemblyViolations);

  if (assemblyViolations.length > 0) {
    return { valid: false, violations };
  }

  return {
    valid: true,
    violations: [],
    assembled_prompts: assembled,
  };
}