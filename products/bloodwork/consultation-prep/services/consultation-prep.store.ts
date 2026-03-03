import { supabase } from '@/lib/supabase';
import {
  ConsultationQuestion,
  QuestionStatus,
  QuestionSource,
  SourceContext,
} from '../types/consultation-prep.types';

export const consultationPrepStore = {
  async getAll(): Promise<ConsultationQuestion[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('consultation_questions')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', 'bloodwork')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error reading consultation prep questions:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        questionText: row.question_text,
        createdAt: row.created_at,
        updatedAt: row.created_at,
        status: row.is_answered ? 'addressed' : 'open',
        relatedMarkers: [],
        source: row.source === 'ai_suggested' ? 'gemma' : 'manual',
        sourceContext: row.related_entry_id ? { related_entry_id: row.related_entry_id } : undefined,
      }));
    } catch (error) {
      console.error('Error reading consultation prep questions:', error);
      return [];
    }
  },

  async addQuestion(
    questionText: string,
    options?: {
      relatedMarkers?: string[];
      source?: QuestionSource;
      sourceContext?: SourceContext;
      questionIntent?: string;
      questionKeywords?: string[];
      allowDuplicates?: boolean;
      domain?: string;
    }
  ): Promise<ConsultationQuestion | { isDuplicate: true; existingQuestion: ConsultationQuestion }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const questions = await this.getAll();

      if (!options?.allowDuplicates) {
        const similarQuestion = this.findSimilarQuestion(
          questionText,
          questions,
          options?.questionIntent,
          options?.questionKeywords,
          options?.relatedMarkers
        );

        if (similarQuestion) {
          return {
            isDuplicate: true,
            existingQuestion: similarQuestion,
          };
        }
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      const insertPayload = {
        user_id: user.id,
        question_text: questionText,
        domain: options?.domain || 'bloodwork',
        source: options?.source === 'gemma' ? 'ai_suggested' : 'user_added',
        priority: 'general',
        is_answered: false,
        related_entry_id: options?.sourceContext?.related_entry_id || null,
      };

      const { data, error } = await supabase
        .from('consultation_questions')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newQuestion: ConsultationQuestion = {
        id: data.id,
        questionText: data.question_text,
        createdAt: data.created_at,
        updatedAt: data.created_at,
        status: 'open',
        relatedMarkers: options?.relatedMarkers,
        source: options?.source || 'manual',
        sourceContext: options?.sourceContext,
      };

      return newQuestion;
    } catch (error) {
      console.error('Error adding consultation question:', error);
      throw error;
    }
  },

  findSimilarQuestion(
    questionText: string,
    existingQuestions: ConsultationQuestion[],
    questionIntent?: string,
    questionKeywords?: string[],
    relatedMarkers?: string[]
  ): ConsultationQuestion | null {
    const lowerQuestion = questionText.toLowerCase();

    for (const existing of existingQuestions) {
      // Only check open questions (not already asked/resolved)
      if (existing.status !== 'open') continue;

      const lowerExisting = existing.questionText.toLowerCase();

      // Check 1: Exact or near-exact text match (>85% similarity)
      if (this.calculateTextSimilarity(lowerQuestion, lowerExisting) > 0.85) {
        return existing;
      }

      // Check 2: Same markers + same intent keywords
      if (relatedMarkers && existing.relatedMarkers) {
        const markerOverlap = relatedMarkers.filter(m =>
          existing.relatedMarkers?.includes(m)
        ).length;

        if (markerOverlap > 0) {
          // Check for intent keyword overlap
          const intentKeywords = [
            'why', 'explain', 'above', 'below', 'high', 'low',
            'monitoring', 'trend', 'pattern', 'interact', 'relate'
          ];

          const questionIntentWords = intentKeywords.filter(kw => lowerQuestion.includes(kw));
          const existingIntentWords = intentKeywords.filter(kw => lowerExisting.includes(kw));

          const intentOverlap = questionIntentWords.filter(kw =>
            existingIntentWords.includes(kw)
          ).length;

          // If same markers and similar intent, likely duplicate
          if (markerOverlap === relatedMarkers.length && intentOverlap >= 2) {
            return existing;
          }
        }
      }

      // Check 3: Keyword-based similarity (if provided)
      if (questionKeywords && questionKeywords.length > 0) {
        const existingText = existing.questionText.toLowerCase();
        const keywordMatches = questionKeywords.filter(kw =>
          existingText.includes(kw.toLowerCase())
        ).length;

        if (keywordMatches >= Math.ceil(questionKeywords.length * 0.7)) {
          return existing;
        }
      }
    }

    return null;
  },

  calculateTextSimilarity(str1: string, str2: string): number {
    // Simple word-based Jaccard similarity
    const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  },

  async updateQuestion(
    id: string,
    updates: Partial<Omit<ConsultationQuestion, 'id' | 'createdAt'>> & { domain?: string }
  ): Promise<void> {
    try {
      const updatePayload: any = {
        question_text: updates.questionText,
        is_answered: updates.status === 'addressed',
      };

      if (updates.domain) {
        updatePayload.domain = updates.domain;
      }

      const { error } = await supabase
        .from('consultation_questions')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        console.error('Error updating consultation question:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating consultation question:', error);
      throw error;
    }
  },

  async updateStatus(id: string, status: QuestionStatus): Promise<void> {
    return this.updateQuestion(id, { status });
  },

  async deleteQuestion(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('consultation_questions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting consultation question:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting consultation question:', error);
      throw error;
    }
  },

  async getByStatus(status: QuestionStatus): Promise<ConsultationQuestion[]> {
    const questions = await this.getAll();
    return questions.filter((q) => q.status === status);
  },

  async getByMarker(marker: string): Promise<ConsultationQuestion[]> {
    const questions = await this.getAll();
    return questions.filter(
      (q) => q.relatedMarkers && q.relatedMarkers.includes(marker)
    );
  },
};
