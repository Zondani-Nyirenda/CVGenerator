import { Template } from '../types/cv.types';

export const classicTemplate: Template = {
  id: 'classic',
  name: 'Classic',
  primaryColor: '#185FA5',
  secondaryColor: '#f1f5f9',
  fontFamily: 'Georgia, serif',
  fontSize: { heading: 16, body: 13, name: 24 },
  sectionOrder: ['header', 'summary', 'experience', 'education', 'certifications', 'skills', 'languages', 'references'],
  layout: 'single-column',
  accentStyle: 'underline',
};