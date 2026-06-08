import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { professionalContext } from '@/lib/professionalContext'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'

const MARGIN = 60
const PAGE_W = 612
const PAGE_H = 792
const CONTENT_W = PAGE_W - MARGIN * 2

const DARK = rgb(0.11, 0.09, 0.06)
const MID = rgb(0.35, 0.30, 0.20)

/**
 * Build a cover letter PDF in standard business letter format.
 */
export async function buildCoverLetterPdf(
  pkg: TailoredPackage,
  role: { company: string; title: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman)
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold)

  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  const ctx = professionalContext

  function drawText(
    text: string,
    options: { font?: typeof fontRegular; size?: number; color?: typeof DARK; x?: number; maxWidth?: number },
  ) {
    const font = options.font ?? fontRegular
    const size = options.size ?? 11
    const color = options.color ?? DARK
    const x = options.x ?? MARGIN
    const maxWidth = options.maxWidth ?? CONTENT_W

    const words = text.split(/\s+/)
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        if (y < MARGIN + 20) {
          page = doc.addPage([PAGE_W, PAGE_H])
          y = PAGE_H - MARGIN
        }
        page.drawText(line, { x, y, size, font, color })
        y -= size * 1.5
        line = word
      } else {
        line = test
      }
    }
    if (line) {
      if (y < MARGIN + 20) {
        page = doc.addPage([PAGE_W, PAGE_H])
        y = PAGE_H - MARGIN
      }
      page.drawText(line, { x, y, size, font, color })
      y -= size * 1.5
    }
  }

  function gap(px = 12) {
    y -= px
  }

  // ── Header ─────────────────────────────────────────────────────────

  drawText(ctx.identity.name, { font: fontBold, size: 14 })
  drawText(`${ctx.identity.email}  |  ${ctx.identity.phone}`, { size: 9, color: MID })
  drawText(ctx.identity.linkedin, { size: 9, color: MID })
  gap(18)

  // ── Date ───────────────────────────────────────────────────────────

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  drawText(today, { size: 10, color: MID })
  gap(12)

  // ── Recipient ──────────────────────────────────────────────────────

  drawText(`Hiring Team`, { font: fontBold, size: 10 })
  drawText(role.company, { size: 10 })
  gap(16)

  // ── Body ───────────────────────────────────────────────────────────

  // Split cover letter into paragraphs and render each with spacing
  const paragraphs = pkg.coverLetter.split(/\n\n+/).filter((p) => p.trim())
  for (const para of paragraphs) {
    drawText(para.trim(), { size: 10.5 })
    gap(8)
  }

  gap(8)

  // ── Close ──────────────────────────────────────────────────────────

  drawText('Best,', { size: 10.5 })
  gap(4)
  drawText(ctx.identity.name, { font: fontBold, size: 10.5 })

  return doc.save()
}
