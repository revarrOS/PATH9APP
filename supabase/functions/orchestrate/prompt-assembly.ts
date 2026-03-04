import { PromptRegistry, AssembledPrompts, StateContext } from "./types.ts";

function hydrateTemplate(template: string, state: StateContext): string {
  let hydrated = template;

  const simpleReplacements: Record<string, string> = {
    "{{journey_phase}}": state.journey_phase || "Chaos",
    "{{time_in_journey}}": state.time_in_journey || "Early",
    "{{confidence_level}}": state.confidence_level || "Low",
    "{{care_load}}": state.care_load || "Low",
    "{{emotional_load}}": state.emotional_load || "Low",
    "{{session_count}}": state.session_count?.toString() || "0",
    "{{last_interaction_date}}": state.last_interaction_date || "none",
    "{{user_goals}}": state.user_goals || "",
    "{{focus_areas}}": state.focus_areas || "",
    "{{recent_topics}}": state.recent_topics || "",
    "{{pending_questions}}": state.pending_questions || "",
    "{{conversation_tone}}": state.conversation_tone || "neutral",
  };

  for (const [key, value] of Object.entries(simpleReplacements)) {
    hydrated = hydrated.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  const conditionalBlocks = [
    {
      pattern: /\{\{#if user_goals\}\}([\s\S]*?)\{\{\/if\}\}/g,
      condition: !!state.user_goals,
    },
    {
      pattern: /\{\{#if focus_areas\}\}([\s\S]*?)\{\{\/if\}\}/g,
      condition: !!state.focus_areas,
    },
    {
      pattern: /\{\{#if recent_topics\}\}([\s\S]*?)\{\{\/if\}\}/g,
      condition: !!state.recent_topics,
    },
    {
      pattern: /\{\{#if pending_questions\}\}([\s\S]*?)\{\{\/if\}\}/g,
      condition: !!state.pending_questions,
    },
    {
      pattern: /\{\{#if conversation_tone\}\}([\s\S]*?)\{\{\/if\}\}/g,
      condition: !!state.conversation_tone,
    },
  ];

  for (const block of conditionalBlocks) {
    hydrated = hydrated.replace(block.pattern, (_, content) => {
      return block.condition ? content : "";
    });
  }

  hydrated = hydrated.replace(/\n{3,}/g, "\n\n");

  return hydrated.trim();
}

export function assemblePrompts(
  registry: PromptRegistry,
  state: StateContext,
  canonContext?: string,
  domainContext?: string
): AssembledPrompts {
  const hydratedState = hydrateTemplate(registry.stateTemplate.content, state);

  const prompts = [
    registry.coreSystem.content,
    registry.boundarySafety.content,
    hydratedState,
    registry.knowledgeCanon.content,
  ];

  if (canonContext) {
    prompts.push(canonContext);
  }

  if (domainContext) {
    prompts.push(domainContext);
  }

  const prompt_versions = [
    registry.coreSystem.metadata.id,
    registry.boundarySafety.metadata.id,
    registry.stateTemplate.metadata.id,
    registry.knowledgeCanon.metadata.id,
  ];

  if (canonContext) {
    prompt_versions.push('canon_context_v1');
  }

  if (domainContext) {
    prompt_versions.push('domain_context_v1');
  }

  return {
    prompts,
    metadata: {
      prompt_versions,
      assembly_timestamp: new Date().toISOString(),
      state_hydrated: true,
      canon_included: !!canonContext,
      domain_context_included: !!domainContext,
    },
  };
}

export function validatePromptOrder(assembled: AssembledPrompts): boolean {
  const requiredOrder = [
    "gemma-core-system-v4",
    "boundary-safety-v4",
    "state-template-v2",
    "knowledge-canon-v2",
  ];

  const optionalSuffixes = ["canon_context_v1", "domain_context_v1"];

  if (assembled.metadata.prompt_versions.length < requiredOrder.length) {
    return false;
  }

  for (let i = 0; i < requiredOrder.length; i++) {
    if (assembled.metadata.prompt_versions[i] !== requiredOrder[i]) {
      return false;
    }
  }

  for (let i = requiredOrder.length; i < assembled.metadata.prompt_versions.length; i++) {
    if (!optionalSuffixes.includes(assembled.metadata.prompt_versions[i])) {
      return false;
    }
  }

  return true;
}