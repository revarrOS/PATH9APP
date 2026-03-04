import { createClient } from "npm:@supabase/supabase-js@2";
import { RetrievalContext, RetrievalResult, CanonChunk } from "./canon-types.ts";

const MAX_CHUNKS = 3;
const CONFIDENCE_THRESHOLD = 0.5;

function calculateRelevanceScore(
  chunk: CanonChunk,
  context: RetrievalContext
): number {
  let score = 0;

  if (context.journey_phase && chunk.journey_phase === context.journey_phase) {
    score += 0.5;
  }

  if (context.pillar && chunk.pillar === context.pillar) {
    score += 0.3;
  }

  if (context.topic_hint && chunk.tags.length > 0) {
    const topicLower = context.topic_hint.toLowerCase();
    const hasMatchingTag = chunk.tags.some((tag) =>
      tag.toLowerCase().includes(topicLower) || topicLower.includes(tag.toLowerCase())
    );
    if (hasMatchingTag) {
      score += 0.2;
    }
  }

  return score;
}

export async function retrieveCanonChunks(
  context: RetrievalContext
): Promise<RetrievalResult> {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let query = supabaseClient.from("canon_chunks").select("*");

    if (context.journey_phase) {
      query = query.eq("journey_phase", context.journey_phase);
    }

    if (context.pillar) {
      query = query.eq("pillar", context.pillar);
    }

    const { data: chunks, error } = await query;

    if (error) {
      console.error("Canon retrieval error:", error);
      return { chunks: [], count: 0, canon_version_ids: [] };
    }

    if (!chunks || chunks.length === 0) {
      return { chunks: [], count: 0, canon_version_ids: [] };
    }

    const scoredChunks = chunks
      .map((chunk) => ({
        chunk: chunk as CanonChunk,
        score: calculateRelevanceScore(chunk as CanonChunk, context),
      }))
      .filter((item) => item.score >= CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CHUNKS);

    if (scoredChunks.length === 0) {
      return { chunks: [], count: 0, canon_version_ids: [] };
    }

    const resultChunks = scoredChunks.map((item) => item.chunk);
    const versionIds = Array.from(
      new Set(resultChunks.map((chunk) => `${chunk.pillar}-${chunk.version}`))
    );

    return {
      chunks: resultChunks,
      count: resultChunks.length,
      canon_version_ids: versionIds,
    };
  } catch (error) {
    console.error("Canon retrieval failed:", error);
    return { chunks: [], count: 0, canon_version_ids: [] };
  }
}

export function formatCanonContext(chunks: CanonChunk[]): string {
  if (chunks.length === 0) {
    return "";
  }

  const sections = chunks.map((chunk, index) => {
    return `[Canon Reference ${index + 1}: ${chunk.pillar}]\n${chunk.content}`;
  });

  return `
KNOWLEDGE CANON CONTEXT

The following references from the knowledge canon may be relevant to this conversation:

${sections.join("\n\n---\n\n")}

END CANON CONTEXT
`.trim();
}