import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import ScreenLayout from '../components/ScreenLayout';
import { useCVStore } from '../store/cvStore';
import { generateSummary, refineSummary } from '../utils/aiSummary';
import { theme, sw, sh, ms } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type Nav = StackNavigationProp<RootStackParamList, 'Step2'>;

type Phase = 'idle' | 'generating' | 'review' | 'refining' | 'editing';

export default function Step2_Summary() {
  const navigation = useNavigation<Nav>();
  const {
    summary, setSummary,
    personal, workExperience, education, skills,
    persistToSQLite,
  } = useCVStore();

  const [text, setText] = useState(summary);
  const [phase, setPhase] = useState<Phase>(summary ? 'editing' : 'idle');
  const [refineFeedback, setRefineFeedback] = useState('');
  const [showRefineInput, setShowRefineInput] = useState(false);

  /* ── Generate fresh summary using Anthropic ── */
  const handleGenerate = async () => {
    setPhase('generating');
    setShowRefineInput(false);
    setRefineFeedback('');
    try {
      // Pass all available store data so Claude can write a specific, rich summary
      const result = await generateSummary(
        personal,
        workExperience,
        education,
        [
          ...(skills?.technical ?? []),
          ...(skills?.soft ?? []),
        ],
      );
      setText(result);
      setPhase('review');
    } catch {
      setPhase('idle');
    }
  };

  /* ── Refine with user feedback using Anthropic ── */
  const handleRefine = async () => {
    if (!refineFeedback.trim()) return;
    setPhase('refining');
    try {
      // Uses refineSummary from aiSummary.ts — Anthropic SDK, same model
      const result = await refineSummary(
        text,
        refineFeedback,
        personal,
        workExperience,
      );
      setText(result);
      setRefineFeedback('');
      setShowRefineInput(false);
      setPhase('review');
    } catch {
      setPhase('review');
    }
  };

  /* ── Accept and proceed ── */
  const onContinue = async () => {
    setSummary(text);
    await persistToSQLite();
    navigation.navigate('Step3');
  };

  const isLoading = phase === 'generating' || phase === 'refining';

  return (
    <ScreenLayout
      step={2}
      title="Professional summary"
      subtitle="A 2–4 sentence snapshot of your career"
      onBack={() => navigation.goBack()}
      onContinue={onContinue}
      continueEnabled={text.trim().length > 0 && !isLoading}
    >

      {/* ─── Phase: idle – no summary yet ─── */}
      {phase === 'idle' && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>Let AI write your summary</Text>
          <Text style={styles.emptyBody}>
            We'll use your job title, experience, education, and skills to craft a
            tailored professional summary — or you can write one yourself below.
          </Text>
        </View>
      )}

      {/* ─── Phase: generating / refining spinner ─── */}
      {isLoading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            {phase === 'refining' ? 'Refining your summary…' : 'Generating your summary…'}
          </Text>
          <Text style={styles.loadingSubtext}>
            {phase === 'refining'
              ? 'Incorporating your feedback'
              : 'Analysing your full profile'}
          </Text>
        </View>
      )}

      {/* ─── Generated / editable summary card ─── */}
      {(phase === 'review' || phase === 'editing') && !isLoading && (
        <View style={styles.summaryCard}>
          {phase === 'review' && (
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>✦ AI Generated</Text>
            </View>
          )}

          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            value={text}
            onChangeText={(t) => { setText(t); setPhase('editing'); }}
            textAlignVertical="top"
            placeholder="Your summary will appear here…"
            placeholderTextColor={theme.colors.text.muted}
          />

          {/* Review-phase actions */}
          {phase === 'review' && (
            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowRefineInput(v => !v)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>✎ Tailor it more</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnGhost]}
                onPress={handleGenerate}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnGhostText}>↺ Regenerate</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Refine feedback input */}
          {showRefineInput && phase === 'review' && (
            <View style={styles.refineBox}>
              <Text style={styles.refineLabel}>What would you like changed?</Text>
              <TextInput
                style={styles.refineInput}
                placeholder="e.g. Make it more senior, focus on leadership, keep it under 3 sentences…"
                placeholderTextColor={theme.colors.text.muted}
                value={refineFeedback}
                onChangeText={setRefineFeedback}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.refineSubmitBtn,
                  !refineFeedback.trim() && styles.refineSubmitBtnDisabled,
                ]}
                onPress={handleRefine}
                disabled={!refineFeedback.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.refineSubmitText}>Apply feedback →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ─── Manual text area (idle) ─── */}
      {phase === 'idle' && (
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={6}
          placeholder="e.g. Experienced frontend developer with 5+ years building performant web applications…"
          placeholderTextColor={theme.colors.text.muted}
          value={text}
          onChangeText={(t) => { setText(t); if (t) setPhase('editing'); }}
          textAlignVertical="top"
        />
      )}

      {/* ─── AI generate / regenerate button ─── */}
      {!isLoading && (
        <TouchableOpacity
          style={styles.aiBtn}
          onPress={handleGenerate}
          activeOpacity={0.8}
        >
          <Text style={styles.aiBtnText}>
            {phase === 'idle' ? '✦ Generate with AI' : '✦ Regenerate with AI'}
          </Text>
        </TouchableOpacity>
      )}

      {phase === 'review' && (
        <Text style={styles.hint}>
          Looks good? Tap <Text style={{ fontWeight: '700' }}>Continue</Text> to save, or
          use "Tailor it more" to refine before moving on.
        </Text>
      )}
      {phase === 'idle' && (
        <Text style={styles.hint}>
          AI uses your name, job title, experience, education and skills to write a
          tailored summary.
        </Text>
      )}
    </ScreenLayout>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: sh(24),
    paddingHorizontal: sw(12),
    marginBottom: sh(16),
  },
  emptyIcon: {
    fontSize: ms(32),
    color: theme.colors.primary,
    marginBottom: sh(10),
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: sh(6),
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: ms(20),
  },

  loadingCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: sh(28),
    alignItems: 'center',
    marginBottom: sh(16),
    gap: sh(8),
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: sh(8),
  },
  loadingSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
  },

  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: sh(14),
  },
  aiTag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: sw(12),
    paddingVertical: sh(6),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  aiTagText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.primary,
    letterSpacing: 0.3,
  },

  textArea: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: sw(14),
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    minHeight: sh(130),
    marginBottom: sh(14),
    lineHeight: ms(22),
  },

  reviewActions: {
    flexDirection: 'row',
    gap: sw(8),
    padding: sw(10),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: '#fafafa',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: sh(9),
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actionBtnGhost: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
  },
  actionBtnGhostText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },

  refineBox: {
    padding: sw(12),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    gap: sh(8),
  },
  refineLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  refineInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: sw(10),
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    minHeight: sh(80),
    lineHeight: ms(20),
  },
  refineSubmitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: sh(10),
    alignItems: 'center',
  },
  refineSubmitBtnDisabled: {
    opacity: 0.4,
  },
  refineSubmitText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },

  aiBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: sh(12),
    alignItems: 'center',
    marginBottom: sh(12),
    backgroundColor: theme.colors.primaryLight,
  },
  aiBtnText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },

  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: ms(18),
  },
});