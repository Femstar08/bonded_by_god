import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzePassage } from '@/lib/ai/analysis/storyExtractor'

/**
 * POST /api/analysis
 * Analyze a passage of text for writing signals.
 * Body: { passage: string }
 * Returns: WritingSignals
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { passage } = await request.json()
  if (!passage || typeof passage !== 'string' || passage.trim().length < 30) {
    return NextResponse.json({ error: 'Passage too short for analysis' }, { status: 400 })
  }

  const signals = await analyzePassage(passage)
  return NextResponse.json(signals)
}
