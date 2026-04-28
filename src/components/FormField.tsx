import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Controller, Control, FieldErrors, FieldValues, Path } from 'react-hook-form';
import { theme, sw, sh, ms } from '../constants/theme';

interface Props<T extends FieldValues> extends TextInputProps {
  label: string;
  name: Path<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
}

export default function FormField<T extends FieldValues>({
  label, name, control, errors, ...inputProps
}: Props<T>) {
  const error = errors[name];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, error && styles.inputError]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholderTextColor={theme.colors.text.muted}
            {...inputProps}
          />
        )}
      />
      {error && (
        <Text style={styles.errorText}>
          {error.message as string}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: sh(16),
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: sh(6),
  },
  input: {
    height: theme.inputHeight,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: sw(14),
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    ...(theme.shadow?.sm as object),
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    marginTop: sh(4),
    fontSize: theme.fontSize.xs,
    color: theme.colors.danger,
    fontWeight: '500',
  },
});