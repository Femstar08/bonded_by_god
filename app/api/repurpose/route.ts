import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runScribe } from '@/lib/agents/scribe'
import { runShepherd } from '@/lib/agents/shepherd'
import type { ProjectContext } from '@/lib/ai/context'
import type { RepurposeFormat, RepurposedOutput } from '@/types/repurposing'
import { REPURPOSE_FORMATS } from '@/types/repurposing'

interface RepurposeRequest {
  sourceContent: string
  formats: RepurposeFormat[]
  context: ProjectContext
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised. Please sign in.' }, { status: 401 })
    }

    const body: RepurposeRequest = await request.json()
    const { sourceContent, formats, context } = body

    if (!sourceContent || sourceContent.trim().length === 0) {
      return NextResponse.json({ error: 'Source content is required' }, { status: 400 })
    }

    if (!formats || formats.length === 0) {
      return NextResponse.json({ error: 'At least one format must be selected' }, { status: 400 })
    }

    if (!context) {
      return NextResponse.json({ error: 'Project context is required' }, { status: 400 })
    }

    // Truncate source content to 8000 words max
    const words = sourceContent.split(/\s+/)
    const truncated = words.length > 8000 ? words.slice(-8000).join(' ') : sourceContent

    // Generate all formats in parallel
    const results = await Promise.allSettled(
      formats.map(async (format): Promise<RepurposedOutput> => {
        const formatInfo = REPURPOSE_FORMATS.find((f) => f.id === format)
        const agentInput = {
          userText: truncated,
          context,
          repurposeFormat: format,
        }

        try {
          let result: { content: string }

          if (formatInfo?.agent === 'shepherd') {
            result = await runShepherd({ ...agentInput, mode: 'format' as const })
          } else {
            result = await runScribe({ ...agentInput, mode: 'repurpose' as const })
          }

          // Validate minimum content length
          if (!result.content || result.content.trim().length < 50) {
            return {
              format,
              content: '',
              status: 'error',
              errorMessage: 'Generated content was too short. Please retry.',
            }
          }

          return {
            format,
            content: result.content,
            status: 'complete',
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Generation failed'
          return {
            format,
            content: '',
            status: 'error',
            errorMessage: message,
          }
        }
      })
    )

    const outputs: RepurposedOutput[] = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      return {
        format: formats[i],
        content: '',
        status: 'error' as const,
        errorMessage: r.reason?.message || 'Generation failed',
      }
    })

    return NextResponse.json({
      results: outputs,
      truncated: words.length > 8000,
    })
  } catch (error) {
    console.error('Repurpose error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Repurpose error: ${message}` },
      { status: 500 }
    )
  }
}
