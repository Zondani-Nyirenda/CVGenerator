/**
 * components/CoverLetterPreview.tsx
 *
 * Full cover letter generation, preview, and refinement panel.
 * Drop this inside Step7_Preview as the second tab.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, StyleSheet,
} from 'react-native';

import { generateCoverLetter, refineCoverLetter, buildCoverLetterHTML } from '../utils/generateCoverLetter';
import { theme, sw, sh, ms } from '../constants/theme';

/* ─── Cover letter template styles (visual picker) ─── */
export type CLTemplateId = 'classic' | 'modern' | 'minimal' | 'executive';

interface CLTemplate {
  id: CLTemplateId;
  name: string;
  primaryColor: string;
  description: string;
}

const CL_TEMPLATES: CLTemplate[] = [
  { id: 'classic',   name: 'Classic',   primaryColor: '#1e3a5f', description: 'Navy header, formal' },
  { id: 'modern',    name: 'Modern',    primaryColor: '#0f766e', description: 'Teal diagonal cut' },
  { id: 'minimal',   name: 'Minimal',   primaryColor: '#111827', description: 'Clean ruled lines' },
  { id: 'executive', name: 'Executive', primaryColor: '#7c2d12', description: 'Burgundy top bar' },
];

interface Props {
  personal: any;
  workExperience: any[];
  summary: string;
  skills: string[];
  /** Called with the final HTML so Step7/Step8 can export it */
  onHTMLReady: (html: string) => void;
}

type Phase = 'idle' | 'generating' | 'review' | 'refining';

export default function CoverLetterPreview({
  personal, workExperience, summary, skills, onHTMLReady,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [letterBody, setLetterBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CLTemplateId>('classic');
  const [jobDescription, setJobDescription] = useState('');
  const [showJobInput, setShowJobInput] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const currentTemplate = CL_TEMPLATES.find(t => t.id === selectedTemplate)!;

  /* ─── Generate ─── */
  const handleGenerate = async () => {
    setPhase('generating');
    setShowFeedback(false);
    setFeedback('');
    try {
      const result = await generateCoverLetter(
        personal, workExperience, summary, skills, jobDescription || undefined,
      );
      setLetterBody(result);
      setPhase('review');
      // Notify parent immediately
      onHTMLReady(buildCoverLetterHTML(result, personal, selectedTemplate, currentTemplate.primaryColor));
    } catch {
      setPhase('idle');
    }
  };

  /* ─── Refine ─── */
  const handleRefine = async () => {
    if (!feedback.trim()) return;
    setPhase('refining');
    try {
      const result = await refineCoverLetter(letterBody, feedback, personal, jobDescription || undefined);
      setLetterBody(result);
      setFeedback('');
      setShowFeedback(false);
      setPhase('review');
      onHTMLReady(buildCoverLetterHTML(result, personal, selectedTemplate, currentTemplate.primaryColor));
    } catch {
      setPhase('review');
    }
  };

  /* ─── Template change ─── */
  const handleTemplateChange = (id: CLTemplateId) => {
    setSelectedTemplate(id);
    if (letterBody) {
      const t = CL_TEMPLATES.find(x => x.id === id)!;
      onHTMLReady(buildCoverLetterHTML(letterBody, personal, id, t.primaryColor));
    }
  };

  const isLoading = phase === 'generating' || phase === 'refining';

  return (
    <View style={styles.root}>

      {/* ── Template style picker ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Letter style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>
          {CL_TEMPLATES.map((t) => {
            const active = t.id === selectedTemplate;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.templateChip, active && { borderColor: t.primaryColor, backgroundColor: t.primaryColor + '14' }]}
                onPress={() => handleTemplateChange(t.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.chipDot, { backgroundColor: t.primaryColor }]} />
                <View>
                  <Text style={[styles.chipName, active && { color: t.primaryColor }]}>{t.name}</Text>
                  <Text style={styles.chipDesc}>{t.description}</Text>
                </View>
                {active && <Text style={[styles.chipCheck, { color: t.primaryColor }]}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Optional job description ── */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setShowJobInput(v => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionLabel}>Targeting a specific job?</Text>
          <Text style={styles.toggleChevron}>{showJobInput ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showJobInput && (
          <TextInput
            style={styles.jobInput}
            multiline
            numberOfLines={4}
            placeholder="Paste the job title, company name, or key requirements here. The AI will tailor the letter to this role."
            placeholderTextColor={theme.colors.text.muted}
            value={jobDescription}
            onChangeText={setJobDescription}
            textAlignVertical="top"
          />
        )}
      </View>

      {/* ── Spinner ── */}
      {isLoading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={currentTemplate.primaryColor} />
          <Text style={styles.loadingText}>
            {phase === 'refining' ? 'Refining your letter…' : 'Writing your cover letter…'}
          </Text>
          <Text style={styles.loadingSubtext}>
            {phase === 'refining' ? 'Applying your feedback' : 'Crafting a tailored introduction'}
          </Text>
        </View>
      )}

      {/* ── Letter body preview ── */}
      {phase === 'review' && !isLoading && (
        <View style={[styles.letterCard, { borderTopColor: currentTemplate.primaryColor }]}>
          {/* Header strip */}
          <View style={[styles.letterHeaderStrip, { backgroundColor: currentTemplate.primaryColor }]}>
            <Text style={styles.letterHeaderName}>{personal?.fullName ?? 'Your Name'}</Text>
            <Text style={styles.letterHeaderRole}>{personal?.jobTitle ?? ''}</Text>
          </View>

          {/* Body text (editable) */}
          <TextInput
            style={styles.letterBody}
            multiline
            value={letterBody}
            onChangeText={setLetterBody}
            textAlignVertical="top"
          />

          {/* Action row */}
          <View style={styles.letterActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShowFeedback(v => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>✎ Tailor more</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionGhost]}
              onPress={handleGenerate}
              activeOpacity={0.8}
            >
              <Text style={styles.actionGhostText}>↺ Redo</Text>
            </TouchableOpacity>
          </View>

          {/* Feedback input */}
          {showFeedback && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackLabel}>What would you like changed?</Text>
              <TextInput
                style={styles.feedbackInput}
                multiline
                numberOfLines={3}
                placeholder="e.g. Make it more enthusiastic, mention my Python skills, keep it under 200 words…"
                placeholderTextColor={theme.colors.text.muted}
                value={feedback}
                onChangeText={setFeedback}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.feedbackSubmit, !feedback.trim() && { opacity: 0.4 }]}
                onPress={handleRefine}
                disabled={!feedback.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.feedbackSubmitText}>Apply feedback →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Generate button ── */}
      {!isLoading && (
        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: currentTemplate.primaryColor }]}
          onPress={handleGenerate}
          activeOpacity={0.85}
        >
          <Text style={styles.generateBtnText}>
            {phase === 'idle' ? '✦ Generate Cover Letter' : '✦ Regenerate'}
          </Text>
        </TouchableOpacity>
      )}

      {phase === 'idle' && (
        <Text style={styles.hint}>
          AI uses your CV to write a professional cover letter. Optionally paste a job description to tailor it.
        </Text>
      )}

      {phase === 'review' && (
        <Text style={styles.hint}>
          Looks good? Your cover letter is ready to export from the next screen.
        </Text>
      )}
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  root: { flex: 1 },

  section: {
    marginBottom: sh(14),
  },
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
  toggleChevron: {
    fontSize: ms(12),
    color: theme.colors.text.muted,
  },

  templateRow: {
    gap: sw(8),
    paddingBottom: sh(4),
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: sw(12),
    paddingVertical: sh(8),
    backgroundColor: theme.colors.surface,
  },
  chipDot: {
    width: sw(10),
    height: sw(10),
    borderRadius: sw(5),
  },
  chipName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  chipDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 1,
  },
  chipCheck: {
    fontSize: ms(13),
    fontWeight: '700',
    marginLeft: sw(4),
  },

  jobInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: sw(12),
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    minHeight: sh(90),
    lineHeight: ms(20),
  },

  loadingCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: sh(28),
    alignItems: 'center',
    marginBottom: sh(16),
    gap: sh(8),
    backgroundColor: theme.colors.surface,
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

  letterCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopWidth: 3,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: sh(14),
    backgroundColor: theme.colors.surface,
  },
  letterHeaderStrip: {
    paddingHorizontal: sw(14),
    paddingVertical: sh(10),
  },
  letterHeaderName: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  letterHeaderRole: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  letterBody: {
    padding: sw(14),
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: ms(22),
    minHeight: sh(180),
  },

  letterActions: {
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
  actionGhost: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
  },
  actionGhostText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },

  feedbackBox: {
    padding: sw(12),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    gap: sh(8),
  },
  feedbackLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  feedbackInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: sw(10),
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
    minHeight: sh(75),
    lineHeight: ms(20),
  },
  feedbackSubmit: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: sh(10),
    alignItems: 'center',
  },
  feedbackSubmitText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },

  generateBtn: {
    borderRadius: theme.radius.md,
    paddingVertical: sh(13),
    alignItems: 'center',
    marginBottom: sh(12),
  },
  generateBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: ms(18),
  },
});