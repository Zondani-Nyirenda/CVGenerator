import { Template } from '../types/cv.types';

export const executiveTemplate: Template = {
  id: 'executive',
  name: 'Executive',
  primaryColor: '#92400e',
  secondaryColor: '#fffbeb',
  fontFamily: 'Times New Roman, serif',
  fontSize: { heading: 16, body: 13, name: 28 },
  sectionOrder: ['header', 'summary', 'experience', 'education', 'certifications', 'skills', 'languages', 'references'],
  layout: 'single-column',
  accentStyle: 'background',
};