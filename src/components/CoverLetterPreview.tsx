/**
 * components/CoverLetterPreview.tsx
 * Stable version - No infinite loop when exporting
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';

import {
  generateCoverLetter,
  refineCoverLetter,
  buildCoverLetterHTML,
} from '../utils/generateCoverLetter';

import { theme, sw, sh, ms } from '../constants/theme';

export type CLTemplateId = 'classic' | 'modern' | 'minimal' | 'executive';

interface CLTemplate {
  id: CLTemplateId;
  name: string;
  primaryColor: string;
  description: string;
}

const CL_TEMPLATES: CLTemplate[] = [
  { id: 'classic', name: 'Classic', primaryColor: '#185FA5', description: 'Formal navy header' },
  { id: 'modern', name: 'Modern', primaryColor: '#7c3aed', description: 'Vibrant diagonal design' },
  { id: 'minimal', name: 'Minimal', primaryColor: '#374151', description: 'Clean and simple' },
  { id: 'executive', name: 'Executive', primaryColor: '#92400e', description: 'Premium executive look' },
];

interface Props {
  personal: any;
  workExperience: any[];
  summary: string;
  skills: string[];
  onHTMLReady: (html: string) => void;
}

type Phase = 'idle' | 'generating' | 'review' | 'refining';

export default function CoverLetterPreview({
  personal,
  workExperience,
  summary,
  skills,
  onHTMLReady,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [letterBody, setLetterBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CLTemplateId>('classic');
  const [jobDescription, setJobDescription] = useState('');
  const [showJobInput, setShowJobInput] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const currentTemplate = CL_TEMPLATES.find((t) => t.id === selectedTemplate)!;
  const isLoading = phase === 'generating' || phase === 'refining';

  // Function to update parent with latest HTML
  const updateParentHTML = useCallback((body: string) => {
    if (!body) return;
    const html = buildCoverLetterHTML(
      body,
      personal,
      selectedTemplate,
      currentTemplate.primaryColor
    );
    onHTMLReady(html);
  }, [personal, selectedTemplate, currentTemplate.primaryColor, onHTMLReady]);

  // Generate
  const handleGenerate = async () => {
    setPhase('generating');
    setShowFeedback(false);
    setFeedback('');

    try {
      const result = await generateCoverLetter(
        personal,
        workExperience,
        summary,
        skills,
        jobDescription.trim() || undefined
      );

      setLetterBody(result);
      updateParentHTML(result);        // ← Only call once
      setPhase('review');
    } catch (err) {
      console.error('[CoverLetter] Generate error:', err);
      setPhase('idle');
    }
  };

  // Refine
  const handleRefine = async () => {
    if (!feedback.trim() || isLoading) return;

    setPhase('refining');

    try {
      const result = await refineCoverLetter(
        letterBody,
        feedback,
        personal,
        jobDescription.trim() || undefined
      );

      setLetterBody(result);
      updateParentHTML(result);
      setFeedback('');
      setShowFeedback(false);
      setPhase('review');
    } catch (err) {
      console.error('[CoverLetter] Refine error:', err);
      setPhase('review');
    }
  };

  // Template Change
  const handleTemplateChange = (id: CLTemplateId) => {
    setSelectedTemplate(id);
    if (letterBody) {
      updateParentHTML(letterBody);   // Update HTML when style changes
    }
  };

  return (
    <View style={styles.root}>
      {/* Template Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Letter Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>
          {CL_TEMPLATES.map((t) => {
            const isActive = t.id === selectedTemplate;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.templateChip,
                  isActive && { borderColor: t.primaryColor, backgroundColor: `${t.primaryColor}15` },
                ]}
                onPress={() => handleTemplateChange(t.id)}
              >
                <View style={[styles.chipDot, { backgroundColor: t.primaryColor }]} />
                <View>
                  <Text style={[styles.chipName, isActive && { color: t.primaryColor }]}>{t.name}</Text>
                  <Text style={styles.chipDesc}>{t.description}</Text>
                </View>
                {isActive && <Text style={[styles.chipCheck, { color: t.primaryColor }]}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Job Description Input */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.toggleRow} onPress={() => setShowJobInput(v => !v)}>
          <Text style={styles.sectionLabel}>Target a specific job?</Text>
          <Text style={styles.toggleChevron}>{showJobInput ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showJobInput && (
          <TextInput
            style={styles.jobInput}
            multiline
            numberOfLines={4}
            placeholder="Paste the job title, company, or full job description here..."
            placeholderTextColor={theme.colors.text.muted}
            value={jobDescription}
            onChangeText={setJobDescription}
            textAlignVertical="top"
          />
        )}
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={currentTemplate.primaryColor} />
          <Text style={styles.loadingText}>
            {phase === 'refining' ? 'Refining your letter...' : 'Generating cover letter...'}
          </Text>
        </View>
      )}

      {/* Letter Preview */}
      {phase === 'review' && letterBody && !isLoading && (
        <View style={[styles.letterCard, { borderTopColor: currentTemplate.primaryColor }]}>
          <View style={[styles.letterHeaderStrip, { backgroundColor: currentTemplate.primaryColor }]}>
            <Text style={styles.letterHeaderName}>{personal?.fullName ?? 'Your Name'}</Text>
            <Text style={styles.letterHeaderRole}>{personal?.jobTitle ?? ''}</Text>
          </View>

          <TextInput
            style={styles.letterBody}
            multiline
            value={letterBody}
            onChangeText={setLetterBody}
            textAlignVertical="top"
          />

          <View style={styles.letterActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowFeedback(v => !v)}>
              <Text style={styles.actionBtnText}>✎ Tailor it more</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionGhost]} onPress={handleGenerate}>
              <Text style={styles.actionGhostText}>↺ Regenerate</Text>
            </TouchableOpacity>
          </View>

          {showFeedback && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackLabel}>What would you like to change?</Text>
              <TextInput
                style={styles.feedbackInput}
                multiline
                numberOfLines={3}
                placeholder="e.g., Make it more confident, shorter..."
                placeholderTextColor={theme.colors.text.muted}
                value={feedback}
                onChangeText={setFeedback}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.feedbackSubmit, (!feedback.trim() || isLoading) && { opacity: 0.5 }]}
                onPress={handleRefine}
                disabled={!feedback.trim() || isLoading}
              >
                <Text style={styles.feedbackSubmitText}>
                  {isLoading ? 'Applying...' : 'Apply Changes →'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Generate Button */}
      {!isLoading && (
        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: currentTemplate.primaryColor }]}
          onPress={handleGenerate}
        >
          <Text style={styles.generateBtnText}>
            {phase === 'idle' ? '✦ Generate Cover Letter' : '✦ Regenerate Cover Letter'}
          </Text>
        </TouchableOpacity>
      )}

      {phase === 'idle' && (
        <Text style={styles.hint}>
          The AI will create a professional cover letter based on your CV.
        </Text>
      )}
    </View>
  );
}

/* ==================== STYLES ==================== */
const styles = StyleSheet.create({
  root: { flex: 1 },
  section: { marginBottom: sh(16) },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: sh(8),
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sh(6),
  },
  toggleChevron: { fontSize: ms(14), color: theme.colors.text.muted },

  templateRow: { gap: sw(10), paddingBottom: sh(8) },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: sw(14),
    paddingVertical: sh(10),
    backgroundColor: theme.colors.surface,
    minWidth: sw(160),
  },
  chipDot: { width: sw(12), height: sw(12), borderRadius: sw(6) },
  chipName: { fontSize: theme.fontSize.sm, fontWeight: '700' },
  chipDesc: { fontSize: theme.fontSize.xs, color: theme.colors.text.muted },
  chipCheck: { fontSize: ms(16), fontWeight: '700', marginLeft: 'auto' },

  jobInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: sw(14),
    minHeight: sh(100),
    fontSize: theme.fontSize.sm,
  },

  loadingCard: {
    padding: sh(32),
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingText: { fontSize: theme.fontSize.md, fontWeight: '600', marginTop: sh(12) },

  letterCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopWidth: 4,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    marginBottom: sh(16),
  },
  letterHeaderStrip: { paddingHorizontal: sw(16), paddingVertical: sh(12) },
  letterHeaderName: { fontSize: theme.fontSize.md, fontWeight: '700', color: '#fff' },
  letterHeaderRole: { fontSize: theme.fontSize.xs, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  letterBody: {
    padding: sw(16),
    fontSize: theme.fontSize.sm,
    lineHeight: ms(22),
    color: theme.colors.text.primary,
    minHeight: sh(220),
  },

  letterActions: {
    flexDirection: 'row',
    gap: sw(10),
    padding: sw(12),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: '#fafafa',
  },

  actionBtn: {
    flex: 1,
    paddingVertical: sh(10),
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionBtnText: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.primary },
  actionGhost: { backgroundColor: 'transparent', borderColor: theme.colors.border },
  actionGhostText: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.text.secondary },

  feedbackBox: {
    padding: sw(14),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    gap: sh(10),
  },
  feedbackLabel: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.text.primary },
  feedbackInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: sw(12),
    minHeight: sh(80),
    fontSize: theme.fontSize.sm,
  },
  feedbackSubmit: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: sh(12),
    alignItems: 'center',
  },
  feedbackSubmitText: { color: '#fff', fontSize: theme.fontSize.sm, fontWeight: '700' },

  generateBtn: {
    borderRadius: theme.radius.md,
    paddingVertical: sh(14),
    alignItems: 'center',
    marginBottom: sh(12),
  },
  generateBtnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: '700' },

  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: ms(18),
    paddingHorizontal: sw(20),
  },
});