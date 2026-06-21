/**
 * Editable, ATS-friendly PDF export.
 *
 * Renders the Resume directly via jsPDF (no html2canvas, no image conversion),
 * so the PDF carries a real text layer that any ATS can extract verbatim,
 * AND attaches AcroForm text fields over each editable region. Opening the
 * resulting PDF in Adobe Acrobat Reader (or any AcroForm-capable viewer)
 * lets the user click into the fields and edit the resume directly.
 *
 * jsPDF 4.x ships AcroForm support out of the box: `new AcroFormTextField()`
 * + `doc.addField(field)`. See `node_modules/jspdf/types/index.d.ts`.
 *
 * No new dependencies. Pure ASCII. Single column. Canonical section order.
 */

import type { Resume, Section } from '@/store/types';
import { asciiSafe } from '../ats/atsScore';

interface LayoutContext {
  doc: import('jspdf').jsPDF;
  jspdfNs: typeof import('jspdf');
  pageWidth: number;
  pageHeight: number;
  margin: number;
  cursorY: number;
  contentWidth: number;
}

function ensureSpace(ctx: LayoutContext, needed: number): void {
  if (ctx.cursorY + needed > ctx.pageHeight - ctx.margin) {
    ctx.doc.addPage();
    ctx.cursorY = ctx.margin;
  }
}

function drawHeading(ctx: LayoutContext, text: string): void {
  ensureSpace(ctx, 14);
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(12);
  ctx.doc.setTextColor(20, 30, 60);
  const upper = text.toUpperCase();
  ctx.doc.text(upper, ctx.margin, ctx.cursorY);
  ctx.cursorY += 4;
  ctx.doc.setDrawColor(120);
  ctx.doc.setLineWidth(0.3);
  ctx.doc.line(
    ctx.margin,
    ctx.cursorY,
    ctx.pageWidth - ctx.margin,
    ctx.cursorY,
  );
  ctx.cursorY += 5;
}

function drawText(
  ctx: LayoutContext,
  text: string,
  opts: { bold?: boolean; italic?: boolean; size?: number; color?: [number, number, number]; indent?: number } = {},
): void {
  const size = opts.size ?? 10;
  const indent = opts.indent ?? 0;
  ctx.doc.setFont('helvetica', opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal');
  ctx.doc.setFontSize(size);
  ctx.doc.setTextColor(...(opts.color ?? [40, 40, 40]));
  const wrapped = ctx.doc.splitTextToSize(
    asciiSafe(text),
    ctx.contentWidth - indent,
  ) as string[];
  for (const line of wrapped) {
    ensureSpace(ctx, size * 0.45 + 1.5);
    ctx.doc.text(line, ctx.margin + indent, ctx.cursorY);
    ctx.cursorY += size * 0.45 + 1.5;
  }
}

/**
 * Place an invisible AcroForm text field over a region of the page so the
 * user can click it and edit. Field bounds are in mm.
 */
function addEditableField(
  ctx: LayoutContext,
  opts: {
    name: string;
    value: string;
    x: number;
    y: number;
    width: number;
    height: number;
    multiline?: boolean;
    fontSize?: number;
  },
): void {
  const FieldCtor = (
    ctx.jspdfNs as unknown as { AcroFormTextField?: { new (): import('jspdf').AcroFormTextField } }
  ).AcroFormTextField;
  if (!FieldCtor) return; // Older jsPDF or missing AcroForm plugin -- skip silently.

  const field = new FieldCtor();
  field.fieldName = opts.name;
  field.x = opts.x;
  field.y = opts.y;
  field.width = opts.width;
  field.height = opts.height;
  field.value = asciiSafe(opts.value);
  field.defaultValue = field.value;
  field.fontSize = opts.fontSize ?? 10;
  if (opts.multiline) field.multiline = true;
  ctx.doc.addField(field);
}

const SECTION_ORDER: Section['type'][] = [
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'extracurricular',
  'custom',
];

const HEADING_FOR: Record<string, string> = {
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  certifications: 'Certifications',
  extracurricular: 'Extracurricular Activities',
  custom: '',
};

function sortSections(sections: Section[]): Section[] {
  const idx = (t: Section['type']) =>
    SECTION_ORDER.indexOf(t) === -1 ? 99 : SECTION_ORDER.indexOf(t);
  return [...sections].sort((a, b) => idx(a.type) - idx(b.type));
}

function entryDescription(entry: { fields: Record<string, string>; bullets: string[] }): {
  primary: string;
  secondary: string;
  duration: string;
  extra: string;
} {
  const primary =
    entry.fields.institution ||
    entry.fields.role ||
    entry.fields.name ||
    entry.fields.title ||
    '';
  const secondary =
    entry.fields.degree ||
    entry.fields.company ||
    entry.fields.tech ||
    entry.fields.issuer ||
    entry.fields.org ||
    '';
  const duration = entry.fields.duration || entry.fields.date || '';
  const extra =
    entry.fields.location || entry.fields.gpa || entry.fields.url || '';
  return { primary, secondary, duration, extra };
}

/**
 * Produce an editable PDF Blob (also triggers a download when `download` is
 * true). Returns the Blob so callers can preview, hash, or share it.
 */
export async function exportEditablePdf(
  resume: Resume,
  opts: { filename?: string; download?: boolean } = {},
): Promise<Blob> {
  const jspdfNs = await import('jspdf');
  const { jsPDF } = jspdfNs;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const ctx: LayoutContext = {
    doc,
    jspdfNs,
    pageWidth,
    pageHeight,
    margin,
    cursorY: margin,
    contentWidth: pageWidth - margin * 2,
  };

  // ---------------- Header ----------------
  const name = resume.personal.name || 'Your Name';
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(20);
  ctx.doc.setTextColor(20, 30, 60);
  ctx.doc.text(asciiSafe(name), pageWidth / 2, ctx.cursorY + 6, {
    align: 'center',
  });
  // Invisible editable name field over the rendered name.
  addEditableField(ctx, {
    name: 'personal.name',
    value: name,
    x: margin,
    y: ctx.cursorY,
    width: ctx.contentWidth,
    height: 8,
    fontSize: 14,
  });
  ctx.cursorY += 10;

  const contactParts = [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
    resume.personal.linkedin,
    resume.personal.github,
  ].filter(Boolean);
  if (contactParts.length) {
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setFontSize(9);
    ctx.doc.setTextColor(80, 80, 80);
    ctx.doc.text(asciiSafe(contactParts.join(' | ')), pageWidth / 2, ctx.cursorY, {
      align: 'center',
    });
    addEditableField(ctx, {
      name: 'personal.contact',
      value: contactParts.join(' | '),
      x: margin,
      y: ctx.cursorY - 3.5,
      width: ctx.contentWidth,
      height: 5,
      fontSize: 9,
    });
    ctx.cursorY += 4;
  }
  ctx.cursorY += 4;

  // ---------------- Summary ----------------
  if (resume.summary && resume.summary.trim()) {
    drawHeading(ctx, 'Professional Summary');
    const yStart = ctx.cursorY - 2;
    drawText(ctx, resume.summary);
    const yEnd = ctx.cursorY;
    addEditableField(ctx, {
      name: 'summary',
      value: resume.summary,
      x: margin,
      y: yStart,
      width: ctx.contentWidth,
      height: Math.max(yEnd - yStart, 8),
      multiline: true,
    });
    ctx.cursorY += 2;
  }

  // ---------------- Sections ----------------
  const ordered = sortSections(resume.sections);
  let fieldCounter = 0;

  for (const section of ordered) {
    if (section.entries.length === 0) continue;
    const heading = HEADING_FOR[section.type] || section.heading;
    if (heading) drawHeading(ctx, heading);

    if (section.type === 'skills') {
      for (const entry of section.entries) {
        const cat = entry.fields.category || '';
        const list = entry.bullets.filter(Boolean).join(', ');
        if (!cat && !list) continue;
        const text = cat ? `${cat}: ${list}` : list;
        const yStart = ctx.cursorY - 1;
        drawText(ctx, text);
        const yEnd = ctx.cursorY;
        addEditableField(ctx, {
          name: `skills.${fieldCounter++}`,
          value: text,
          x: margin,
          y: yStart,
          width: ctx.contentWidth,
          height: Math.max(yEnd - yStart, 5),
        });
      }
      ctx.cursorY += 2;
      continue;
    }

    for (const entry of section.entries) {
      const { primary, secondary, duration, extra } = entryDescription(entry);
      ensureSpace(ctx, 14);

      if (primary || duration) {
        ctx.doc.setFont('helvetica', 'bold');
        ctx.doc.setFontSize(10.5);
        ctx.doc.setTextColor(20, 20, 20);
        ctx.doc.text(asciiSafe(primary), margin, ctx.cursorY);
        if (duration) {
          ctx.doc.setFont('helvetica', 'normal');
          ctx.doc.setFontSize(9);
          ctx.doc.setTextColor(80, 80, 80);
          ctx.doc.text(
            asciiSafe(duration),
            pageWidth - margin,
            ctx.cursorY,
            { align: 'right' },
          );
        }
        addEditableField(ctx, {
          name: `${section.type}.${fieldCounter}.primary`,
          value: primary,
          x: margin,
          y: ctx.cursorY - 3.5,
          width: ctx.contentWidth * 0.65,
          height: 5,
        });
        if (duration) {
          addEditableField(ctx, {
            name: `${section.type}.${fieldCounter}.duration`,
            value: duration,
            x: margin + ctx.contentWidth * 0.7,
            y: ctx.cursorY - 3.5,
            width: ctx.contentWidth * 0.3,
            height: 5,
          });
        }
        ctx.cursorY += 4.5;
      }

      if (secondary || extra) {
        ctx.doc.setFont('helvetica', 'italic');
        ctx.doc.setFontSize(9.5);
        ctx.doc.setTextColor(60, 60, 60);
        ctx.doc.text(asciiSafe(secondary), margin, ctx.cursorY);
        if (extra) {
          ctx.doc.setFont('helvetica', 'normal');
          ctx.doc.setFontSize(9);
          ctx.doc.text(asciiSafe(extra), pageWidth - margin, ctx.cursorY, {
            align: 'right',
          });
        }
        addEditableField(ctx, {
          name: `${section.type}.${fieldCounter}.secondary`,
          value: secondary,
          x: margin,
          y: ctx.cursorY - 3.5,
          width: ctx.contentWidth * 0.65,
          height: 5,
        });
        ctx.cursorY += 4;
      }

      if (entry.fields.description) {
        drawText(ctx, entry.fields.description, { size: 9.5, color: [60, 60, 60] });
      }
      if (entry.fields.coursework) {
        drawText(ctx, 'Relevant Coursework: ' + entry.fields.coursework, {
          size: 9,
          color: [80, 80, 80],
        });
      }

      for (let i = 0; i < entry.bullets.length; i++) {
        const b = entry.bullets[i];
        if (!b.trim()) continue;
        const yStart = ctx.cursorY - 1;
        drawText(ctx, '• ' + b, { size: 9.5, indent: 3 });
        const yEnd = ctx.cursorY;
        addEditableField(ctx, {
          name: `${section.type}.${fieldCounter}.bullet.${i}`,
          value: b,
          x: margin + 3,
          y: yStart,
          width: ctx.contentWidth - 3,
          height: Math.max(yEnd - yStart, 4.5),
          multiline: true,
        });
      }
      fieldCounter += 1;
      ctx.cursorY += 2;
    }
  }

  // ---------------- Output ----------------
  const blob = doc.output('blob') as Blob;
  if (opts.download !== false) {
    const filename = opts.filename || 'resume-editable.pdf';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  return blob;
}
