/**
 * screens/ChatScreen.tsx
 *
 * Chat-first CV creation. The user describes their career in natural language;
 * Claude extracts structured data, populates the store, and the user can refine
 * before jumping straight to Step7 (Preview) or Step1 (manual editing).
 *
 * Flow:
 *   ChatScreen → (CV ready) → Step7_Preview → Step8_Export
 *   ChatScreen → (wants manual edit) → Step1_PersonalDetails
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useCVStore } from '../store/cvStore';
import { sendChatMessage, getOpeningMessage, ChatMessage, ParsedCVData } from '../utils/aiCVParser';
import { theme, sw, sh, ms } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type Nav = StackNavigationProp<RootStackParamList, 'Chat'>;

// ─── Types ───────────────────────────────────────────────────────────────────

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  cvData?: ParsedCVData;
  timestamp: number;
}

// ─── Quick-prompt chips ───────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "I'm a software engineer with 5 years experience",
  "I'm a recent graduate looking for my first job",
  "I'm a marketing manager with 8 years experience",
  "I'm a nurse with 3 years clinical experience",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ]),
      ).start();

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    width: sw(7),
    height: sw(7),
    borderRadius: sw(4),
    backgroundColor: theme.colors.primary,
    marginHorizontal: sw(2),
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={msgStyles.assistantBubble}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: sh(4) }}>
        <Animated.View style={dotStyle(dot1)} />
        <Animated.View style={dotStyle(dot2)} />
        <Animated.View style={dotStyle(dot3)} />
      </View>
    </View>
  );
};

const CVReadyCard = ({
  cvData,
  onPreview,
  onEdit,
}: {
  cvData: ParsedCVData;
  onPreview: () => void;
  onEdit: () => void;
}) => {
  const hasWork = cvData.workExperience.length > 0;
  const hasEdu = cvData.education.length > 0;
  const skillCount = (cvData.skills.technical.length + cvData.skills.soft.length);

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.headerIcon}>✦</Text>
        <Text style={cardStyles.headerText}>CV Ready</Text>
      </View>

      <Text style={cardStyles.name}>{cvData.personal.fullName || 'Your Name'}</Text>
      <Text style={cardStyles.title}>{cvData.personal.jobTitle || 'Professional'}</Text>

      <View style={cardStyles.pills}>
        {hasWork && (
          <View style={cardStyles.pill}>
            <Text style={cardStyles.pillText}>
              💼 {cvData.workExperience.length} role{cvData.workExperience.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
        {hasEdu && (
          <View style={cardStyles.pill}>
            <Text style={cardStyles.pillText}>🎓 {cvData.education.length} qualification{cvData.education.length > 1 ? 's' : ''}</Text>
          </View>
        )}
        {skillCount > 0 && (
          <View style={cardStyles.pill}>
            <Text style={cardStyles.pillText}>⚡ {skillCount} skills</Text>
          </View>
        )}
      </View>

      <View style={cardStyles.actions}>
        <TouchableOpacity style={cardStyles.previewBtn} onPress={onPreview} activeOpacity={0.85}>
          <Text style={cardStyles.previewBtnText}>Preview & Export →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cardStyles.editBtn} onPress={onEdit} activeOpacity={0.8}>
          <Text style={cardStyles.editBtnText}>Fine-tune manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const store = useCVStore();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latestCVData, setLatestCVData] = useState<ParsedCVData | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // ── Conversation history for the API (role + content only) ────────────────
  const historyRef = useRef<ChatMessage[]>([]);

  // ── Initialise with Claude's opening message ──────────────────────────────
  useEffect(() => {
    (async () => {
      const opening = await getOpeningMessage();
      setMessages([
        {
          id: '0',
          role: 'assistant',
          content: opening,
          timestamp: Date.now(),
        },
      ]);
      // Don't add opening to historyRef — it was generated without user input
      setIsInitialising(false);
    })();
  }, []);

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // ── Send a message ────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text?: string) => {
      const userText = (text ?? input).trim();
      if (!userText || isLoading) return;

      setInput('');
      setShowQuickPrompts(false);
      Keyboard.dismiss();

      // Add user message to display
      const userMsg: DisplayMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Build history for API
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: userText },
      ];

      setIsLoading(true);

      const { reply, cvData } = await sendChatMessage(historyRef.current);

      // Add assistant reply to history
      historyRef.current = [
        ...historyRef.current,
        { role: 'assistant', content: reply },
      ];

      // If we got CV data, update the store immediately
      if (cvData) {
        store.setPersonal(cvData.personal);
        store.setSummary(cvData.summary);
        cvData.workExperience.forEach((exp) => {
          const existing = store.workExperience.find((e) => e.id === exp.id);
          if (!existing) store.addWorkExperience(exp);
          else store.updateWorkExperience(exp.id, exp);
        });
        cvData.education.forEach((edu) => {
          const existing = store.education.find((e) => e.id === edu.id);
          if (!existing) store.addEducation(edu);
          else store.updateEducation(edu.id, edu);
        });
        cvData.certifications.forEach((cert) => {
          const existing = store.certifications.find((c) => c.id === cert.id);
          if (!existing) store.addCertification(cert);
        });
        store.setSkills(cvData.skills);
        cvData.languages.forEach((lang) => {
          const existing = store.languages.find((l) => l.id === lang.id);
          if (!existing) store.addLanguage(lang);
        });
        setLatestCVData(cvData);
        await store.persistToSQLite();
      }

      const assistantMsg: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        cvData: cvData ?? undefined,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    },
    [input, isLoading, store],
  );

  // ── Navigate to preview with current CV data ──────────────────────────────
  const handlePreview = useCallback(async () => {
    await store.persistToSQLite();
    navigation.navigate('Step7');
  }, [navigation, store]);

  // ── Navigate to manual editing ────────────────────────────────────────────
  const handleManualEdit = useCallback(() => {
    navigation.navigate('Step1');
  }, [navigation]);

  // ── Render message bubble ─────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    if (item.role === 'user') {
      return (
        <View style={msgStyles.userRow}>
          <View style={msgStyles.userBubble}>
            <Text style={msgStyles.userText}>{item.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={msgStyles.assistantRow}>
        <View style={msgStyles.avatarDot}>
          <Text style={msgStyles.avatarText}>✦</Text>
        </View>
        <View style={{ flex: 1, gap: sh(10) }}>
          <View style={msgStyles.assistantBubble}>
            <Text style={msgStyles.assistantText}>{item.content}</Text>
          </View>
          {/* Show CV ready card when CV data is attached */}
          {item.cvData && item.cvData.personal.fullName && (
            <CVReadyCard
              cvData={item.cvData}
              onPreview={handlePreview}
              onEdit={handleManualEdit}
            />
          )}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CV Assistant</Text>
          <Text style={styles.headerSub}>Describe your career, I'll build your CV</Text>
        </View>
        {latestCVData && (
          <TouchableOpacity style={styles.previewPill} onPress={handlePreview} activeOpacity={0.8}>
            <Text style={styles.previewPillText}>Preview →</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ── Messages ── */}
        {isInitialising ? (
          <View style={styles.initLoader}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.initText}>Starting your session…</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              isLoading ? (
                <View style={msgStyles.assistantRow}>
                  <View style={msgStyles.avatarDot}>
                    <Text style={msgStyles.avatarText}>✦</Text>
                  </View>
                  <TypingIndicator />
                </View>
              ) : null
            }
          />
        )}

        {/* ── Quick prompts ── */}
        {showQuickPrompts && !isInitialising && messages.length <= 1 && (
          <View style={styles.quickPromptsContainer}>
            <Text style={styles.quickPromptsLabel}>Quick start</Text>
            <View style={styles.quickPrompts}>
              {QUICK_PROMPTS.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickPromptChip}
                  onPress={() => handleSend(prompt)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickPromptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Tell me about your career…"
            placeholderTextColor={theme.colors.text.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="default"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Manual edit link ── */}
        <TouchableOpacity style={styles.manualLink} onPress={handleManualEdit}>
          <Text style={styles.manualLinkText}>Prefer to fill in forms manually →</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(20),
    paddingVertical: sh(14),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: sh(2),
  },
  previewPill: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: sw(14),
    paddingVertical: sh(8),
    borderRadius: theme.radius.md,
  },
  previewPillText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  initLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sh(12),
  },
  initText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
  },
  messageList: {
    paddingHorizontal: sw(16),
    paddingVertical: sh(16),
    gap: sh(16),
  },
  quickPromptsContainer: {
    paddingHorizontal: sw(16),
    paddingBottom: sh(8),
  },
  quickPromptsLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    fontWeight: '600',
    marginBottom: sh(8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sw(8),
  },
  quickPromptChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: sw(12),
    paddingVertical: sh(8),
  },
  quickPromptText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: sw(10),
    paddingHorizontal: sw(16),
    paddingVertical: sh(12),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: sw(14),
    paddingVertical: sh(10),
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    maxHeight: sh(120),
    lineHeight: ms(22),
  },
  sendBtn: {
    width: sw(44),
    height: sw(44),
    borderRadius: sw(22),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    color: '#fff',
    fontSize: ms(20),
    fontWeight: '700',
    lineHeight: ms(22),
  },
  manualLink: {
    alignItems: 'center',
    paddingVertical: sh(10),
    backgroundColor: theme.colors.surface,
  },
  manualLinkText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    textDecorationLine: 'underline',
  },
});

const msgStyles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: sh(4),
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    borderBottomRightRadius: sw(4),
    paddingHorizontal: sw(14),
    paddingVertical: sh(10),
    maxWidth: '80%',
  },
  userText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    lineHeight: ms(22),
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sw(10),
    marginBottom: sh(4),
  },
  avatarDot: {
    width: sw(30),
    height: sw(30),
    borderRadius: sw(15),
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sh(2),
    flexShrink: 0,
  },
  avatarText: {
    fontSize: ms(12),
    color: theme.colors.primary,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderTopLeftRadius: sw(4),
    paddingHorizontal: sw(14),
    paddingVertical: sh(10),
    maxWidth: '85%',
  },
  assistantText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSize.md,
    lineHeight: ms(22),
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: sw(16),
    maxWidth: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    marginBottom: sh(10),
  },
  headerIcon: {
    fontSize: ms(14),
    color: theme.colors.primary,
  },
  headerText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: sh(2),
    marginBottom: sh(12),
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sw(6),
    marginBottom: sh(14),
  },
  pill: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.sm,
    paddingHorizontal: sw(10),
    paddingVertical: sh(4),
  },
  pillText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actions: {
    gap: sh(8),
  },
  previewBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: sh(11),
    alignItems: 'center',
  },
  previewBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  editBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: sh(10),
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
});