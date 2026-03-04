import { supabase } from '@/lib/supabase';
import type {
  NutritionEntry,
  NutritionPreferences,
  NutritionTrends,
  CreateNutritionEntryInput,
  UpdateNutritionEntryInput,
  SupportAreaFrequency,
} from '../types/nutrition.types';
import { getConditionNutritionKnowledge } from '../knowledge/condition-nutrition-map';

export const nutritionService = {
  async getEntries(
    startDate?: string,
    endDate?: string
  ): Promise<{ data: NutritionEntry[] | null; error: any }> {
    let query = supabase
      .from('nutrition_entries')
      .select('*')
      .order('entry_date', { ascending: false });

    if (startDate) {
      query = query.gte('entry_date', startDate);
    }

    if (endDate) {
      query = query.lte('entry_date', endDate);
    }

    return await query;
  },

  async getEntryById(id: string): Promise<{ data: NutritionEntry | null; error: any }> {
    return await supabase
      .from('nutrition_entries')
      .select('*')
      .eq('id', id)
      .maybeSingle();
  },

  async createEntry(input: CreateNutritionEntryInput): Promise<{ data: NutritionEntry | null; error: any }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    let imagePath: string | null = null;

    if (input.image_uri) {
      console.log('[Nutrition] Starting image upload and analysis...');
      const fileExt = input.image_uri.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log('[Nutrition] Fetching image from URI...');
      const response = await fetch(input.image_uri);
      const blob = await response.blob();
      console.log('[Nutrition] Blob created:', blob.type, blob.size, 'bytes');

      console.log('[Nutrition] Uploading to Supabase Storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('nutrition-images')
        .upload(fileName, blob);

      if (uploadError) {
        console.error('[Nutrition] Upload error:', uploadError);
        return { data: null, error: uploadError };
      }

      imagePath = uploadData.path;
      console.log('[Nutrition] Image uploaded successfully:', imagePath);

      // Convert blob to base64 for AI analysis
      console.log('[Nutrition] Converting to base64...');
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      const image_base64 = `data:${blob.type};base64,${base64}`;
      console.log('[Nutrition] Base64 created, length:', image_base64.length, 'prefix:', image_base64.substring(0, 50));

      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-nutrition-image`;
      console.log('[Nutrition] Calling AI analysis:', apiUrl);
      const headers = {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      try {
        console.log('[Nutrition] Sending request to edge function...');
        const analysisResponse = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ image_base64 }),
        });

        console.log('[Nutrition] Response status:', analysisResponse.status);
        const analysisResult = await analysisResponse.json();
        console.log('[Nutrition] Analysis result:', JSON.stringify(analysisResult, null, 2));

        if (analysisResult.success && analysisResult.analysis) {
          const { data: entry, error } = await supabase
            .from('nutrition_entries')
            .insert({
              user_id: user.id,
              entry_date: input.entry_date,
              entry_type: input.entry_type,
              image_path: imagePath,
              ai_interpretation: analysisResult.analysis,
              user_notes: input.user_notes,
            })
            .select()
            .single();

          return { data: entry, error };
        } else {
          return {
            data: null,
            error: new Error('Photo analysis failed - please retry'),
          };
        }
      } catch (analysisError) {
        console.error('Failed to analyze image:', analysisError);

        return {
          data: null,
          error: new Error('Photo analysis failed - please retry'),
        };
      }
    } else {
      const { data: entry, error } = await supabase
        .from('nutrition_entries')
        .insert({
          user_id: user.id,
          entry_date: input.entry_date,
          entry_type: input.entry_type,
          user_notes: input.user_notes,
        })
        .select()
        .single();

      return { data: entry, error };
    }
  },

  async updateEntry(
    id: string,
    input: UpdateNutritionEntryInput
  ): Promise<{ data: NutritionEntry | null; error: any }> {
    return await supabase
      .from('nutrition_entries')
      .update(input)
      .eq('id', id)
      .select()
      .single();
  },

  async deleteEntry(id: string): Promise<{ error: any }> {
    const { data: entry } = await supabase
      .from('nutrition_entries')
      .select('image_path')
      .eq('id', id)
      .maybeSingle();

    if (entry?.image_path) {
      await supabase.storage.from('nutrition-images').remove([entry.image_path]);
    }

    return await supabase.from('nutrition_entries').delete().eq('id', id);
  },

  async getPreferences(): Promise<{ data: NutritionPreferences | null; error: any }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    return await supabase
      .from('nutrition_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
  },

  async setPreferences(preferences: Partial<NutritionPreferences>): Promise<{ data: NutritionPreferences | null; error: any }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data: existing } = await this.getPreferences();

    if (existing) {
      return await supabase
        .from('nutrition_preferences')
        .update(preferences)
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      return await supabase
        .from('nutrition_preferences')
        .insert({
          user_id: user.id,
          ...preferences,
        })
        .select()
        .single();
    }
  },

  async verifyCondition(diagnosis: string): Promise<{ data: NutritionPreferences | null; error: any }> {
    return await this.setPreferences({
      condition_verified: true,
      condition_verified_at: new Date().toISOString(),
      verified_diagnosis: diagnosis,
    });
  },

  async getTrends(days: number = 30): Promise<{ data: NutritionTrends | null; error: any }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: entries, error } = await this.getEntries(
      startDate.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    if (error || !entries) {
      return { data: null, error };
    }

    const supportAreaCounts: Record<string, number> = {};
    const entriesByType = {
      meal: 0,
      snack: 0,
      drink: 0,
      supplement: 0,
    };

    entries.forEach(entry => {
      entriesByType[entry.entry_type]++;

      if (entry.ai_interpretation?.supportAreas) {
        entry.ai_interpretation.supportAreas.forEach((area: string) => {
          supportAreaCounts[area] = (supportAreaCounts[area] || 0) + 1;
        });
      }
    });

    const { data: preferences } = await this.getPreferences();
    const knowledge = getConditionNutritionKnowledge(preferences?.verified_diagnosis || null);

    const supportAreas: SupportAreaFrequency[] = Object.entries(supportAreaCounts)
      .map(([areaId, count]) => {
        const supportArea = knowledge.supportAreas.find(s => s.id === areaId);
        return {
          supportAreaId: areaId,
          label: supportArea?.label || areaId,
          count,
          totalEntries: entries.length,
          percentage: Math.round((count / entries.length) * 100),
        };
      })
      .sort((a, b) => b.count - a.count);

    const trends: NutritionTrends = {
      totalEntries: entries.length,
      dateRange: {
        start: entries[entries.length - 1]?.entry_date || '',
        end: entries[0]?.entry_date || '',
      },
      supportAreas,
      entriesByType,
    };

    return { data: trends, error: null };
  },

  async getImageUrl(imagePath: string): Promise<string | null> {
    const { data } = supabase.storage.from('nutrition-images').getPublicUrl(imagePath);
    return data?.publicUrl || null;
  },
};
