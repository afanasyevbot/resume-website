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
      children: [new TextRun({ text: 'I close deals. I build AI systems.', bold: true, size: 28 })],
    }),
  )
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Most reps can't build. Most builders can't sell. I've been on both sides, and I do both well.", italics: true, size: 18 })],
    }),
  )

  // Summary
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))
  children.push(
    new Paragraph({
      children: [new TextRun({ text: pkg.summary, size: 20 })],
    }),
  )

  // Stat highlights
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '#1', bold: true, size: 22 }),
        new TextRun({ text: ' of 30 AEs · Q1 2026    ', size: 18 }),
        new TextRun({ text: '102.6%', bold: true, size: 22 }),
        new TextRun({ text: ' FY25 Attainment    ', size: 18 }),
        new TextRun({ text: '58%', bold: true, size: 22 }),
        new TextRun({ text: ' ARR Growth · FY24    ', size: 18 }),
        new TextRun({ text: '5', bold: true, size: 22 }),
        new TextRun({ text: ' AI Systems Deployed', size: 18 }),
      ],
    }),
  )

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

  // Core Skills
  children.push(sectionHeading('CORE SKILLS'))
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'SALES  ', bold: true, size: 18 }),
        new TextRun({ text: 'Full-Cycle SaaS Sales, Consultative Discovery, Multithreading, Value & ROI Selling, New Business Acquisition, Account Expansion & Upsell, Pipeline Building from Zero, Contract Negotiation', size: 18 }),
      ],
    }),
  )
  children.push(
    new Paragraph({
      spacing: { before: 60 },
      children: [
        new TextRun({ text: 'AI & TECH  ', bold: true, size: 18 }),
        new TextRun({ text: 'Claude API & Agent SDK, RAG / pgvector, Next.js, Supabase / Postgres, Stripe, Playwright, Apollo, Salesforce, Power BI', size: 18 }),
      ],
    }),
  )

  // Education
  children.push(sectionHeading('EDUCATION'))
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'BBA, Marketing Management', bold: true, size: 20 }),
        new TextRun({ text: '  ·  University of St. Thomas    2017 - 2021', size: 18 }),
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
