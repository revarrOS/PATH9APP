import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronLeft } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { nutritionService } from '@/products/nutrition/services/nutrition.service';
import type { EntryType } from '@/products/nutrition/types/nutrition.types';

export default function NewNutritionEntryScreen() {
  const router = useRouter();
  const [entryType, setEntryType] = useState<EntryType>('meal');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [userNotes, setUserNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permissions are required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!imageUri && !userNotes) {
      Alert.alert('Required', 'Please add an image or notes');
      return;
    }

    setLoading(true);

    const { data: entry, error } = await nutritionService.createEntry({
      entry_date: entryDate,
      entry_type: entryType,
      image_uri: imageUri || undefined,
      user_notes: userNotes || undefined,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message || 'Failed to save entry');
    } else if (entry) {
      router.replace({
        pathname: '/nutrition/entry-feedback',
        params: { entryId: entry.id },
      } as any);
    } else {
      router.back();
    }
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
        <View style={styles.headerContent}>
          <Text style={styles.title}>New Entry</Text>
          <Text style={styles.subtitle}>Record a meal, snack, or supplement</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        <View style={styles.section}>
        <Text style={styles.label}>Entry Type</Text>
        <View style={styles.typeButtons}>
          {(['meal', 'snack', 'drink', 'supplement'] as EntryType[]).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, entryType === type && styles.typeButtonActive]}
              onPress={() => setEntryType(type)}>
              <Text
                style={[
                  styles.typeButtonText,
                  entryType === type && styles.typeButtonTextActive,
                ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={entryDate}
          onChangeText={setEntryDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Photo (Optional)</Text>
        {imageUri ? (
          <View>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
              <Text style={styles.changeImageText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Camera size={32} color={theme.colors.state.success} />
            <Text style={styles.imagePickerText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={userNotes}
          onChangeText={setUserNotes}
          placeholder="Add any notes about this entry..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <Text style={styles.saveButtonText}>Save Entry</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: theme.colors.state.success,
    borderColor: theme.colors.state.success,
  },
  typeButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
  },
  typeButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  input: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
  },
  textArea: {
    minHeight: 100,
  },
  imagePickerButton: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.state.success,
    marginTop: theme.spacing.sm,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.elevated,
  },
  changeImageButton: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  changeImageText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.state.success,
  },
  saveButton: {
    backgroundColor: theme.colors.state.success,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.inverse,
  },
});
