import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'
import type { ProfessionalContext } from '@/lib/types'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'
import {
  PERSONAL_SIGNATURE,
  RESUME_HEADLINE,
  archetypeToVariant,
  contactLine,
  resumeVariants,
  type ResumeProjectBlock,
} from '@/lib/resumeContent'

export async function buildResumeDocx(
  pkg: TailoredPackage,
  _context: ProfessionalContext,
  role: { company: string; title: string },
): Promise<Buffer> {
  const variant = archetypeToVariant(pkg.archetype)
  const content = resumeVariants[variant]
  const children: Paragraph[] = []

  if (role.company && role.title) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${role.company.toUpperCase()} · ${role.title.toUpperCase()}`,
            bold: true,
            size: 14,
            color: '888888',
          }),
        ],
      }),
    )
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: 'MATTHEW AFANASIEV', bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: RESUME_HEADLINE, bold: true, size: 18, color: '1E4D32' })],
    }),
    ...contactLine()
      .split('\n')
      .map(
        (line) =>
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: line, size: 14, color: '888888' })],
          }),
      ),
    new Paragraph({ children: [new TextRun({ text: '' })] }),
    new Paragraph({
      children: [new TextRun({ text: pkg.summary || content.summary, size: 20 })],
    }),
  )

  children.push(sectionHeading('PROFESSIONAL EXPERIENCE'))
  for (let i = 0; i < content.roles.length; i++) {
    const r = content.roles[i]
    const bullets = i === 0 && pkg.emphasizedBullets.length > 0 ? pkg.emphasizedBullets : r.bullets
    children.push(
      new Paragraph({
        spacing: { before: 160 },
        children: [
          new TextRun({ text: r.company, bold: true, size: 22 }),
          new TextRun({ text: `    ${r.dates}`, size: 18, color: '888888' }),
        ],
      }),
    )
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: r.title, bold: true, size: 18, color: '1E4D32' }),
          ...(r.concurrent ? [new TextRun({ text: '  (concurrent)', italics: true, size: 18, color: '888888' })] : []),
        ],
      }),
    )
    for (const b of bullets) {
      children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: b, size: 20 })] }))
    }
  }

  children.push(sectionHeading('AI PRODUCTS & SYSTEMS BUILT'))
  for (const proj of content.projects) children.push(...projectParagraphs(proj))

  children.push(sectionHeading('SKILLS'))
  for (const skill of content.skills) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${skill.category}: `, bold: true, size: 18 }),
          new TextRun({ text: skill.items, size: 18 }),
        ],
      }),
    )
  }

  children.push(sectionHeading('EDUCATION'))
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'BBA, Marketing Management', bold: true, size: 20 }),
        new TextRun({ text: '  ·  University of St. Thomas    2017 - 2021', size: 18 }),
      ],
    }),
  )
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240 },
      children: [new TextRun({ text: PERSONAL_SIGNATURE, size: 18 })],
    }),
  )

  const doc = new Document({
    creator: 'Matthew Afanasiev',
    title: 'Matthew Afanasiev — Resume',
    sections: [{ children }],
  })

  return Packer.toBuffer(doc)
}

function projectParagraphs(proj: ResumeProjectBlock): Paragraph[] {
  const description = proj.stack ? `${proj.description} Built with ${proj.stack.replaceAll(' · ', ', ')}.` : proj.description
  return [
    new Paragraph({
      spacing: { before: 120 },
      children: [new TextRun({ text: proj.name, bold: true, size: 20 })],
    }),
    new Paragraph({ children: [new TextRun({ text: description, size: 18 })] }),
  ]
}

function sectionHeading(label: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 80 },
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text: label, bold: true, size: 22, color: '1E4D32' })],
  })
}
