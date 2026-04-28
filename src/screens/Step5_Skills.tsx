import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Modal, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { v4 as uuid } from 'uuid';

import ScreenLayout from '../components/ScreenLayout';
import SkillTag from '../components/SkillTag';
import { useCVStore } from '../store/cvStore';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type Nav = StackNavigationProp<RootStackParamList, 'Step5'>;

const LEVELS = ['Native', 'Fluent', 'Conversational', 'Basic'];

export default function Step5_Skills() {
  const navigation = useNavigation<Nav>();
  const { skills, languages, setSkills, addLanguage, removeLanguage, persistToSQLite } = useCVStore();

  const [techInput, setTechInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [langModal, setLangModal] = useState(false);
  const [langName, setLangName] = useState('');
  const [langLevel, setLangLevel] = useState('Fluent');

  const addSkill = (type: 'technical' | 'soft', value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (skills[type].includes(trimmed)) return;
    setSkills({ ...skills, [type]: [...skills[type], trimmed] });
    if (type === 'technical') setTechInput('');
    else setSoftInput('');
  };

  const removeSkill = (type: 'technical' | 'soft', skill: string) => {
    setSkills({ ...skills, [type]: skills[type].filter((s) => s !== skill) });
  };

  const saveLanguage = () => {
    if (!langName.trim()) return;
    addLanguage({ id: uuid(), name: langName.trim(), level: langLevel });
    setLangName('');
    setLangLevel('Fluent');
    setLangModal(false);
  };

  const onContinue = async () => {
    await persistToSQLite();
    navigation.navigate('Step6');
  };

  return (
    <>
      <ScreenLayout
        step={5}
        title="Skills & languages"
        subtitle="Technical skills, tools, soft skills"
        onBack={() => navigation.goBack()}
        onContinue={onContinue}
      >
        {/* Technical Skills */}
        <Text style={styles.sectionLabel}>Technical skills</Text>
        <View style={styles.tagRow}>
          {skills.technical.map((s) => (
            <SkillTag key={s} label={s} onRemove={() => removeSkill('technical', s)} />
          ))}
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.tagInput}
            value={techInput}
            onChangeText={setTechInput}
            placeholder="Add a skill..."
            placeholderTextColor={theme.colors.text.muted}
            onSubmitEditing={() => addSkill('technical', techInput)}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.addTagBtn}
            onPress={() => addSkill('technical', techInput)}
          >
            <Text style={styles.addTagBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Soft Skills */}
        <Text style={styles.sectionLabel}>Soft skills</Text>
        <View style={styles.tagRow}>
          {skills.soft.map((s) => (
            <SkillTag key={s} label={s} onRemove={() => removeSkill('soft', s)} />
          ))}
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.tagInput}
            value={softInput}
            onChangeText={setSoftInput}
            placeholder="Add a skill..."
            placeholderTextColor={theme.colors.text.muted}
            onSubmitEditing={() => addSkill('soft', softInput)}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.addTagBtn}
            onPress={() => addSkill('soft', softInput)}
          >
            <Text style={styles.addTagBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Languages */}
        <Text style={styles.sectionLabel}>Languages</Text>
        <View style={styles.tagRow}>
          {languages.map((l) => (
            <SkillTag
              key={l.id}
              label={`${l.name} – ${l.level}`}
              onRemove={() => removeLanguage(l.id)}
            />
          ))}
        </View>
        <TouchableOpacity
          style={styles.addTagBtn}
          onPress={() => setLangModal(true)}
        >
          <Text style={styles.addTagBtnText}>+ Add language</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* References */}
        <View style={styles.referencesCard}>
          <Text style={styles.referencesTitle}>References</Text>
          <Text style={styles.referencesText}>
            "References available upon request" will appear on your CV automatically.
          </Text>
        </View>
      </ScreenLayout>

      {/* Language Modal */}
      <Modal visible={langModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>Add language</Text>

            <Text style={styles.fieldLabel}>Language name</Text>
            <TextInput
              style={styles.input}
              value={langName}
              onChangeText={setLangName}
              placeholder="e.g. English"
              placeholderTextColor={theme.colors.text.muted}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Proficiency level</Text>
            <View style={styles.levelRow}>
              {LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.levelBtn, langLevel === level && styles.levelBtnActive]}
                  onPress={() => setLangLevel(level)}
                >
                  <Text style={[styles.levelText, langLevel === level && styles.levelTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setLangModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveLanguage}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  tagInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  addTagBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.primaryLight,
  },
  addTagBtnText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: theme.fontSize.sm,
  },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 20 },
  referencesCard: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    borderTopLeftRadius: theme.radius.md, borderBottomLeftRadius: theme.radius.md,
  },
  referencesTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.primaryDark,
    marginBottom: 4,
  },
  referencesText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    lineHeight: 20,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  levelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  levelBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  levelText: { fontSize: theme.fontSize.sm, color: theme.colors.text.secondary, fontWeight: '500' },
  levelTextActive: { color: '#fff' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center',
  },
  cancelText: { color: theme.colors.text.secondary, fontWeight: '600' },
  saveBtn: {
    flex: 2, paddingVertical: 13, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary, alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: theme.fontSize.md },
});