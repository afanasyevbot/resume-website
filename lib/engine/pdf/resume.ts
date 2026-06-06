import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { professionalContext } from '@/lib/professionalContext'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'

const MARGIN = 50
const PAGE_W = 612 // US Letter
const PAGE_H = 792
const CONTENT_W = PAGE_W - MARGIN * 2

const DARK = rgb(0.11, 0.09, 0.06) // #1c1810
const MID = rgb(0.35, 0.30, 0.20) // #594d34
const GOLD = rgb(0.54, 0.43, 0.23) // #8a6d3b

/**
 * Build an ATS-safe single-column PDF resume from the tailored package +
 * Matthew's canonical profile. Embeds standard fonts (no custom font embedding)
 * so every ATS parser can read it.
 */
export async function buildResumePdf(
  pkg: TailoredPackage,
  role: { company: string; title: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman)
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold)
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic)

  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  const ctx = professionalContext

  // ── Helpers ────────────────────────────────────────────────────────

  function drawText(
    text: string,
    options: { font?: typeof fontRegular; size?: number; color?: typeof DARK; x?: number; maxWidth?: number },
  ) {
    const font = options.font ?? fontRegular
    const size = options.size ?? 10
    const color = options.color ?? DARK
    const x = options.x ?? MARGIN
    const maxWidth = options.maxWidth ?? CONTENT_W

    // Word-wrap
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
        y -= size * 1.4
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
      y -= size * 1.4
    }
  }

  function heading(text: string) {
    y -= 6
    drawText(text.toUpperCase(), { font: fontBold, size: 10, color: GOLD })
    // Thin line under heading
    y += 2
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.82, 0.76, 0.65),
    })
    y -= 8
  }

  function gap(px = 8) {
    y -= px
  }

  // ── Header ─────────────────────────────────────────────────────────

  drawText(ctx.identity.name, { font: fontBold, size: 18, color: DARK })
  gap(2)
  drawText(
    `${ctx.identity.email}  |  ${ctx.identity.phone}  |  ${ctx.identity.linkedin}`,
    { size: 9, color: MID },
  )
  if (ctx.identity.websites.length > 0) {
    drawText(ctx.identity.websites.join('  |  '), { size: 9, color: MID })
  }
  gap(4)

  // ── Summary (tailored) ─────────────────────────────────────────────

  heading('Summary')
  drawText(pkg.summary, { size: 10 })
  gap(4)

  // ── Experience ─────────────────────────────────────────────────────

  heading('Experience')
  const topRoles = ctx.roles.slice(0, 3)
  for (let i = 0; i < topRoles.length; i++) {
    const r = topRoles[i]
    drawText(`${r.title}`, { font: fontBold, size: 10 })
    drawText(`${r.company}  |  ${r.dates}`, { font: fontItalic, size: 9, color: MID })
    gap(2)

    // Use tailored bullets for the first (current) role
    const bullets = i === 0 ? (pkg.emphasizedBullets ?? r.bullets) : r.bullets
    for (const bullet of bullets.slice(0, 4)) {
      drawText(`•  ${bullet}`, { size: 9.5, x: MARGIN + 10, maxWidth: CONTENT_W - 10 })
    }
    gap(6)
  }

  // ── Skills ─────────────────────────────────────────────────────────

  heading('Skills')
  drawText(`Deep: ${ctx.skills.deep.join(', ')}`, { size: 9 })
  gap(2)
  drawText(`Conversant: ${ctx.skills.conversant.join(', ')}`, { size: 9 })
  gap(4)

  // ── Education ──────────────────────────────────────────────────────

  heading('Education')
  drawText(ctx.identity.education, { size: 9.5 })
  if (ctx.identity.firstGenGrad) {
    drawText('First-generation college graduate', { font: fontItalic, size: 8.5, color: MID })
  }

  // ── Serialize ──────────────────────────────────────────────────────

  return doc.save()
}
