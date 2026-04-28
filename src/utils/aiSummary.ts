/**
 * utils/aiSummary.ts
 *
 * Dynamic professional summary generation via the Anthropic API.
 * Uses ALL available CV context so the output is specific, not generic.
 * Also exports `refineSummary` for the "Tailor it more" flow in Step2.
 */

import Anthropic from '@anthropic-ai/sdk';
import { PersonalDetails, WorkExperience } from '../types/cv.types';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Education {
  institution?: string;
  degree?: string;
  field?: string;
}

interface SkillGroup {
  category?: string;
  items?: string[];
}

interface GenerateSummaryOptions {
  personal: PersonalDetails;
  workExperience?: WorkExperience[];
  education?: Education[];
  skills?: string[] | SkillGroup[];
  /** Approximate years of experience — computed automatically if omitted */
  yearsOverride?: number;
}

// ─── Client ────────────────────────────────────────────────────────────────

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,   // required for Expo / React Native environments
});

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Extract a flat list of skill names from whatever shape the store holds. */
function flattenSkills(skills?: string[] | SkillGroup[]): string[] {
  if (!skills || skills.length === 0) return [];
  if (typeof skills[0] === 'string') return skills as string[];
  return (skills as SkillGroup[]).flatMap((g) => g.items ?? []);
}

/**
 * Estimate total years of experience from the work history.
 * Uses the current year when `endDate` is absent (i.e. current role).
 */
function estimateYears(workExperience?: WorkExperience[]): number | null {
  if (!workExperience?.length) return null;

  let totalMonths = 0;
  const currentYear = new Date().getFullYear();

  for (const job of workExperience) {
    // Try to parse start / end years from strings like "Jan 2019", "2019", etc.
    const startYear = extractYear(job.startDate) ?? currentYear;
    const endYear = job.current
      ? currentYear
      : (extractYear(job.endDate) ?? currentYear);

    totalMonths += Math.max(0, (endYear - startYear) * 12);
  }

  const years = Math.round(totalMonths / 12);
  return years > 0 ? years : null;
}

function extractYear(dateStr?: string): number | null {
  if (!dateStr) return null;
  const match = dateStr.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Build a rich, concise context block that Claude can reason over.
 * The more fields that are filled in, the more specific the output.
 */
function buildContext(opts: GenerateSummaryOptions): string {
  const { personal, workExperience = [], education = [], skills } = opts;

  const lines: string[] = [];

  // Personal
  if (personal.fullName)  lines.push(`Full name: ${personal.fullName}`);
  if (personal.jobTitle)  lines.push(`Current/target job title: ${personal.jobTitle}`);
  if (personal.city)      lines.push(`Location: ${personal.city}`);

  // Experience
  const years = opts.yearsOverride ?? estimateYears(workExperience);
  if (years !== null)     lines.push(`Total years of experience: ~${years}`);

  if (workExperience.length) {
    const jobLines = workExperience.map((job) => {
      const parts = [`${job.jobTitle ?? 'Role'} at ${job.company ?? 'Company'}`];
      const range = [job.startDate, job.current ? 'Present' : job.endDate]
        .filter(Boolean)
        .join(' – ');
      if (range) parts.push(`(${range})`);
      if (job.description?.trim()) parts.push(`— ${job.description.trim().slice(0, 120)}`);
      return parts.join(' ');
    });
    lines.push(`Work history:\n${jobLines.map((j) => `  • ${j}`).join('\n')}`);
  }

  // Education
  if (education.length) {
    const eduLines = education.map(
      (e) =>
        `${[e.degree, e.field].filter(Boolean).join(', ') || 'Qualification'} — ${e.institution ?? ''}`,
    );
    lines.push(`Education:\n${eduLines.map((e) => `  • ${e}`).join('\n')}`);
  }

  // Skills
  const skillList = flattenSkills(skills);
  if (skillList.length) {
    lines.push(`Key skills: ${skillList.slice(0, 12).join(', ')}`);
  }

  return lines.join('\n');
}

// ─── Prompt templates ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert CV writer with 15 years of experience helping
professionals land roles at top companies. You write professional summaries that are:
- Specific to the individual's background (never generic boilerplate)
- Written in confident third-person voice
- 2–4 sentences, 60–100 words
- ATS-friendly, using relevant industry keywords naturally
- Focused on the value the candidate brings, not just what they've done
Return ONLY the summary text. No preamble, no quotation marks, no labels.`;

// ─── Main export ───────────────────────────────────────────────────────────

/**
 * Generate a tailored professional summary from CV data.
 */
export async function generateSummary(
  personal: PersonalDetails,
  workExperience: WorkExperience[],
  education?: Education[],
  skills?: string[] | SkillGroup[],
): Promise<string> {
  const context = buildContext({ personal, workExperience, education, skills });

  const prompt = `Using the following candidate profile, write a professional CV summary.\n\n${context}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = message.content[0];
    if (block.type === 'text') return block.text.trim();
    return fallback(personal);
  } catch (err) {
    console.warn('[aiSummary] generateSummary error:', err);
    return fallback(personal);
  }
}

/**
 * Refine an existing summary based on free-text user feedback.
 * Used by the "Tailor it more → Apply feedback" flow in Step2.
 */
export async function refineSummary(
  existingSummary: string,
  feedback: string,
  personal: PersonalDetails,
  workExperience?: WorkExperience[],
): Promise<string> {
  const contextLines: string[] = [];
  if (personal.fullName)  contextLines.push(`Name: ${personal.fullName}`);
  if (personal.jobTitle)  contextLines.push(`Title: ${personal.jobTitle}`);
  const years = estimateYears(workExperience);
  if (years)              contextLines.push(`Years of experience: ~${years}`);

  const prompt = `
You are refining a professional CV summary based on user feedback.

CURRENT SUMMARY:
"${existingSummary}"

USER FEEDBACK:
"${feedback}"

CANDIDATE CONTEXT:
${contextLines.join('\n')}

Rewrite the summary incorporating the feedback. Keep it 2–4 sentences, third-person,
confident, and specific. Return ONLY the revised summary text.
`.trim();

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = message.content[0];
    if (block.type === 'text') return block.text.trim();
    return existingSummary;
  } catch (err) {
    console.warn('[aiSummary] refineSummary error:', err);
    return existingSummary;
  }
}

// ─── Fallback ──────────────────────────────────────────────────────────────

function fallback(personal: PersonalDetails): string {
  const name = personal.fullName ?? 'This professional';
  const title = personal.jobTitle ?? 'their field';
  const city = personal.city ? ` based in ${personal.city}` : '';
  return `${name} is an experienced ${title}${city} with a strong track record of delivering high-quality results. Passionate about continuous growth and making a meaningful impact in every role.`;
}