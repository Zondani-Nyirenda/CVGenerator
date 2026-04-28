import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme, sw, sh, ms } from '../constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function EntryCard({ title, subtitle, onEdit, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: sh(12),
    paddingHorizontal: sw(14),
    marginBottom: sh(10),
    ...(theme.shadow?.sm as object),
  },
  content: { flex: 1, marginRight: sw(10) },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: sh(2),
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
  },
  editBtn: {
    paddingVertical: sh(6),
    paddingHorizontal: sw(12),
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  editText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    width: sw(32),
    height: sw(32),
    borderRadius: sw(16),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: ms(13),
    color: theme.colors.danger,
    fontWeight: '700',
  },
});