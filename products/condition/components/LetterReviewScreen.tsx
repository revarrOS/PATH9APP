import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { ChevronLeft, Check, X, Edit3 } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { useRouter } from 'expo-router';

interface TimelineEventSuggestion {
  event_type: 'diagnosis' | 'appointment' | 'test' | 'treatment' | 'referral';
  date: string | null;
  description: string;
  provider: string | null;
}

interface CareTeamContactSuggestion {
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  facility: string | null;
}

interface ConsultationQuestionSuggestion {
  question_text: string;
  category: 'diagnosis' | 'treatment' | 'side_effects' | 'prognosis' | 'lifestyle' | 'general';
  priority: 'high' | 'medium' | 'low';
}

interface LetterReviewScreenProps {
  documentId: string;
  letterTitle: string;
  extractedData: {
    timeline_events: TimelineEventSuggestion[];
    care_team_contacts: CareTeamContactSuggestion[];
    consultation_questions: ConsultationQuestionSuggestion[];
    extracted_diagnosis: string | null;
    confidence_score: number;
    warnings: string[];
  };
  onAcceptAll: () => Promise<void>;
  onBack: () => void;
}

type SuggestionState = 'pending' | 'accepted' | 'rejected' | 'edited';

interface SuggestionTracking {
  [key: string]: SuggestionState;
}

export function LetterReviewScreen({
  documentId,
  letterTitle,
  extractedData,
  onAcceptAll,
  onBack,
}: LetterReviewScreenProps) {
  const router = useRouter();
  const [timelineStates, setTimelineStates] = useState<SuggestionTracking>({});
  const [contactStates, setContactStates] = useState<SuggestionTracking>({});
  const [questionStates, setQuestionStates] = useState<SuggestionTracking>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initialTimeline: SuggestionTracking = {};
    extractedData.timeline_events.forEach((_, idx) => {
      initialTimeline[idx] = 'pending';
    });
    setTimelineStates(initialTimeline);

    const initialContacts: SuggestionTracking = {};
    extractedData.care_team_contacts.forEach((_, idx) => {
      initialContacts[idx] = 'pending';
    });
    setContactStates(initialContacts);

    const initialQuestions: SuggestionTracking = {};
    extractedData.consultation_questions.forEach((_, idx) => {
      initialQuestions[idx] = 'pending';
    });
    setQuestionStates(initialQuestions);
  }, [extractedData]);

  const handleAcceptTimeline = (index: number) => {
    setTimelineStates(prev => {
      const updated = { ...prev, [index]: 'accepted' };
      checkAndAutoSave(updated, contactStates, questionStates);
      return updated;
    });
  };

  const handleRejectTimeline = (index: number) => {
    setTimelineStates(prev => {
      const updated = { ...prev, [index]: 'rejected' };
      checkAndAutoSave(updated, contactStates, questionStates);
      return updated;
    });
  };

  const handleEditTimeline = (index: number) => {
    setTimelineStates(prev => ({ ...prev, [index]: 'edited' }));
  };

  const handleAcceptContact = (index: number) => {
    setContactStates(prev => {
      const updated = { ...prev, [index]: 'accepted' };
      checkAndAutoSave(timelineStates, updated, questionStates);
      return updated;
    });
  };

  const handleRejectContact = (index: number) => {
    setContactStates(prev => {
      const updated = { ...prev, [index]: 'rejected' };
      checkAndAutoSave(timelineStates, updated, questionStates);
      return updated;
    });
  };

  const handleEditContact = (index: number) => {
    setContactStates(prev => ({ ...prev, [index]: 'edited' }));
  };

  const handleAcceptQuestion = (index: number) => {
    setQuestionStates(prev => {
      const updated = { ...prev, [index]: 'accepted' };
      checkAndAutoSave(timelineStates, contactStates, updated);
      return updated;
    });
  };

  const handleRejectQuestion = (index: number) => {
    setQuestionStates(prev => {
      const updated = { ...prev, [index]: 'rejected' };
      checkAndAutoSave(timelineStates, contactStates, updated);
      return updated;
    });
  };

  const handleEditQuestion = (index: number) => {
    setQuestionStates(prev => ({ ...prev, [index]: 'edited' }));
  };

  const checkAndAutoSave = (
    timeline: SuggestionTracking,
    contacts: SuggestionTracking,
    questions: SuggestionTracking
  ) => {
    const hasPending =
      Object.values(timeline).some(state => state === 'pending') ||
      Object.values(contacts).some(state => state === 'pending') ||
      Object.values(questions).some(state => state === 'pending');

    if (!hasPending && !saving) {
      handleSaveAll();
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await onAcceptAll();
      router.push(`/medical/condition/letters/${documentId}`);
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', 'Failed to save suggestions');
    }
  };

  const hasPendingSuggestions =
    Object.values(timelineStates).some(state => state === 'pending') ||
    Object.values(contactStates).some(state => state === 'pending') ||
    Object.values(questionStates).some(state => state === 'pending');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Review Suggestions</Text>
        <View style={styles.headerRight}>
          {saving && (
            <ActivityIndicator size="small" color={theme.colors.brand.cyan} />
          )}
        </View>
      </View>

      {extractedData.warnings.length > 0 && (
        <View style={styles.warningBanner}>
          {extractedData.warnings.map((warning, idx) => (
            <Text key={idx} style={styles.warningText}>• {warning}</Text>
          ))}
        </View>
      )}

      <View style={styles.aiReviewBanner}>
        <Text style={styles.aiReviewText}>
          Please review AI-extracted data (highlighted in yellow) before saving
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {extractedData.extracted_diagnosis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary Diagnosis</Text>
            <View style={styles.diagnosisCard}>
              <Text style={styles.diagnosisText}>{extractedData.extracted_diagnosis}</Text>
              <View style={styles.aiBadgeContainer}>
                <Text style={styles.aiBadge}>AI</Text>
              </View>
            </View>
          </View>
        )}

        {extractedData.timeline_events.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Timeline Events ({extractedData.timeline_events.length})
            </Text>
            {extractedData.timeline_events.map((event, idx) => {
              const state = timelineStates[idx];
              return (
                <View
                  key={idx}
                  style={[
                    styles.suggestionCard,
                    state === 'pending' && styles.suggestionCardPending,
                    state === 'accepted' && styles.suggestionCardAccepted,
                    state === 'rejected' && styles.suggestionCardRejected,
                  ]}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.eventType}>{event.event_type.toUpperCase()}</Text>
                    {state === 'pending' && <Text style={styles.aiBadge}>AI</Text>}
                  </View>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  {event.date && (
                    <Text style={styles.eventDetail}>Date: {event.date}</Text>
                  )}
                  {event.provider && (
                    <Text style={styles.eventDetail}>Provider: {event.provider}</Text>
                  )}
                  {state === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAcceptTimeline(idx)}
                        activeOpacity={0.7}>
                        <Check size={16} color={theme.colors.text.inverse} />
                        <Text style={styles.actionButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEditTimeline(idx)}
                        activeOpacity={0.7}>
                        <Edit3 size={16} color={theme.colors.text.primary} />
                        <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectTimeline(idx)}
                        activeOpacity={0.7}>
                        <X size={16} color={theme.colors.text.inverse} />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {state === 'accepted' && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Accepted</Text>
                    </View>
                  )}
                  {state === 'rejected' && (
                    <View style={[styles.statusBadge, styles.statusBadgeRejected]}>
                      <Text style={styles.statusText}>Rejected</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {extractedData.care_team_contacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Care Team Contacts ({extractedData.care_team_contacts.length})
            </Text>
            {extractedData.care_team_contacts.map((contact, idx) => {
              const state = contactStates[idx];
              return (
                <View
                  key={idx}
                  style={[
                    styles.suggestionCard,
                    state === 'pending' && styles.suggestionCardPending,
                    state === 'accepted' && styles.suggestionCardAccepted,
                    state === 'rejected' && styles.suggestionCardRejected,
                  ]}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {state === 'pending' && <Text style={styles.aiBadge}>AI</Text>}
                  </View>
                  <Text style={styles.contactRole}>{contact.role}</Text>
                  {contact.facility && (
                    <Text style={styles.eventDetail}>{contact.facility}</Text>
                  )}
                  {contact.phone && (
                    <Text style={styles.eventDetail}>Phone: {contact.phone}</Text>
                  )}
                  {contact.email && (
                    <Text style={styles.eventDetail}>Email: {contact.email}</Text>
                  )}
                  {state === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAcceptContact(idx)}
                        activeOpacity={0.7}>
                        <Check size={16} color={theme.colors.text.inverse} />
                        <Text style={styles.actionButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEditContact(idx)}
                        activeOpacity={0.7}>
                        <Edit3 size={16} color={theme.colors.text.primary} />
                        <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectContact(idx)}
                        activeOpacity={0.7}>
                        <X size={16} color={theme.colors.text.inverse} />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {state === 'accepted' && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Accepted</Text>
                    </View>
                  )}
                  {state === 'rejected' && (
                    <View style={[styles.statusBadge, styles.statusBadgeRejected]}>
                      <Text style={styles.statusText}>Rejected</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {extractedData.consultation_questions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Consultation Questions ({extractedData.consultation_questions.length})
            </Text>
            {extractedData.consultation_questions.map((question, idx) => {
              const state = questionStates[idx];
              return (
                <View
                  key={idx}
                  style={[
                    styles.suggestionCard,
                    state === 'pending' && styles.suggestionCardPending,
                    state === 'accepted' && styles.suggestionCardAccepted,
                    state === 'rejected' && styles.suggestionCardRejected,
                  ]}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.questionPriority}>{question.priority.toUpperCase()}</Text>
                    {state === 'pending' && <Text style={styles.aiBadge}>AI</Text>}
                  </View>
                  <Text style={styles.questionText}>{question.question_text}</Text>
                  <Text style={styles.questionCategory}>Category: {question.category}</Text>
                  {state === 'pending' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAcceptQuestion(idx)}
                        activeOpacity={0.7}>
                        <Check size={16} color={theme.colors.text.inverse} />
                        <Text style={styles.actionButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEditQuestion(idx)}
                        activeOpacity={0.7}>
                        <Edit3 size={16} color={theme.colors.text.primary} />
                        <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectQuestion(idx)}
                        activeOpacity={0.7}>
                        <X size={16} color={theme.colors.text.inverse} />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {state === 'accepted' && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Accepted</Text>
                    </View>
                  )}
                  {state === 'rejected' && (
                    <View style={[styles.statusBadge, styles.statusBadgeRejected]}>
                      <Text style={styles.statusText}>Rejected</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
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
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBanner: {
    backgroundColor: theme.colors.state.warning,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.state.warning,
  },
  warningText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.primary,
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
  },
  aiReviewBanner: {
    backgroundColor: theme.colors.state.warning,
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.state.warning,
  },
  aiReviewText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  content: {
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
    marginBottom: theme.spacing.md,
  },
  diagnosisCard: {
    backgroundColor: theme.colors.state.warning,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.state.warning,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagnosisText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  aiBadgeContainer: {
    marginLeft: theme.spacing.sm,
  },
  aiBadge: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.inverse,
    backgroundColor: theme.colors.state.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  suggestionCard: {
    backgroundColor: theme.colors.background.elevated,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
  },
  suggestionCardPending: {
    backgroundColor: theme.colors.state.warning,
    borderColor: theme.colors.state.warning,
  },
  suggestionCardAccepted: {
    backgroundColor: theme.colors.state.success,
    borderColor: theme.colors.state.success,
    opacity: 0.7,
  },
  suggestionCardRejected: {
    backgroundColor: theme.colors.background.elevated,
    borderColor: theme.colors.border.subtle,
    opacity: 0.5,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  eventType: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  eventDescription: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  eventDetail: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  contactName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  contactRole: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  questionPriority: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  questionCategory: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  acceptButton: {
    backgroundColor: theme.colors.brand.cyan,
  },
  editButton: {
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  rejectButton: {
    backgroundColor: theme.colors.state.error,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.inverse,
  },
  editButtonText: {
    color: theme.colors.text.primary,
  },
  statusBadge: {
    backgroundColor: theme.colors.state.success,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  statusBadgeRejected: {
    backgroundColor: theme.colors.state.error,
  },
  statusText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.inverse,
  },
});
