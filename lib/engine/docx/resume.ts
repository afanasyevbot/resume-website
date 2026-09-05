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
 * Build a DOCX resume matching Matthew's master format:
 * Name + tagline, summary, stat highlights, ALL roles, AI Systems Built,
 * SALES / AI & TECH skills, education.
 */
export async function buildResumeDocx(
  pkg: TailoredPackage,
  context: ProfessionalContext,
  _role: { company: string; title: string },
): Promise<Buffer> {
  const { identity, roles, skills, projects } = context

  const renderedRoles: Role[] = roles.map((r, i) =>
    i === 0
      ? { ...r, bullets: pkg.emphasizedBullets.length > 0 ? pkg.emphasizedBullets : r.bullets }
      : r,
  )

  const children: Paragraph[] = []

  // Header — name centered
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: identity.name, bold: true, size: 36 })],
    }),
  )

  // Tagline
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'REVENUE x AI', bold: true, size: 16, color: '3F6A2C' })],
    }),
  )

  // Subtitle
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Account Executive & AI Systems Builder', italics: true, size: 20 })],
    }),
  )

  // Contact line
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `${identity.phone}  ·  ${identity.email}  ·  ${identity.linkedin}  ·  fidelisstrategy.net  ·  matthew-afanasiev.vercel.app`, size: 16 }),
      ],
    }),
  )

  // Spacer
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

  // Headline
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'I sell by guiding the buyer.', bold: true, size: 28 })],
    }),
  )
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Prescriptive B2B SaaS selling. I've been on both sides, and I do both well.", italics: true, size: 18 })],
    }),
  )

  // Summary
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))
  children.push(
    new Paragraph({
      children: [new TextRun({ text: pkg.summary, size: 20 })],
    }),
  )

  // Stat highlights (from context)
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))
  const statRuns: TextRun[] = []
  for (let si = 0; si < context.resumeStats.length; si++) {
    const s = context.resumeStats[si]
    statRuns.push(new TextRun({ text: s.big, bold: true, size: 22 }))
    statRuns.push(new TextRun({ text: ` ${s.sub}${si < context.resumeStats.length - 1 ? '    ' : ''}`, size: 18 }))
  }
  children.push(new Paragraph({ children: statRuns }))

  // Experience — all roles
  children.push(sectionHeading('EXPERIENCE'))
  for (const r of renderedRoles) {
    children.push(
      new Paragraph({
        spacing: { before: 160 },
        children: [
          new TextRun({ text: r.title, bold: true, size: 22 }),
          new TextRun({ text: `    ${r.dates}`, size: 18, color: '888888' }),
        ],
      }),
    )
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: r.company, bold: true, size: 18, color: '3F6A2C' }),
          ...(r.company === 'Fidelis Strategy LLC'
            ? [new TextRun({ text: '  (concurrent)', italics: true, size: 18, color: '888888' })]
            : []),
        ],
      }),
    )
    for (const b of r.bullets) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: b, size: 20 })],
        }),
      )
    }
  }

  // AI Systems Built
  children.push(sectionHeading('AI SYSTEMS BUILT'))
  const topProjects = projects.slice(0, 3)
  for (const proj of topProjects) {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({ text: proj.name, bold: true, size: 20 }),
          ...(proj.badge ? [new TextRun({ text: `  ${proj.badge.toUpperCase()}`, bold: true, size: 14, color: '3F6A2C' })] : []),
        ],
      }),
    )
    children.push(
      new Paragraph({
        children: [new TextRun({ text: proj.description, size: 18 })],
      }),
    )
    children.push(
      new Paragraph({
        children: [new TextRun({ text: proj.stack.join('  ·  '), size: 16, color: '888888' })],
      }),
    )
  }

  // Core Skills (from context)
  children.push(sectionHeading('CORE SKILLS'))
  for (let si = 0; si < context.resumeSkills.length; si++) {
    const skill = context.resumeSkills[si]
    children.push(
      new Paragraph({
        ...(si > 0 ? { spacing: { before: 60 } } : {}),
        children: [
          new TextRun({ text: `${skill.category}  `, bold: true, size: 18 }),
          new TextRun({ text: skill.items, size: 18 }),
        ],
      }),
    )
  }

  // Education (from context)
  children.push(sectionHeading('EDUCATION'))
  const eduParts = identity.education.split(',').map((s: string) => s.trim())
  const eduDegree = eduParts.slice(0, 2).join(', ')
  const eduSchool = eduParts[2] ?? ''
  const eduYears = eduParts[3] ?? ''
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: eduDegree, bold: true, size: 20 }),
        new TextRun({ text: `  ·  ${eduSchool}${eduYears ? `    ${eduYears}` : ''}`, size: 18 }),
      ],
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
    children: [new TextRun({ text: label, bold: true, size: 22, color: '3F6A2C' })],
  })
}
