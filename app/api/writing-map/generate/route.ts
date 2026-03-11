import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateChapterPlan } from '@/lib/writingMap/chapterPlanner'
import { insertSections } from '@/lib/writingMap/progressTracker'
import { buildProjectContext } from '@/lib/ai/context'

/**
 * POST /api/writing-map/generate
 * Generate an AI section plan for a chapter.
 * Body: { chapterId, projectId }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chapterId, projectId } = await request.json()
  if (!chapterId || !projectId) {
    return NextResponse.json({ error: 'Missing chapterId or projectId' }, { status: 400 })
  }

  // Fetch project and chapter
  const [{ data: project }, { data: chapter }] = await Promise.all([
    supabase
      .from('ltu_projects')
      .select('title, type, role, audience, tone, scripture_focus')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('ltu_chapters')
      .select('title, content')
      .eq('id', chapterId)
      .single(),
  ])

  if (!project || !chapter) {
    return NextResponse.json({ error: 'Project or chapter not found' }, { status: 404 })
  }

  // Check if sections already exist for this chapter
  const { data: existing } = await supabase
    .from('ltu_sections')
    .select('id')
    .eq('chapter_id', chapterId)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Sections already exist for this chapter. Delete them first to regenerate.' }, { status: 409 })
  }

  const context = buildProjectContext(project, { chapter })
  const plan = await generateChapterPlan(context, chapter.title, chapter.content)

  if (plan.length === 0) {
    return NextResponse.json({ error: 'Failed to generate chapter plan' }, { status: 500 })
  }

  const sections = await insertSections(chapterId, projectId, plan)

  return NextResponse.json({ sections })
}
