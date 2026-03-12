import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildMemoryContext } from '@/lib/memory/inject'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const activeChapterId = searchParams.get('activeChapterId')

  if (!projectId || !activeChapterId) {
    return NextResponse.json({ error: 'Missing projectId or activeChapterId' }, { status: 400 })
  }

  const context = await buildMemoryContext(projectId, activeChapterId, user.id)
  return NextResponse.json(context)
}
