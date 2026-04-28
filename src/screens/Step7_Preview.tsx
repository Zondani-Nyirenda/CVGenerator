/**
 * screens/Step7_Preview.tsx
 *
 * Tabbed preview: CV preview | Cover Letter
 * The cover letter HTML is stored in the CV store so Step8 can export it.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import ScreenLayout from '../components/ScreenLayout';
import CVPreview from '../components/CVPreview';
import CoverLetterPreview from '../components/CoverLetterPreview';
import { useCVStore } from '../store/cvStore';
import { classicTemplate } from '../templates/classic';
import { modernTemplate } from '../templates/modern';
import { minimalTemplate } from '../templates/minimal';
import { executiveTemplate } from '../templates/executive';
import { Template, SkillGroup } from '../types/cv.types';
import { theme, sw, sh, ms } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type Nav = StackNavigationProp<RootStackParamList, 'Step7'>;

const templateMap: Record<string, Template> = {
  classic: classicTemplate,
  modern: modernTemplate,
  minimal: minimalTemplate,
  executive: executiveTemplate,
};

type Tab = 'cv' | 'cover';

/** Flatten SkillGroup { technical: string[], soft: string[] } → string[] */
const getFlattenedSkills = (skills: SkillGroup): string[] => {
  const result: string[] = [];
  if (skills?.technical?.length) result.push(...skills.technical);
  if (skills?.soft?.length)      result.push(...skills.soft);
  return result;
};

export default function Step7_Preview() {
  const navigation = useNavigation<Nav>();
  const store = useCVStore();
  const [activeTab, setActiveTab] = useState<Tab>('cv');

  const template = templateMap[store.selectedTemplate] ?? classicTemplate;

  const cvData = {
    personal: store.personal,
    summary: store.summary,
    workExperience: store.workExperience,
    education: store.education,
    certifications: store.certifications,
    skills: store.skills,
    languages: store.languages,
    selectedTemplate: store.selectedTemplate,
  };

  const handleCoverLetterHTML = (html: string) => {
    store.setCoverLetterHTML(html);
  };

  return (
    <ScreenLayout
      step={7}
      title={activeTab === 'cv' ? 'Preview your CV' : 'Cover letter'}
      subtitle={
        activeTab === 'cv'
          ? 'Looking good! Review before exporting'
          : 'AI-written and ready to personalise'
      }
      onBack={() => navigation.goBack()}
      onContinue={() => navigation.navigate('Step8')}
      continueLabel="Export →"
    >
      {/* ── Tab switcher ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cv' && styles.tabActive]}
          onPress={() => setActiveTab('cv')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'cv' && styles.tabTextActive]}>
            📄 CV Preview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cover' && styles.tabActive]}
          onPress={() => setActiveTab('cover')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'cover' && styles.tabTextActive]}>
            ✉ Cover Letter
          </Text>
          {store.coverLetterHTML ? <View style={styles.readyDot} /> : null}
        </TouchableOpacity>
      </View>

      {/* ── Tab content ── */}
      {activeTab === 'cv' ? (
        <View style={styles.previewWrapper}>
          <CVPreview cvData={cvData} template={template} />
        </View>
      ) : (
        /* ScrollView ensures the cover letter panel (with generate button,
           template picker, letter body) is fully scrollable and visible */
        <ScrollView
          style={styles.coverScroll}
          contentContainerStyle={styles.coverScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <CoverLetterPreview
            personal={store.personal}
            workExperience={store.workExperience}
            summary={store.summary}
            skills={getFlattenedSkills(store.skills)}
            onHTMLReady={handleCoverLetterHTML}
          />
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: sw(4),
    marginBottom: sh(16),
    gap: sw(4),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sh(9),
    borderRadius: theme.radius.sm,
    gap: sw(5),
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  readyDot: {
    width: sw(7),
    height: sw(7),
    borderRadius: sw(4),
    backgroundColor: '#22c55e',
    position: 'absolute',
    top: sh(6),
    right: sw(10),
  },
  previewWrapper: {
    flex: 1,
    minHeight: sh(560),
  },
  coverScroll: {
    flex: 1,
  },
  coverScrollContent: {
    paddingBottom: sh(24),
  },
});