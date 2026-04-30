/**
 * utils/generateCoverLetter.ts
 *
 * AI cover letter generation using Google Gemini with fallback models + retry logic
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PersonalDetails, WorkExperience } from '../types/cv.types';

// ─── Model Priority ────────────────────────────────────────────────────────
const MODEL_PRIORITY = [
  'gemini-2.5-flash',        // Best quality
  'gemini-2.5-flash-lite',   // Faster & often more available
  'gemini-2.5-pro',          // Most powerful (use as last resort)
] as const;

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
);

// ─── Build Context ─────────────────────────────────────────────────────────
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
        lines.push(`    ${job.description.trim().slice(0, 180)}`);
      }
    }
  }

  if (skills?.length) {
    lines.push(`\nKey skills: ${skills.slice(0, 12).join(', ')}`);
  }

  if (jobDescription?.trim()) {
    lines.push(`\nTarget Job Description:\n${jobDescription.trim()}`);
  }

  return lines.join('\n');
}

// ─── Robust Gemini Call with Fallback ──────────────────────────────────────
async function callGeminiWithFallback(
  prompt: string,
  systemInstruction?: string,
  maxRetries = 3
): Promise<string> {
  let lastError: any;

  for (const modelName of MODEL_PRIORITY) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          ...(systemInstruction && { systemInstruction }),
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        console.log(`[generateCoverLetter] Success using model: ${modelName}`);
        return text || '';

      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';

        console.warn(`[generateCoverLetter] ${modelName} attempt ${attempt} failed:`, msg);

        if (msg.includes('503') || msg.includes('high demand') || msg.includes('overloaded')) {
          const delay = Math.min(800 * attempt, 4000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        break; // Try next model for other errors
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

// ─── Generate Cover Letter ─────────────────────────────────────────────────
export async function generateCoverLetter(
  personal: PersonalDetails,
  workExperience: WorkExperience[],
  summary: string,
  skills: string[],
  jobDescription?: string,
): Promise<string> {
  const context = buildContext(personal, workExperience, summary, skills, jobDescription);

  const systemPrompt = `You are an expert cover letter writer. Write highly compelling, specific, and professional cover letters.

Rules:
- Write in first person ("I", "my")
- Exactly 3 paragraphs
- 160–230 words total
- Be specific and reference real experience and skills
- Natural, confident, and enthusiastic tone
- Return ONLY the 3 paragraphs. No salutation, no sign-off.`;

  try {
    const text = await callGeminiWithFallback(
      `Write a tailored cover letter for this candidate:\n\n${context}`,
      systemPrompt
    );
    return text || fallbackLetter(personal);
  } catch (err) {
    console.warn('[generateCoverLetter] error:', err);
    return fallbackLetter(personal);
  }
}

// ─── Refine Cover Letter ───────────────────────────────────────────────────
export async function refineCoverLetter(
  existingLetter: string,
  feedback: string,
  personal: PersonalDetails,
  jobDescription?: string,
): Promise<string> {
  const prompt = `Rewrite the following cover letter based on user feedback.

CURRENT COVER LETTER:
${existingLetter}

USER FEEDBACK:
${feedback}

Candidate: ${personal.fullName}, ${personal.jobTitle}
${jobDescription ? `Target Role: ${jobDescription}` : ''}

Keep it to 3 paragraphs, first person, 160–230 words. Return only the revised letter body.`;

  try {
    const text = await callGeminiWithFallback(prompt);
    return text || existingLetter;
  } catch (err) {
    console.warn('[generateCoverLetter] refineCoverLetter error:', err);
    return existingLetter;
  }
}

// ─── Build Cover Letter HTML ───────────────────────────────────────────────
export function buildCoverLetterHTML(
  letterBody: string,
  personal: PersonalDetails,
  templateId: 'classic' | 'modern' | 'minimal' | 'executive' = 'classic',
  primaryColor: string = '#1e3a5f',
): string {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const paragraphs = letterBody
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');

  const contact = [personal.email, personal.phone, personal.city]
    .filter(Boolean)
    .join('  ·  ');

  // Full template styles (you had placeholders before)
  const templateStyles: Record<string, string> = {
    classic: `
      .header { background: ${primaryColor}; padding: 36px 48px; }
      .header-name { color: #fff; font-size: 26px; font-weight: 700; margin: 0 0 4px; }
      .header-role { color: rgba(255,255,255,0.78); font-size: 14px; margin: 0 0 8px; }
      .header-contact { color: rgba(255,255,255,0.65); font-size: 12px; }
      .body-wrap { padding: 40px 48px; }
    `,
    modern: `
      .header { background: ${primaryColor}; padding: 36px 48px 56px; clip-path: polygon(0 0, 100% 0, 100% 78%, 0 100%); }
      .header-name { color: #fff; font-size: 26px; font-weight: 700; margin: 0 0 4px; }
      .header-role { color: rgba(255,255,255,0.78); font-size: 14px; margin: 0 0 8px; }
      .header-contact { color: rgba(255,255,255,0.65); font-size: 12px; }
      .body-wrap { padding: 16px 48px 40px; }
    `,
    minimal: `
      .header { border-bottom: 3px solid ${primaryColor}; padding: 28px 48px 20px; }
      .header-name { color: ${primaryColor}; font-size: 26px; font-weight: 700; margin: 0 0 4px; }
      .header-role { color: #555; font-size: 14px; margin: 0 0 8px; }
      .header-contact { color: #888; font-size: 12px; }
      .body-wrap { padding: 32px 48px 40px; }
    `,
    executive: `
      .header { background: ${primaryColor}; padding: 36px 48px; border-bottom: 5px solid #b45309; }
      .header-name { color: #fff; font-size: 28px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 4px; }
      .header-role { color: rgba(255,255,255,0.75); font-size: 13px; margin: 0 0 8px; letter-spacing: 0.8px; text-transform: uppercase; }
      .header-contact { color: rgba(255,255,255,0.6); font-size: 12px; }
      .body-wrap { padding: 40px 48px; }
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
    ${templateStyles[templateId] || templateStyles.classic}
    .body-wrap p {
      line-height: 1.75;
      margin-bottom: 18px;
      color: #2c2c2c;
      font-size: 15px;
    }
    .salutation { font-weight: 600; margin-bottom: 18px; color: #1a1a1a; }
    .sign-off { margin-top: 32px; }
    .sign-off-line { margin-bottom: 6px; }
    .sign-off-name { font-weight: 700; font-size: 16px; color: #1a1a1a; }
    .sign-off-role { font-size: 13px; color: #666; font-style: italic; }
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
  return `I am writing to express my strong interest in the ${personal.jobTitle || 'position'} role. 

With my background and proven track record, I am confident I can make a valuable contribution to your team. I have consistently delivered results and am eager to bring my skills to your organization.

I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your time and consideration. I look forward to hearing from you.`;
}