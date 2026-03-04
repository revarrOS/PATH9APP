import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { ConsultationQuestion } from '../types/consultation-prep.types';
import {
  QuestionCategory,
  detectQuestionCategory,
  getCategoryLabel,
} from '@/products/shared/consultation-prep/category-detector';

interface AddQuestionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (questionText: string, relatedMarkers: string[], category: QuestionCategory) => void;
  initialQuestion?: Partial<ConsultationQuestion>;
}

const AVAILABLE_MARKERS = [
  'WBC', 'RBC', 'HGB', 'HCT', 'PLT',
  'NEUT', 'LYM', 'MXD',
  'MCV', 'MCH', 'MCHC', 'RDW-CV', 'RDW-SD',
  'MPV', 'PDW', 'PLCR',
];

const CATEGORIES: QuestionCategory[] = ['bloodwork', 'condition', 'nutrition', 'general'];

export function AddQuestionModal({
  visible,
  onClose,
  onSave,
  initialQuestion,
}: AddQuestionModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [selectedMarkers, setSelectedMarkers] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>('bloodwork');

  useEffect(() => {
    if (visible) {
      setQuestionText(initialQuestion?.questionText || '');
      setSelectedMarkers(initialQuestion?.relatedMarkers || []);

      if (initialQuestion?.questionText) {
        const detected = detectQuestionCategory(initialQuestion.questionText);
        setSelectedCategory(detected);
      } else {
        setSelectedCategory('bloodwork');
      }
    }
  }, [visible, initialQuestion]);

  useEffect(() => {
    if (questionText.trim().length > 10) {
      const detected = detectQuestionCategory(questionText);
      setSelectedCategory(detected);
    }
  }, [questionText]);

  const handleSave = () => {
    if (questionText.trim()) {
      onSave(questionText.trim(), selectedMarkers, selectedCategory);
      setQuestionText('');
      setSelectedMarkers([]);
      setSelectedCategory('bloodwork');
      onClose();
    }
  };

  const toggleMarker = (marker: string) => {
    setSelectedMarkers((prev) =>
      prev.includes(marker)
        ? prev.filter((m) => m !== marker)
        : [...prev, marker]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {initialQuestion ? 'Edit Question' : 'Add Question'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.label}>Question</Text>
            <TextInput
              style={styles.input}
              value={questionText}
              onChangeText={setQuestionText}
              placeholder="What do you want to ask your clinician?"
              placeholderTextColor={theme.colors.text.disabled}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categorySelector}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextSelected,
                    ]}
                  >
                    {getCategoryLabel(category)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedCategory === 'bloodwork' && (
              <>
                <Text style={styles.label}>Related Markers (Optional)</Text>
                <Text style={styles.hint}>
                  Tag markers this question relates to
                </Text>

                <View style={styles.markerGrid}>
                  {AVAILABLE_MARKERS.map((marker) => (
                    <TouchableOpacity
                      key={marker}
                      style={[
                        styles.markerChip,
                        selectedMarkers.includes(marker) && styles.markerChipSelected,
                      ]}
                      onPress={() => toggleMarker(marker)}
                    >
                      <Text
                        style={[
                          styles.markerChipText,
                          selectedMarkers.includes(marker) &&
                            styles.markerChipTextSelected,
                        ]}
                      >
                        {marker}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !questionText.trim() && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!questionText.trim()}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  hint: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    marginBottom: theme.spacing.lg,
    minHeight: 100,
  },
  categorySelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.brand.cyan + '20',
    borderColor: theme.colors.brand.cyan,
  },
  categoryChipText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  categoryChipTextSelected: {
    color: theme.colors.brand.cyan,
    fontWeight: theme.typography.fontWeights.bold,
  },
  markerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  markerChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  markerChipSelected: {
    backgroundColor: theme.colors.brand.cyan + '20',
    borderColor: theme.colors.brand.cyan,
  },
  markerChipText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  markerChipTextSelected: {
    color: theme.colors.brand.cyan,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.brand.cyan,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.inverse,
  },
});
