import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { RESUME_SUMMARY_SALES } from '@/lib/resumeContent'

const outDir = join(process.cwd(), 'public/resume')
const SALES_PDF = join(outDir, 'Matthew_Afanasiev_AI_Sales_Resume.pdf')
const GTM_PDF = join(outDir, 'Matthew_Afanasiev_AI_GTM_Strategy_Resume.pdf')

function pdfText(path: string): string {
  return execSync(`pdftotext '${path.replace(/'/g, "'\\''")}' -`, { encoding: 'utf8' })
}

function pdfPages(path: string): number {
  const info = execSync(`pdfinfo '${path.replace(/'/g, "'\\''")}'`, { encoding: 'utf8' })
  const match = info.match(/^Pages:\s+(\d+)/m)
  return match ? Number(match[1]) : 0
}

// The public PDFs are the locked-design resume (built from the master docx),
// committed as static files. Tests only read them; never regenerate or overwrite.
describe('public resume PDFs', () => {
  it('is exactly one page with updated curated copy', () => {
    expect(pdfPages(SALES_PDF)).toBe(1)
    const text = pdfText(SALES_PDF).replace(/\s+/g, ' ')
    expect(text).toContain('shipping production software')
    expect(text).toContain('#1 ranked rep YTD')
    expect(text).not.toMatch(/Ranked #1 rep YTD/i)
    expect(text).not.toMatch(/hands-on/i)
    expect(text).not.toMatch(/112%/i)
    expect(text).not.toMatch(/Pro bono/i)
    expect(text).toContain("President's Club qualification")
    expect(text).toContain('200% of quota in Q3')
  })

  it('uses the same PDF for the GTM download path', () => {
    expect(pdfPages(GTM_PDF)).toBe(1)
    const sales = pdfText(SALES_PDF)
    const gtm = pdfText(GTM_PDF)
    expect(gtm).toBe(sales)
  })

  it('summary matches resumeContent sales variant', () => {
    const text = pdfText(SALES_PDF).replace(/\s+/g, ' ')
    const summary = RESUME_SUMMARY_SALES.replace(/\s+/g, ' ')
    expect(text).toContain(summary.slice(0, 80))
  })
})
