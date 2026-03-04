import { supabase } from '@/lib/supabase';
import {
  RequestEnvelope,
  OrchestrationResponse,
  StandardError,
} from '@/types/request-envelope';

const getApiUrl = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');
  }
  return supabaseUrl;
};

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

export const orchestrationService = {
  async createEnvelope(
    journey_state: Record<string, unknown>,
    consent_flags?: Partial<RequestEnvelope['consent_flags']>
  ): Promise<RequestEnvelope> {
    const user_id = await getCurrentUserId();

    if (!user_id) {
      throw new Error('User must be authenticated to create request envelope');
    }

    return {
      user_id,
      journey_state,
      consent_flags: {
        data_processing: consent_flags?.data_processing ?? true,
        analytics: consent_flags?.analytics ?? false,
        third_party_sharing: consent_flags?.third_party_sharing ?? false,
      },
      request_id: generateRequestId(),
    };
  },

  async orchestrate<T = unknown>(
    envelope: RequestEnvelope
  ): Promise<OrchestrationResponse<T>> {
    const token = await getAuthToken();

    if (!token) {
      return {
        success: false,
        error: {
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          request_id: envelope.request_id,
        },
        request_id: envelope.request_id,
      };
    }

    try {
      const apiUrl = `${getApiUrl()}/functions/v1/orchestrate`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data as StandardError,
          request_id: envelope.request_id,
        };
      }

      return data as OrchestrationResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: {
          error: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
          request_id: envelope.request_id,
        },
        request_id: envelope.request_id,
      };
    }
  },

  async request<T = unknown>(
    journey_state: Record<string, unknown>,
    consent_flags?: Partial<RequestEnvelope['consent_flags']>
  ): Promise<OrchestrationResponse<T>> {
    const envelope = await this.createEnvelope(journey_state, consent_flags);
    return this.orchestrate<T>(envelope);
  },
};
