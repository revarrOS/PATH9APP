import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '@/config/theme';
import { supabase } from '@/lib/supabase';
import { LetterReviewScreen } from '@/products/condition/components/LetterReviewScreen';
import { LetterPrepopulationService } from '@/products/condition/services/letter-prepopulation.service';

interface ConditionDocument {
  id: string;
  title: string;
  extraction_json: any;
  extraction_status: string;
}

export default function LetterReviewRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [document, setDocument] = useState<ConditionDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const documentId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (documentId) {
      loadDocument();
    } else {
      setError('Missing letter ID');
      setLoading(false);
    }
  }, [documentId]);

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
        .select('id, title, extraction_json, extraction_status')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error('Document not found or access denied');
      }

      if (data.extraction_status !== 'extracted' && data.extraction_status !== 'partial') {
        throw new Error('Document extraction not complete');
      }

      setDocument(data);
    } catch (err: any) {
      console.error('Error loading document:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAll = async () => {
    if (!document) return;

    const extraction = document.extraction_json || {};

    const result = await LetterPrepopulationService.prepopulateFromLetter({
      documentId: document.id,
      timelineEvents: extraction.timeline_events || [],
      careTeamContacts: extraction.care_team_contacts || [],
      consultationQuestions: extraction.consultation_questions || [],
    });

    await supabase
      .from('condition_documents')
      .update({
        extraction_json: {
          ...extraction,
          prepopulation_result: result,
        },
      })
      .eq('id', document.id);
  };

  const handleBack = () => {
    router.push(`/medical/condition/letters/${documentId}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.blue} />
          <Text style={styles.loadingText}>Loading suggestions...</Text>
        </View>
      </View>
    );
  }

  if (error || !document) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Document not found'}</Text>
        </View>
      </View>
    );
  }

  const extraction = document.extraction_json || {};
  const extractedData = {
    timeline_events: extraction.timeline_events || [],
    care_team_contacts: extraction.care_team_contacts || [],
    consultation_questions: extraction.consultation_questions || [],
    extracted_diagnosis: extraction.extracted_diagnosis || null,
    confidence_score: extraction.confidence_score || 0,
    warnings: extraction.warnings || [],
  };

  return (
    <LetterReviewScreen
      documentId={document.id}
      letterTitle={document.title}
      extractedData={extractedData}
      onAcceptAll={handleAcceptAll}
      onBack={handleBack}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.muted,
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
});
