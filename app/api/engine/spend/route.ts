import { NextResponse } from 'next/server'
import { spendSummary } from '@/lib/engine/costGuard'

export const runtime = 'nodejs'

export async function GET() {
  const summary = await spendSummary()
  return NextResponse.json(summary)
}
