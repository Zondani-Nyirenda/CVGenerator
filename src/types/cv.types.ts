export interface PersonalDetails {
  fullName: string;
  jobTitle: string;
  phone: string;
  email: string;
  city: string;
  linkedin?: string;
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  description?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface SkillGroup {
  technical: string[];
  soft: string[];
}

export interface Language {
  id: string;
  name: string;
  level: string;
}

export type TemplateId = 'classic' | 'modern' | 'minimal' | 'executive';

export interface CVData {
  personal: PersonalDetails;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  skills: SkillGroup;
  languages: Language[];
  selectedTemplate: TemplateId;
}

export interface Template {
  id: TemplateId;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: { heading: number; body: number; name: number };
  sectionOrder: string[];
  layout: 'single-column' | 'two-column';
  accentStyle: 'underline' | 'border-left' | 'background' | 'minimal';
}