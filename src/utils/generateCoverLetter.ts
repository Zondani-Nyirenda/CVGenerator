/**
 * utils/generateCoverLetter.ts
 *
 * AI cover letter generation + HTML builder.
 * Imported by CoverLetterPreview.tsx:
 *   import { generateCoverLetter, refineCoverLetter, buildCoverLetterHTML } from '../utils/generateCoverLetter';
 */

import Anthropic from '@anthropic-ai/sdk';
import { PersonalDetails, WorkExperience } from '../types/cv.types';

// ─── Client ────────────────────────────────────────────────────────────────

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

// ─── Types ─────────────────────────────────────────────────────────────────

export type CLTemplateId = 'classic' | 'modern' | 'minimal' | 'executive';

// ─── Helpers ───────────────────────────────────────────────────────────────

function buildContext(
  personal: PersonalDetails,
  workExperience: WorkExperience[],
  summary: string,
  skills: string[],
  jobDescription?: string,
): string {
  const lines: string[] = [];

  lines.push(`Candidate: ${personal.fullName}`);
  lines.push(`Title: ${personal.jobTitle}`);
  if (personal.city) lines.push(`Location: ${personal.city}`);
  if (personal.email) lines.push(`Email: ${personal.email}`);

  if (summary?.trim()) lines.push(`\nProfessional summary:\n${summary.trim()}`);

  if (workExperience?.length) {
    lines.push('\nWork experience:');
    for (const job of workExperience) {
      const dates = [job.startDate, job.current ? 'Present' : job.endDate]
        .filter(Boolean).join(' – ');
      lines.push(`  • ${job.jobTitle} at ${job.company}${dates ? ` (${dates})` : ''}`);
      if (job.description?.trim()) {
        lines.push(`    ${job.description.trim().slice(0, 150)}`);
      }
    }
  }

  if (skills?.length) {
    lines.push(`\nKey skills: ${skills.slice(0, 10).join(', ')}`);
  }

  if (jobDescription?.trim()) {
    lines.push(`\nTarget role / job description:\n${jobDescription.trim().slice(0, 400)}`);
  }

  return lines.join('\n');
}

// ─── Generate ──────────────────────────────────────────────────────────────

/**
 * Generate a cover letter body (plain text paragraphs, no salutation/sign-off —
 * those are added by the HTML builder).
 */
export async function generateCoverLetter(
  personal: PersonalDetails,
  workExperience: WorkExperience[],
  summary: string,
  skills: string[],
  jobDescription?: string,
): Promise<string> {
  const context = buildContext(personal, workExperience, summary, skills, jobDescription);

  const systemPrompt = `You are an expert cover letter writer. Write compelling, specific cover
letters that highlight the candidate's real experience. Rules:
- 3 paragraphs: opening hook, skills/experience evidence, closing with call to action
- Third person or first person — use first person (I/my)
- Specific, never generic — reference actual job titles, companies, and skills from the profile
- 150–220 words total
- Do NOT include date, address block, "Dear Hiring Manager", or "Sincerely" — just the 3 paragraphs
- Return only the letter body, nothing else`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Write a cover letter for this candidate:\n\n${context}`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type === 'text') return block.text.trim();
    return fallbackLetter(personal);
  } catch (err) {
    console.warn('[generateCoverLetter] error:', err);
    return fallbackLetter(personal);
  }
}

// ─── Refine ────────────────────────────────────────────────────────────────

export async function refineCoverLetter(
  existingLetter: string,
  feedback: string,
  personal: PersonalDetails,
  jobDescription?: string,
): Promise<string> {
  const prompt = `Rewrite the following cover letter based on the user's feedback.

CURRENT LETTER:
${existingLetter}

USER FEEDBACK:
${feedback}

CANDIDATE: ${personal.fullName}, ${personal.jobTitle}
${jobDescription ? `TARGET ROLE: ${jobDescription.slice(0, 200)}` : ''}

Rules: Keep 3 paragraphs. First person. 150–220 words. Return only the revised letter body.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = message.content[0];
    if (block.type === 'text') return block.text.trim();
    return existingLetter;
  } catch (err) {
    console.warn('[generateCoverLetter] refineCoverLetter error:', err);
    return existingLetter;
  }
}

// ─── HTML builder ──────────────────────────────────────────────────────────

/**
 * Converts plain-text letter body → a styled, self-contained HTML document
 * ready for PDF export or WebView preview.
 *
 * templateId controls the visual style; primaryColor is the accent hex (with #).
 */
export function buildCoverLetterHTML(
  letterBody: string,
  personal: PersonalDetails,
  templateId: CLTemplateId = 'classic',
  primaryColor: string = '#1e3a5f',
): string {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Convert plain text paragraphs → <p> tags
  const paragraphs = letterBody
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');

  const contact = [personal.email, personal.phone, personal.city]
    .filter(Boolean)
    .join('  ·  ');

  // ── Per-template CSS variables ──────────────────────────────────────────
  const templateStyles: Record<CLTemplateId, string> = {
    classic: `
      .header { background: ${primaryColor}; padding: 36px 48px; }
      .header-name { color: #fff; font-size: 26px; font-weight: 700; margin: 0 0 4px; }
      .header-role { color: rgba(255,255,255,0.78); font-size: 14px; margin: 0 0 8px; font-style: italic; }
      .header-contact { color: rgba(255,255,255,0.65); font-size: 12px; }
      .body-wrap { padding: 40px 48px; }
      .date { color: #888; font-size: 13px; margin-bottom: 28px; }
    `,
    modern: `
      .header { background: ${primaryColor}; clip-path: polygon(0 0,100% 0,100% 78%,0 100%);
                padding: 36px 48px 56px; }
      .header-name { color: #fff; font-size: 26px; font-weight: 700; margin: 0 0 4px; }
      .header-role { color: rgba(255,255,255,0.78); font-size: 14px; margin: 0 0 8px; font-style: italic; }
      .header-contact { color: rgba(255,255,255,0.65); font-size: 12px; }
      .body-wrap { padding: 16px 48px 40px; }
      .date { color: #888; font-size: 13px; margin-bottom: 28px; }
    `,
    minimal: `
      .header { border-bottom: 3px solid ${primaryColor}; padding: 28px 48px 20px; }
      .header-name { color: ${primaryColor}; font-size: 26px; font-weight: 700; margin: 0 0 4px; }
      .header-role { color: #555; font-size: 14px; margin: 0 0 8px; }
      .header-contact { color: #888; font-size: 12px; }
      .body-wrap { padding: 32px 48px 40px; }
      .date { color: #888; font-size: 13px; margin-bottom: 28px; }
    `,
    executive: `
      .header { background: ${primaryColor}; border-bottom: 5px solid #b45309;
                padding: 36px 48px; }
      .header-name { color: #fff; font-size: 28px; font-weight: 700;
                     letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 4px; }
      .header-role { color: rgba(255,255,255,0.75); font-size: 13px; margin: 0 0 8px;
                     letter-spacing: 0.8px; text-transform: uppercase; }
      .header-contact { color: rgba(255,255,255,0.6); font-size: 12px; }
      .body-wrap { padding: 40px 48px; }
      .date { color: #888; font-size: 13px; margin-bottom: 28px; }
    `,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Cover Letter – ${personal.fullName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 15px;
      color: #1a1a1a;
      background: #fff;
      max-width: 760px;
      margin: 0 auto;
    }
    ${templateStyles[templateId] ?? templateStyles.classic}
    .body-wrap p {
      line-height: 1.75;
      margin-bottom: 18px;
      color: #2c2c2c;
      font-size: 15px;
    }
    .salutation {
      font-weight: 600;
      margin-bottom: 18px;
      color: #1a1a1a;
    }
    .sign-off {
      margin-top: 32px;
    }
    .sign-off-line {
      margin-bottom: 6px;
      color: #2c2c2c;
    }
    .sign-off-name {
      font-weight: 700;
      font-size: 16px;
      color: #1a1a1a;
      margin-bottom: 2px;
    }
    .sign-off-role {
      font-size: 13px;
      color: #666;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="header-name">${personal.fullName || 'Your Name'}</p>
    <p class="header-role">${personal.jobTitle || ''}</p>
    <p class="header-contact">${contact}</p>
  </div>

  <div class="body-wrap">
    <p class="date">${today}</p>
    <p class="salutation">Dear Hiring Manager,</p>

    ${paragraphs}

    <div class="sign-off">
      <p class="sign-off-line">Yours sincerely,</p>
      <p class="sign-off-name">${personal.fullName || ''}</p>
      <p class="sign-off-role">${personal.jobTitle || ''}</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Fallback ──────────────────────────────────────────────────────────────

function fallbackLetter(personal: PersonalDetails): string {
  return `I am writing to express my strong interest in joining your team. With my background as a ${personal.jobTitle ?? 'professional'}, I have developed a solid foundation of skills that I am eager to bring to a new challenge.

Throughout my career I have consistently delivered results and taken on increasing responsibility. I thrive in collaborative environments and bring both technical competence and a commitment to quality to everything I do.

I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your time and consideration — I look forward to hearing from you.`;
}