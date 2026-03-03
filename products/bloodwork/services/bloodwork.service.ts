import { supabase } from '@/lib/supabase';
import type {
  BloodTest,
  BloodMarker,
  BloodTestWithMarkers,
  CreateBloodTestInput,
  UpdateBloodTestInput,
  UpdateBloodMarkerInput,
} from '../types/bloodwork.types';
import { UserPreferencesService } from '@/services/user-preferences.service';

export class BloodworkService {
  static async createTest(input: CreateBloodTestInput): Promise<BloodTestWithMarkers> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('User not authenticated');
    }

    const user = session.user;

    const { test_date, location, notes, markers } = input;

    const { data: test, error: testError } = await supabase
      .from('blood_tests')
      .insert({
        user_id: user.id,
        test_date,
        location,
        notes,
      })
      .select()
      .single();

    if (testError || !test) {
      throw new Error(testError?.message || 'Failed to create blood test');
    }

    if (markers.length > 0) {
      const markerInserts = markers.map((marker) => ({
        test_id: test.id,
        marker_name: marker.marker_name,
        value: marker.value,
        unit: marker.unit,
        reference_range_low: marker.reference_range_low,
        reference_range_high: marker.reference_range_high,
      }));

      const { data: insertedMarkers, error: markersError } = await supabase
        .from('blood_markers')
        .insert(markerInserts)
        .select();

      if (markersError) {
        throw new Error(markersError.message);
      }

      // Auto-save location to preferences (non-blocking)
      if (location) {
        UserPreferencesService.addSavedLocation(location).catch(err => {
          console.error('Failed to auto-save location:', err);
        });
      }

      return {
        ...test,
        markers: insertedMarkers || [],
      };
    }

    // Auto-save location to preferences (non-blocking)
    if (location) {
      UserPreferencesService.addSavedLocation(location).catch(err => {
        console.error('Failed to auto-save location:', err);
      });
    }

    return {
      ...test,
      markers: [],
    };
  }

  static async getTests(): Promise<BloodTestWithMarkers[]> {
    const { data: tests, error: testsError } = await supabase
      .from('blood_tests')
      .select('*')
      .order('test_date', { ascending: false });

    if (testsError) {
      throw new Error(testsError.message);
    }

    if (!tests || tests.length === 0) {
      return [];
    }

    const testIds = tests.map((test) => test.id);

    const { data: markers, error: markersError } = await supabase
      .from('blood_markers')
      .select('*')
      .in('test_id', testIds)
      .order('marker_name');

    if (markersError) {
      throw new Error(markersError.message);
    }

    const markersByTestId = (markers || []).reduce(
      (acc, marker) => {
        if (!acc[marker.test_id]) {
          acc[marker.test_id] = [];
        }
        acc[marker.test_id].push(marker);
        return acc;
      },
      {} as Record<string, BloodMarker[]>
    );

    return tests.map((test) => ({
      ...test,
      markers: markersByTestId[test.id] || [],
    }));
  }

  static async getTest(testId: string): Promise<BloodTestWithMarkers | null> {
    const { data: test, error: testError } = await supabase
      .from('blood_tests')
      .select('*')
      .eq('id', testId)
      .maybeSingle();

    if (testError) {
      throw new Error(testError.message);
    }

    if (!test) {
      return null;
    }

    const { data: markers, error: markersError } = await supabase
      .from('blood_markers')
      .select('*')
      .eq('test_id', testId)
      .order('marker_name');

    if (markersError) {
      throw new Error(markersError.message);
    }

    return {
      ...test,
      markers: markers || [],
    };
  }

  static async updateTest(
    testId: string,
    input: UpdateBloodTestInput
  ): Promise<BloodTest> {
    const { data, error } = await supabase
      .from('blood_tests')
      .update(input)
      .eq('id', testId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update blood test');
    }

    // Auto-save location to preferences if changed (non-blocking)
    if (input.location) {
      UserPreferencesService.addSavedLocation(input.location).catch(err => {
        console.error('Failed to auto-save location:', err);
      });
    }

    return data;
  }

  static async deleteTest(testId: string): Promise<void> {
    const { error } = await supabase
      .from('blood_tests')
      .delete()
      .eq('id', testId);

    if (error) {
      throw new Error(error.message);
    }
  }

  static async updateMarker(
    markerId: string,
    input: UpdateBloodMarkerInput
  ): Promise<BloodMarker> {
    const { data, error } = await supabase
      .from('blood_markers')
      .update(input)
      .eq('id', markerId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update blood marker');
    }

    return data;
  }

  static async deleteMarker(markerId: string): Promise<void> {
    const { error } = await supabase
      .from('blood_markers')
      .delete()
      .eq('id', markerId);

    if (error) {
      throw new Error(error.message);
    }
  }

  static async addMarkersToTest(
    testId: string,
    markers: Array<{
      marker_name: string;
      value: number;
      unit: string;
      reference_range_low?: number;
      reference_range_high?: number;
    }>
  ): Promise<BloodMarker[]> {
    const markerInserts = markers.map((marker) => ({
      test_id: testId,
      ...marker,
    }));

    const { data, error } = await supabase
      .from('blood_markers')
      .insert(markerInserts)
      .select();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to add markers to test');
    }

    return data;
  }
}
