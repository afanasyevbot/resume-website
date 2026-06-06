import { NextResponse } from 'next/server'
import { sql } from '@/lib/engine/db'
import { professionalContext } from '@/lib/professionalContext'
import { buildResumeDocx } from '@/lib/engine/docx/resume'
import { buildCoverLetterDocx } from '@/lib/engine/docx/coverLetter'
import { buildResumePdf } from '@/lib/engine/pdf/resume'
import { buildCoverLetterPdf } from '@/lib/engine/pdf/coverLetter'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'

// docx → Packer uses Node Buffer; needs Node runtime, not Edge.
export const runtime = 'nodejs'

interface PackageRow {
  id: number
  package_json: TailoredPackage | null
  company: string
  title: string
}

/**
 * GET /api/engine/package/:id/download?kind=resume|cover
 * Returns a .docx file built from the stored TailoredPackage + Matthew's
 * static professionalContext. Resume uses tailored summary + bullets;
 * cover letter uses pkg.coverLetter wrapped in standard letter format.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const packageId = Number(id)
  if (!Number.isFinite(packageId) || packageId <= 0) {
    return NextResponse.json({ error: 'Invalid package id' }, { status: 400 })
  }

  const url = new URL(_req.url)
  const kind = url.searchParams.get('kind')
  if (kind !== 'resume' && kind !== 'cover') {
    return NextResponse.json(
      { error: "kind must be 'resume' or 'cover'" },
      { status: 400 },
    )
  }
  const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'docx'

  const rows = await sql`
    select p.id, p.package_json, r.company, r.title
    from application_packages p
    join roles r on r.id = p.role_id
    where p.id = ${packageId}
    limit 1
  `
  const row = rows[0] as PackageRow | undefined
  if (!row || !row.package_json) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  const role = { company: row.company, title: row.title }
  let bytes: Uint8Array | Buffer
  let contentType: string
  let ext: string

  try {
    if (format === 'pdf') {
      bytes =
        kind === 'resume'
          ? await buildResumePdf(row.package_json, role)
          : await buildCoverLetterPdf(row.package_json, role)
      contentType = 'application/pdf'
      ext = 'pdf'
    } else {
      bytes =
        kind === 'resume'
          ? await buildResumeDocx(row.package_json, professionalContext, role)
          : await buildCoverLetterDocx(row.package_json, professionalContext, role)
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ext = 'docx'
    }
  } catch (err) {
    console.error(`${format.toUpperCase()} build error:`, err)
    return NextResponse.json({ error: `Failed to build ${format.toUpperCase()}` }, { status: 500 })
  }

  const companySafe = row.company.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'role'
  const filename = `Matthew_Afanasiev_${kind}_${companySafe}.${ext}`

  // Copy into a fresh ArrayBuffer — Node Buffer's underlying buffer may be a
  // SharedArrayBuffer which Web Response types reject.
  const ab = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(ab).set(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))

  return new NextResponse(ab, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'private, no-store',
    },
  })
}
