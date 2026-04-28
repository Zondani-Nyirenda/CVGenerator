import { Template } from '../types/cv.types';

export const modernTemplate: Template = {
  id: 'modern',
  name: 'Modern',
  primaryColor: '#7c3aed',
  secondaryColor: '#f5f3ff',
  fontFamily: 'Arial, sans-serif',
  fontSize: { heading: 15, body: 13, name: 26 },
  sectionOrder: ['header', 'summary', 'experience', 'skills', 'education', 'certifications', 'languages', 'references'],
  layout: 'two-column',
  accentStyle: 'border-left',
};