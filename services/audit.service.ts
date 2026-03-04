import { supabase } from '@/lib/supabase';

export interface AuditEvent {
  id: string;
  user_id: string;
  event_type: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAuditEventParams {
  event_type: string;
  metadata?: Record<string, unknown>;
}

export const auditService = {
  async createEvent(userId: string, params: CreateAuditEventParams) {
    const { data, error } = await supabase
      .from('audit_events')
      .insert({
        user_id: userId,
        event_type: params.event_type,
        metadata: params.metadata,
      })
      .select()
      .maybeSingle();

    if (error) {
      return { event: null, error: error.message };
    }

    return { event: data as AuditEvent | null, error: null };
  },

  async getUserEvents(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { events: null, error: error.message };
    }

    return { events: data as AuditEvent[], error: null };
  },

  async getEventsByType(userId: string, eventType: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { events: null, error: error.message };
    }

    return { events: data as AuditEvent[], error: null };
  },
};
