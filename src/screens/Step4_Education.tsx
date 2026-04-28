import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { v4 as uuid } from 'uuid';

import ScreenLayout from '../components/ScreenLayout';
import EntryCard from '../components/EntryCard';
import { useCVStore } from '../store/cvStore';
import { Education, Certification } from '../types/cv.types';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type Nav = StackNavigationProp<RootStackParamList, 'Step4'>;

const emptyEdu = (): Education => ({ id: uuid(), degree: '', institution: '', startYear: '', endYear: '', description: '' });
const emptyCert = (): Certification => ({ id: uuid(), name: '', issuer: '', year: '' });

type ModalType = 'edu' | 'cert' | null;

export default function Step4_Education() {
  const navigation = useNavigation<Nav>();
  const {
    education, certifications,
    addEducation, updateEducation, removeEducation,
    addCertification, removeCertification,
    persistToSQLite,
  } = useCVStore();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingEdu, setEditingEdu] = useState<Education>(emptyEdu());
  const [editingCert, setEditingCert] = useState<Certification>(emptyCert());

  const openAddEdu = () => { setEditingEdu(emptyEdu()); setModalType('edu'); };
  const openEditEdu = (e: Education) => { setEditingEdu({ ...e }); setModalType('edu'); };
  const openAddCert = () => { setEditingCert(emptyCert()); setModalType('cert'); };

  const saveEdu = () => {
    if (!editingEdu.degree || !editingEdu.institution) {
      Alert.alert('Required', 'Degree and institution are required.'); return;
    }
    const exists = education.find((e) => e.id === editingEdu.id);
    if (exists) updateEducation(editingEdu.id, editingEdu);
    else addEducation(editingEdu);
    setModalType(null);
  };

  const saveCert = () => {
    if (!editingCert.name) { Alert.alert('Required', 'Certification name is required.'); return; }
    addCertification(editingCert);
    setModalType(null);
  };

  const onContinue = async () => {
    await persistToSQLite();
    navigation.navigate('Step5');
  };

  return (
    <>
      <ScreenLayout
        step={4}
        title="Education & certs"
        subtitle="Degrees, diplomas, certifications"
        onBack={() => navigation.goBack()}
        onContinue={onContinue}
      >
        {/* Education section */}
        <Text style={styles.sectionLabel}>Education</Text>
        {education.map((e) => (
          <EntryCard
            key={e.id}
            title={e.degree}
            subtitle={`${e.institution} · ${e.startYear} – ${e.endYear}`}
            onEdit={() => openEditEdu(e)}
            onDelete={() => Alert.alert('Delete', 'Remove this education?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => removeEducation(e.id) },
            ])}
          />
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={openAddEdu}>
          <Text style={styles.addBtnText}>+ Add education</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Certifications section */}
        <Text style={styles.sectionLabel}>Certifications</Text>
        {certifications.map((c) => (
          <EntryCard
            key={c.id}
            title={c.name}
            subtitle={`${c.issuer} · ${c.year}`}
            onEdit={() => {}}
            onDelete={() => Alert.alert('Delete', 'Remove this certification?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => removeCertification(c.id) },
            ])}
          />
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={openAddCert}>
          <Text style={styles.addBtnText}>+ Add certification</Text>
        </TouchableOpacity>
      </ScreenLayout>

      {/* Education Modal */}
      <Modal visible={modalType === 'edu'} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>
              {education.find((e) => e.id === editingEdu.id) ? 'Edit education' : 'Add education'}
            </Text>
            <ScrollView>
              {([
                ['Degree / Diploma', 'degree'],
                ['Institution', 'institution'],
                ['Start year', 'startYear'],
                ['End year', 'endYear'],
              ] as const).map(([label, field]) => (
                <View key={field} style={styles.field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={editingEdu[field]}
                    onChangeText={(v) => setEditingEdu((p) => ({ ...p, [field]: v }))}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    placeholderTextColor={theme.colors.text.muted}
                  />
                </View>
              ))}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editingEdu.description}
                  onChangeText={(v) => setEditingEdu((p) => ({ ...p, description: v }))}
                  placeholder="Relevant coursework, achievements..."
                  placeholderTextColor={theme.colors.text.muted}
                  multiline numberOfLines={3} textAlignVertical="top"
                />
              </View>
            </ScrollView>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdu}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Certification Modal */}
      <Modal visible={modalType === 'cert'} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>Add certification</Text>
            {([
              ['Certification name', 'name'],
              ['Issuer', 'issuer'],
              ['Year', 'year'],
            ] as const).map(([label, field]) => (
              <View key={field} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={editingCert[field]}
                  onChangeText={(v) => setEditingCert((p) => ({ ...p, [field]: v }))}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  placeholderTextColor={theme.colors.text.muted}
                  keyboardType={field === 'year' ? 'numeric' : 'default'}
                />
              </View>
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCert}>
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
    marginTop: 4,
  },
  addBtn: {
    borderWidth: 1.5, borderColor: theme.colors.primary,
    borderStyle: 'dashed', borderRadius: theme.radius.md,
    paddingVertical: 13, alignItems: 'center', marginTop: 4,
  },
  addBtnText: { color: theme.colors.primary, fontSize: theme.fontSize.md, fontWeight: '600' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 24 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.surface, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 24, maxHeight: '85%',
  },
  modalTitle: { fontSize: theme.fontSize.lg, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 20 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: theme.fontSize.sm, fontWeight: '500', color: theme.colors.text.secondary, marginBottom: 6 },
  input: {
    backgroundColor: theme.colors.background, borderWidth: 1,
    borderColor: theme.colors.border, borderRadius: theme.radius.md,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: theme.fontSize.md, color: theme.colors.text.primary,
  },
  textArea: { minHeight: 80, paddingTop: 12 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
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