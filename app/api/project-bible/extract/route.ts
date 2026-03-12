import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runProjectBibleExtractor } from '@/lib/agents/extractor'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { project_id } = await req.json()
  if (!project_id) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  }

  // Verify ownership
  const { data: project } = await supabase
    .from('ltu_projects')
    .select('id, title, type, role, audience, tone, scripture_focus')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Fetch all chapter content
  const { data: chapters } = await supabase
    .from('ltu_chapters')
    .select('title, content')
    .eq('project_id', project_id)
    .order('position', { ascending: true })

  if (!chapters?.length) {
    return NextResponse.json({ error: 'No chapters found' }, { status: 400 })
  }

  // Strip HTML tags for AI processing
  const chapterTexts = chapters.map((ch) => ({
    title: ch.title,
    content: (ch.content || '').replace(/<[^>]*>/g, ''),
  }))

  // Check minimum content
  const totalWords = chapterTexts.reduce(
    (sum, ch) => sum + ch.content.split(/\s+/).filter(Boolean).length,
    0
  )
  if (totalWords < 50) {
    return NextResponse.json(
      { error: 'Not enough content to extract from. Write at least 50 words first.' },
      { status: 400 }
    )
  }

  try {
    const candidates = await runProjectBibleExtractor({
      projectTitle: project.title,
      projectType: project.type,
      role: project.role,
      audience: project.audience ?? undefined,
      tone: project.tone ?? undefined,
      scriptureFocus: project.scripture_focus ?? undefined,
      chapters: chapterTexts,
    })

    return NextResponse.json({ candidates })
  } catch (err) {
    console.error('Project Bible extraction failed:', err)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
