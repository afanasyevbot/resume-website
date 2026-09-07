import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from 'pdf-lib'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'
import {
  archetypeToVariant,
  contactLine,
  resumeVariants,
  type ResumeProjectBlock,
  type ResumeRoleBlock,
  type ResumeVariant,
} from '@/lib/resumeContent'

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 48
const CONTENT_W = PAGE_W - MARGIN * 2
const SIDEBAR_W = 148
const MAIN_X = MARGIN + SIDEBAR_W + 14
const MAIN_W = PAGE_W - MAIN_X - MARGIN

const DARK = rgb(0.11, 0.09, 0.06)
const MID = rgb(0.35, 0.30, 0.20)
const GREEN = rgb(0.12, 0.30, 0.20)
const FAINT = rgb(0.55, 0.50, 0.42)
const RULE = rgb(0.82, 0.78, 0.72)

type Color = ReturnType<typeof rgb>

interface PdfCtx {
  doc: PDFDocument
  page: PDFPage
  y: number
  fontRegular: PDFFont
  fontBold: PDFFont
  fontItalic: PDFFont
}

function makeCtx(doc: PDFDocument, page: PDFPage, fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont }): PdfCtx {
  return {
    doc,
    page,
    y: PAGE_H - MARGIN,
    fontRegular: fonts.regular,
    fontBold: fonts.bold,
    fontItalic: fonts.italic,
  }
}

function ensureSpace(ctx: PdfCtx, needed: number, margin = MARGIN) {
  if (ctx.y >= margin + needed) return
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H])
  ctx.y = PAGE_H - margin
}

function drawWrapped(
  ctx: PdfCtx,
  text: string,
  opts: {
    x?: number
    maxWidth?: number
    size?: number
    font?: PDFFont
    color?: Color
    lineHeight?: number
    margin?: number
  },
) {
  const font = opts.font ?? ctx.fontRegular
  const size = opts.size ?? 9
  const color = opts.color ?? DARK
  const x = opts.x ?? MARGIN
  const maxWidth = opts.maxWidth ?? CONTENT_W
  const lh = opts.lineHeight ?? size * 1.35
  const margin = opts.margin ?? MARGIN

  const words = text.split(/\s+/)
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      ensureSpace(ctx, lh + 4, margin)
      ctx.page.drawText(line, { x, y: ctx.y, size, font, color })
      ctx.y -= lh
      line = word
    } else {
      line = test
    }
  }
  if (line) {
    ensureSpace(ctx, lh + 4, margin)
    ctx.page.drawText(line, { x, y: ctx.y, size, font, color })
    ctx.y -= lh
  }
}

function drawCentered(
  ctx: PdfCtx,
  text: string,
  opts: { font?: PDFFont; size?: number; color?: Color; width?: number },
) {
  const font = opts.font ?? ctx.fontRegular
  const size = opts.size ?? 10
  const color = opts.color ?? DARK
  const width = opts.width ?? CONTENT_W
  const tw = font.widthOfTextAtSize(text, size)
  ensureSpace(ctx, size * 1.5)
  ctx.page.drawText(text, { x: MARGIN + (width - tw) / 2, y: ctx.y, size, font, color })
  ctx.y -= size * 1.35
}

function sectionHeading(ctx: PdfCtx, text: string, x = MARGIN, width = CONTENT_W) {
  ctx.y -= 8
  ensureSpace(ctx, 22)
  const size = 7
  const label = text.toUpperCase().split('').join(' ')
  ctx.page.drawText(label, { x, y: ctx.y, size, font: ctx.fontBold, color: GREEN })
  ctx.y -= 3
  ctx.page.drawLine({
    start: { x, y: ctx.y },
    end: { x: x + width, y: ctx.y },
    thickness: 1,
    color: GREEN,
  })
  ctx.y -= 9
}

function drawStats(ctx: PdfCtx, stats: { big: string; sub: string }[], x = MARGIN, width = CONTENT_W) {
  const boxW = width / stats.length
  const boxH = 34
  const boxY = ctx.y - boxH
  ensureSpace(ctx, boxH + 8)
  ctx.page.drawLine({ start: { x, y: ctx.y }, end: { x: x + width, y: ctx.y }, thickness: 0.5, color: RULE })
  for (let i = 0; i < stats.length; i++) {
    const bx = x + i * boxW
    const s = stats[i]
    const bigSize = 15
    const bigW = ctx.fontBold.widthOfTextAtSize(s.big, bigSize)
    ctx.page.drawText(s.big, {
      x: bx + (boxW - bigW) / 2,
      y: boxY + 17,
      size: bigSize,
      font: ctx.fontBold,
      color: DARK,
    })
    const subSize = 5.2
    const subW = ctx.fontRegular.widthOfTextAtSize(s.sub, subSize)
    ctx.page.drawText(s.sub, {
      x: bx + (boxW - subW) / 2,
      y: boxY + 7,
      size: subSize,
      font: ctx.fontRegular,
      color: FAINT,
    })
    if (i < stats.length - 1) {
      ctx.page.drawLine({
        start: { x: bx + boxW, y: ctx.y - 3 },
        end: { x: bx + boxW, y: boxY + 3 },
        thickness: 0.4,
        color: RULE,
      })
    }
  }
  ctx.page.drawLine({ start: { x, y: boxY + 2 }, end: { x: x + width, y: boxY + 2 }, thickness: 0.5, color: RULE })
  ctx.y = boxY - 6
}

function drawRole(ctx: PdfCtx, role: ResumeRoleBlock, x = MARGIN, width = CONTENT_W, firstRoleBullets?: string[]) {
  ensureSpace(ctx, 40)
  const titleSize = 9
  ctx.page.drawText(role.title, { x, y: ctx.y, size: titleSize, font: ctx.fontBold, color: DARK })
  const dateSize = 8
  const dateW = ctx.fontRegular.widthOfTextAtSize(role.dates, dateSize)
  ctx.page.drawText(role.dates, {
    x: x + width - dateW,
    y: ctx.y + 0.5,
    size: dateSize,
    font: ctx.fontRegular,
    color: FAINT,
  })
  ctx.y -= 11
  const companyLabel = role.concurrent ? `${role.company} (concurrent)` : role.company
  ctx.page.drawText(companyLabel, { x, y: ctx.y, size: 8.5, font: ctx.fontBold, color: GREEN })
  ctx.y -= 10
  const bullets = firstRoleBullets ?? role.bullets
  for (const bullet of bullets) {
    ensureSpace(ctx, 20)
    ctx.page.drawText('•', { x, y: ctx.y + 1, size: 5, font: ctx.fontRegular, color: GREEN })
    drawWrapped(ctx, bullet, { x: x + 8, maxWidth: width - 8, size: 8.2, color: MID, lineHeight: 10.5 })
    ctx.y -= 2
  }
  ctx.y -= 4
}

function drawProject(ctx: PdfCtx, proj: ResumeProjectBlock, x = MARGIN, width = CONTENT_W) {
  ensureSpace(ctx, 36)
  const nameSize = 8.8
  ctx.page.drawText(proj.name, { x: x + 2, y: ctx.y, size: nameSize, font: ctx.fontBold, color: DARK })
  const nw = ctx.fontBold.widthOfTextAtSize(proj.name, nameSize)
  ctx.page.drawText(`  ${proj.badge}`, {
    x: x + 2 + nw + 3,
    y: ctx.y,
    size: 6.2,
    font: ctx.fontBold,
    color: GREEN,
  })
  ctx.y -= 10
  drawWrapped(ctx, proj.description, { x: x + 2, maxWidth: width - 4, size: 7.8, color: MID, lineHeight: 10 })
  ctx.y -= 1
  drawWrapped(ctx, proj.stack, { x: x + 2, maxWidth: width - 4, size: 6.8, color: FAINT, lineHeight: 8.5 })
  ctx.y -= 4
}

function buildSalesPdf(ctx: PdfCtx, variant: ResumeVariant, pkg: TailoredPackage, role: { company: string; title: string }) {
  const content = resumeVariants[variant]

  if (role.company && role.title) {
    drawCentered(ctx, `${role.company.toUpperCase()} · ${role.title.toUpperCase()}`, {
      font: ctx.fontBold,
      size: 7,
      color: FAINT,
    })
    ctx.y -= 4
  }

  drawCentered(ctx, 'MATTHEW AFANASIEV', { font: ctx.fontBold, size: 20, color: DARK })
  drawCentered(ctx, 'R E V E N U E  x  A I', { font: ctx.fontBold, size: 7, color: GREEN })
  drawCentered(ctx, content.subtitle, { font: ctx.fontItalic, size: 9.5, color: MID })
  drawCentered(ctx, contactLine(), { size: 7, color: FAINT })
  ctx.y -= 8

  drawCentered(ctx, content.headline, { font: ctx.fontBold, size: 13, color: DARK })
  drawCentered(ctx, content.tagline, { font: ctx.fontItalic, size: 8, color: MID })
  ctx.y -= 4
  drawWrapped(ctx, pkg.summary || content.summary, { size: 8.5, color: MID, lineHeight: 11 })
  ctx.y -= 6

  drawStats(ctx, content.stats)
  ctx.y -= 4

  sectionHeading(ctx, 'EXPERIENCE')
  for (let i = 0; i < content.roles.length; i++) {
    const firstBullets = i === 0 && pkg.emphasizedBullets.length > 0 ? pkg.emphasizedBullets : undefined
    drawRole(ctx, content.roles[i], MARGIN, CONTENT_W, firstBullets)
  }

  sectionHeading(ctx, 'AI SYSTEMS BUILT')
  for (const proj of content.projects) drawProject(ctx, proj)

  sectionHeading(ctx, 'CORE SKILLS')
  for (const skill of content.skills) {
    ensureSpace(ctx, 18)
    ctx.page.drawText(skill.category, { x: MARGIN, y: ctx.y, size: 7, font: ctx.fontBold, color: DARK })
    const labelW = ctx.fontBold.widthOfTextAtSize(skill.category, 7)
    drawWrapped(ctx, skill.items, { x: MARGIN + labelW + 5, maxWidth: CONTENT_W - labelW - 5, size: 8, color: MID, lineHeight: 10 })
    ctx.y -= 2
  }

  sectionHeading(ctx, 'EDUCATION')
  drawWrapped(ctx, 'BBA, Marketing Management · University of St. Thomas    2017 - 2021', {
    size: 8.5,
    font: ctx.fontBold,
    color: DARK,
    lineHeight: 11,
  })
}

function buildGtmPdf(ctx: PdfCtx, pkg: TailoredPackage) {
  const content = resumeVariants.gtm
  const sidebarX = MARGIN
  let sidebarY = PAGE_H - MARGIN

  function sidebarHeading(label: string) {
    const size = 6.2
    const text = label.toUpperCase().split('').join(' ')
    ctx.page.drawText(text, { x: sidebarX, y: sidebarY, size, font: ctx.fontBold, color: GREEN })
    sidebarY -= 8
    ctx.page.drawLine({
      start: { x: sidebarX, y: sidebarY },
      end: { x: sidebarX + SIDEBAR_W, y: sidebarY },
      thickness: 0.8,
      color: GREEN,
    })
    sidebarY -= 7
  }

  function sidebarLine(text: string, size = 7.2) {
    const words = text.split(/\s+/)
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.fontRegular.widthOfTextAtSize(test, size) > SIDEBAR_W && line) {
        ctx.page.drawText(line, { x: sidebarX, y: sidebarY, size, font: ctx.fontRegular, color: MID })
        sidebarY -= size * 1.3
        line = word
      } else {
        line = test
      }
    }
    if (line) {
      ctx.page.drawText(line, { x: sidebarX, y: sidebarY, size, font: ctx.fontRegular, color: MID })
      sidebarY -= size * 1.3
    }
  }

  sidebarHeading('Contact')
  for (const line of contactLine().split(' · ')) {
    sidebarLine(line, 6.8)
  }
  sidebarY -= 6

  sidebarHeading('Go-To-Market Expertise')
  for (const item of content.gtmExpertise ?? []) {
    sidebarLine(`• ${item}`, 6.6)
  }
  sidebarY -= 6

  sidebarHeading('Tools & Stack')
  for (const item of content.toolsStack ?? []) {
    sidebarLine(item, 6.6)
  }
  sidebarY -= 6

  sidebarHeading('Education')
  sidebarLine('BBA, Marketing Management', 6.8)
  sidebarLine('University of St. Thomas', 6.8)
  sidebarLine('2017 - 2021', 6.8)
  sidebarY -= 6

  sidebarHeading('What Drives Me')
  sidebarLine(content.whatDrivesMe ?? '', 6.8)

  ctx.page.drawText('MATTHEW', { x: MAIN_X, y: ctx.y, size: 26, font: ctx.fontBold, color: DARK })
  ctx.y -= 28
  ctx.page.drawText('AFANASIEV', { x: MAIN_X, y: ctx.y, size: 26, font: ctx.fontBold, color: DARK })
  ctx.y -= 14
  ctx.page.drawText('R E V E N U E  x  A I', { x: MAIN_X, y: ctx.y, size: 7, font: ctx.fontBold, color: GREEN })
  ctx.y -= 11
  drawWrapped(ctx, content.subtitle, { x: MAIN_X, maxWidth: MAIN_W, size: 9.5, font: ctx.fontItalic, color: MID, lineHeight: 11 })
  ctx.y -= 6
  drawWrapped(ctx, content.headline, { x: MAIN_X, maxWidth: MAIN_W, size: 12, font: ctx.fontBold, color: DARK, lineHeight: 14 })
  drawWrapped(ctx, content.tagline, { x: MAIN_X, maxWidth: MAIN_W, size: 8, font: ctx.fontItalic, color: MID, lineHeight: 10 })
  ctx.y -= 2
  drawWrapped(ctx, pkg.summary || content.summary, { x: MAIN_X, maxWidth: MAIN_W, size: 8.2, color: MID, lineHeight: 10.5 })
  ctx.y -= 4

  drawStats(ctx, content.stats, MAIN_X, MAIN_W)
  ctx.y -= 2

  sectionHeading(ctx, 'EXPERIENCE', MAIN_X, MAIN_W)
  for (let i = 0; i < content.roles.length; i++) {
    const firstBullets = i === 0 && pkg.emphasizedBullets.length > 0 ? pkg.emphasizedBullets : undefined
    drawRole(ctx, content.roles[i], MAIN_X, MAIN_W, firstBullets)
  }

  if (content.signatureBuild) {
    sectionHeading(ctx, 'Signature Build', MAIN_X, MAIN_W)
    drawProject(ctx, content.signatureBuild, MAIN_X, MAIN_W)
  }

  if (content.additionalBuilds?.length) {
    sectionHeading(ctx, 'Additional Builds', MAIN_X, MAIN_W)
    for (const proj of content.additionalBuilds) drawProject(ctx, proj, MAIN_X, MAIN_W)
  }
}

export async function buildResumePdf(
  pkg: TailoredPackage,
  role: { company: string; title: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([PAGE_W, PAGE_H])
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  }
  const ctx = makeCtx(doc, page, fonts)
  const variant = archetypeToVariant(pkg.archetype)

  if (variant === 'gtm') {
    buildGtmPdf(ctx, pkg)
  } else {
    buildSalesPdf(ctx, variant, pkg, role)
  }

  return doc.save()
}
