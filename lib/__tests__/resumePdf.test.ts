import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

const SALES_PDF = join(process.cwd(), 'public/resume/Matthew_Afanasiev_AI_Sales_Resume.pdf')
const GTM_PDF = join(process.cwd(), 'public/resume/Matthew_Afanasiev_AI_GTM_Strategy_Resume.pdf')

function pdfText(path: string): string {
  const escaped = path.replace(/'/g, "'\\''")
  return execSync(
    `python3 -c "from pypdf import PdfReader; r=PdfReader('${escaped}'); print(''.join((p.extract_text() or '') for p in r.pages))"`,
    { encoding: 'utf8' },
  )
}

describe('public resume PDFs', () => {
  it('ships current SPS performance copy in the sales PDF', () => {
    const text = pdfText(SALES_PDF)
    expect(text).toMatch(/#1 ranked rep YTD|Ranked #1 rep YTD/i)
    expect(text).toContain('200% of quota in Q3')
    expect(text).not.toMatch(/#3 of 30/i)
    expect(text).not.toMatch(/Top performer in Q1 2026/i)
    expect(text).not.toMatch(/as of Sep/i)
    expect(text).not.toMatch(/Paradise Capital/i)
  })

  it('uses the same current PDF for the GTM download path', () => {
    const sales = pdfText(SALES_PDF)
    const gtm = pdfText(GTM_PDF)
    expect(gtm).toBe(sales)
  })
})
