import { supabase } from '@/lib/supabase';

export interface UserPreferences {
  user_id: string;
  saved_locations: string[];
  bloodwork_sex?: string | null;
  bloodwork_age_group?: string | null;
  created_at: string;
  updated_at: string;
}

export class UserPreferencesService {
  static async getPreferences(): Promise<UserPreferences | null> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('User not authenticated');
    }

    const user = session.user;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async getSavedLocations(): Promise<string[]> {
    const preferences = await this.getPreferences();
    return preferences?.saved_locations || [];
  }

  static async addSavedLocation(location: string): Promise<string[]> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('User not authenticated');
    }

    const user = session.user;

    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      throw new Error('Location cannot be empty');
    }

    const currentLocations = await this.getSavedLocations();

    if (currentLocations.includes(trimmedLocation)) {
      return currentLocations;
    }

    const newLocations = [trimmedLocation, ...currentLocations].slice(0, 5);

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          saved_locations: newLocations,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.saved_locations;
  }

  static async removeSavedLocation(location: string): Promise<string[]> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('User not authenticated');
    }

    const user = session.user;

    const currentLocations = await this.getSavedLocations();
    const newLocations = currentLocations.filter((loc) => loc !== location);

    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        saved_locations: newLocations,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.saved_locations;
  }

  static async getBloodworkProfile(): Promise<{ sex: string | null; ageGroup: string | null }> {
    const preferences = await this.getPreferences();
    return {
      sex: preferences?.bloodwork_sex || null,
      ageGroup: preferences?.bloodwork_age_group || null,
    };
  }

  static async setBloodworkProfile(sex: string, ageGroup: string): Promise<void> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('User not authenticated');
    }

    const user = session.user;

    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          bloodwork_sex: sex,
          bloodwork_age_group: ageGroup,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      throw new Error(error.message);
    }
  }
}
