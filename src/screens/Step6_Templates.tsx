import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import ScreenLayout from '../components/ScreenLayout';
import TemplateCard from '../components/TemplateCard';
import { useCVStore } from '../store/cvStore';
import { Template, TemplateId } from '../types/cv.types';
import { classicTemplate } from '../templates/classic';
import { modernTemplate } from '../templates/modern';
import { minimalTemplate } from '../templates/minimal';
import { executiveTemplate } from '../templates/executive';
import { theme, sw, sh, ms } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

const ALL_TEMPLATES: Template[] = [
  classicTemplate,
  modernTemplate,
  minimalTemplate,
  executiveTemplate,
];

type Nav = StackNavigationProp<RootStackParamList, 'Step6'>;

export default function Step6_Templates() {
  const navigation = useNavigation<Nav>();
  const { selectedTemplate, setTemplate, persistToSQLite } = useCVStore();

  const onContinue = async () => {
    await persistToSQLite();
    navigation.navigate('Step7');
  };

  const selectedInfo = ALL_TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <ScreenLayout
      step={6}
      title="Choose a template"
      subtitle="Select a style that fits your industry"
      onBack={() => navigation.goBack()}
      onContinue={onContinue}
      continueLabel="Preview CV →"
      continueEnabled={!!selectedTemplate}
    >
      {/* 2-column grid */}
      <View style={styles.grid}>
        {ALL_TEMPLATES.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={selectedTemplate === t.id}
            onSelect={() => setTemplate(t.id as TemplateId)}
          />
        ))}
      </View>

      {/* Selection info bar */}
      {selectedInfo && (
        <View style={[styles.selectionBar, { borderColor: selectedInfo.primaryColor + '50' }]}>
          <View style={[styles.selectionDot, { backgroundColor: selectedInfo.primaryColor }]} />
          
          <Text style={styles.selectionCheck}>✓</Text>
        </View>
      )}

      {!selectedTemplate && (
        <Text style={styles.hint}>Tap a template to select it, then preview your CV.</Text>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -sw(6),
    marginBottom: sh(16),
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    paddingHorizontal: sw(14),
    paddingVertical: sh(12),
    marginBottom: sh(8),
  },
  selectionDot: {
    width: sw(10),
    height: sw(10),
    borderRadius: sw(5),
  },
  selectionName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  selectionDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 1,
  },
  selectionCheck: {
    fontSize: ms(16),
    color: theme.colors.text.muted,
  },
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: ms(18),
  },
});