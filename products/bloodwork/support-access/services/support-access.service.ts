import { supabase } from '@/lib/supabase';
import type {
  BloodworkSupportInvitation,
  BloodworkSupportAccess,
  CreateInviteInput,
  SupportAccessResponse,
} from '../types/support-access.types';

const EDGE_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/bloodwork-support-access`;

export class SupportAccessService {
  private async getAuthHeaders() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    };
  }

  async getInvitations(): Promise<BloodworkSupportInvitation[]> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${EDGE_FUNCTION_URL}/invitations`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch invitations');
    }

    return response.json();
  }

  async getAccess(): Promise<SupportAccessResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${EDGE_FUNCTION_URL}/access`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch access');
    }

    return response.json();
  }

  async createInvite(
    input: CreateInviteInput
  ): Promise<BloodworkSupportInvitation> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${EDGE_FUNCTION_URL}/invite`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create invitation');
    }

    return response.json();
  }

  async acceptInvite(
    invitationToken: string
  ): Promise<BloodworkSupportAccess> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${EDGE_FUNCTION_URL}/accept`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ invitation_token: invitationToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to accept invitation');
    }

    return response.json();
  }

  async revokeAccess(accessId: string): Promise<void> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${EDGE_FUNCTION_URL}/revoke?id=${accessId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to revoke access');
    }
  }

  async cancelInvite(inviteId: string): Promise<void> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(
      `${EDGE_FUNCTION_URL}/cancel-invite?id=${inviteId}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel invitation');
    }
  }
}

export const supportAccessService = new SupportAccessService();
