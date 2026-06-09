import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { professionalContext } from '@/lib/professionalContext'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'

const MARGIN = 48
const PAGE_W = 612
const PAGE_H = 792
const CONTENT_W = PAGE_W - MARGIN * 2

const DARK = rgb(0.11, 0.09, 0.06)
const MID = rgb(0.35, 0.30, 0.20)
const GREEN = rgb(0.25, 0.42, 0.17)
const FAINT = rgb(0.55, 0.50, 0.42)

/**
 * Build an ATS-safe resume PDF matching Matthew's master format:
 * Name, REVENUE x AI tagline, stat boxes, all roles, AI Systems Built,
 * SALES / AI & TECH skills, education.
 */
export async function buildResumePdf(
  pkg: TailoredPackage,
  role: { company: string; title: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique)

  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  const ctx = professionalContext

  function ensureSpace(needed: number) {
    if (y < MARGIN + needed) {
      page = doc.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - MARGIN
    }
  }

  function drawText(
    text: string,
    options: {
      font?: typeof fontRegular
      size?: number
      color?: typeof DARK
      x?: number
      maxWidth?: number
      lineHeight?: number
    },
  ) {
    const font = options.font ?? fontRegular
    const size = options.size ?? 9.5
    const color = options.color ?? DARK
    const x = options.x ?? MARGIN
    const maxWidth = options.maxWidth ?? CONTENT_W
    const lh = options.lineHeight ?? size * 1.35

    const words = text.split(/\s+/)
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        ensureSpace(20)
        page.drawText(line, { x, y, size, font, color })
        y -= lh
        line = word
      } else {
        line = test
      }
    }
    if (line) {
      ensureSpace(20)
      page.drawText(line, { x, y, size, font, color })
      y -= lh
    }
  }

  function drawTextCentered(
    text: string,
    options: { font?: typeof fontRegular; size?: number; color?: typeof DARK },
  ) {
    const font = options.font ?? fontRegular
    const size = options.size ?? 10
    const color = options.color ?? DARK
    const tw = font.widthOfTextAtSize(text, size)
    const x = MARGIN + (CONTENT_W - tw) / 2
    ensureSpace(20)
    page.drawText(text, { x, y, size, font, color })
    y -= size * 1.35
  }

  function sectionHeading(text: string) {
    y -= 10
    ensureSpace(24)
    const size = 8
    const label = text.toUpperCase().split('').join(' ')
    page.drawText(label, { x: MARGIN, y, size, font: fontBold, color: GREEN })
    y -= 3
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 1.2,
      color: GREEN,
    })
    y -= 10
  }

  function gap(px = 6) {
    y -= px
  }

  // ── Header ──────────────────────────────────────────────────────────

  drawTextCentered('MATTHEW AFANASIEV', { font: fontBold, size: 22, color: DARK })
  gap(1)
  drawTextCentered('R E V E N U E  x  A I', { font: fontBold, size: 7.5, color: GREEN })
  gap(0)
  drawTextCentered('Account Executive & AI Systems Builder', { font: fontItalic, size: 10, color: MID })
  gap(1)
  drawTextCentered(
    `${ctx.identity.phone}  ·  ${ctx.identity.email}  ·  ${ctx.identity.linkedin}  ·  fidelisstrategy.net  ·  matthew-afanasiev.vercel.app`,
    { size: 7.5, color: FAINT },
  )
  gap(12)

  // ── Headline + Summary ──────────────────────────────────────────────

  drawTextCentered('I close deals. I build AI systems.', { font: fontBold, size: 14, color: DARK })
  gap(1)
  drawTextCentered(
    "Most reps can't build. Most builders can't sell. I've been on both sides, and I do both well.",
    { font: fontItalic, size: 8.5, color: MID },
  )
  gap(6)

  drawText(pkg.summary, { size: 9, color: MID, lineHeight: 12 })
  gap(8)

  // ── Stat Boxes ──────────────────────────────────────────────────────

  const stats = ctx.resumeStats
  const boxW = CONTENT_W / 4
  const boxH = 36
  const boxY = y - boxH

  ensureSpace(boxH + 10)
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.82, 0.78, 0.72),
  })

  for (let i = 0; i < stats.length; i++) {
    const bx = MARGIN + i * boxW
    const s = stats[i]
    const bigSize = 16
    const bigW = fontBold.widthOfTextAtSize(s.big, bigSize)
    page.drawText(s.big, {
      x: bx + (boxW - bigW) / 2,
      y: boxY + 18,
      size: bigSize,
      font: fontBold,
      color: DARK,
    })
    const subSize = 5.5
    const subW = fontRegular.widthOfTextAtSize(s.sub, subSize)
    page.drawText(s.sub, {
      x: bx + (boxW - subW) / 2,
      y: boxY + 8,
      size: subSize,
      font: fontRegular,
      color: FAINT,
    })
    if (i < stats.length - 1) {
      page.drawLine({
        start: { x: bx + boxW, y: y - 4 },
        end: { x: bx + boxW, y: boxY + 4 },
        thickness: 0.4,
        color: rgb(0.82, 0.78, 0.72),
      })
    }
  }
  page.drawLine({
    start: { x: MARGIN, y: boxY + 2 },
    end: { x: PAGE_W - MARGIN, y: boxY + 2 },
    thickness: 0.5,
    color: rgb(0.82, 0.78, 0.72),
  })
  y = boxY - 4

  // ── Experience ──────────────────────────────────────────────────────

  sectionHeading('EXPERIENCE')

  for (let i = 0; i < ctx.roles.length; i++) {
    const r = ctx.roles[i]
    ensureSpace(50)

    // Title + dates on same line
    const titleSize = 9.5
    const titleW = fontBold.widthOfTextAtSize(r.title, titleSize)
    page.drawText(r.title, { x: MARGIN, y, size: titleSize, font: fontBold, color: DARK })
    const dateSize = 8.5
    const dateW = fontRegular.widthOfTextAtSize(r.dates, dateSize)
    page.drawText(r.dates, {
      x: PAGE_W - MARGIN - dateW,
      y: y + 0.5,
      size: dateSize,
      font: fontRegular,
      color: FAINT,
    })
    y -= 12

    // Company (green)
    page.drawText(r.company, { x: MARGIN, y, size: 8.5, font: fontBold, color: GREEN })

    // Concurrent tag for Fidelis
    if (r.company === 'Fidelis Strategy LLC') {
      const compW = fontBold.widthOfTextAtSize(r.company, 8.5)
      page.drawText('  (concurrent)', { x: MARGIN + compW, y, size: 8.5, font: fontItalic, color: FAINT })
    }
    y -= 11

    // Bullets — use tailored bullets for first role
    const bullets = i === 0 ? (pkg.emphasizedBullets.length > 0 ? pkg.emphasizedBullets : r.bullets) : r.bullets
    for (const bullet of bullets) {
      ensureSpace(24)
      const bulletX = MARGIN + 8
      page.drawText('•', { x: MARGIN, y: y + 1, size: 5, font: fontRegular, color: GREEN })
      drawText(bullet, { size: 8.5, x: bulletX, maxWidth: CONTENT_W - 8, lineHeight: 11 })
      gap(1)
    }
    gap(6)
  }

  // ── AI Systems Built ────────────────────────────────────────────────

  sectionHeading('AI SYSTEMS BUILT')

  const topProjects = ctx.projects.slice(0, 3)
  for (const proj of topProjects) {
    ensureSpace(40)
    // Project name bold + badge
    const nameSize = 9
    page.drawText(proj.name, { x: MARGIN + 4, y, size: nameSize, font: fontBold, color: DARK })
    if (proj.badge) {
      const nw = fontBold.widthOfTextAtSize(proj.name, nameSize)
      page.drawText(`  ${proj.badge.toUpperCase()}`, {
        x: MARGIN + 4 + nw + 4,
        y,
        size: 6.5,
        font: fontBold,
        color: GREEN,
      })
    }
    y -= 11

    // Description
    drawText(proj.description, { size: 8, x: MARGIN + 4, maxWidth: CONTENT_W - 8, color: MID, lineHeight: 10.5 })
    gap(1)

    // Stack
    const stackStr = proj.stack.join('  ·  ')
    drawText(stackStr, { size: 7, x: MARGIN + 4, maxWidth: CONTENT_W - 8, color: FAINT, lineHeight: 9 })
    gap(6)
  }

  // ── Core Skills ─────────────────────────────────────────────────────

  sectionHeading('CORE SKILLS')

  for (let si = 0; si < ctx.resumeSkills.length; si++) {
    const skill = ctx.resumeSkills[si]
    ensureSpace(20)
    page.drawText(skill.category, { x: MARGIN, y, size: 7, font: fontBold, color: DARK })
    const labelW = fontBold.widthOfTextAtSize(skill.category, 7)
    drawText(skill.items, { size: 8, x: MARGIN + labelW + 6, maxWidth: CONTENT_W - labelW - 6, color: MID, lineHeight: 10.5 })
    gap(si < ctx.resumeSkills.length - 1 ? 3 : 4)
  }

  // ── Education ───────────────────────────────────────────────────────

  sectionHeading('EDUCATION')
  ensureSpace(16)
  // Parse education: "BBA, Marketing Management, University of St. Thomas, 2017–2021"
  const eduParts = ctx.identity.education.split(',').map((s) => s.trim())
  const eduDegree = eduParts.slice(0, 2).join(', ')
  const eduSchool = eduParts[2] ?? ''
  const eduYears = (eduParts[3] ?? '').replace('–', ' - ')
  page.drawText(eduDegree, { x: MARGIN, y, size: 9, font: fontBold, color: DARK })
  if (eduYears) {
    const eduDateW = fontRegular.widthOfTextAtSize(eduYears, 8.5)
    page.drawText(eduYears, {
      x: PAGE_W - MARGIN - eduDateW,
      y: y + 0.5,
      size: 8.5,
      font: fontRegular,
      color: FAINT,
    })
  }
  y -= 12
  if (eduSchool) {
    page.drawText(eduSchool, { x: MARGIN, y, size: 8.5, font: fontRegular, color: MID })
  }

  return doc.save()
}
