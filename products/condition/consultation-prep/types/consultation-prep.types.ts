export type QuestionStatus = 'open' | 'asked' | 'resolved';
export type QuestionSource = 'ai' | 'user';

export interface SourceContext {
  documentDate?: string;
  documentType?: string;
  clinicianName?: string;
}

export interface ConsultationQuestion {
  id: string;
  questionText: string;
  status: QuestionStatus;
  relatedTerms: string[];
  source: QuestionSource;
  sourceContext?: SourceContext;
  createdAt: number;
}

export interface ConsultationPrepStore {
  questions: ConsultationQuestion[];
}
