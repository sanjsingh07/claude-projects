import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Text,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StellarText } from '@components/StellarCard';
import { StellarBackground } from '@components/StellarBackground';
import { useAuthStore } from '@store/authStore';
import { colors, spacing, shadows } from '@theme/theme';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@services/api';
import { DateTime } from 'luxon';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatResponse {
  message: string;
}

export const ChatScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState('');
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
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
      const now = DateTime.now().toISO();

      // Immediately add user message to UI
      const newUserMsg: Message = { id: userMessageId, role: 'user', content: message, timestamp: now };
      setPendingMessages(prev => [...prev, newUserMsg]);

      const response = await api.client.post('/chat/message', { message });
      return response.data as ChatResponse;
    },
    onMutate: () => {
      setInput('');
    },
    onSuccess: () => {
      setPendingMessages([]);
      refetch();
    },
    onError: (error: any) => {
      console.error('Chat error:', error);
      setPendingMessages([]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input);
  };

  const handleClearChat = async () => {
    try {
      setMenuVisible(false);
      await api.client.delete('/chat/session');
      refetch();
    } catch (error) {
      console.error('Failed to clear chat:', error);
      Alert.alert('Error', 'Failed to clear chat. Please try again.');
    }
  };

  const confirmClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'This action is permanent and will clear the chat to start fresh. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Chat', 
          style: 'destructive', 
          onPress: handleClearChat 
        },
      ]
    );
  };

  const messages: Message[] = [...(chatHistory || []), ...pendingMessages];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, sendMessageMutation.isPending]);

  const formatTime = (iso: string) => {
    return DateTime.fromISO(iso).toFormat('h:mm a');
  };

  const renderMessageContent = (content: string) => {
    if (!content) return '';
    
    // Check if it's a JSON string
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        // If it's the structured format we've seen: { greeting: "...", analysis: "..." }
        if (parsed.greeting || parsed.analysis) {
          return `${parsed.greeting || ''}\n\n${parsed.analysis || ''}`.trim();
        }
        // Fallback for other JSON structures
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Not valid JSON, just return as is
        return content;
      }
    }
    return content;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <StellarBackground />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiAvatar}>
          <StellarText style={styles.avatarSymbol}>✧</StellarText>
        </View>
        <View style={styles.headerInfo}>
          <StellarText style={styles.headerTitle} serif italic>Stellar Align Guide</StellarText>
          <StellarText style={styles.headerStatus}>
            {sendMessageMutation.isPending ? 'Consulting the stars...' : 'Online'}
          </StellarText>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={() => setMenuVisible(!menuVisible)}>
          <StellarText style={styles.moreIcon}>⋮</StellarText>
        </TouchableOpacity>

        {/* Custom Dropdown Menu */}
        {menuVisible && (
          <Pressable 
            style={styles.menuOverlay} 
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={confirmClearChat}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <StellarText style={[styles.menuItemText, { color: colors.error }]}>Clear Chat</StellarText>
              </TouchableOpacity>
            </View>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Chat Messages or Empty State */}
        {(!messages || messages.length === 0) ? (
          <ScrollView contentContainerStyle={styles.emptyStateContainer}>
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.gray600} />
              <StellarText style={{ fontSize: 24, marginTop: spacing.lg, color: colors.gray400, fontFamily: 'Instrument Serif', fontStyle: 'italic' }}>
                Start a Conversation
              </StellarText>
              <StellarText
                style={{ marginTop: spacing.sm, color: colors.gray500, textAlign: 'center', maxWidth: 300, fontSize: 14, fontFamily: 'DM Sans' }}
              >
                Ask me anything about your natal chart, horoscopes, or astrology!
              </StellarText>
              <View style={styles.suggestions}>
                <StellarText style={{ fontSize: 12, color: colors.gray500, fontFamily: 'DM Sans', marginBottom: 8 }}>
                  Try asking:
                </StellarText>
                <Text style={styles.suggestion}>• "What does my Sun sign mean?"</Text>
                <Text style={styles.suggestion}>• "Tell me about my rising sign"</Text>
                <Text style={styles.suggestion}>• "How will today's transits affect me?"</Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, index) => {
              const isUser = msg.role.toLowerCase() === 'user';
              return (
                <View key={msg.id || index} style={[styles.msg, isUser ? styles.userMsg : styles.aiMsg]}>
                  <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                    <StellarText style={styles.bubbleText}>
                      {renderMessageContent(msg.content)}
                    </StellarText>
                  </View>
                  <StellarText style={[styles.msgTime, isUser && styles.userTime]}>
                    {formatTime(msg.timestamp)}
                  </StellarText>
                </View>
              );
            })}
            
            {sendMessageMutation.isPending && (
              <View style={styles.aiMsg}>
                <View style={[styles.bubble, styles.aiBubble]}>
                  <ActivityIndicator size="small" color={colors.stellarFg} />
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {sendMessageMutation.isPending && (
          <StellarText style={styles.typingIndicator}>Stellar Align is typing...</StellarText>
        )}

        {/* Input Area */}
        <View style={styles.inputWrap}>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask about your transits..."
              placeholderTextColor={colors.stellarMuted}
              value={input}
              onChangeText={setInput}
              multiline
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sendMessageMutation.isPending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sendMessageMutation.isPending}
          >
            <StellarText style={styles.sendIcon}>↑</StellarText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stellarBg,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.stellarBorder,
    gap: 12,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    backgroundColor: colors.stellarViolet, // Note: HTML uses a gradient, simplified here
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSymbol: {
    fontSize: 14,
    color: colors.stellarFg,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    color: colors.stellarFg,
    fontFamily: 'Instrument Serif',
    fontStyle: 'italic',
  },
  headerStatus: {
    fontSize: 10,
    color: colors.stellarViolet,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
    fontFamily: 'DM Sans',
  },
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    fontSize: 20,
    color: colors.stellarMuted,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
    flexGrow: 1,
    alignItems: 'stretch',
  },
  msg: {
    maxWidth: '85%',
    gap: 4,
  },
  aiMsg: {
    alignSelf: 'flex-start',
  },
  userMsg: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  aiBubble: {
    backgroundColor: colors.stellarSurface,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.stellarViolet,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.stellarFg,
    fontFamily: 'DM Sans',
  },
  msgTime: {
    fontSize: 9,
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
    paddingHorizontal: 4,
  },
  userTime: {
    textAlign: 'right',
  },
  typingIndicator: {
    fontSize: 12,
    color: colors.stellarMuted,
    paddingHorizontal: 24,
    fontStyle: 'italic',
    marginBottom: 10,
    fontFamily: 'DM Sans',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    borderTopWidth: 1,
    borderTopColor: colors.stellarBorder,
    gap: 12,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.stellarSurface,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
  },
  textInput: {
    flex: 1,
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: colors.stellarFg,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.stellarViolet,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendIcon: {
    fontSize: 18,
    color: colors.stellarFg,
    fontWeight: '700',
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    right: 24,
    backgroundColor: colors.stellarSurface,
    borderWidth: 1,
    borderColor: colors.stellarBorder,
    borderRadius: 12,
    padding: 4,
    minWidth: 140,
    ...shadows.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
  },
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  suggestions: {
    marginTop: 32,
    alignItems: 'center',
  },
  suggestion: {
    fontSize: 14,
    color: colors.stellarMuted,
    fontFamily: 'DM Sans',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default ChatScreen;
