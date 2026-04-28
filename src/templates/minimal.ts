import { Template } from '../types/cv.types';

export const minimalTemplate: Template = {
  id: 'minimal',
  name: 'Minimal',
  primaryColor: '#374151',
  secondaryColor: '#f9fafb',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: { heading: 14, body: 12, name: 22 },
  sectionOrder: ['header', 'summary', 'experience', 'education', 'skills', 'certifications', 'languages', 'references'],
  layout: 'single-column',
  accentStyle: 'minimal',
};