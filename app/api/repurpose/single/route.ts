import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runScribe } from '@/lib/agents/scribe'
import { runShepherd } from '@/lib/agents/shepherd'
import type { ProjectContext } from '@/lib/ai/context'
import type { RepurposeFormat } from '@/types/repurposing'
import { REPURPOSE_FORMATS } from '@/types/repurposing'

interface SingleRepurposeRequest {
  sourceContent: string
  format: RepurposeFormat
  context: ProjectContext
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised. Please sign in.' }, { status: 401 })
    }

    const body: SingleRepurposeRequest = await request.json()
    const { sourceContent, format, context } = body

    if (!sourceContent || !format || !context) {
      return NextResponse.json({ error: 'sourceContent, format, and context are required' }, { status: 400 })
    }

    const words = sourceContent.split(/\s+/)
    const truncated = words.length > 8000 ? words.slice(-8000).join(' ') : sourceContent

    const formatInfo = REPURPOSE_FORMATS.find((f) => f.id === format)
    const agentInput = {
      userText: truncated,
      context,
      repurposeFormat: format,
    }

    let result: { content: string }

    if (formatInfo?.agent === 'shepherd') {
      result = await runShepherd({ ...agentInput, mode: 'format' as const })
    } else {
      result = await runScribe({ ...agentInput, mode: 'repurpose' as const })
    }

    if (!result.content || result.content.trim().length < 50) {
      return NextResponse.json({
        format,
        content: '',
        status: 'error',
        errorMessage: 'Generated content was too short. Please retry.',
      })
    }

    return NextResponse.json({
      format,
      content: result.content,
      status: 'complete',
    })
  } catch (error) {
    console.error('Single repurpose error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Repurpose error: ${message}` },
      { status: 500 }
    )
  }
}
