import { supabase } from '@/lib/supabase';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export const authService = {
  async signUp(credentials: AuthCredentials): Promise<AuthResponse> {
    const { error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async signOut(): Promise<AuthResponse> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error: error.message };
    }

    return { session: data.session, error: null };
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  },
};
