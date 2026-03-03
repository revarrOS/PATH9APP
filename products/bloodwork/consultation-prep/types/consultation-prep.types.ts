export type QuestionStatus = 'open' | 'asked' | 'resolved';

export type QuestionSource = 'gemma' | 'manual';

export interface SourceContext {
  testDate?: string;
  marker?: string;
  value?: string;
  range?: string;
}

export interface ConsultationQuestion {
  id: string;
  questionText: string;
  createdAt: string;
  status: QuestionStatus;
  relatedMarkers?: string[];
  source?: QuestionSource;
  sourceContext?: SourceContext;
  updatedAt?: string;
}

export interface ConsultationPrepStore {
  questions: ConsultationQuestion[];
}
