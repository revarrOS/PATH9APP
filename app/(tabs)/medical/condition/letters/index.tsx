import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { FileText, Upload, AlertCircle, ChevronLeft } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { supabase } from '@/lib/supabase';

interface ConditionDocument {
  id: string;
  title: string;
  doc_type: string;
  doc_date: string | null;
  extraction_status: 'uploaded' | 'processing' | 'extracted' | 'partial' | 'failed';
  confidence_score: number | null;
  created_at: string;
}

export default function ConditionLettersScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<ConditionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [])
  );

  const loadDocuments = async () => {
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
        .select('id, title, doc_type, doc_date, extraction_status, confidence_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
        return 'Processing';
      case 'partial':
        return 'Needs review';
      case 'failed':
        return 'Failed';
      default:
        return 'Uploaded';
    }
  };

  const renderDocument = ({ item }: { item: ConditionDocument }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => router.push(`/medical/condition/letters/${item.id}`)}
    >
      <View style={styles.documentIcon}>
        <FileText size={24} color={theme.colors.brand.blue} />
      </View>
      <View style={styles.documentContent}>
        <Text style={styles.documentTitle}>{item.title || 'Untitled'}</Text>
        <Text style={styles.documentMeta}>
          {item.doc_date ? new Date(item.doc_date).toLocaleDateString('en-GB') : 'No date'} • {item.doc_type}
        </Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.extraction_status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.extraction_status) }]}>
            {getStatusLabel(item.extraction_status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FileText size={64} color={theme.colors.text.muted} strokeWidth={1} />
      <Text style={styles.emptyTitle}>No letters yet</Text>
      <Text style={styles.emptyText}>
        Add a letter when you're ready. Path9 can help pull out what matters.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/medical/condition')}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Letters & Reports</Text>
          <Text style={styles.subtitle}>
            Upload medical letters for extraction and prepopulation
          </Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={20} color={theme.colors.state.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.blue} />
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => router.push('/medical/condition/letters/upload')}
      >
        <Upload size={20} color={theme.colors.background.surface} />
        <Text style={styles.uploadButtonText}>Upload letter</Text>
      </TouchableOpacity>
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
    gap: 12,
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
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.muted,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.state.error,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.state.error,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  documentCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    marginBottom: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.brand.blue + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 13,
    color: theme.colors.text.muted,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brand.blue,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background.surface,
  },
});
