import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { QuestionCard } from '@/products/bloodwork/consultation-prep/components/QuestionCard';
import { AddQuestionModal } from '@/products/bloodwork/consultation-prep/components/AddQuestionModal';
import { FilterTabs } from '@/products/bloodwork/consultation-prep/components/FilterTabs';
import { sharedConsultationPrepStore, ConsultationQuestion, QuestionStatus } from '@/products/shared/consultation-prep/consultation-prep.store';
import { QuestionCategory } from '@/products/shared/consultation-prep/category-detector';

export default function ConsultationPrepScreen() {
  const [questions, setQuestions] = useState<ConsultationQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<ConsultationQuestion[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | QuestionStatus>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ConsultationQuestion | undefined>();

  useFocusEffect(
    React.useCallback(() => {
      loadQuestions();
    }, [])
  );

  useEffect(() => {
    filterQuestions();
  }, [questions, activeFilter]);

  const loadQuestions = async () => {
    const loaded = await sharedConsultationPrepStore.getAll('bloodwork');
    setQuestions(loaded);
  };

  const filterQuestions = () => {
    if (activeFilter === 'all') {
      setFilteredQuestions(questions);
    } else {
      setFilteredQuestions(questions.filter((q) => q.status === activeFilter));
    }
  };

  const handleAddQuestion = async (
    questionText: string,
    relatedMarkers: string[],
    category: QuestionCategory
  ) => {
    await sharedConsultationPrepStore.addQuestion(questionText, category, { relatedMarkers });
    loadQuestions();
  };

  const handleEditQuestion = async (
    questionText: string,
    relatedMarkers: string[],
    category: QuestionCategory
  ) => {
    if (editingQuestion) {
      await sharedConsultationPrepStore.updateQuestion(editingQuestion.id, {
        questionText,
        relatedMarkers,
        domain: category,
      });
      setEditingQuestion(undefined);
      loadQuestions();
    }
  };

  const handleStatusChange = async (id: string, status: QuestionStatus) => {
    await sharedConsultationPrepStore.updateStatus(id, status);
    loadQuestions();
  };

  const handleEdit = (question: ConsultationQuestion) => {
    setEditingQuestion(question);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Delete Question\n\n' +
      'Are you sure you want to delete this question?\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      await sharedConsultationPrepStore.deleteQuestion(id);
      loadQuestions();
    } catch (err) {
      console.error('Delete error:', err);
      window.alert('Failed to delete question. Please try again.');
    }
  };

  const getCounts = () => {
    return {
      all: questions.length,
      open: questions.filter((q) => q.status === 'open').length,
      asked: questions.filter((q) => q.status === 'asked').length,
      resolved: questions.filter((q) => q.status === 'resolved').length,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consultation Prep</Text>
      </View>

      <View style={styles.intro}>
        <Text style={styles.introText}>
          Save questions you want to ask your clinician. Stored on this device only.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingQuestion(undefined);
          setModalVisible(true);
        }}
      >
        <Plus size={20} color={theme.colors.text.inverse} />
        <Text style={styles.addButtonText}>Add Question</Text>
      </TouchableOpacity>

      <FilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={getCounts()}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {filteredQuestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {activeFilter === 'all'
                ? 'No questions yet. Add a question to get started.'
                : `No ${activeFilter} questions.`}
            </Text>
          </View>
        ) : (
          filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      <AddQuestionModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingQuestion(undefined);
        }}
        onSave={editingQuestion ? handleEditQuestion : handleAddQuestion}
        initialQuestion={editingQuestion}
      />
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
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  intro: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
  },
  introText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    lineHeight: theme.typography.fontSizes.sm * theme.typography.lineHeights.normal,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.brand.cyan,
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
});
