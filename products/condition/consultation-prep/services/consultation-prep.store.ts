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
        .eq('domain', 'condition')
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
        relatedTerms: [],
        source: row.source === 'ai_suggested' ? 'gemma' : 'user',
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
      relatedTerms?: string[];
      source?: QuestionSource;
      sourceContext?: SourceContext;
      domain?: string;
    }
  ): Promise<ConsultationQuestion> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      const insertPayload = {
        user_id: user.id,
        question_text: questionText,
        domain: options?.domain || 'condition',
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
        status: 'open',
        relatedTerms: options?.relatedTerms || [],
        source: options?.source || 'user',
        sourceContext: options?.sourceContext,
        createdAt: data.created_at,
      };

      return newQuestion;
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  },

  async updateQuestion(
    id: string,
    updates: {
      questionText?: string;
      relatedTerms?: string[];
      domain?: string;
    }
  ): Promise<void> {
    try {
      const updatePayload: any = {
        question_text: updates.questionText,
      };

      if (updates.domain) {
        updatePayload.domain = updates.domain;
      }

      const { error } = await supabase
        .from('consultation_questions')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        console.error('Error updating question:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating question:', error);
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
