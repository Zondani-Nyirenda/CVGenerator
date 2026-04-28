/**
 * store/cvStore.ts
 * Fixed version with proper reset handling - No EventEmitter
 */

import { create } from 'zustand';
import {
  CVData,
  PersonalDetails,
  WorkExperience,
  Education,
  Certification,
  SkillGroup,
  Language,
  TemplateId,
} from '../types/cv.types';

import { saveCV, loadCV, clearCV, getDatabaseStats } from '../db/database';

const defaultState: CVData & { coverLetterHTML: string | null } = {
  personal: { fullName: '', jobTitle: '', phone: '', email: '', city: '', linkedin: '' },
  summary: '',
  workExperience: [],
  education: [],
  certifications: [],
  skills: { technical: [], soft: [] },
  languages: [],
  selectedTemplate: 'classic' as TemplateId,
  coverLetterHTML: null,
};

interface CVStore extends CVData {
  coverLetterHTML: string | null;

  setPersonal: (data: PersonalDetails) => void;
  setSummary: (summary: string) => void;
  setSkills: (skills: SkillGroup) => void;
  setTemplate: (id: TemplateId) => void;
  setCoverLetterHTML: (html: string) => void;

  addWorkExperience: (exp: WorkExperience) => void;
  updateWorkExperience: (id: string, exp: WorkExperience) => void;
  removeWorkExperience: (id: string) => void;

  addEducation: (edu: Education) => void;
  updateEducation: (id: string, edu: Education) => void;
  removeEducation: (id: string) => void;

  addCertification: (cert: Certification) => void;
  removeCertification: (id: string) => void;

  addLanguage: (lang: Language) => void;
  removeLanguage: (id: string) => void;

  clearCoverLetterHTML: () => void;

  persistToSQLite: () => Promise<void>;
  loadFromSQLite: () => Promise<void>;
  resetCV: () => Promise<void>;
  isResetting: boolean;
  lastResetTimestamp: number | null;
  resetComplete: boolean; // New flag to indicate reset just completed
}

export const useCVStore = create<CVStore>((set, get) => ({
  ...defaultState,
  isResetting: false,
  lastResetTimestamp: null,
  resetComplete: false,

  setPersonal: (data) => set({ personal: data }),
  setSummary: (summary) => set({ summary }),
  setSkills: (skills) => set({ skills }),
  setTemplate: (id) => set({ selectedTemplate: id }),
  setCoverLetterHTML: (html) => set({ coverLetterHTML: html }),

  addWorkExperience: (exp) => set((s) => ({ workExperience: [...s.workExperience, exp] })),
  updateWorkExperience: (id, exp) => 
    set((s) => ({ workExperience: s.workExperience.map((e) => e.id === id ? exp : e) })),
  removeWorkExperience: (id) => 
    set((s) => ({ workExperience: s.workExperience.filter((e) => e.id !== id) })),

  addEducation: (edu) => set((s) => ({ education: [...s.education, edu] })),
  updateEducation: (id, edu) => 
    set((s) => ({ education: s.education.map((e) => e.id === id ? edu : e) })),
  removeEducation: (id) => 
    set((s) => ({ education: s.education.filter((e) => e.id !== id) })),

  addCertification: (cert) => set((s) => ({ certifications: [...s.certifications, cert] })),
  removeCertification: (id) => 
    set((s) => ({ certifications: s.certifications.filter((c) => c.id !== id) })),

  addLanguage: (lang) => set((s) => ({ languages: [...s.languages, lang] })),
  removeLanguage: (id) => 
    set((s) => ({ languages: s.languages.filter((l) => l.id !== id) })),

  clearCoverLetterHTML: () => set({ coverLetterHTML: null }),

  persistToSQLite: async () => {
    const s = get();
    if (s.isResetting) {
      console.log('⏭️ Skipping persist because reset is in progress');
      return;
    }
    
    try {
      await saveCV('personal', JSON.stringify(s.personal));
      await saveCV('summary', s.summary);
      await saveCV('workExperience', JSON.stringify(s.workExperience));
      await saveCV('education', JSON.stringify(s.education));
      await saveCV('certifications', JSON.stringify(s.certifications));
      await saveCV('skills', JSON.stringify(s.skills));
      await saveCV('languages', JSON.stringify(s.languages));
      await saveCV('selectedTemplate', s.selectedTemplate);
    } catch (e) {
      console.error('Persist failed:', e);
    }
  },

  loadFromSQLite: async () => {
    const state = get();
    
    // Don't load if reset is in progress
    if (state.isResetting) {
      console.log('⏭️ Skipping loadFromSQLite - Reset in progress');
      return;
    }

    // Don't load if reset was just completed (within last 2 seconds)
    if (state.resetComplete) {
      console.log('⏭️ Skipping loadFromSQLite - Reset just completed');
      return;
    }

    const resetTimestamp = state.lastResetTimestamp;
    if (resetTimestamp && Date.now() - resetTimestamp < 2000) {
      console.log('⏭️ Skipping stale load - Reset happened recently');
      return;
    }

    try {
      const stats = await getDatabaseStats();
      console.log(`📊 Database stats before load: ${stats.totalRecords} records`, stats.keys);
      
      // If database is empty and we have a reset timestamp, assume we're in a clean state
      if (stats.totalRecords === 0 && (resetTimestamp || state.resetComplete)) {
        console.log('📭 Database is empty after reset, keeping default state');
        set({ 
          ...defaultState,
          isResetting: false,
          lastResetTimestamp: null,
          resetComplete: false,
        });
        return;
      }
      
      const personalStr = await loadCV('personal');
      const summaryStr = await loadCV('summary');
      const workStr = await loadCV('workExperience');
      const eduStr = await loadCV('education');
      const certStr = await loadCV('certifications');
      const skillsStr = await loadCV('skills');
      const langStr = await loadCV('languages');
      const templateStr = await loadCV('selectedTemplate');

      set({
        personal: personalStr ? JSON.parse(personalStr) : defaultState.personal,
        summary: summaryStr ?? '',
        workExperience: workStr ? JSON.parse(workStr) : [],
        education: eduStr ? JSON.parse(eduStr) : [],
        certifications: certStr ? JSON.parse(certStr) : [],
        skills: skillsStr ? JSON.parse(skillsStr) : defaultState.skills,
        languages: langStr ? JSON.parse(langStr) : [],
        selectedTemplate: (templateStr as TemplateId) ?? 'classic',
        coverLetterHTML: null,
        isResetting: false,
        lastResetTimestamp: null,
        resetComplete: false,
      });

      console.log('✅ CV data loaded into store from SQLite');
    } catch (error) {
      console.error('Load failed:', error);
      set({ ...defaultState, isResetting: false, lastResetTimestamp: null, resetComplete: false });
    }
  },

  resetCV: async () => {
    try {
      console.log('🔄 Starting full reset...');

      // Set reset flags
      set({ 
        isResetting: true, 
        lastResetTimestamp: Date.now(),
        resetComplete: false,
      });

      // Clear database
      await clearCV();
      
      // Verify database is cleared
      const stats = await getDatabaseStats();
      console.log(`📊 Database after clear: ${stats.totalRecords} records`);

      // Reset store to default state
      set({ 
        ...defaultState,
        isResetting: false,
        lastResetTimestamp: Date.now(),
        resetComplete: true, // Mark that reset is complete
      });

      console.log('🎉 FULL RESET COMPLETED - Database + Store cleared');
      
      // Reset the resetComplete flag after 2.5 seconds
      setTimeout(() => {
        const currentState = get();
        if (currentState.resetComplete) {
          set({ resetComplete: false });
          console.log('🔓 Reset protection flag cleared');
        }
      }, 2500);
      
    } catch (error) {
      console.error('❌ Reset failed:', error);
      set({ 
        ...defaultState, 
        isResetting: false, 
        lastResetTimestamp: null,
        resetComplete: false,
      });
    }
  },
}));