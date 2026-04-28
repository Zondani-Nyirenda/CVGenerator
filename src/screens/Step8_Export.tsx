/**
 * screens/Step8_Export.tsx
 *
 * Exports CV and Cover Letter independently.
 * Cover letter section only appears if one was generated in Step 7.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import ScreenLayout from '../components/ScreenLayout';
import { useCVStore } from '../store/cvStore';
import { buildHTMLString } from '../utils/htmlBuilder';
import { exportPDF } from '../utils/generatePDF';
import { exportDOCX } from '../utils/generateDOCX';
import { classicTemplate } from '../templates/classic';
import { modernTemplate } from '../templates/modern';
import { minimalTemplate } from '../templates/minimal';
import { executiveTemplate } from '../templates/executive';
import { Template } from '../types/cv.types';
import { theme, sw, sh, ms } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type Nav = StackNavigationProp<RootStackParamList, 'Step8'>;

const templateMap: Record<string, Template> = {
  classic: classicTemplate,
  modern: modernTemplate,
  minimal: minimalTemplate,
  executive: executiveTemplate,
};

type ExportKey =
  | 'cv_pdf' | 'cv_docx' | 'cv_html'
  | 'cl_pdf' | 'cl_html';

export default function Step8_Export() {
  const navigation = useNavigation<Nav>();
  const store = useCVStore();
  const [loading, setLoading] = useState<ExportKey | null>(null);

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

  const baseName = store.personal.fullName
    ? store.personal.fullName.replace(/\s+/g, '_')
    : 'My';

  const cvFileName = baseName + '_CV';
  const clFileName = baseName + '_Cover_Letter';
  const hasCoverLetter = !!store.coverLetterHTML;

  /* ── CV exports ── */
  const handleCVPDF = async () => {
    setLoading('cv_pdf');
    try {
      await exportPDF(buildHTMLString(cvData, template), cvFileName);
    } catch {
      Alert.alert('Export failed', 'Could not generate CV PDF.');
    } finally { setLoading(null); }
  };

  const handleCVDOCX = async () => {
    setLoading('cv_docx');
    try {
      await exportDOCX(cvData, cvFileName);
    } catch {
      Alert.alert('Export failed', 'Could not generate DOCX.');
    } finally { setLoading(null); }
  };

const handleCVHTML = async () => {
  setLoading('cv_html');
  try {
    const html = buildHTMLString(cvData, template);
    const path = FileSystem.Directory + cvFileName + '.html';
    await FileSystem.writeAsStringAsync(path, html, { encoding: 'utf8' });
    await Sharing.shareAsync(path, { mimeType: 'text/html', dialogTitle: 'Share CV as HTML' });
  } catch {
    Alert.alert('Export failed', 'Could not share CV HTML.');
  } finally { setLoading(null); }
};


  /* ── Cover letter exports ── */
  const handleCLPDF = async () => {
    if (!store.coverLetterHTML) return;
    setLoading('cl_pdf');
    try {
      await exportPDF(store.coverLetterHTML, clFileName);
    } catch {
      Alert.alert('Export failed', 'Could not generate cover letter PDF.');
    } finally { setLoading(null); }
  };

  const handleCLHTML = async () => {
    if (!store.coverLetterHTML) return;
    setLoading('cl_html');
    try {
     const path = FileSystem.Directory + clFileName + '.html';
await FileSystem.writeAsStringAsync(path, store.coverLetterHTML, {
  encoding: 'utf8',
});
      await Sharing.shareAsync(path, { mimeType: 'text/html', dialogTitle: 'Share Cover Letter' });
    } catch {
      Alert.alert('Export failed', 'Could not share cover letter.');
    } finally { setLoading(null); }
  };

  /* ── Option rows ── */
  interface ExportOption {
    key: ExportKey;
    icon: string;
    title: string;
    subtitle: string;
    accentColor: string;
    lightColor: string;
    onPress: () => void;
  }

  const cvOptions: ExportOption[] = [
    {
      key: 'cv_pdf',
      icon: '📄',
      title: 'PDF',
      subtitle: 'Best for sending to employers',
      accentColor: '#dc2626',
      lightColor: '#fef2f2',
      onPress: handleCVPDF,
    },
    {
      key: 'cv_docx',
      icon: '📝',
      title: 'Word (.docx)',
      subtitle: 'Editable in Microsoft Word',
      accentColor: '#185FA5',
      lightColor: theme.colors.primaryLight,
      onPress: handleCVDOCX,
    },
    {
      key: 'cv_html',
      icon: '🌐',
      title: 'HTML',
      subtitle: 'Open in any browser',
      accentColor: '#059669',
      lightColor: '#ecfdf5',
      onPress: handleCVHTML,
    },
  ];

  const clOptions: ExportOption[] = [
    {
      key: 'cl_pdf',
      icon: '📄',
      title: 'PDF',
      subtitle: 'Ready to attach to applications',
      accentColor: '#dc2626',
      lightColor: '#fef2f2',
      onPress: handleCLPDF,
    },
    {
      key: 'cl_html',
      icon: '🌐',
      title: 'HTML',
      subtitle: 'Share or print from browser',
      accentColor: '#059669',
      lightColor: '#ecfdf5',
      onPress: handleCLHTML,
    },
  ];

  const renderOption = ({ item }: { item: ExportOption }) => (
    <TouchableOpacity
      style={[styles.exportCard, { borderLeftColor: item.accentColor }]}
      onPress={item.onPress}
      disabled={loading !== null}
      activeOpacity={0.85}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.lightColor }]}>
        {loading === item.key ? (
          <ActivityIndicator size="small" color={item.accentColor} />
        ) : (
          <Text style={styles.icon}>{item.icon}</Text>
        )}
      </View>
      <View style={styles.exportText}>
        <Text style={styles.exportTitle}>{item.title}</Text>
        <Text style={styles.exportSubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={[styles.arrow, { color: item.accentColor }]}>→</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout
      step={8}
      title="Export"
      subtitle="Download your CV and cover letter"
      onBack={() => navigation.goBack()}
      onContinue={() => Alert.alert('All done!', 'Your documents are ready.')}
      continueLabel="Done ✓"
    >
      {/* ── CV section ── */}
      <View style={styles.docSection}>
        <View style={styles.docHeader}>
          <View style={[styles.docBadge, { backgroundColor: '#185FA5' }]}>
            <Text style={styles.docBadgeText}>CV</Text>
          </View>
          <Text style={styles.docTitle}>Curriculum Vitae</Text>
        </View>
        {cvOptions.map((opt) => (
          <React.Fragment key={opt.key}>{renderOption({ item: opt })}</React.Fragment>
        ))}
      </View>

      {/* ── Cover letter section ── */}
      <View style={styles.docSection}>
        <View style={styles.docHeader}>
          <View style={[styles.docBadge, { backgroundColor: '#059669' }]}>
            <Text style={styles.docBadgeText}>CL</Text>
          </View>
          <Text style={styles.docTitle}>Cover Letter</Text>
          {!hasCoverLetter && (
            <Text style={styles.docBadgeMissing}>Not generated yet</Text>
          )}
        </View>

        {hasCoverLetter ? (
          clOptions.map((opt) => (
            <React.Fragment key={opt.key}>{renderOption({ item: opt })}</React.Fragment>
          ))
        ) : (
          <View style={styles.clEmptyCard}>
            <Text style={styles.clEmptyText}>
              Go back to Preview and generate a cover letter to enable these exports.
            </Text>
            <TouchableOpacity
              style={styles.clEmptyBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.clEmptyBtnText}>← Generate cover letter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Reset ── */}
      <View style={styles.resetSection}>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() =>
            Alert.alert('Start over?', 'This will clear all your CV data.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: () => {
                  store.resetCV?.();
                  navigation.navigate('Step1');
                },
              },
            ])
          }
        >
          <Text style={styles.resetText}>Start a new CV</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  docSection: {
    marginBottom: sh(24),
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    marginBottom: sh(12),
  },
  docBadge: {
    paddingHorizontal: sw(10),
    paddingVertical: sh(4),
    borderRadius: theme.radius.sm,
  },
  docBadgeText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  docTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  docBadgeMissing: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
  },

  exportCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    padding: sw(14),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sh(10),
  },
  iconCircle: {
    width: sw(44),
    height: sw(44),
    borderRadius: sw(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: sw(14),
  },
  icon: { fontSize: ms(20) },
  exportText: { flex: 1 },
  exportTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: sh(2),
  },
  exportSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  arrow: { fontSize: ms(18), fontWeight: '700' },

  clEmptyCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
    padding: sw(20),
    alignItems: 'center',
    gap: sh(12),
    backgroundColor: '#fafafa',
  },
  clEmptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: ms(20),
  },
  clEmptyBtn: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: sw(16),
    paddingVertical: sh(9),
  },
  clEmptyBtnText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  resetSection: { marginTop: sh(8), alignItems: 'center' },
  resetBtn: { padding: sw(12) },
  resetText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
    textDecorationLine: 'underline',
  },
});