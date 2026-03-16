import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude, parseJsonResponse } from '@/lib/agents/base'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user's preferred translation
  const { data: profile } = await supabase
    .from('ltu_profiles')
    .select('preferred_translation')
    .eq('id', user.id)
    .single()

  const translation = profile?.preferred_translation || 'NIV'
  const today = new Date().toISOString().split('T')[0]

  const raw = await callClaude({
    system: `You are a Spirit-led Scripture assistant for a Christian writing app called Scriptloom.
Return a single Bible verse that is encouraging, inspiring, and relevant for a writer or minister starting their day.
Use the ${translation} translation for the verse text.
Respond ONLY with valid JSON in this exact format: {"reference":"Book Chapter:Verse","text":"The verse text"}
Do not include any other text outside the JSON.`,
    userMessage: `Today's date is ${today}. Please provide a daily Scripture verse for today in the ${translation} translation.`,
    maxTokens: 300,
  })

  const parsed = parseJsonResponse<{ reference: string; text: string }>(raw)

  return NextResponse.json(parsed)
}
