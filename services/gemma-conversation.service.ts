import { supabase } from '@/lib/supabase';

export interface GemmaMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  domain?: 'bloodwork' | 'condition' | 'nutrition';
  consultationPrepSuggestion?: {
    suggestedQuestion: string;
    relatedMarkers?: string[];
    relatedTerms?: string[];
    sourceContext?: Record<string, any>;
  };
}

export interface GemmaConversation {
  id: string;
  user_id: string;
  messages: GemmaMessage[];
  context_metadata: {
    current_domain?: 'bloodwork' | 'condition' | 'nutrition';
    last_updated: string;
  };
  created_at: string;
  updated_at: string;
}

class GemmaConversationService {
  private cachedConversation: GemmaConversation | null = null;

  async getOrCreateConversation(): Promise<GemmaConversation> {
    if (this.cachedConversation) {
      return this.cachedConversation;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: existing, error: fetchError } = await supabase
      .from('gemma_conversations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch conversation: ${fetchError.message}`);
    }

    if (existing) {
      this.cachedConversation = existing as GemmaConversation;
      return this.cachedConversation;
    }

    const { data: newConversation, error: createError } = await supabase
      .from('gemma_conversations')
      .insert({
        user_id: user.id,
        messages: [],
        context_metadata: {
          last_updated: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (createError || !newConversation) {
      throw new Error(`Failed to create conversation: ${createError?.message}`);
    }

    this.cachedConversation = newConversation as GemmaConversation;
    return this.cachedConversation;
  }

  async addMessage(message: GemmaMessage, domain: 'bloodwork' | 'condition' | 'nutrition'): Promise<void> {
    const conversation = await this.getOrCreateConversation();

    const updatedMessages = [...conversation.messages, { ...message, domain }];

    const { error } = await supabase
      .from('gemma_conversations')
      .update({
        messages: updatedMessages,
        context_metadata: {
          current_domain: domain,
          last_updated: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id);

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    this.cachedConversation = {
      ...conversation,
      messages: updatedMessages,
      context_metadata: {
        current_domain: domain,
        last_updated: new Date().toISOString(),
      },
    };
  }

  async getMessages(): Promise<GemmaMessage[]> {
    const conversation = await this.getOrCreateConversation();
    return conversation.messages;
  }

  async clearConversation(): Promise<void> {
    const conversation = await this.getOrCreateConversation();

    const { error } = await supabase
      .from('gemma_conversations')
      .update({
        messages: [],
        context_metadata: {
          last_updated: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id);

    if (error) {
      throw new Error(`Failed to clear conversation: ${error.message}`);
    }

    this.cachedConversation = {
      ...conversation,
      messages: [],
    };
  }

  clearCache(): void {
    this.cachedConversation = null;
  }

  getDomainContextPrompt(domain: 'bloodwork' | 'condition' | 'nutrition'): string {
    if (domain === 'bloodwork') {
      return 'Context: User is now discussing bloodwork and lab results.';
    } else if (domain === 'condition') {
      return 'Context: User is now discussing their medical condition and clinical documents.';
    } else {
      return 'Context: User is now discussing nutrition and food patterns.';
    }
  }
}

export const gemmaConversationService = new GemmaConversationService();
