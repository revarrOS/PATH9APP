import { supabase } from '@/lib/supabase';
import type {
  BloodworkKeyContact,
  CreateKeyContactInput,
  UpdateKeyContactInput,
} from '../types/key-contacts.types';

const EDGE_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/bloodwork-key-contacts`;

export class KeyContactsService {
  private async getAuthHeaders() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    };
  }

  async getAll(): Promise<BloodworkKeyContact[]> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch contacts');
    }

    return response.json();
  }

  async getById(id: string): Promise<BloodworkKeyContact> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${EDGE_FUNCTION_URL}?id=${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch contact');
    }

    return response.json();
  }

  async create(input: CreateKeyContactInput): Promise<BloodworkKeyContact> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create contact');
    }

    return response.json();
  }

  async update(
    id: string,
    input: UpdateKeyContactInput
  ): Promise<BloodworkKeyContact> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${EDGE_FUNCTION_URL}?id=${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update contact');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${EDGE_FUNCTION_URL}?id=${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete contact');
    }
  }
}

export const keyContactsService = new KeyContactsService();
