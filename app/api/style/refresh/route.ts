import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStyleProfile, upsertStyleProfile } from '@/lib/memory/style-store'
import { analyzeStyle, refreshStyle } from '@/lib/agents/stylist'
import { countWords } from '@/lib/utils/text'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, newWriting } = body as {
      projectId: string
      newWriting: string
    }

    if (!projectId || !newWriting || newWriting.trim().length < 200) {
      return NextResponse.json(
        { error: 'projectId and newWriting (200+ chars) are required' },
        { status: 400 }
      )
    }

    const existing = await getStyleProfile(user.id, projectId)
    const wordCount = countWords(newWriting)

    let updatedStyle
    if (existing) {
      // Refresh existing profile with new writing
      updatedStyle = await refreshStyle(existing.style_data, newWriting)
    } else {
      // No existing profile — create one from the writing
      updatedStyle = await analyzeStyle(newWriting)
    }

    // Save as project-level profile
    await upsertStyleProfile(
      user.id,
      projectId,
      updatedStyle,
      existing?.samples_text ?? [],
      wordCount
    )

    return NextResponse.json({ styleData: updatedStyle })
  } catch (error) {
    console.error('Style refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh style profile' },
      { status: 500 }
    )
  }
}
