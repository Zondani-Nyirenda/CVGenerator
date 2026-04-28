import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme, sw, sh, ms } from '../constants/theme';

interface Props {
  label: string;
  onRemove: () => void;
}

export default function SkillTag({ label, onRemove }: Props) {
  return (
    <View style={styles.tag}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={styles.removeBtn}
      >
        <Text style={styles.removeText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    paddingVertical: sh(6),
    paddingLeft: sw(12),
    paddingRight: sw(8),
    marginRight: sw(6),
    marginBottom: sh(8),
    maxWidth: sw(200),
    borderWidth: 1,
    borderColor: theme.colors.primary + '33',
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primaryDark,
    fontWeight: '600',
    flexShrink: 1,
  },
  removeBtn: {
    marginLeft: sw(6),
    width: sw(18),
    height: sw(18),
    borderRadius: sw(9),
    backgroundColor: theme.colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: ms(14),
    color: theme.colors.primary,
    fontWeight: '700',
    lineHeight: ms(16),
  },
});