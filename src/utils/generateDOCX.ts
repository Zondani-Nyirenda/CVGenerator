/**
 * utils/generateDOCX.ts
 *
 * Exports the CV as a .docx that mirrors the previewed layout.
 * Types match cv.types.ts exactly:
 *   - SkillGroup = { technical: string[], soft: string[] }
 *   - Education  uses startYear/endYear (not startDate/endDate)
 *   - Certification uses year (not date)
 *   - WorkExperience has no achievements array
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  LevelFormat,
  BorderStyle,
  Footer,
  PageNumber,
  ShadingType,
  WidthType,
  Table,
  TableRow,
  TableCell,
  ExternalHyperlink,
} from 'docx';

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

// ─── Template palette ──────────────────────────────────────────────────────

const PALETTE: Record<TemplateId, { accent: string; headerBg: string }> = {
  classic:   { accent: '185FA5', headerBg: '185FA5' },
  modern:    { accent: '7C3AED', headerBg: '7C3AED' },
  minimal:   { accent: '111827', headerBg: '111827' },
  executive: { accent: '0F4C75', headerBg: '0F4C75' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Merge SkillGroup { technical, soft } into one flat list with labels. */
function flattenSkills(skills: SkillGroup): string[] {
  const result: string[] = [];
  if (skills.technical?.length) result.push(...skills.technical);
  if (skills.soft?.length)      result.push(...skills.soft);
  return result;
}

function dateRange(start?: string, end?: string, current?: boolean): string {
  const s = start ?? '';
  const e = current ? 'Present' : (end ?? '');
  if (!s && !e) return '';
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
}

// ─── Section heading ───────────────────────────────────────────────────────

function sectionHeading(title: string, accent: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 60 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 4 },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 24,
        color: accent,
        font: 'Arial',
        characterSpacing: 40,
      }),
    ],
  });
}

function bulletPara(text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 22, font: 'Arial' })],
  });
}

// ─── Main export ───────────────────────────────────────────────────────────

export async function exportDOCX(cvData: CVData, fileName: string): Promise<void> {
  const palette = PALETTE[cvData.selectedTemplate] ?? PALETTE.classic;
  const { accent, headerBg } = palette;
  const p = cvData.personal;

  // ── Header table (coloured banner) ──────────────────────────────────────
  const headerTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: headerBg, type: ShadingType.CLEAR },
            margins: { top: 240, bottom: 240, left: 360, right: 360 },
            width: { size: 9360, type: WidthType.DXA },
            children: [
              // Full name
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: p.fullName || 'Your Name',
                    bold: true,
                    size: 64,
                    color: 'FFFFFF',
                    font: 'Arial',
                  }),
                ],
              }),
              // Job title
              ...(p.jobTitle ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 80 },
                  children: [
                    new TextRun({
                      text: p.jobTitle,
                      size: 30,
                      color: 'E0E0E0',
                      font: 'Arial',
                    }),
                  ],
                }),
              ] : []),
              // Contact line
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: [p.email, p.phone, p.city].filter(Boolean).join('  ·  '),
                    size: 20,
                    color: 'CCCCCC',
                    font: 'Arial',
                  }),
                ],
              }),
              // LinkedIn
              ...(p.linkedin ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40 },
                  children: [
                    new ExternalHyperlink({
                      link: p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}`,
                      children: [
                        new TextRun({
                          text: p.linkedin,
                          size: 20,
                          color: 'AACCFF',
                          underline: {},
                          font: 'Arial',
                        }),
                      ],
                    }),
                  ],
                }),
              ] : []),
            ],
          }),
        ],
      }),
    ],
  });

  // ── Body paragraphs ─────────────────────────────────────────────────────
  const body: Paragraph[] = [];

  // Summary
  if (cvData.summary?.trim()) {
    body.push(sectionHeading('Professional Summary', accent));
    body.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: cvData.summary.trim(),
            size: 22,
            font: 'Arial',
            italics: true,
          }),
        ],
      }),
    );
  }

  // Work Experience
  if (cvData.workExperience?.length) {
    body.push(sectionHeading('Work Experience', accent));
    for (const job of cvData.workExperience) {
      body.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({ text: job.jobTitle, bold: true, size: 24, font: 'Arial' }),
            new TextRun({ text: `  ·  ${job.company}`, size: 24, font: 'Arial', color: '555555' }),
          ],
        }),
      );
      const range = dateRange(job.startDate, job.endDate, job.current);
      if (range) {
        body.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: range, size: 20, font: 'Arial', color: '888888', italics: true }),
            ],
          }),
        );
      }
      if (job.description?.trim()) {
        // Split description on newlines and render each as a bullet
        const lines = job.description.trim().split('\n').filter(l => l.trim());
        for (const line of lines) {
          body.push(bulletPara(line.replace(/^[-•]\s*/, '').trim()));
        }
      }
    }
  }

  // Education — uses startYear / endYear per cv.types.ts
  if (cvData.education?.length) {
    body.push(sectionHeading('Education', accent));
    for (const edu of cvData.education) {
      body.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 24, font: 'Arial' }),
          ],
        }),
      );
      body.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: edu.institution, size: 22, font: 'Arial', color: '444444' }),
          ],
        }),
      );
      const yearRange = [edu.startYear, edu.endYear].filter(Boolean).join(' – ');
      if (yearRange) {
        body.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: yearRange, size: 20, font: 'Arial', color: '888888', italics: true }),
            ],
          }),
        );
      }
      if (edu.description?.trim()) {
        body.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: edu.description.trim(), size: 22, font: 'Arial' }),
            ],
          }),
        );
      }
    }
  }

  // Certifications — uses year (not date) per cv.types.ts
  if (cvData.certifications?.length) {
    body.push(sectionHeading('Certifications', accent));
    for (const cert of cvData.certifications) {
      body.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [
            new TextRun({ text: cert.name, bold: true, size: 22, font: 'Arial' }),
            new TextRun({ text: `  —  ${cert.issuer}`, size: 22, font: 'Arial', color: '555555' }),
            new TextRun({ text: cert.year ? `  (${cert.year})` : '', size: 20, font: 'Arial', color: '888888', italics: true }),
          ],
        }),
      );
    }
  }

  // Skills — SkillGroup = { technical: string[], soft: string[] }
  const allSkills = flattenSkills(cvData.skills);
  if (allSkills.length) {
    body.push(sectionHeading('Skills', accent));

    if (cvData.skills.technical?.length) {
      body.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: 'Technical:  ', bold: true, size: 22, font: 'Arial' }),
            new TextRun({ text: cvData.skills.technical.join('  ·  '), size: 22, font: 'Arial' }),
          ],
        }),
      );
    }
    if (cvData.skills.soft?.length) {
      body.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: 'Soft skills:  ', bold: true, size: 22, font: 'Arial' }),
            new TextRun({ text: cvData.skills.soft.join('  ·  '), size: 22, font: 'Arial' }),
          ],
        }),
      );
    }
  }

  // Languages
  if (cvData.languages?.length) {
    body.push(sectionHeading('Languages', accent));
    for (const lang of cvData.languages) {
      body.push(
        new Paragraph({
          spacing: { before: 40, after: 20 },
          children: [
            new TextRun({ text: lang.name, bold: true, size: 22, font: 'Arial' }),
            new TextRun({ text: `  —  ${lang.level}`, size: 22, font: 'Arial', color: '666666' }),
          ],
        }),
      );
    }
  }

  // ── Assemble document ───────────────────────────────────────────────────
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 720, right: 1080, bottom: 720, left: 1080 },
          },
        },
        children: [
          headerTable,
          new Paragraph({ spacing: { after: 80 }, children: [] }),
          ...body,
        ],
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${p.fullName} · CV · Page `, size: 16, color: '999999', font: 'Arial' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999', font: 'Arial' }),
                  new TextRun({ text: ' of ', size: 16, color: '999999', font: 'Arial' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '999999', font: 'Arial' }),
                ],
              }),
            ],
          }),
        },
      },
    ],
  });

  const base64 = await Packer.toBase64String(doc);
  const path = `${FileSystem.documentDirectory}${fileName}.docx`;
  await FileSystem.writeAsStringAsync(path, base64, { encoding: 'base64' });
  await Sharing.shareAsync(path, {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    dialogTitle: `Share ${fileName}.docx`,
    UTI: 'org.openxmlformats.wordprocessingml.document',
  });
}