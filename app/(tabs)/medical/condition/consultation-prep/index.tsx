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
import { QuestionCard } from '@/products/condition/consultation-prep/components/QuestionCard';
import { AddQuestionModal } from '@/products/condition/consultation-prep/components/AddQuestionModal';
import { FilterTabs } from '@/products/condition/consultation-prep/components/FilterTabs';
import { sharedConsultationPrepStore, ConsultationQuestion, QuestionStatus } from '@/products/shared/consultation-prep/consultation-prep.store';
import { QuestionCategory } from '@/products/shared/consultation-prep/category-detector';

export default function ConditionConsultationPrepScreen() {
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
    const loaded = await sharedConsultationPrepStore.getAll('condition');
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
    relatedTerms: string[],
    category: QuestionCategory
  ) => {
    await sharedConsultationPrepStore.addQuestion(questionText, category, { relatedTerms });
    loadQuestions();
  };

  const handleEditQuestion = async (
    questionText: string,
    relatedTerms: string[],
    category: QuestionCategory
  ) => {
    if (editingQuestion) {
      await sharedConsultationPrepStore.updateQuestion(editingQuestion.id, {
        questionText,
        relatedTerms,
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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Consultation Prep</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingQuestion(undefined);
            setModalVisible(true);
          }}
        >
          <Plus size={24} color={theme.colors.text.inverse} />
        </TouchableOpacity>
      </View>

      <FilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={getCounts()}
      />

      <ScrollView style={styles.list}>
        {filteredQuestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {activeFilter === 'all'
                ? 'No questions yet. Tap + to add one.'
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
        <View style={{ height: 40 }} />
      </ScrollView>

      <AddQuestionModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingQuestion(undefined);
        }}
        onSave={editingQuestion ? handleEditQuestion : handleAddQuestion}
        initialQuestion={
          editingQuestion
            ? {
                questionText: editingQuestion.questionText,
                relatedTerms: editingQuestion.relatedTerms || [],
              }
            : undefined
        }
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
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.brand.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    padding: theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
});
