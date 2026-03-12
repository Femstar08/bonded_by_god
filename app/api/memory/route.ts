import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateChapterMemory, generateProjectStyle } from '@/lib/memory/generate'
import { upsertChapterMemory, upsertProjectMemory, getChapterMemories } from '@/lib/memory/store'

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

  // Fetch chapter content
  const { data: chapter } = await supabase
    .from('ltu_chapters')
    .select('content')
    .eq('id', chapterId)
    .single()

  if (!chapter?.content) {
    return NextResponse.json({ success: true }) // Nothing to summarize
  }

  // Fetch project title
  const { data: project } = await supabase
    .from('ltu_projects')
    .select('title')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Generate chapter memory
  const memory = await generateChapterMemory(chapter.content, project.title)
  const wordCount = chapter.content.trim().split(/\s+/).filter(Boolean).length

  await upsertChapterMemory(chapterId, projectId, {
    ...memory,
    word_count_at_generation: wordCount,
  })

  // If 3+ chapter memories exist, regenerate project-level memory
  const allMemories = await getChapterMemories(projectId)
  if (allMemories.length >= 3) {
    // Aggregate themes and scriptures
    const allThemes = new Set<string>()
    const allScriptures = new Set<string>()
    let sampleContent = ''

    for (const m of allMemories) {
      for (const t of m.key_themes) allThemes.add(t)
      for (const s of m.scriptures_used) allScriptures.add(s)
    }

    // Fetch content from chapters for style analysis (first 3 with content)
    const { data: chapters } = await supabase
      .from('ltu_chapters')
      .select('content')
      .eq('project_id', projectId)
      .not('content', 'eq', '')
      .limit(3)

    if (chapters) {
      sampleContent = chapters.map((c) => c.content).join('\n\n---\n\n')
    }

    const writingStyle = await generateProjectStyle(sampleContent)

    await upsertProjectMemory(projectId, {
      writing_style: writingStyle,
      recurring_themes: Array.from(allThemes),
      all_scriptures_used: Array.from(allScriptures),
    })
  }

  return NextResponse.json({ success: true })
}
