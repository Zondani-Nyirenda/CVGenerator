/**
 * utils/aiCVParser.ts
 *
 * Parses a free-text career description into structured CVData using Google Gemini.
 * Handles multi-turn chat for follow-up refinements.
 */

import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { v4 as uuid } from 'uuid';
import {
  PersonalDetails,
  WorkExperience,
  Education,
  Certification,
  SkillGroup,
  Language,
} from '../types/cv.types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ParsedCVData {
  personal: PersonalDetails;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  skills: SkillGroup;
  languages: Language[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Config ─────────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash';   // ← Updated model

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
);

// ─── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are an expert CV writer and career coach. Your job is to have a natural conversation with a user to understand their career background, then extract and structure that information into a professional CV.

When the user describes their career, extract ALL available information into this EXACT JSON format. Be thorough — infer reasonable details when clearly implied.

IMPORTANT RULES:
1. Always respond with BOTH a conversational message AND a JSON block
2. The JSON must be wrapped in <CV_DATA> tags
3. If information is missing, use empty strings/arrays — never omit fields
4. Generate a strong professional summary from the context provided
5. For work experience descriptions, write 2-3 achievement-focused bullet points (joined by newlines) based on the role if the user doesn't provide details
6. Infer technical and soft skills from the roles and experience described
7. After parsing, ask ONE focused follow-up question to get any major missing info (e.g. education if not mentioned, or specific achievements)
8. If the user provides refinements, update the CV data accordingly and confirm the change

RESPONSE FORMAT (always follow this exactly):
[Your conversational response here — friendly, professional, encouraging]

<CV_DATA>
{
  "personal": {
    "fullName": "",
    "jobTitle": "",
    "phone": "",
    "email": "",
    "city": "",
    "linkedin": ""
  },
  "summary": "",
  "workExperience": [
    {
      "id": "auto",
      "jobTitle": "",
      "company": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "description": ""
    }
  ],
  "education": [
    {
      "id": "auto",
      "degree": "",
      "institution": "",
      "startYear": "",
      "endYear": "",
      "description": ""
    }
  ],
  "certifications": [
    {
      "id": "auto",
      "name": "",
      "issuer": "",
      "year": ""
    }
  ],
  "skills": {
    "technical": [],
    "soft": []
  },
  "languages": [
    {
      "id": "auto",
      "name": "",
      "level": ""
    }
  ]
}
</CV_DATA>

Only include items with actual data in arrays. Empty arrays [] are fine if no data exists.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseCVFromResponse(responseText: string): ParsedCVData | null {
  const match = responseText.match(/<CV_DATA>([\s\S]*?)<\/CV_DATA>/);
  if (!match) return null;

  try {
    const raw = JSON.parse(match[1].trim());

    const assignIds = <T extends { id?: string }>(arr: T[]): (T & { id: string })[] =>
      (arr ?? []).map((item) => ({
        ...item,
        id: item.id && item.id !== 'auto' ? item.id : uuid(),
      }));

    return {
      personal: {
        fullName: raw.personal?.fullName ?? '',
        jobTitle: raw.personal?.jobTitle ?? '',
        phone: raw.personal?.phone ?? '',
        email: raw.personal?.email ?? '',
        city: raw.personal?.city ?? '',
        linkedin: raw.personal?.linkedin ?? '',
      },
      summary: raw.summary ?? '',
      workExperience: assignIds(raw.workExperience ?? []),
      education: assignIds(raw.education ?? []),
      certifications: assignIds(raw.certifications ?? []),
      skills: {
        technical: raw.skills?.technical ?? [],
        soft: raw.skills?.soft ?? [],
      },
      languages: assignIds(raw.languages ?? []),
    };
  } catch (err) {
    console.warn('[aiCVParser] JSON parse failed:', err);
    return null;
  }
}

function extractMessage(responseText: string): string {
  return responseText.replace(/<CV_DATA>[\s\S]*?<\/CV_DATA>/g, '').trim();
}

/** Convert our ChatMessage[] format to Gemini's Content[] format */
function toGeminiHistory(history: ChatMessage[]): Content[] {
  return history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

// ─── Main API ────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  history: ChatMessage[],
): Promise<{ reply: string; cvData: ParsedCVData | null }> {
  try {
    const geminiModel = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const allButLast = history.slice(0, -1);
    const lastMessage = history[history.length - 1];

    const chat = geminiModel.startChat({
      history: toGeminiHistory(allButLast),
    });

    const result = await chat.sendMessage(lastMessage.content);
    const rawText = result.response.text();

    const cvData = parseCVFromResponse(rawText);
    const reply = extractMessage(rawText);

    return { reply, cvData };
  } catch (err: any) {
    console.error('[aiCVParser] sendChatMessage error:', err?.message || err);
    return {
      reply: "I'm having trouble connecting to the AI service right now. Please check your internet connection and try again.",
      cvData: null,
    };
  }
}

/**
 * Generate the opening greeting message
 */
export async function getOpeningMessage(): Promise<string> {
  try {
    const geminiModel = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await geminiModel.generateContent(
      'Hello, I want to create a professional CV. What do you need from me?',
    );

    const rawText = result.response.text();
    return extractMessage(rawText);
  } catch (err: any) {
    console.error('[aiCVParser] getOpeningMessage error:', err?.message || err);
    return "Hi! I'm your AI CV assistant. Tell me about yourself — your name, current role, work history, education, and any key skills. The more you share, the better I can tailor your CV. You can write it naturally, like you're talking to a friend.";
  }
}