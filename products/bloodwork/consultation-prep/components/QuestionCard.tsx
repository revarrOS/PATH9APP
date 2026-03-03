import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2, Edit3, CheckCircle, MessageCircle } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { ConsultationQuestion, QuestionStatus } from '../types/consultation-prep.types';

interface QuestionCardProps {
  question: ConsultationQuestion;
  onStatusChange: (id: string, status: QuestionStatus) => void;
  onEdit: (question: ConsultationQuestion) => void;
  onDelete: (id: string) => void;
}

export function QuestionCard({ question, onStatusChange, onEdit, onDelete }: QuestionCardProps) {
  const statusConfig = {
    open: { label: 'Open', color: theme.colors.state.info },
    asked: { label: 'Asked', color: theme.colors.state.warning },
    resolved: { label: 'Resolved', color: theme.colors.state.success },
  };

  const config = statusConfig[question.status];

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.statusPill, { backgroundColor: config.color + '20' }]}>
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(question.createdAt)}</Text>
      </View>

      <Text style={styles.questionText}>{question.questionText}</Text>

      {question.relatedMarkers && question.relatedMarkers.length > 0 && (
        <View style={styles.markerTags}>
          {question.relatedMarkers.map((marker) => (
            <View key={marker} style={styles.markerTag}>
              <Text style={styles.markerTagText}>{marker}</Text>
            </View>
          ))}
        </View>
      )}

      {question.sourceContext && (
        <View style={styles.context}>
          <Text style={styles.contextText}>
            {question.sourceContext.marker} {question.sourceContext.value}
            {question.sourceContext.testDate && ` • ${formatDate(question.sourceContext.testDate)}`}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {question.status === 'open' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onStatusChange(question.id, 'asked')}
          >
            <MessageCircle size={16} color={theme.colors.text.secondary} />
            <Text style={styles.actionButtonText}>Asked</Text>
          </TouchableOpacity>
        )}

        {question.status === 'asked' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onStatusChange(question.id, 'resolved')}
          >
            <CheckCircle size={16} color={theme.colors.text.secondary} />
            <Text style={styles.actionButtonText}>Resolved</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(question)}
        >
          <Edit3 size={16} color={theme.colors.text.secondary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(question.id)}
        >
          <Trash2 size={16} color={theme.colors.state.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  date: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
  },
  questionText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSizes.md * theme.typography.lineHeights.normal,
    marginBottom: theme.spacing.sm,
  },
  markerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  markerTag: {
    backgroundColor: theme.colors.brand.cyan + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.brand.cyan + '40',
  },
  markerTagText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.brand.cyan,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  context: {
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  contextText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.secondary,
  },
});
