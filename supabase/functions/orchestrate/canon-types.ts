export interface CanonDocument {
  id: string;
  title: string;
  pillar: string;
  journey_phase: string;
  tone: string;
  sensitivity: string;
  version: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface CanonChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  pillar: string;
  journey_phase: string;
  tone: string;
  sensitivity: string;
  version: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface RetrievalContext {
  journey_phase?: string;
  topic_hint?: string;
  pillar?: string;
}

export interface RetrievalResult {
  chunks: CanonChunk[];
  count: number;
  canon_version_ids: string[];
}