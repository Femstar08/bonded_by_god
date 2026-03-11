import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ProjectContext } from '@/lib/ai/context'
import { createClient } from '@/lib/supabase/server'
import { AI_MODEL } from '@/lib/ai/config'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatRequestBody = {
  messages: ChatMessage[]
  context: ProjectContext
}

/**
 * Builds a context-aware system prompt for the co-author chat panel.
 * Every variable is drawn directly from the ProjectContext so the model
 * responds in the voice and scope of the user's specific project.
 */
function buildSystemPrompt(context: ProjectContext): string {
  const {
    projectTitle,
    projectType,
    userRole,
    tone,
    scriptureFocus,
    recentContent,
  } = context

  const toneClause = tone ? ` The tone is ${tone}.` : ''
  const scriptureClause = scriptureFocus
    ? ` The scripture focus is "${scriptureFocus}".`
    : ''
  const recentContentSection = recentContent
    ? `The user is currently working on this section:\n\n${recentContent}`
    : ''

  return `You are a Spirit-led writing co-author and mentor on a Christian writing platform called Scriptloom. You are helping a user write a ${projectType} project titled "${projectTitle}". Their role is ${userRole}.${toneClause}${scriptureClause}

Your role is to:
- Help the user develop their ideas and structure
- Suggest relevant scriptures when appropriate
- Provide theological grounding and encouragement
- Ask thoughtful questions to draw out the user's voice
- Never override the user's vision — you serve their writing, not the other way around

${recentContentSection}

Always respond with warmth, wisdom, and spiritual sensitivity.`.trim()
}

/**
 * POST /api/chat
 *
 * Streaming co-author chat endpoint for the Scriptloom writing panel.
 *
 * Request body:
 *   messages  — Conversation history (role/content pairs). Must be non-empty.
 *   context   — ProjectContext describing the active project.
 *
 * Response:
 *   A chunked plain-text stream of the assistant's reply. Each chunk is the
 *   raw text delta from the Anthropic streaming API, suitable for appending
 *   directly to the UI without additional parsing.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised. Please sign in.' }, { status: 401 })
    }

    const body: ChatRequestBody = await request.json()
    const { messages, context } = body

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!context) {
      return NextResponse.json(
        { error: 'Project context is required' },
        { status: 400 }
      )
    }

    const systemPrompt = buildSystemPrompt(context)

    const stream = await anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch (streamError) {
          controller.error(streamError)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Chat error: ${message}` },
      { status: 500 }
    )
  }
}
