import { supabase } from '@/lib/supabase';

export type QuestionStatus = 'open' | 'asked' | 'resolved' | 'addressed';
export type QuestionSource = 'user' | 'gemma';
export type QuestionDomain = 'bloodwork' | 'condition' | 'nutrition' | 'general';

export interface SourceContext {
  related_entry_id?: string;
}

export interface ConsultationQuestion {
  id: string;
  questionText: string;
  status: QuestionStatus;
  relatedMarkers?: string[];
  relatedTerms?: string[];
  source: QuestionSource;
  sourceContext?: SourceContext;
  createdAt: string;
  updatedAt?: string;
  domain: QuestionDomain;
}

export const sharedConsultationPrepStore = {
  async getAll(domainFilter?: QuestionDomain): Promise<ConsultationQuestion[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('consultation_questions')
        .select('*')
        .eq('user_id', user.id);

      if (domainFilter) {
        query = query.eq('domain', domainFilter);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

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
        relatedTerms: [],
        source: row.source === 'ai_suggested' ? 'gemma' : 'user',
        sourceContext: row.related_entry_id ? { related_entry_id: row.related_entry_id } : undefined,
        domain: row.domain as QuestionDomain,
      }));
    } catch (error) {
      console.error('Error reading consultation prep questions:', error);
      return [];
    }
  },

  async addQuestion(
    questionText: string,
    domain: QuestionDomain,
    options?: {
      relatedMarkers?: string[];
      relatedTerms?: string[];
      source?: QuestionSource;
      sourceContext?: SourceContext;
      questionIntent?: string;
      questionKeywords?: string[];
      allowDuplicates?: boolean;
    }
  ): Promise<ConsultationQuestion | { isDuplicate: true; existingQuestion: ConsultationQuestion }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!options?.allowDuplicates) {
        const questions = await this.getAll(domain);
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

      const insertPayload = {
        user_id: user.id,
        question_text: questionText,
        domain: domain,
        source: options?.source === 'gemma' ? 'ai_suggested' : 'user_added',
        priority: 'general',
        is_answered: false,
        related_entry_id: options?.sourceContext?.related_entry_id || null,
      };

      console.log('[ConsultationPrepStore] Saving question:', {
        domain,
        questionText: questionText.substring(0, 50) + '...',
        userSelected: true
      });

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
        status: 'open',
        relatedMarkers: options?.relatedMarkers || [],
        relatedTerms: options?.relatedTerms || [],
        source: options?.source || 'user',
        sourceContext: options?.sourceContext,
        createdAt: data.created_at,
        domain: data.domain as QuestionDomain,
      };

      console.log('[ConsultationPrepStore] Question saved successfully:', {
        id: newQuestion.id,
        domain: newQuestion.domain
      });

      return newQuestion;
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  },

  findSimilarQuestion(
    questionText: string,
    questions: ConsultationQuestion[],
    questionIntent?: string,
    questionKeywords?: string[] | null,
    relatedMarkers?: string[]
  ): ConsultationQuestion | null {
    const normalizedNewQuestion = questionText.toLowerCase().trim();

    for (const existingQuestion of questions) {
      const normalizedExisting = existingQuestion.questionText.toLowerCase().trim();

      if (normalizedExisting === normalizedNewQuestion) {
        return existingQuestion;
      }

      const levenshteinDistance = this.calculateLevenshtein(
        normalizedNewQuestion,
        normalizedExisting
      );
      const maxLength = Math.max(normalizedNewQuestion.length, normalizedExisting.length);
      const similarity = 1 - levenshteinDistance / maxLength;

      if (similarity > 0.85) {
        return existingQuestion;
      }

      if (questionIntent && questionKeywords && questionKeywords.length > 0) {
        const keywordOverlap = this.calculateKeywordOverlap(
          questionKeywords,
          existingQuestion.questionText
        );
        if (keywordOverlap > 0.6) {
          return existingQuestion;
        }
      }

      if (relatedMarkers && relatedMarkers.length > 0 && existingQuestion.relatedMarkers) {
        const markerOverlap = this.calculateArrayOverlap(
          relatedMarkers,
          existingQuestion.relatedMarkers
        );
        if (markerOverlap > 0.7 && similarity > 0.5) {
          return existingQuestion;
        }
      }
    }

    return null;
  },

  calculateLevenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  },

  calculateKeywordOverlap(keywords: string[], text: string): number {
    const lowerText = text.toLowerCase();
    const matchCount = keywords.filter((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    ).length;
    return matchCount / keywords.length;
  },

  calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1.map((s) => s.toLowerCase()));
    const set2 = new Set(arr2.map((s) => s.toLowerCase()));
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  },

  async updateQuestion(
    id: string,
    updates: {
      questionText?: string;
      relatedMarkers?: string[];
      relatedTerms?: string[];
      domain?: QuestionDomain;
    }
  ): Promise<void> {
    try {
      const updatePayload: any = {
        question_text: updates.questionText,
      };

      if (updates.domain) {
        updatePayload.domain = updates.domain;
        console.log('[ConsultationPrepStore] Updating question domain:', {
          id,
          newDomain: updates.domain
        });
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
    try {
      const { error } = await supabase
        .from('consultation_questions')
        .update({
          is_answered: status === 'addressed',
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating question status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating question status:', error);
      throw error;
    }
  },

  async deleteQuestion(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('consultation_questions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting question:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },
};
