import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'
import type { ProfessionalContext, Role } from '@/lib/types'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'

/**
 * Build a single-column ATS-friendly DOCX resume tailored to a specific role.
 *
 * V1 only renders the "classic" archetype — single column, plain typography —
 * because that's what survives ATS parsing reliably. The Revenue × AI two-column
 * archetype is not attempted here.
 *
 * The tailored bullets from the package REPLACE the bullets of the current role
 * (context.roles[0]); other roles keep their original bullets. We render at most
 * the top 3 most recent roles to keep the resume to a sensible length.
 */
export async function buildResumeDocx(
  pkg: TailoredPackage,
  context: ProfessionalContext,
  _role: { company: string; title: string },
): Promise<Buffer> {
  const { identity, roles, skills } = context

  // Top 3 most recent roles (context.roles is already in reverse-chronological order).
  // Current role (index 0) gets its bullets replaced by the tailored ones.
  const topRoles: Role[] = roles.slice(0, 3)
  const renderedRoles = topRoles.map((r, i) =>
    i === 0
      ? { ...r, bullets: pkg.emphasizedBullets.length > 0 ? pkg.emphasizedBullets : r.bullets }
      : r,
  )

  const children: Paragraph[] = []

  // Header — name centered, large
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: identity.name, bold: true, size: 36 })],
    }),
  )

  // Contact line — email · phone · linkedin
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: identity.email, size: 20 }),
        new TextRun({ text: '  ·  ', size: 20 }),
        new TextRun({ text: identity.phone, size: 20 }),
        new TextRun({ text: '  ·  ', size: 20 }),
        new TextRun({ text: identity.linkedin, size: 20 }),
      ],
    }),
  )

  // Spacer
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

  // Summary
  children.push(sectionHeading('SUMMARY'))
  children.push(
    new Paragraph({
      children: [new TextRun({ text: pkg.summary, size: 22 })],
    }),
  )

  // Experience
  children.push(sectionHeading('EXPERIENCE'))
  for (const r of renderedRoles) {
    // Role title + company
    children.push(
      new Paragraph({
        spacing: { before: 160 },
        children: [
          new TextRun({ text: r.title, bold: true, size: 22 }),
          new TextRun({ text: '  —  ', size: 22 }),
          new TextRun({ text: r.company, size: 22 }),
        ],
      }),
    )
    // Dates (italic, smaller)
    children.push(
      new Paragraph({
        children: [new TextRun({ text: r.dates, italics: true, size: 20 })],
      }),
    )
    // Bullets
    for (const b of r.bullets) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: b, size: 22 })],
        }),
      )
    }
  }

  // Skills
  children.push(sectionHeading('SKILLS'))
  children.push(
    new Paragraph({
      children: [new TextRun({ text: skills.deep.join(' · '), size: 22 })],
    }),
  )

  // Education
  children.push(sectionHeading('EDUCATION'))
  children.push(
    new Paragraph({
      children: [new TextRun({ text: identity.education, size: 22 })],
    }),
  )

  const doc = new Document({
    creator: identity.name,
    title: `${identity.name} — Resume`,
    sections: [{ children }],
  })

  return Packer.toBuffer(doc)
}

function sectionHeading(label: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 80 },
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text: label, bold: true, size: 24 })],
  })
}
