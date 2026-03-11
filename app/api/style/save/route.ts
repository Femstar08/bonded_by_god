import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertStyleProfile } from '@/lib/memory/style-store'
import type { StyleData } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { styleData, samplesText, projectId } = body as {
      styleData: StyleData
      samplesText: string[]
      projectId?: string
    }

    if (!styleData || !styleData.styleSummary) {
      return NextResponse.json(
        { error: 'Style data with styleSummary is required' },
        { status: 400 }
      )
    }

    // If project-scoped, verify user owns the project
    if (projectId) {
      const { data: project } = await supabase
        .from('ltu_projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
    }

    await upsertStyleProfile(
      user.id,
      projectId ?? null,
      styleData,
      samplesText ?? [],
      0
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Style save error:', error)
    return NextResponse.json(
      { error: 'Failed to save style profile' },
      { status: 500 }
    )
  }
}
