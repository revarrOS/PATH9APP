import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { theme } from '@/config/theme';
import {
  QuestionCategory,
  detectQuestionCategory,
  getCategoryLabel,
} from '@/products/shared/consultation-prep/category-detector';

interface AddQuestionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (questionText: string, relatedTerms: string[], category: QuestionCategory) => void;
  initialQuestion?: {
    questionText: string;
    relatedTerms: string[];
  };
}

const CATEGORIES: QuestionCategory[] = ['bloodwork', 'condition', 'general'];

export function AddQuestionModal({
  visible,
  onClose,
  onSave,
  initialQuestion,
}: AddQuestionModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [relatedTerms, setRelatedTerms] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>('condition');

  useEffect(() => {
    if (visible) {
      if (initialQuestion) {
        setQuestionText(initialQuestion.questionText);
        setRelatedTerms(initialQuestion.relatedTerms.join(', '));
        const detected = detectQuestionCategory(initialQuestion.questionText);
        setSelectedCategory(detected);
      } else {
        setQuestionText('');
        setRelatedTerms('');
        setSelectedCategory('condition');
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
    if (!questionText.trim()) {
      return;
    }

    const termsArray = relatedTerms
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m);

    onSave(questionText.trim(), termsArray, selectedCategory);
    setQuestionText('');
    setRelatedTerms('');
    setSelectedCategory('condition');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {initialQuestion ? 'Edit Question' : 'Add Question'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.label}>Question</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
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

            <Text style={styles.label}>Related Terms (optional)</Text>
            <TextInput
              style={styles.input}
              value={relatedTerms}
              onChangeText={setRelatedTerms}
              placeholder="e.g., biopsy, lymphoma, treatment"
              placeholderTextColor={theme.colors.text.disabled}
            />
            <Text style={styles.hint}>Separate multiple terms with commas</Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                !questionText.trim() && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={!questionText.trim()}
            >
              <Text style={styles.buttonPrimaryText}>Save</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  textArea: {
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
  hint: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.brand.cyan,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPrimaryText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.inverse,
  },
  buttonSecondaryText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
});
