import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/agents/base'

const SYNOPSIS_SYSTEM_PROMPT = `You are a thoughtful editorial assistant for a Christian writing platform called Scriptloom.

Your task is to write a concise chapter synopsis — 2 to 4 sentences that capture:
• The core subject or argument of the chapter
• The spiritual or theological thread being explored
• The emotional or narrative arc (if present)

Guidelines:
• Write in third person, present tense ("This chapter explores…")
• Be specific — name themes, not just say "faith" or "God"
• Keep it under 80 words
• Do not include generic filler phrases like "a compelling exploration"
• Do not include the chapter title in the synopsis

Return ONLY the synopsis text. No headings, no labels, no explanation.`

/**
 * Strip HTML tags from chapter content before sending to the AI.
 * This reduces token usage and prevents the model from describing markup.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

/**
 * POST /api/planner/synopsis
 *
 * Generates a short synopsis for a chapter using Claude.
 * The synopsis is returned to the caller — it is NOT automatically saved;
 * the frontend decides whether to persist it via the planner patch route.
 *
 * Request body: { chapterId: string }
 * Response:     { synopsis: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { chapterId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { chapterId } = body
  if (!chapterId) {
    return NextResponse.json({ error: 'chapterId is required' }, { status: 400 })
  }

  // Fetch the chapter — RLS ensures it belongs to the authenticated user
  const { data: chapter, error: chapterError } = await supabase
    .from('ltu_chapters')
    .select('id, title, content, project_id')
    .eq('id', chapterId)
    .single()

  if (chapterError || !chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  const plainText = stripHtml(chapter.content ?? '')

  if (!plainText || plainText.length < 50) {
    return NextResponse.json(
      { error: 'Chapter does not have enough content to generate a synopsis' },
      { status: 422 }
    )
  }

  // Truncate to ~6 000 characters to stay within a safe token budget while
  // still giving the model enough material for an accurate synopsis.
  const contentForPrompt = plainText.length > 6000
    ? plainText.substring(0, 6000) + '\n\n[Content truncated for synopsis generation]'
    : plainText

  const userMessage = `Chapter title: "${chapter.title}"\n\nChapter content:\n${contentForPrompt}`

  let synopsis: string
  try {
    synopsis = await callClaude({
      system: SYNOPSIS_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 256,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ synopsis: synopsis.trim() })
}
