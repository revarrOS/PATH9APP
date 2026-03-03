import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, Camera, Image as ImageIcon } from 'lucide-react-native';
import { useState } from 'react';
import { BloodworkService } from '@/products/bloodwork/services/bloodwork.service';
import { CBC_MARKERS } from '@/products/bloodwork/types/bloodwork.types';
import type { CreateBloodMarkerInput } from '@/products/bloodwork/types/bloodwork.types';
import { PHIWarning } from '@/products/bloodwork/components/PHIWarning';
import { TrackingDisclaimer } from '@/products/bloodwork/components/TrackingDisclaimer';
import { LocationSelector } from '@/products/bloodwork/components/LocationSelector';
import * as ImagePicker from 'expo-image-picker';
import { environment } from '@/config/environment';
import { smartNormalize } from '@/products/bloodwork/utils/smart-normalize';
import { theme } from '@/config/theme';

export default function NewBloodTest() {
  const router = useRouter();
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [markerValues, setMarkerValues] = useState<Record<string, { value: string; refLow: string; refHigh: string }>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiExtractedFields, setAiExtractedFields] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisWarnings, setAnalysisWarnings] = useState<string[]>([]);
  const [aiExtractedDate, setAiExtractedDate] = useState(false);
  const [aiExtractedLocation, setAiExtractedLocation] = useState(false);
  const [unmappedMarkers, setUnmappedMarkers] = useState<string[]>([]);
  const [showNormalizationNotice, setShowNormalizationNotice] = useState(false);


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

  const analyzeImage = async (base64Image: string) => {
    try {
      setAnalyzing(true);
      setError(null);
      setAnalysisWarnings([]);

      const response = await fetch(`${environment.supabaseUrl}/functions/v1/analyze-bloodwork-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${environment.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64Image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const result = await response.json();

      const newMarkerValues = { ...markerValues };
      const newAiExtracted = new Set<string>();

      for (const [markerName, value] of Object.entries(result.suggested_values)) {
        newMarkerValues[markerName] = {
          value: value as string,
          refLow: result.reference_ranges[markerName]?.low || '',
          refHigh: result.reference_ranges[markerName]?.high || '',
        };
        newAiExtracted.add(markerName);
      }

      setMarkerValues(newMarkerValues);
      setAiExtractedFields(newAiExtracted);

      if (result.extracted_date) {
        setTestDate(result.extracted_date);
        setAiExtractedDate(true);
      }

      if (result.extracted_location) {
        setLocation(result.extracted_location);
        setAiExtractedLocation(true);
      }

      if (result.warnings && result.warnings.length > 0) {
        setAnalysisWarnings(result.warnings);
      }

      if (result.unmapped_markers && result.unmapped_markers.length > 0) {
        setUnmappedMarkers(result.unmapped_markers);
      }

      setAnalyzing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      setAnalyzing(false);
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Camera is not available on web');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await analyzeImage(result.assets[0].base64);
    }
  };

  const handleChooseFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library permission is needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await analyzeImage(result.assets[0].base64);
    }
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'web') {
      handleChooseFromLibrary();
    } else {
      Alert.alert(
        'Upload Blood Test Image',
        'Images are analyzed securely and not stored',
        [
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose from Library', onPress: handleChooseFromLibrary },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      setShowNormalizationNotice(false);

      // Apply smart normalization (UI-layer only, pre-save)
      const normalizationResult = smartNormalize(markerValues);
      const valuesToSave = normalizationResult.normalizedValues;

      const markers: CreateBloodMarkerInput[] = [];

      for (const [markerName, data] of Object.entries(valuesToSave)) {
        if (data.value.trim()) {
          const markerDef = CBC_MARKERS.find(m => m.name === markerName);
          if (!markerDef) continue;

          let value = parseFloat(data.value);
          if (isNaN(value)) continue;

          markers.push({
            marker_name: markerName,
            value,
            unit: markerDef.unit,
            reference_range_low: data.refLow ? parseFloat(data.refLow) : undefined,
            reference_range_high: data.refHigh ? parseFloat(data.refHigh) : undefined,
          });
        }
      }

      if (markers.length === 0) {
        setError('Please enter at least one marker value');
        setSaving(false);
        return;
      }

      await BloodworkService.createTest({
        test_date: testDate,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        markers,
      });

      setSaveSuccess(true);
      setSaving(false);

      // Show normalization notice if values were normalized
      if (normalizationResult.wasNormalized) {
        setShowNormalizationNotice(true);
      }

      setTimeout(() => {
        router.back();
      }, normalizationResult.wasNormalized ? 5000 : (unmappedMarkers.length > 0 ? 2500 : 1500));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save test');
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
        [field]: value,
      }
    }));

    if (field === 'value') {
      validateMarkerValue(markerName, value);
      setAiExtractedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(markerName);
        return newSet;
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Record Blood Test</Text>
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
          <Text style={styles.successText}>
            Blood test saved successfully
            {unmappedMarkers.length > 0 && '\nSome values from this test weren\'t captured'}
          </Text>
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
            <Text style={styles.label}>
              Test Date
              {aiExtractedDate && <Text style={styles.aiExtractedLabel}> (AI extracted — please review)</Text>}
            </Text>
            <TextInput
              style={[styles.input, aiExtractedDate && styles.inputAiExtracted]}
              value={testDate}
              onChangeText={(value) => {
                setTestDate(value);
                setAiExtractedDate(false);
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Lab / Location (Optional)
              {aiExtractedLocation && <Text style={styles.aiExtractedLabel}> (AI extracted — please review)</Text>}
            </Text>
            <LocationSelector
              value={location}
              onChangeText={setLocation}
              aiExtracted={aiExtractedLocation}
              onAiExtractedChange={() => setAiExtractedLocation(false)}
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
          <Text style={styles.sectionTitle}>Image Assist (Optional)</Text>
          <Text style={styles.sectionDescription}>
            Upload a photo of your blood test to pre-fill values. You must review all values before saving.
          </Text>
          <View style={styles.imageAssistDisclaimer}>
            <Text style={styles.imageAssistDisclaimerText}>
              Images are analyzed securely and not stored. AI extraction is assistive only — you must verify all values before saving.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.imageUploadButton,
              analyzing && styles.imageUploadButtonDisabled
            ]}
            onPress={showImagePickerOptions}
            disabled={analyzing}
            activeOpacity={0.7}>
            {analyzing ? (
              <>
                <ActivityIndicator size="small" color={theme.colors.brand.cyan} style={{ marginRight: 8 }} />
                <Text style={styles.imageUploadButtonText}>Analyzing image...</Text>
              </>
            ) : (
              <>
                {Platform.OS === 'web' ? (
                  <ImageIcon size={20} color={theme.colors.text.secondary} style={{ marginRight: 8 }} />
                ) : (
                  <Camera size={20} color={theme.colors.text.secondary} style={{ marginRight: 8 }} />
                )}
                <Text style={styles.imageUploadButtonText}>Upload Blood Test Image</Text>
              </>
            )}
          </TouchableOpacity>

          {analysisWarnings.length > 0 && (
            <View style={styles.analysisWarningsContainer}>
              {analysisWarnings.map((warning, index) => (
                <Text key={index} style={styles.analysisWarningText}>• {warning}</Text>
              ))}
            </View>
          )}

          {aiExtractedFields.size > 0 && (
            <View style={styles.aiReviewBanner}>
              <Text style={styles.aiReviewText}>
                Please review AI-extracted values (highlighted in yellow) before saving
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CBC Panel Markers</Text>
          <Text style={styles.sectionDescription}>
            Enter values for any markers from your blood test. All markers are optional — skip any that weren't tested.
          </Text>

          {CBC_MARKERS.map((marker) => {
            const hasWarning = warnings[marker.name];
            const isAiExtracted = aiExtractedFields.has(marker.name);

            return (
              <View key={marker.name} style={styles.markerField}>
                <View style={styles.markerHeader}>
                  <Text style={styles.markerName}>
                    {marker.name}
                    {isAiExtracted && <Text style={styles.aiExtractedBadge}> AI</Text>}
                  </Text>
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
                        isAiExtracted && styles.markerInputAiExtracted
                      ]}
                      value={markerValues[marker.name]?.value || ''}
                      onChangeText={(value) => updateMarkerValue(marker.name, 'value', value)}
                      placeholder="Skip if not tested"
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
  inputAiExtracted: {
    backgroundColor: theme.colors.state.warning,
    borderColor: theme.colors.state.warning,
    borderWidth: 2,
  },
  aiExtractedLabel: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
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
  imageAssistDisclaimer: {
    backgroundColor: theme.colors.background.elevated,
    padding: theme.spacing.md,
    borderRadius: 6,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.brand.cyan,
  },
  imageAssistDisclaimerText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  imageUploadButtonDisabled: {
    opacity: 0.6,
  },
  imageUploadButtonText: {
    fontSize: 15,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
  },
  analysisWarningsContainer: {
    backgroundColor: theme.colors.state.warning,
    padding: theme.spacing.md,
    borderRadius: 6,
    marginBottom: theme.spacing.md,
  },
  analysisWarningText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.primary,
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
  },
  aiReviewBanner: {
    backgroundColor: theme.colors.state.warning,
    padding: theme.spacing.md,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.state.warning,
  },
  aiReviewText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  markerInputAiExtracted: {
    backgroundColor: theme.colors.state.warning,
    borderColor: theme.colors.state.warning,
    borderWidth: 2,
  },
  aiExtractedBadge: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.inverse,
    backgroundColor: theme.colors.state.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
