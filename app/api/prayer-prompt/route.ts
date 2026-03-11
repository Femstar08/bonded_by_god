import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/agents/base'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role, title, scriptureFocus } = (await req.json()) as {
    role: string
    title: string
    scriptureFocus?: string
  }

  const scriptureNote = scriptureFocus
    ? `The project's scripture focus is: ${scriptureFocus}.`
    : ''

  const prayer = await callClaude({
    system: `You are a Spirit-led prayer assistant for a Christian writing app called Scriptloom.
Write a short, heartfelt opening prayer (3-5 sentences) for someone about to begin writing.
The prayer should ask for God's guidance, wisdom, and inspiration.
Keep the tone warm, reverent, and encouraging. Do not use markdown formatting.`,
    userMessage: `The writer is a ${role} working on a project titled "${title}". ${scriptureNote} Please write a short prayer to begin this writing session.`,
    maxTokens: 400,
  })

  return NextResponse.json({ prayer: prayer.trim() })
}
