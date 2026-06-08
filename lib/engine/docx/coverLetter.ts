import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx'
import type { ProfessionalContext } from '@/lib/types'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'

/**
 * Build a DOCX cover letter for a tailored role.
 * Format: header (name + contact), date, recipient, body, close.
 * The body is pkg.coverLetter — no salutation/closing is included in that field,
 * so we wrap it with "Dear Hiring Team," and a standard sign-off.
 */
export async function buildCoverLetterDocx(
  pkg: TailoredPackage,
  context: ProfessionalContext,
  role: { company: string; title: string },
): Promise<Buffer> {
  const { identity } = context

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const children: Paragraph[] = []

  // Header — name
  children.push(
    new Paragraph({
      children: [new TextRun({ text: identity.name, bold: true, size: 28 })],
    }),
  )
  // Contact line
  children.push(
    new Paragraph({
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

  // Date
  children.push(
    new Paragraph({
      children: [new TextRun({ text: today, size: 22 })],
    }),
  )

  // Spacer
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

  // Recipient
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Hiring Team, ${role.company}`, size: 22 })],
    }),
  )

  // Spacer
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

  // Salutation
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Dear Hiring Team,', size: 22 })],
    }),
  )

  // Spacer
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

  // Body — split coverLetter on blank lines into paragraphs
  const bodyParas = pkg.coverLetter
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  for (const p of bodyParas) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: p, size: 22 })],
      }),
    )
  }

  // Close
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Best,', size: 22 })],
    }),
  )
  children.push(
    new Paragraph({
      children: [new TextRun({ text: identity.name, size: 22 })],
    }),
  )

  const doc = new Document({
    creator: identity.name,
    title: `${identity.name} — Cover Letter — ${role.company}`,
    sections: [{ children }],
  })

  return Packer.toBuffer(doc)
}
