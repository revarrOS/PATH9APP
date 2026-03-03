import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Send, CircleAlert as AlertCircle, BookmarkPlus } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { supabase } from '@/lib/supabase';
import { AddQuestionModal } from '@/products/bloodwork/consultation-prep/components/AddQuestionModal';
import { sharedConsultationPrepStore } from '@/products/shared/consultation-prep/consultation-prep.store';
import { gemmaConversationService, GemmaMessage } from '@/services/gemma-conversation.service';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/UpgradeModal';
import { AIUsageBanner } from '@/components/AIUsageBanner';

interface Message extends GemmaMessage {}

const TURN_LIMIT = 20;
const MAX_MESSAGE_LENGTH = 500;

export function NutritionChat() {
  const { checkFeature, incrementUsage, aiUsage } = useSubscription();
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGemmaAvailable, setIsGemmaAvailable] = useState<boolean | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Message['consultationPrepSuggestion'] | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previousLastMessageRole, setPreviousLastMessageRole] = useState<'user' | 'assistant' | null>(null);
  const [continuationModalVisible, setContinuationModalVisible] = useState(false);
  const [additionalTurnsGranted, setAdditionalTurnsGranted] = useState(0);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const shouldScrollOnSend = useRef(false);

  const turnCount = conversation.filter(m => m.role === 'user').length;
  const effectiveTurnLimit = TURN_LIMIT + additionalTurnsGranted;
  const isNearingLimit = turnCount >= effectiveTurnLimit;

  useEffect(() => {
    const lastMessage = conversation[conversation.length - 1];
    const currentLastRole = lastMessage?.role || null;

    if (currentLastRole === 'user' && shouldScrollOnSend.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      shouldScrollOnSend.current = false;
    }

    setPreviousLastMessageRole(currentLastRole);
  }, [conversation, previousLastMessageRole]);

  useEffect(() => {
    loadConversation();
    checkGemmaAvailability();
  }, []);

  const loadConversation = async () => {
    try {
      const messages = await gemmaConversationService.getMessages();
      setConversation(messages);
      const lastRole = messages.length > 0 ? messages[messages.length - 1]?.role || null : null;
      setPreviousLastMessageRole(lastRole);
      if (messages.length > 0) {
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const checkGemmaAvailability = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsGemmaAvailable(false);
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/nutrition-ai-respond`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationHistory: [],
            currentMessage: 'ping',
          }),
        }
      );

      setIsGemmaAvailable(response.status !== 503);
    } catch (err) {
      setIsGemmaAvailable(false);
    }
  };

  const handleSaveQuestion = async (questionText: string, relatedMarkers: string[], category: string) => {
    if (!selectedSuggestion) return;

    try {
      await sharedConsultationPrepStore.addQuestion(questionText, 'nutrition', {
        relatedTerms: relatedMarkers,
        source: 'gemma',
        sourceContext: selectedSuggestion.sourceContext,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving question:', err);
    }
  };

  const handleContinueConversation = () => {
    setAdditionalTurnsGranted(prev => prev + TURN_LIMIT);
    setContinuationModalVisible(false);
    console.log('[Conversation Pack] User unlocked additional turns - ready for future billing integration');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const usageCheck = await checkFeature('ai_interactions_evaluation');

    if (!usageCheck.allowed) {
      setUpgradeModalVisible(true);
      return;
    }

    if (isNearingLimit) {
      setContinuationModalVisible(true);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    shouldScrollOnSend.current = true;
    setConversation(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      await gemmaConversationService.addMessage(userMessage, 'nutrition');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const allMessages = await gemmaConversationService.getMessages();
      const domainContext = gemmaConversationService.getDomainContextPrompt('nutrition');

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/nutrition-ai-respond`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationHistory: allMessages.slice(-15).map(m => ({
              role: m.role,
              content: m.content,
            })),
            currentMessage: userMessage.content,
            domainContext,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 503) {
          setIsGemmaAvailable(false);
          throw new Error('Service temporarily unavailable');
        }
        throw new Error('Failed to get response');
      }

      setIsGemmaAvailable(true);
      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        consultationPrepSuggestion: data.showSaveToConsultationPrep
          ? {
              suggestedQuestion: data.suggestedQuestion,
              relatedMarkers: data.relatedTerms || [],
              sourceContext: data.sourceContext,
            }
          : undefined,
      };

      await gemmaConversationService.addMessage(assistantMessage, 'nutrition');
      setConversation(prev => [...prev, assistantMessage]);

      await incrementUsage('ai_interactions_evaluation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AIUsageBanner
        used={aiUsage.used}
        limit={aiUsage.limit}
        onUpgradePress={() => setUpgradeModalVisible(true)}
      />

      {isGemmaAvailable === false && (
        <View style={styles.banner}>
          <AlertCircle size={16} color={theme.colors.state.warning} />
          <Text style={styles.bannerText}>Gemma is unavailable right now</Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      >
        {conversation.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              I can help you reflect on your nutrition patterns and prepare questions for your clinician.
            </Text>
            <Text style={styles.welcomeSubtext}>
              Ask me about your food entries, patterns over time, or nutrition in the context of your condition.
            </Text>
          </View>
        )}

        {conversation.map((message, index) => {
          const messageKey = `${message.timestamp}-${index}`;

          return (
            <View key={messageKey}>
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userText : styles.assistantText,
                  ]}
                >
                  {message.content}
                </Text>
              </View>

              {message.role === 'assistant' && message.consultationPrepSuggestion && (
                <TouchableOpacity
                  style={styles.saveQuestionButton}
                  onPress={() => {
                    setSelectedSuggestion(message.consultationPrepSuggestion || null);
                    setModalVisible(true);
                  }}
                >
                  <BookmarkPlus size={16} color={theme.colors.brand.cyan} />
                  <Text style={styles.saveQuestionButtonText}>
                    Review and save question
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {isLoading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={theme.colors.text.muted} />
          </View>
        )}
      </ScrollView>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your nutrition patterns..."
          placeholderTextColor={theme.colors.text.muted}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send size={20} color={!input.trim() || isLoading ? theme.colors.text.muted : theme.colors.brand.cyan} />
        </TouchableOpacity>
      </View>

      {saveSuccess && (
        <View style={styles.successToast}>
          <Text style={styles.successToastText}>
            Saved to Consultation Prep
          </Text>
        </View>
      )}

      <AddQuestionModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedSuggestion(null);
        }}
        onSave={handleSaveQuestion}
        initialQuestion={
          selectedSuggestion
            ? {
                questionText: selectedSuggestion.suggestedQuestion,
                relatedMarkers: selectedSuggestion.relatedMarkers,
                sourceContext: selectedSuggestion.sourceContext,
              }
            : undefined
        }
      />

      {continuationModalVisible && (
        <View style={styles.continuationModalOverlay}>
          <View style={styles.continuationModal}>
            <Text style={styles.continuationTitle}>Would you like to continue this conversation with Gemma?</Text>
            <Text style={styles.continuationDescription}>
              Keep exploring your nutrition insights without interruption.
            </Text>
            <View style={styles.continuationButtons}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinueConversation}
              >
                <Text style={styles.continueButtonText}>Continue conversation</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.notNowButton}
                onPress={() => setContinuationModalVisible(false)}
              >
                <Text style={styles.notNowButtonText}>Not now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        usedCount={aiUsage.used}
        limitCount={aiUsage.limit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.state.warning,
  },
  bannerText: {
    fontSize: 14,
    color: theme.colors.state.warning,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    gap: 12,
  },
  welcomeContainer: {
    padding: 20,
    gap: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: theme.colors.text.muted,
    lineHeight: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.brand.cyan,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: theme.colors.text.primary,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    padding: 16,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.state.error,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.state.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    padding: 12,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: 8,
    color: theme.colors.text.primary,
    fontSize: 15,
  },
  sendButton: {
    padding: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  saveQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.brand.cyan + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.brand.cyan + '40',
  },
  saveQuestionButtonText: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.brand.cyan,
  },
  successToast: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    padding: 12,
    backgroundColor: theme.colors.state.success,
    borderRadius: 8,
    alignItems: 'center',
  },
  successToastText: {
    fontSize: 14,
    fontWeight: theme.typography.fontWeights.semibold,
    color: '#FFFFFF',
  },
  continuationModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  continuationModal: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  continuationTitle: {
    fontSize: 18,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    lineHeight: 26,
    textAlign: 'center',
  },
  continuationDescription: {
    fontSize: 15,
    color: theme.colors.text.muted,
    lineHeight: 22,
    textAlign: 'center',
  },
  continuationButtons: {
    gap: 12,
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: theme.colors.brand.cyan,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: theme.typography.fontWeights.semibold,
    color: '#FFFFFF',
  },
  notNowButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  notNowButtonText: {
    fontSize: 16,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.muted,
  },
});
