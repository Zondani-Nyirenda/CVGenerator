import { CVData, Template } from '../types/cv.types';

function sectionHeading(title: string, t: Template): string {
  const underline = `border-bottom: 2px solid ${t.primaryColor}; padding-bottom: 4px;`;
  const borderLeft = `border-left: 4px solid ${t.primaryColor}; padding-left: 10px;`;
  const background = `background: ${t.primaryColor}; color: #fff; padding: 4px 10px; border-radius: 4px;`;
  const minimal = `border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;`;

  const styleMap: Record<string, string> = {
    underline: underline,
    'border-left': borderLeft,
    background: background,
    minimal: minimal,
  };
  const s = styleMap[t.accentStyle] || underline;
  const color = t.accentStyle === 'background' ? '#fff' : t.primaryColor;

  return `<h2 style="font-size:${t.fontSize.heading}px; font-weight:bold; margin:18px 0 8px; ${s} color:${color};">${title}</h2>`;
}

function buildHeader(cv: CVData, t: Template): string {
  const p = cv.personal;
  const contact = [p.phone, p.email, p.city, p.linkedin].filter(Boolean).join(' · ');
  return `
    <div style="background:${t.primaryColor}; color:#fff; padding:24px 28px; margin-bottom:8px;">
      <div style="font-size:${t.fontSize.name}px; font-weight:bold; margin-bottom:4px;">${p.fullName}</div>
      <div style="font-size:${t.fontSize.heading}px; opacity:0.85; margin-bottom:8px;">${p.jobTitle}</div>
      <div style="font-size:${t.fontSize.body}px; opacity:0.75;">${contact}</div>
    </div>`;
}

function buildSummary(cv: CVData, t: Template): string {
  if (!cv.summary) return '';
  return `${sectionHeading('Professional Summary', t)}
    <p style="font-size:${t.fontSize.body}px; line-height:1.7; color:#374151;">${cv.summary}</p>`;
}

function buildExperience(cv: CVData, t: Template): string {
  if (!cv.workExperience.length) return '';
  const items = cv.workExperience.map((e) => `
    <div style="margin-bottom:14px;">
      <div style="font-size:${t.fontSize.body + 1}px; font-weight:bold; color:#1e293b;">${e.jobTitle} — ${e.company}</div>
      <div style="font-size:${t.fontSize.body}px; color:#64748b; margin-bottom:4px;">${e.startDate} – ${e.current ? 'Present' : e.endDate}</div>
      <div style="font-size:${t.fontSize.body}px; color:#374151; line-height:1.6;">${e.description}</div>
    </div>`).join('');
  return `${sectionHeading('Experience', t)}${items}`;
}

function buildEducation(cv: CVData, t: Template): string {
  if (!cv.education.length) return '';
  const items = cv.education.map((e) => `
    <div style="margin-bottom:12px;">
      <div style="font-size:${t.fontSize.body + 1}px; font-weight:bold; color:#1e293b;">${e.degree} — ${e.institution}</div>
      <div style="font-size:${t.fontSize.body}px; color:#64748b;">${e.startYear} – ${e.endYear}</div>
      ${e.description ? `<div style="font-size:${t.fontSize.body}px; color:#374151;">${e.description}</div>` : ''}
    </div>`).join('');
  return `${sectionHeading('Education', t)}${items}`;
}

function buildCertifications(cv: CVData, t: Template): string {
  if (!cv.certifications.length) return '';
  const items = cv.certifications.map((c) => `
    <div style="margin-bottom:8px;">
      <span style="font-size:${t.fontSize.body}px; font-weight:bold; color:#1e293b;">${c.name}</span>
      <span style="font-size:${t.fontSize.body}px; color:#64748b;"> — ${c.issuer}, ${c.year}</span>
    </div>`).join('');
  return `${sectionHeading('Certifications', t)}${items}`;
}

function buildSkills(cv: CVData, t: Template): string {
  const pill = (s: string) =>
    `<span style="display:inline-block; background:${t.secondaryColor}; color:${t.primaryColor}; border-radius:20px; padding:3px 12px; font-size:${t.fontSize.body}px; margin:3px 4px 3px 0;">${s}</span>`;

  let html = sectionHeading('Skills', t);
  if (cv.skills.technical.length) {
    html += `<div style="margin-bottom:8px;"><div style="font-size:${t.fontSize.body}px; font-weight:bold; color:#64748b; margin-bottom:4px;">Technical</div>${cv.skills.technical.map(pill).join('')}</div>`;
  }
  if (cv.skills.soft.length) {
    html += `<div><div style="font-size:${t.fontSize.body}px; font-weight:bold; color:#64748b; margin-bottom:4px;">Soft skills</div>${cv.skills.soft.map(pill).join('')}</div>`;
  }
  return html;
}

function buildLanguages(cv: CVData, t: Template): string {
  if (!cv.languages.length) return '';
  const items = cv.languages.map((l) =>
    `<span style="display:inline-block; margin-right:16px; font-size:${t.fontSize.body}px; color:#374151;">${l.name} – <span style="color:#64748b;">${l.level}</span></span>`
  ).join('');
  return `${sectionHeading('Languages', t)}<div style="margin-bottom:8px;">${items}</div>`;
}

function buildReferences(t: Template): string {
  return `${sectionHeading('References', t)}<p style="font-size:${t.fontSize.body}px; color:#64748b; font-style:italic;">References available upon request</p>`;
}

const sectionBuilders: Record<string, (cv: CVData, t: Template) => string> = {
  header: buildHeader,
  summary: buildSummary,
  experience: buildExperience,
  education: buildEducation,
  certifications: buildCertifications,
  skills: buildSkills,
  languages: buildLanguages,
  references: (cv, t) => buildReferences(t),
};

export function buildHTMLString(cv: CVData, template: Template): string {
  const body = template.sectionOrder
    .map((section) => sectionBuilders[section]?.(cv, template) ?? '')
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: ${template.fontFamily}; background: #fff; color: #1e293b; }
  .content { padding: 0 28px 32px; }
</style>
</head>
<body>
${buildHeader(cv, template)}
<div class="content">
${template.sectionOrder.filter(s => s !== 'header').map(s => sectionBuilders[s]?.(cv, template) ?? '').join('\n')}
</div>
</body>
</html>`;
}