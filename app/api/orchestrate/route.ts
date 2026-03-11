import { NextRequest, NextResponse } from 'next/server'
import { orchestrate, type OrchestratorInput } from '@/lib/ai/orchestrator'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised. Please sign in.' }, { status: 401 })
    }

    const body: OrchestratorInput = await request.json()
    const { action, context } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    if (!context) {
      return NextResponse.json({ error: 'Project context is required' }, { status: 400 })
    }

    const result = await orchestrate(body)

    // If the result content is JSON, parse it for the response
    let responseData: Record<string, unknown>
    try {
      const parsed = JSON.parse(result.content)
      responseData = { agent: result.agent, ...parsed }
    } catch {
      responseData = { agent: result.agent, result: result.content }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Orchestrator error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Orchestrator error: ${message}` },
      { status: 500 }
    )
  }
}
