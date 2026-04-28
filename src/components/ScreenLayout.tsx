import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Platform, StatusBar,
} from 'react-native';
import { theme, sw, sh, ms, SCREEN } from '../constants/theme';

const STEP_LABELS = [
  'Personal', 'Summary', 'Experience',
  'Education', 'Skills', 'Template', 'Preview', 'Export',
];

interface Props {
  step: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueEnabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export default function ScreenLayout({
  step, 
  title, 
  subtitle, 
  onBack, 
  onContinue,
  continueLabel = 'Continue →',
  continueEnabled = true,
  loading = false,
  children,
}: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* ── Step progress bar ── */}
      <View style={styles.progressContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.progressScroll}
        >
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <View key={n} style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  done && styles.stepDotDone,
                  current && styles.stepDotCurrent,
                ]}>
                  {done ? (
                    <Text style={styles.stepCheck}>✓</Text>
                  ) : (
                    <Text style={[
                      styles.stepNum,
                      current && styles.stepNumCurrent,
                    ]}>{n}</Text>
                  )}
                </View>
                {current && (
                  <Text style={styles.stepLabel}>{label}</Text>
                )}
                {/* connector line */}
                {n < 8 && (
                  <View style={[
                    styles.connector,
                    done && styles.connectorDone,
                  ]} />
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.divider} />

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
        {/* bottom padding so content clears the fixed footer */}
        <View style={{ height: sh(100) }} />
      </ScrollView>

      {/* ── Fixed footer ── */}
      <View style={styles.footer}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <TouchableOpacity
          style={[
            styles.continueBtn, 
            (!continueEnabled || loading) && styles.continueBtnDisabled
          ]}
          onPress={() => {
            if (onContinue && continueEnabled && !loading) {
              onContinue();
            }
          }}
          activeOpacity={0.85}
          disabled={!continueEnabled || loading || !onContinue}
        >
          <Text style={styles.continueText}>
            {loading ? 'Saving...' : continueLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },

  /* Progress */
  progressContainer: {
    paddingTop: sh(10),
    paddingBottom: sh(6),
    backgroundColor: theme.colors.background,
  },
  progressScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sw(20),
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: sw(28),
    height: sw(28),
    borderRadius: sw(14),
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: theme.colors.primary,
  },
  stepDotCurrent: {
    backgroundColor: theme.colors.primary,
    transform: [{ scale: 1.1 }],
    ...(theme.shadow?.sm as object),
  },
  stepCheck: {
    color: '#fff',
    fontSize: ms(11),
    fontWeight: '700',
  },
  stepNum: {
    color: theme.colors.text.muted,
    fontSize: ms(11),
    fontWeight: '600',
  },
  stepNumCurrent: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: ms(10),
    fontWeight: '600',
    color: theme.colors.primary,
    position: 'absolute',
    bottom: -sh(16),
    left: 0,
    width: sw(60),
    textAlign: 'center',
  },
  connector: {
    width: sw(18),
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: sw(2),
  },
  connectorDone: {
    backgroundColor: theme.colors.primary,
  },

  /* Header */
  header: {
    paddingHorizontal: sw(24),
    paddingTop: sh(20),
    paddingBottom: sh(14),
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
    lineHeight: ms(34),
  },
  subtitle: {
    marginTop: sh(4),
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
    lineHeight: ms(20),
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: sw(24),
  },

  /* Scroll */
  scroll: { 
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: sw(24),
    paddingTop: sh(20),
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    paddingHorizontal: sw(24),
    paddingVertical: sh(14),
    paddingBottom: Platform.OS === 'ios' ? sh(28) : sh(16),
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...(theme.shadow?.md as object),
  },
  backBtn: {
    height: theme.buttonHeight,
    paddingHorizontal: sw(18),
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  backPlaceholder: { 
    width: sw(60) 
  },
  backText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  continueBtn: {
    flex: 1,
    height: theme.buttonHeight,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(theme.shadow?.sm as object),
  },
  continueBtnDisabled: { 
    opacity: 0.5,
    backgroundColor: theme.colors.border,
  },
  continueText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});