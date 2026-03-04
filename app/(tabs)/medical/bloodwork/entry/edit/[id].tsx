import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { BloodworkService } from '@/products/bloodwork/services/bloodwork.service';
import { CBC_MARKERS } from '@/products/bloodwork/types/bloodwork.types';
import type { BloodTestWithMarkers, CreateBloodMarkerInput } from '@/products/bloodwork/types/bloodwork.types';
import { PHIWarning } from '@/products/bloodwork/components/PHIWarning';
import { TrackingDisclaimer } from '@/products/bloodwork/components/TrackingDisclaimer';
import { LocationSelector } from '@/products/bloodwork/components/LocationSelector';
import { smartNormalize } from '@/products/bloodwork/utils/smart-normalize';
import { theme } from '@/config/theme';

export default function EditBloodTest() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<BloodTestWithMarkers | null>(null);
  const [testDate, setTestDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [markerValues, setMarkerValues] = useState<Record<string, { value: string; refLow: string; refHigh: string; id?: string }>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showNormalizationNotice, setShowNormalizationNotice] = useState(false);

  useEffect(() => {
    if (id) {
      loadTest();
    }
  }, [id]);

  const loadTest = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BloodworkService.getTest(id);

      if (!data) {
        throw new Error('Test not found');
      }

      setTest(data);
      setTestDate(data.test_date);
      setLocation(data.location || '');
      setNotes(data.notes || '');

      const values: Record<string, { value: string; refLow: string; refHigh: string; id?: string }> = {};
      for (const marker of data.markers) {
        values[marker.marker_name] = {
          value: marker.value.toString(),
          refLow: marker.reference_range_low?.toString() || '',
          refHigh: marker.reference_range_high?.toString() || '',
          id: marker.id,
        };
      }
      setMarkerValues(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test');
    } finally {
      setLoading(false);
    }
  };


  const validateMarkerValue = (markerName: string, value: string) => {
    if (!value.trim()) {
      setWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[markerName];
        return newWarnings;
      });
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setWarnings(prev => ({ ...prev, [markerName]: 'Please enter a valid number' }));
      return;
    }

    const marker = CBC_MARKERS.find(m => m.name === markerName);
    if (!marker) return;

    // Apply same normalization logic for validation
    let normalizedValue = numValue;
    if (markerName === 'HGB' && numValue > 20) {
      normalizedValue = numValue / 10;
    } else if (markerName === 'MCHC' && numValue > 100) {
      normalizedValue = numValue / 10;
    } else if (markerName === 'HCT' && numValue < 1) {
      normalizedValue = numValue * 100;
    } else if (markerName === 'RDW-CV' && numValue < 1) {
      normalizedValue = numValue * 100;
    }

    if (marker.typical_range_low && marker.typical_range_high) {
      const rangeSize = marker.typical_range_high - marker.typical_range_low;
      const veryLow = marker.typical_range_low - (rangeSize * 2);
      const veryHigh = marker.typical_range_high + (rangeSize * 2);

      if (normalizedValue < veryLow || normalizedValue > veryHigh) {
        setWarnings(prev => ({
          ...prev,
          [markerName]: 'This value looks unusual — please double-check your entry'
        }));
        return;
      }
    }

    if (numValue < 0) {
      setWarnings(prev => ({
        ...prev,
        [markerName]: 'This value looks unusual — please double-check your entry'
      }));
      return;
    }

    setWarnings(prev => {
      const newWarnings = { ...prev };
      delete newWarnings[markerName];
      return newWarnings;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      setShowNormalizationNotice(false);

      await BloodworkService.updateTest(id, {
        test_date: testDate,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Apply smart normalization (UI-layer only, pre-save)
      const normalizationResult = smartNormalize(markerValues);
      const valuesToSave = normalizationResult.normalizedValues;

      const existingMarkerIds = new Set(test?.markers.map(m => m.id) || []);
      const currentMarkerNames = new Set<string>();

      for (const [markerName, data] of Object.entries(valuesToSave)) {
        if (data.value.trim()) {
          currentMarkerNames.add(markerName);
          const markerDef = CBC_MARKERS.find(m => m.name === markerName);
          if (!markerDef) continue;

          let value = parseFloat(data.value);
          if (isNaN(value)) continue;

          if (data.id && existingMarkerIds.has(data.id)) {
            await BloodworkService.updateMarker(data.id, {
              value,
              reference_range_low: data.refLow ? parseFloat(data.refLow) : undefined,
              reference_range_high: data.refHigh ? parseFloat(data.refHigh) : undefined,
            });
          } else {
            await BloodworkService.addMarkersToTest(id, [{
              marker_name: markerName,
              value,
              unit: markerDef.unit,
              reference_range_low: data.refLow ? parseFloat(data.refLow) : undefined,
              reference_range_high: data.refHigh ? parseFloat(data.refHigh) : undefined,
            }]);
          }
        }
      }

      for (const marker of test?.markers || []) {
        if (!currentMarkerNames.has(marker.marker_name)) {
          await BloodworkService.deleteMarker(marker.id);
        }
      }

      setSaveSuccess(true);
      setSaving(false);

      // Show normalization notice if values were normalized
      if (normalizationResult.wasNormalized) {
        setShowNormalizationNotice(true);
      }

      setTimeout(() => {
        router.back();
      }, normalizationResult.wasNormalized ? 5000 : 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      setSaving(false);
      setSaveSuccess(false);
    }
  };

  const updateMarkerValue = (markerName: string, field: 'value' | 'refLow' | 'refHigh', value: string) => {
    setMarkerValues(prev => ({
      ...prev,
      [markerName]: {
        value: prev[markerName]?.value || '',
        refLow: prev[markerName]?.refLow || '',
        refHigh: prev[markerName]?.refHigh || '',
        id: prev[markerName]?.id,
        [field]: value,
      }
    }));

    if (field === 'value') {
      validateMarkerValue(markerName, value);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.brand.cyan} />
      </View>
    );
  }

  if (error && !test) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Blood Test</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (saving || saveSuccess) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={saving || saveSuccess}
          activeOpacity={0.7}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.text.inverse} />
          ) : (
            <Save size={20} color={theme.colors.text.inverse} />
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {saveSuccess && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>Changes saved successfully</Text>
        </View>
      )}

      {showNormalizationNotice && (
        <View style={styles.normalizationBanner}>
          <Text style={styles.normalizationText}>
            Some values were normalized to account for unit differences used by different labs (for example, UK vs US formats). You can review or edit these values at any time.
          </Text>
        </View>
      )}

      <ScrollView style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Test Date</Text>
            <TextInput
              style={styles.input}
              value={testDate}
              onChangeText={setTestDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Lab / Location (Optional)</Text>
            <LocationSelector
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <PHIWarning />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes about this test..."
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CBC Panel Markers</Text>
          <Text style={styles.sectionDescription}>
            Modify any marker values. Clear a value completely to remove it from this test.
          </Text>

          {CBC_MARKERS.map((marker) => {
            const hasWarning = warnings[marker.name];
            const hasValue = markerValues[marker.name]?.value;

            return (
              <View key={marker.name} style={styles.markerField}>
                <View style={styles.markerHeader}>
                  <Text style={styles.markerName}>{marker.name}</Text>
                  <Text style={styles.markerFullName}>{marker.full_name}</Text>
                </View>

                <View style={styles.markerInputRow}>
                  <View style={styles.markerInputGroup}>
                    <Text style={styles.markerInputLabel}>
                      Value (Optional)
                      {marker.name === 'HCT' && (
                        <Text style={styles.unitNote}> — Enter as % (e.g., 38.2) or fraction (e.g., 0.382)</Text>
                      )}
                    </Text>
                    <TextInput
                      style={[
                        styles.markerInput,
                        hasWarning && styles.markerInputWarning,
                      ]}
                      value={markerValues[marker.name]?.value || ''}
                      onChangeText={(value) => updateMarkerValue(marker.name, 'value', value)}
                      placeholder="Clear to remove"
                      placeholderTextColor="#CBD5E0"
                      keyboardType="numeric"
                    />
                    <Text style={styles.markerUnit}>
                      {marker.unit}
                      {marker.name === 'HCT' && ' (stored as %)'}
                    </Text>
                  </View>
                </View>

                {hasWarning && (
                  <View style={styles.warningContainer}>
                    <Text style={styles.warningText}>{hasWarning}</Text>
                  </View>
                )}

                {hasValue && (
                  <View style={styles.markerInputRow}>
                    <View style={[styles.markerInputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.markerInputLabel}>Reference Low (Optional)</Text>
                      <TextInput
                        style={styles.markerInput}
                        value={markerValues[marker.name]?.refLow || ''}
                        onChangeText={(value) => updateMarkerValue(marker.name, 'refLow', value)}
                        placeholder={marker.typical_range_low?.toString() || ''}
                        placeholderTextColor="#CBD5E0"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.markerInputGroup, { flex: 1 }]}>
                      <Text style={styles.markerInputLabel}>Reference High (Optional)</Text>
                      <TextInput
                        style={styles.markerInput}
                        value={markerValues[marker.name]?.refHigh || ''}
                        onChangeText={(value) => updateMarkerValue(marker.name, 'refHigh', value)}
                        placeholder={marker.typical_range_high?.toString() || ''}
                        placeholderTextColor="#CBD5E0"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <TrackingDisclaimer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: 60,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.brand.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  errorBanner: {
    backgroundColor: theme.colors.state.error,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.state.error,
  },
  errorText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: theme.colors.state.success,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.state.success,
  },
  successText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeights.medium,
  },
  normalizationBanner: {
    backgroundColor: theme.colors.state.info,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.state.info,
  },
  normalizationText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.brand.cyan,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  form: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.elevated,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  markerField: {
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  markerHeader: {
    marginBottom: theme.spacing.md,
  },
  markerName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  markerFullName: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  markerInputRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  markerInputGroup: {
    flex: 1,
  },
  markerInputLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  unitNote: {
    fontSize: 11,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeights.regular,
  },
  markerInput: {
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: 6,
    padding: 10,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.elevated,
  },
  markerInputWarning: {
    borderColor: theme.colors.state.warning,
    backgroundColor: theme.colors.background.elevated,
  },
  markerUnit: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
  warningContainer: {
    backgroundColor: theme.colors.state.warning,
    padding: theme.spacing.sm,
    borderRadius: 6,
    marginBottom: theme.spacing.sm,
  },
  warningText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.primary,
    lineHeight: 16,
  },
});
