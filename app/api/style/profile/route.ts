import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStyleProfile } from '@/lib/memory/style-store'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    const profile = await getStyleProfile(user.id, projectId)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Style profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch style profile' },
      { status: 500 }
    )
  }
}
