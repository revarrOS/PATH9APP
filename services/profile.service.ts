import { supabase } from '@/lib/supabase';

export interface Profile {
  user_id: string;
  created_at: string;
  updated_at: string;
  timezone?: string | null;
  locale?: string | null;
}

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile: data as Profile | null, error: null };
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile: data as Profile | null, error: null };
  },
};
