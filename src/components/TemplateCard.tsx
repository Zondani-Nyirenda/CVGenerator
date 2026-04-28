import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Template } from '../types/cv.types';
import { theme, sw, sh, ms } from '../constants/theme';

interface TemplateCardProps {
  template: Template;
  selected: boolean;
  onSelect: () => void;
}

/* ─── Mini preview renderers, one per template style ─── */

function ClassicPreview({ color }: { color: string }) {
  return (
    <View style={preview.root}>
      {/* Full-width header band */}
      <View style={[preview.classicHeader, { backgroundColor: color }]}>
        <View style={preview.classicAvatar} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={[preview.line, { width: '80%', backgroundColor: 'rgba(255,255,255,0.9)' }]} />
          <View style={[preview.line, { width: '55%', backgroundColor: 'rgba(255,255,255,0.55)' }]} />
        </View>
      </View>
      <View style={preview.body}>
        <View style={[preview.sectionTitle, { backgroundColor: color }]} />
        <View style={[preview.line, { width: '90%' }]} />
        <View style={[preview.line, { width: '75%' }]} />
        <View style={[preview.line, { width: '60%' }]} />
        <View style={[preview.sectionTitle, { backgroundColor: color, marginTop: 6 }]} />
        <View style={[preview.line, { width: '85%' }]} />
        <View style={[preview.line, { width: '65%' }]} />
      </View>
    </View>
  );
}

function ModernPreview({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <View style={[preview.root, { flexDirection: 'row' }]}>
      {/* Left sidebar */}
      <View style={[preview.modernSidebar, { backgroundColor: primary }]}>
        <View style={preview.modernCircle} />
        <View style={[preview.line, { width: '80%', backgroundColor: 'rgba(255,255,255,0.7)', marginTop: 4 }]} />
        <View style={[preview.line, { width: '60%', backgroundColor: 'rgba(255,255,255,0.45)' }]} />
        <View style={{ marginTop: 8, gap: 4 }}>
          <View style={[preview.line, { width: '90%', backgroundColor: 'rgba(255,255,255,0.4)' }]} />
          <View style={[preview.line, { width: '70%', backgroundColor: 'rgba(255,255,255,0.4)' }]} />
          <View style={[preview.line, { width: '80%', backgroundColor: 'rgba(255,255,255,0.4)' }]} />
        </View>
      </View>
      {/* Right content */}
      <View style={preview.modernContent}>
        <View style={[preview.modernAccentLine, { backgroundColor: primary }]} />
        <View style={[preview.line, { width: '85%' }]} />
        <View style={[preview.line, { width: '65%' }]} />
        <View style={[preview.line, { width: '75%', marginTop: 5 }]} />
        <View style={[preview.line, { width: '55%' }]} />
        <View style={[preview.line, { width: '80%' }]} />
      </View>
    </View>
  );
}

function MinimalPreview({ color }: { color: string }) {
  return (
    <View style={preview.root}>
      <View style={preview.body}>
        {/* Name area — just a large-ish line */}
        <View style={[preview.line, { width: '70%', height: 8, marginBottom: 4 }]} />
        <View style={[preview.line, { width: '45%', marginBottom: 10 }]} />
        {/* Thin rule */}
        <View style={[preview.rule, { backgroundColor: color }]} />
        {/* Body lines */}
        <View style={[preview.line, { width: '95%' }]} />
        <View style={[preview.line, { width: '80%' }]} />
        <View style={[preview.line, { width: '60%' }]} />
        <View style={{ height: 8 }} />
        <View style={[preview.line, { width: '50%', height: 6 }]} />
        <View style={[preview.line, { width: '85%' }]} />
        <View style={[preview.line, { width: '70%' }]} />
      </View>
    </View>
  );
}

function ExecutivePreview({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <View style={preview.root}>
      {/* Top accent bar */}
      <View style={[preview.execTopBar, { backgroundColor: primary }]} />
      <View style={[preview.execSubBar, { backgroundColor: secondary }]} />
      <View style={preview.body}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <View style={[preview.execInitials, { backgroundColor: primary }]}>
            <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 1 }} />
          </View>
          <View style={{ gap: 3, flex: 1 }}>
            <View style={[preview.line, { width: '70%', height: 6 }]} />
            <View style={[preview.line, { width: '50%' }]} />
          </View>
        </View>
        <View style={[preview.rule, { backgroundColor: primary, marginBottom: 6 }]} />
        <View style={[preview.line, { width: '90%' }]} />
        <View style={[preview.line, { width: '75%' }]} />
        <View style={[preview.line, { width: '55%' }]} />
        <View style={{ marginTop: 6, flexDirection: 'row', gap: 4 }}>
          <View style={[preview.tag, { backgroundColor: secondary }]} />
          <View style={[preview.tag, { backgroundColor: secondary, width: 24 }]} />
          <View style={[preview.tag, { backgroundColor: secondary, width: 18 }]} />
        </View>
      </View>
    </View>
  );
}

const PREVIEW_MAP: Record<string, (t: Template) => React.ReactNode> = {
  classic: (t) => <ClassicPreview color={t.primaryColor} />,
  modern: (t) => <ModernPreview primary={t.primaryColor} secondary={t.secondaryColor} />,
  minimal: (t) => <MinimalPreview color={t.primaryColor} />,
  executive: (t) => <ExecutivePreview primary={t.primaryColor} secondary={t.secondaryColor} />,
};

/* ─── Card ─── */

export default function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  const renderPreview = PREVIEW_MAP[template.id] ?? PREVIEW_MAP.classic;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selectedCard]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {selected && (
        <View style={styles.checkBadge}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}

      {/* Mini CV preview */}
      <View style={styles.previewWrapper}>
        {renderPreview(template)}
      </View>

      {/* Footer */}
      <View style={[styles.footer, selected && { borderTopColor: template.primaryColor + '40' }]}>
        <View style={styles.swatches}>
          <View style={[styles.swatch, { backgroundColor: template.primaryColor }]} />
          <View style={[
            styles.swatch,
            { backgroundColor: template.secondaryColor, borderWidth: 1, borderColor: '#e2e8f0' },
          ]} />
        </View>
       
      </View>
    </TouchableOpacity>
  );
}

/* ─── Shared preview primitives ─── */
const preview = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  body: {
    padding: 8,
    gap: 4,
  },
  line: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  rule: {
    height: 1.5,
    width: '100%',
    borderRadius: 1,
    marginVertical: 5,
  },
  sectionTitle: {
    height: 5,
    width: '40%',
    borderRadius: 2,
    marginBottom: 4,
  },
  tag: {
    height: 8,
    width: 30,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },

  /* Classic */
  classicHeader: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  classicAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  /* Modern */
  modernSidebar: {
    width: '35%',
    padding: 6,
    gap: 3,
  },
  modernCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginBottom: 2,
  },
  modernContent: {
    flex: 1,
    padding: 6,
    gap: 4,
  },
  modernAccentLine: {
    height: 3,
    width: '50%',
    borderRadius: 2,
    marginBottom: 4,
  },

  /* Executive */
  execTopBar: {
    height: 8,
    width: '100%',
  },
  execSubBar: {
    height: 3,
    width: '100%',
  },
  execInitials: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* ─── Card styles ─── */
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    flex: 1,
    margin: sw(6),
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: sw(8),
    right: sw(8),
    width: sw(22),
    height: sw(22),
    borderRadius: sw(11),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  checkText: { color: '#fff', fontSize: ms(12), fontWeight: '700' },
  previewWrapper: {
    height: sh(110),
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    padding: sw(10),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  swatches: { flexDirection: 'row', gap: sw(3) },
  swatch: { width: sw(12), height: sw(12), borderRadius: sw(6) },
  name: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  desc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 1,
  },
});