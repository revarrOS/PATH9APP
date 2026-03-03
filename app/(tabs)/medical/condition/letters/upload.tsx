import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Upload, FileText, AlertCircle, X } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';

export default function UploadLetterScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<'letter' | 'report' | 'discharge' | 'other'>('letter');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
        if (!title) {
          setTitle(result.assets[0].name.replace('.pdf', ''));
        }
        setError(null);
      }
    } catch (err: any) {
      console.error('Error picking document:', err);
      setError(err.message);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      console.log('[DIAGNOSIS] Frontend user.id:', user.id);
      console.log('[DIAGNOSIS] Frontend session token (first 20 chars):', session.access_token.substring(0, 20));

      const fileExt = 'pdf';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('condition-letters')
        .upload(fileName, blob, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: document, error: insertError } = await supabase
        .from('condition_documents')
        .insert({
          user_id: user.id,
          title: title.trim() || '',
          doc_type: docType,
          storage_path: fileName,
          extraction_status: 'uploaded',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('[DIAGNOSIS] Document created with ID:', document.id);

      console.log(`[FRONTEND CALL LOG] Calling analyze-condition-letter | documentId: ${document.id} | timestamp: ${new Date().toISOString()}`);

      fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-condition-letter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ documentId: document.id }),
        }
      ).catch((err) => {
        console.error('[DIAGNOSIS] Edge function error (non-blocking):', err);
      });

      router.replace(`/medical/condition/letters/${document.id}`);
    } catch (err: any) {
      console.error('Error uploading:', err);
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Upload Letter</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={20} color={theme.colors.state.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Document Title</Text>
          <Text style={styles.helperText}>
            Optional. You can add or edit the title after AI analysis.
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Haematology Clinic Letter"
            placeholderTextColor={theme.colors.text.muted}
            editable={!uploading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Document Type</Text>
          <View style={styles.typeSelector}>
            {(['letter', 'report', 'discharge', 'other'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  docType === type && styles.typeButtonActive,
                ]}
                onPress={() => setDocType(type)}
                disabled={uploading}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    docType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>PDF File</Text>
          {selectedFile ? (
            <View style={styles.selectedFile}>
              <FileText size={24} color={theme.colors.brand.blue} />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.size! / 1024).toFixed(0)} KB
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedFile(null)}
                disabled={uploading}
              >
                <X size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.pickButton}
              onPress={pickDocument}
              disabled={uploading}
            >
              <Upload size={24} color={theme.colors.text.muted} />
              <Text style={styles.pickButtonText}>Select PDF file</Text>
            </TouchableOpacity>
          )}
        </View>

        {uploading && (
          <View style={styles.processingBanner}>
            <ActivityIndicator size="small" color={theme.colors.brand.blue} />
            <Text style={styles.processingText}>
              Uploading your letter... this can take a moment.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.uploadButton, (!selectedFile || uploading) && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={theme.colors.background.surface} />
          ) : (
            <>
              <Upload size={20} color={theme.colors.background.surface} />
              <Text style={styles.uploadButtonText}>Upload & Analyze</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  closeButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.state.error,
    gap: 12,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.state.error,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    color: theme.colors.text.muted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: theme.colors.brand.blue + '15',
    borderColor: theme.colors.brand.blue,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.muted,
  },
  typeButtonTextActive: {
    color: theme.colors.brand.blue,
  },
  pickButton: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  pickButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 13,
    color: theme.colors.text.muted,
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.brand.blue + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.brand.blue + '30',
    gap: 12,
  },
  processingText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.brand.blue,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brand.blue,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background.surface,
  },
});
