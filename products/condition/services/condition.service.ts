import { supabase } from '@/lib/supabase';
import type {
  ConditionEntry,
  CreateConditionEntryInput,
  UpdateConditionEntryInput,
  ConsultationQuestion,
  CreateConsultationQuestionInput,
  CareTeamMember,
  CreateCareTeamMemberInput,
  UpdateCareTeamMemberInput,
  SupportAccess,
  CreateSupportAccessInput,
  UpdateSupportAccessInput,
} from '../types/condition.types';

export class ConditionService {
  // Consultation Questions

  static async createQuestion(input: CreateConsultationQuestionInput): Promise<ConsultationQuestion> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('User not authenticated');
    }

    const user = session.user;

    const { data, error } = await supabase
      .from('condition_consultation_questions')
      .insert({
        user_id: user.id,
        ...input,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create consultation question');
    }

    return data;
  }

  static async getQuestions(): Promise<ConsultationQuestion[]> {
    const { data, error } = await supabase
      .from('condition_consultation_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  static async updateQuestion(
    questionId: string,
    updates: Partial<ConsultationQuestion>
  ): Promise<ConsultationQuestion> {
    const { data, error } = await supabase
      .from('condition_consultation_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update question');
    }

    return data;
  }

  static async deleteQuestion(questionId: string): Promise<void> {
    const { error } = await supabase
      .from('condition_consultation_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Care Team Management

  static async addCareTeamMember(input: CreateCareTeamMemberInput): Promise<CareTeamMember> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('User not authenticated');
    }

    const user = session.user;

    const { data, error } = await supabase
      .from('condition_care_team')
      .insert({
        user_id: user.id,
        ...input,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to add care team member');
    }

    return data;
  }

  static async getCareTeam(): Promise<CareTeamMember[]> {
    const { data, error } = await supabase
      .from('condition_care_team')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  static async updateCareTeamMember(
    memberId: string,
    input: UpdateCareTeamMemberInput
  ): Promise<CareTeamMember> {
    const { data, error } = await supabase
      .from('condition_care_team')
      .update(input)
      .eq('id', memberId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update care team member');
    }

    return data;
  }

  static async deleteCareTeamMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('condition_care_team')
      .delete()
      .eq('id', memberId);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Support Access Management

  static async createSupportAccess(input: CreateSupportAccessInput): Promise<SupportAccess> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('User not authenticated');
    }

    const user = session.user;

    const { data, error } = await supabase
      .from('condition_support_access')
      .insert({
        owner_id: user.id,
        ...input,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create support access');
    }

    return data;
  }

  static async getSupportAccess(): Promise<SupportAccess[]> {
    const { data, error } = await supabase
      .from('condition_support_access')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  static async updateSupportAccess(
    accessId: string,
    input: UpdateSupportAccessInput
  ): Promise<SupportAccess> {
    const { data, error } = await supabase
      .from('condition_support_access')
      .update(input)
      .eq('id', accessId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update support access');
    }

    return data;
  }

  static async revokeSupportAccess(accessId: string): Promise<void> {
    const { error } = await supabase
      .from('condition_support_access')
      .update({ status: 'revoked' })
      .eq('id', accessId);

    if (error) {
      throw new Error(error.message);
    }
  }

  static async deleteSupportAccess(accessId: string): Promise<void> {
    const { error } = await supabase
      .from('condition_support_access')
      .delete()
      .eq('id', accessId);

    if (error) {
      throw new Error(error.message);
    }
  }

  static async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('condition_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
