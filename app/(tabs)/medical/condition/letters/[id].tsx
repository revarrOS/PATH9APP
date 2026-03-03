import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Switch, Alert, Platform, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FileText, Eye, EyeOff, Trash2, ChevronLeft, ExternalLink, Edit2, Check } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { supabase } from '@/lib/supabase';
import { ConditionService } from '@/products/condition/services/condition.service';
import { LetterPrepopulationService } from '@/products/condition/services/letter-prepopulation.service';

interface ConditionDocument {
  id: string;
  title: string;
  doc_type: string;
  doc_date: string | null;
  source: string | null;
  storage_path: string;
  masked_text: string | null;
  full_text: string | null;
  extraction_json: any;
  extraction_status: string;
  confidence_score: number | null;
  created_at: string;
}

export default function LetterDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [document, setDocument] = useState<ConditionDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [maskingEnabled, setMaskingEnabled] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isAutoPrepopulating, setIsAutoPrepopulating] = useState(false);

  const documentId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (documentId) {
      loadDocument();
    } else {
      setError('Missing letter ID');
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (!document) return;

    const isProcessing = ['uploaded', 'processing'].includes(document.extraction_status);

    if (isProcessing) {
      const interval = setInterval(() => {
        loadDocument();
      }, 3000);

      return () => clearInterval(interval);
    }

    if (
      document.extraction_status === 'extracted' &&
      !hasBeenPrepopulated(document.extraction_json) &&
      !isAutoPrepopulating
    ) {
      autoPrepopulateData();
    }
  }, [document?.extraction_status, document?.id, isAutoPrepopulating]);

  const hasBeenPrepopulated = (extractionJson: any): boolean => {
    return !!(extractionJson?.prepopulation_result);
  };

  const autoPrepopulateData = async () => {
    if (!document || isAutoPrepopulating) return;

    setIsAutoPrepopulating(true);

    try {
      console.log('[AUTO-PREPOPULATE] Starting for document:', document.id);
      const extraction = document.extraction_json || {};

      const result = await LetterPrepopulationService.prepopulateFromLetter({
        documentId: document.id,
        timelineEvents: extraction.timeline_events || [],
        careTeamContacts: extraction.care_team_contacts || [],
        consultationQuestions: extraction.consultation_questions || [],
      });

      console.log('[AUTO-PREPOPULATE] Result:', result);

      const { error: updateError } = await supabase
        .from('condition_documents')
        .update({
          extraction_json: {
            ...extraction,
            prepopulation_result: result,
          },
        })
        .eq('id', document.id);

      if (updateError) {
        throw updateError;
      }

      console.log('[AUTO-PREPOPULATE] Database updated successfully');
      await loadDocument();
    } catch (err) {
      console.error('[AUTO-PREPOPULATE] Error:', err);
    } finally {
      setIsAutoPrepopulating(false);
    }
  };

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('condition_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error('Document not found or access denied');
      }

      setDocument(data);
      setEditedTitle(data?.title || '');
    } catch (err: any) {
      console.error('Error loading document:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    try {
      const { error: updateError } = await supabase
        .from('condition_documents')
        .update({ title: editedTitle.trim() })
        .eq('id', documentId);

      if (updateError) throw updateError;

      setDocument(prev => prev ? { ...prev, title: editedTitle.trim() } : null);
      setEditingTitle(false);
    } catch (err: any) {
      console.error('Error updating title:', err);
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;

    const confirmed = window.confirm(
      'Delete Letter\n\n' +
      'Are you sure you want to delete this letter?\n\n' +
      'This will permanently remove the letter from your records.\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) {
      console.log('Delete cancelled');
      return;
    }

    try {
      console.log('Deleting letter:', documentId);
      setDeleting(true);
      setError(null);

      await ConditionService.deleteDocument(documentId);

      console.log('Letter deleted successfully');
      router.back();
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete letter';
      setError(errorMessage);
      window.alert(`Delete Failed\n\n${errorMessage}`);
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'extracted':
        return theme.colors.state.success;
      case 'processing':
        return theme.colors.brand.blue;
      case 'partial':
        return theme.colors.state.warning;
      case 'failed':
        return theme.colors.state.error;
      default:
        return theme.colors.text.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'extracted':
        return 'Extracted';
      case 'processing':
        return 'Processing... check back in a moment';
      case 'partial':
        return 'Partially extracted - please review';
      case 'failed':
        return 'Extraction failed';
      default:
        return 'Uploaded';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.blue} />
        </View>
      </View>
    );
  }

  if (error || !document) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/medical/condition/letters')}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Document not found'}</Text>
        </View>
      </View>
    );
  }

  const displayText = maskingEnabled
    ? (document?.masked_text || 'No text content available')
    : (document?.full_text || 'No text content available');

  const extraction = document?.extraction_json || {};
  const piiSpans = Array.isArray(extraction?.pii_spans) ? extraction.pii_spans : [];
  const hasPII = piiSpans.length > 0;

  const prepopulationCount = {
    entries: Array.isArray(extraction?.timeline_events) ? extraction.timeline_events.length : 0,
    contacts: Array.isArray(extraction?.contacts) ? extraction.contacts.length : 0,
    questions: Array.isArray(extraction?.consultation_questions) ? extraction.consultation_questions.length : 0,
    signals: Array.isArray(extraction?.trend_signals) ? extraction.trend_signals.length : 0,
  };

  const totalPrepopulated = Object.values(prepopulationCount).reduce((a, b) => a + b, 0);

  const prepopulationResult = extraction?.prepopulation_result;
  const hasDuplicates = prepopulationResult && prepopulationResult.duplicates_skipped > 0;
  const hasBeenProcessed = !!prepopulationResult;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/medical/condition/letters')}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          {editingTitle ? (
            <View style={styles.titleEditContainer}>
              <TextInput
                style={styles.titleInput}
                value={editedTitle}
                onChangeText={setEditedTitle}
                autoFocus
                placeholder="Enter title"
                placeholderTextColor={theme.colors.text.muted}
              />
              <TouchableOpacity onPress={handleSaveTitle} style={styles.saveButton}>
                <Check size={20} color={theme.colors.brand.blue} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.titleContainer}
              onPress={() => setEditingTitle(true)}
            >
              <Text style={styles.headerTitle} numberOfLines={1}>
                {document?.title || 'Untitled'}
              </Text>
              <Edit2 size={14} color={theme.colors.text.muted} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerSubtitle}>
            {document?.doc_date ? new Date(document.doc_date).toLocaleDateString('en-GB') : 'No date'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={theme.colors.state.error} />
          ) : (
            <Trash2 size={20} color={theme.colors.state.error} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusSection}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(document?.extraction_status || 'uploaded') }]} />
          <Text style={[styles.statusLabel, { color: getStatusColor(document?.extraction_status || 'uploaded') }]}>
            {getStatusLabel(document?.extraction_status || 'uploaded')}
          </Text>
        </View>

        {document?.extraction_status === 'extracted' || document?.extraction_status === 'partial' ? (
          <>
            {Array.isArray(extraction?.clinical_assessment) && extraction.clinical_assessment.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Clinical Summary</Text>
                <View style={styles.summaryBox}>
                  {extraction.clinical_assessment.slice(0, 3).map((item: string, idx: number) => (
                    <Text key={idx} style={styles.summaryItem}>• {item}</Text>
                  ))}
                </View>
              </View>
            )}

            {!hasBeenProcessed && (
              <View style={styles.section}>
                <View style={styles.processingBox}>
                  <ActivityIndicator size="small" color={theme.colors.brand.cyan} />
                  <Text style={styles.processingInlineText}>
                    Processing document information...
                  </Text>
                </View>
              </View>
            )}

            {hasBeenProcessed && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Processed Data</Text>
                <View style={styles.processedBox}>
                  <Text style={styles.processedTitle}>✓ Letter processed successfully</Text>
                  {(prepopulationResult.timeline_created + prepopulationResult.contacts_created + prepopulationResult.questions_created) === 0 ? (
                    <Text style={styles.processedItem}>
                      No new items to review — everything is already captured
                    </Text>
                  ) : (
                    <>
                      {prepopulationResult.timeline_created > 0 && (
                        <Text style={styles.processedItem}>
                          • {prepopulationResult.timeline_created} new {prepopulationResult.timeline_created === 1 ? 'event' : 'events'} added to timeline
                        </Text>
                      )}
                      {prepopulationResult.contacts_created > 0 && (
                        <Text style={styles.processedItem}>
                          • {prepopulationResult.contacts_created} new {prepopulationResult.contacts_created === 1 ? 'contact' : 'contacts'} added
                        </Text>
                      )}
                      {prepopulationResult.questions_created > 0 && (
                        <Text style={styles.processedItem}>
                          • {prepopulationResult.questions_created} {prepopulationResult.questions_created === 1 ? 'question' : 'questions'} added
                        </Text>
                      )}
                    </>
                  )}
                  {hasDuplicates && (
                    <View style={styles.duplicateNotice}>
                      <Text style={styles.duplicateText}>
                        ℹ️ {prepopulationResult.duplicates_skipped} {prepopulationResult.duplicates_skipped === 1 ? 'item was' : 'items were'} recognized as existing data and not duplicated
                      </Text>
                    </View>
                  )}
                  {prepopulationResult.errors && prepopulationResult.errors.length > 0 && (
                    <View style={styles.errorNotice}>
                      <Text style={styles.errorNoticeText}>
                        ⚠️ {prepopulationResult.errors.length} {prepopulationResult.errors.length === 1 ? 'error' : 'errors'} occurred during processing
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Document Content</Text>
                {hasPII && (
                  <View style={styles.maskToggle}>
                    <Text style={styles.maskToggleLabel}>Mask personal details</Text>
                    <Switch
                      value={maskingEnabled}
                      onValueChange={setMaskingEnabled}
                      trackColor={{
                        false: theme.colors.border.subtle,
                        true: theme.colors.brand.blue
                      }}
                      thumbColor={theme.colors.background.surface}
                    />
                  </View>
                )}
              </View>

              <ScrollView style={styles.textContainer}>
                <Text style={styles.documentText}>{displayText}</Text>
              </ScrollView>
            </View>
          </>
        ) : (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={theme.colors.brand.blue} />
            <Text style={styles.processingText}>
              {document?.extraction_status === 'processing'
                ? 'Reading your letter... this can take a moment.'
                : 'Waiting to process...'}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.viewPdfButton}
            onPress={() => {}}
          >
            <ExternalLink size={20} color={theme.colors.brand.blue} />
            <Text style={styles.viewPdfButtonText}>View original PDF</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.brand.blue,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
  deleteButton: {
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.state.error,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  maskToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maskToggleLabel: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
  summaryBox: {
    backgroundColor: theme.colors.brand.blue + '08',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.brand.blue + '20',
  },
  summaryItem: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: 8,
  },
  extractionBox: {
    backgroundColor: theme.colors.state.warning,
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.state.warning,
  },
  extractionItem: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: 6,
    fontWeight: '500',
  },
  reviewButton: {
    backgroundColor: theme.colors.brand.cyan,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  extractionNote: {
    fontSize: 12,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  processingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.brand.cyan + '10',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.brand.cyan + '30',
    gap: 12,
  },
  processingInlineText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  processedBox: {
    backgroundColor: theme.colors.state.success + '15',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.state.success + '40',
  },
  processedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.state.success,
    marginBottom: 12,
  },
  processedItem: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  duplicateNotice: {
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.colors.brand.blue + '15',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.brand.blue + '30',
  },
  duplicateText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  errorNotice: {
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.colors.state.error + '15',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.state.error + '30',
  },
  errorNoticeText: {
    fontSize: 13,
    color: theme.colors.state.error,
    lineHeight: 18,
  },
  textContainer: {
    maxHeight: 400,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  documentText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  processingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  processingText: {
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  viewPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.brand.blue,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  viewPdfButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.brand.blue,
  },
});
