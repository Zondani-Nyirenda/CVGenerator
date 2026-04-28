import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

const STEPS = [
  'Personal', 'Summary', 'Experience', 'Education',
  'Skills', 'Template', 'Preview', 'Export',
];

interface WizardProgressProps {
  currentStep: number; // 1-based
}

export default function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {STEPS.map((label, i) => {
          const step = i + 1;
          const done = step < currentStep;
          const active = step === currentStep;
          return (
            <React.Fragment key={step}>
              <View style={styles.dotWrapper}>
                <View style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}>
                  {done && <Text style={styles.checkMark}>✓</Text>}
                  {active && <Text style={styles.activeNum}>{step}</Text>}
                </View>
                {active && <Text style={styles.stepLabel}>{label}</Text>}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.connector, done && styles.connectorDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotWrapper: { alignItems: 'center' },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: theme.colors.primary },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  checkMark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  activeNum: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stepLabel: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 3,
    maxWidth: 28,
  },
  connectorDone: { backgroundColor: theme.colors.primary },
});