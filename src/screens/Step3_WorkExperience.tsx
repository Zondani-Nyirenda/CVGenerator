import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  TextInput, Switch, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

import ScreenLayout from '../components/ScreenLayout';
import EntryCard from '../components/EntryCard';
import { useCVStore } from '../store/cvStore';
import { WorkExperience } from '../types/cv.types';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type Nav = StackNavigationProp<RootStackParamList, 'Step3'>;

const empty = (): WorkExperience => ({
  id: uuid(), jobTitle: '', company: '', startDate: '', endDate: '', current: false, description: '',
});

export default function Step3_WorkExperience() {
  const navigation = useNavigation<Nav>();
  const { workExperience, addWorkExperience, updateWorkExperience, removeWorkExperience, persistToSQLite } = useCVStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<WorkExperience>(empty());

  const openAdd = () => { setEditing(empty()); setModalVisible(true); };
  const openEdit = (exp: WorkExperience) => { setEditing({ ...exp }); setModalVisible(true); };

  const handleSave = () => {
    if (!editing.jobTitle || !editing.company) {
      Alert.alert('Required', 'Job title and company are required.');
      return;
    }
    const exists = workExperience.find((e) => e.id === editing.id);
    if (exists) updateWorkExperience(editing.id, editing);
    else addWorkExperience(editing);
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this experience?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeWorkExperience(id) },
    ]);
  };

  const onContinue = async () => {
    await persistToSQLite();
    navigation.navigate('Step4');
  };

  return (
    <>
      <ScreenLayout
        step={3}
        title="Work experience"
        subtitle="Add your most recent positions first"
        onBack={() => navigation.goBack()}
        onContinue={onContinue}
      >
        {workExperience.map((exp) => (
          <EntryCard
            key={exp.id}
            title={exp.jobTitle}
            subtitle={`${exp.company} · ${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}`}
            onEdit={() => openEdit(exp)}
            onDelete={() => handleDelete(exp.id)}
          />
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add experience</Text>
        </TouchableOpacity>
      </ScreenLayout>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {workExperience.find((e) => e.id === editing.id) ? 'Edit experience' : 'Add experience'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {([
                ['Job title', 'jobTitle', 'words'],
                ['Company', 'company', 'words'],
                ['Start date', 'startDate', 'none'],
              ] as const).map(([label, field, cap]) => (
                <View key={field} style={styles.field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={editing[field]}
                    onChangeText={(v) => setEditing((p) => ({ ...p, [field]: v }))}
                    placeholder={field === 'startDate' ? 'e.g. Jan 2021' : `Enter ${label.toLowerCase()}`}
                    placeholderTextColor={theme.colors.text.muted}
                    autoCapitalize={cap}
                  />
                </View>
              ))}

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Currently working here</Text>
                <Switch
                  value={editing.current}
                  onValueChange={(v) => setEditing((p) => ({ ...p, current: v }))}
                  trackColor={{ true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {!editing.current && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>End date</Text>
                  <TextInput
                    style={styles.input}
                    value={editing.endDate}
                    onChangeText={(v) => setEditing((p) => ({ ...p, endDate: v }))}
                    placeholder="e.g. Dec 2023"
                    placeholderTextColor={theme.colors.text.muted}
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editing.description}
                  onChangeText={(v) => setEditing((p) => ({ ...p, description: v }))}
                  placeholder="Key achievements and responsibilities..."
                  placeholderTextColor={theme.colors.text.muted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
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
  addBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: { color: theme.colors.primary, fontSize: theme.fontSize.md, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 6,
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
  textArea: { minHeight: 90, paddingTop: 12 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelText: { color: theme.colors.text.secondary, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: theme.fontSize.md },
});