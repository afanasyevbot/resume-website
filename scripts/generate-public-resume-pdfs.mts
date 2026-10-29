import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildPublicResumePdf } from '@/lib/engine/pdf/resume'

const outDir = join(process.cwd(), 'public/resume')
const bytes = await buildPublicResumePdf('sales')

for (const name of [
  'Matthew_Afanasiev_AI_Sales_Resume.pdf',
  'Matthew_Afanasiev_AI_GTM_Strategy_Resume.pdf',
]) {
  writeFileSync(join(outDir, name), bytes)
  console.log(`Wrote ${name} (${bytes.length} bytes)`)
}
