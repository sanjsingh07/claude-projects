import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StellarText } from '@components/StellarCard';
import { StellarBackground } from '@components/StellarBackground';
import { useAuthStore } from '@store/authStore';
import { colors, spacing } from '@theme/theme';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatResponse {
  message: string;
  chartContext?: {
    sunSign: string;
    moonSign: string;
    risingSign: string;
  };
}

export const ChatScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState('');
  const [pendingMessages, setPendingMessages] = useState<{id: string, role: 'user' | 'assistant', content: string}[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch chat history
  const { data: chatHistory, refetch } = useQuery({
    queryKey: ['chatHistory', user?.id],
    queryFn: async () => {
      const response = await api.client.get('/chat/history');
      return response.data as Message[];
    },
    enabled: !!user?.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const userMessageId = `pending-${Date.now()}`;

      // Immediately add user message to UI
      setPendingMessages(prev => [...prev, { id: userMessageId, role: 'user', content: message }]);

      const response = await api.client.post('/chat/message', { message });
      return response.data as ChatResponse;
    },
    onMutate: () => {
      setInput('');
    },
    onSuccess: () => {
      // Clear pending and refetch history after success
      setPendingMessages([]);
      refetch();
    },
    onError: (error: any) => {
      console.error('Chat error:', error);
      // Clear pending on error
      setPendingMessages([]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input);
  };

  // Combine persisted messages with pending ones
  const chatHistorySafe = chatHistory || [];
  const messages: Message[] = [...chatHistorySafe, ...pendingMessages as any];

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages?.length]);

  return (
    <SafeAreaView style={styles.container}>
      <StellarBackground />

      {/* Header */}
      <View style={styles.header}>
        <StellarText variant="heading2" uppercase>
          Astro Guide
        </StellarText>
        <StellarText variant="caption" color={colors.gray400}>
          Your personal astrology assistant
        </StellarText>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {(!messages || messages.length === 0) ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.gray600} />
            <StellarText variant="heading3" style={{ marginTop: spacing.lg, color: colors.gray400 }}>
              Start a Conversation
            </StellarText>
            <StellarText
              variant="body"
              style={{ marginTop: spacing.sm, color: colors.gray500, textAlign: 'center', maxWidth: 300 }}
            >
              Ask me anything about your natal chart, horoscopes, or astrology!
            </StellarText>
            <View style={styles.suggestions}>
              <StellarText variant="bodySmall" color={colors.gray500}>
                Try asking:
              </StellarText>
              <Text style={styles.suggestion}>• "What does my Sun sign mean?"</Text>
              <Text style={styles.suggestion}>• "Tell me about my rising sign"</Text>
              <Text style={styles.suggestion}>• "How will today's transits affect me?"</Text>
            </View>
          </View>
        ) : (
          messages.map((msg, index) => (
            <View
              key={msg.id || index}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <StellarText
                variant="body"
                style={msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText}
              >
                {msg.content}
              </StellarText>
            </View>
          ))
        )}
        {sendMessageMutation.isPending && (
          <View style={[styles.messageBubble, styles.assistantMessage]}>
            <ActivityIndicator size="small" color={colors.white} />
            <StellarText variant="body" style={{ marginLeft: spacing.sm, color: colors.gray400 }}>
              {sendMessageMutation.isPending ? "Consulting the stars..." : ""}
            </StellarText>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your chart..."
          placeholderTextColor={colors.gray500}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || sendMessageMutation.isPending}
        >
          <Ionicons
            name="send"
            size={20}
            color={input.trim() && !sendMessageMutation.isPending ? colors.black : colors.gray600}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  messagesContent: {
    paddingVertical: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  suggestions: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  suggestion: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: colors.white,
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: colors.gray800,
  },
  userMessageText: {
    color: colors.black,
  },
  assistantMessageText: {
    color: colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray800,
    backgroundColor: colors.black,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray800,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    maxHeight: 100,
    color: colors.white,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray800,
  },
});

export default ChatScreen;
