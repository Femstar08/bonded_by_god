import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Strip HTML tags and calculate a word count from raw HTML content.
 * Used server-side so we never expose the raw chapter body in the response.
 */
function wordCountFromHtml(html: string): number {
  if (!html) return 0
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length
}

/**
 * GET /api/planner/[projectId]
 *
 * Returns lightweight planner data: chapters with nested sections.
 * The raw chapter content is used only to derive a word count —
 * it is NOT included in the response payload.
 *
 * Response: { chapters: PlannerChapter[] }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch chapters — include content only for word-count calculation, not returned to client
  const { data: chapters, error: chaptersError } = await supabase
    .from('ltu_chapters')
    .select('id, title, position, status, synopsis, color_label, word_goal, content, type, created_at, updated_at')
    .eq('project_id', projectId)
    .order('position', { ascending: true })

  if (chaptersError) {
    return NextResponse.json({ error: chaptersError.message }, { status: 500 })
  }

  if (!chapters || chapters.length === 0) {
    return NextResponse.json({ chapters: [] })
  }

  const chapterIds = chapters.map((c) => c.id)

  // Fetch all sections for this project's chapters in a single query
  const { data: sections, error: sectionsError } = await supabase
    .from('ltu_sections')
    .select('id, chapter_id, title, position, status, synopsis')
    .in('chapter_id', chapterIds)
    .order('position', { ascending: true })

  if (sectionsError) {
    return NextResponse.json({ error: sectionsError.message }, { status: 500 })
  }

  // Group sections by chapter_id for O(n) nesting
  const sectionsByChapter = new Map<string, typeof sections>()
  for (const section of sections ?? []) {
    const bucket = sectionsByChapter.get(section.chapter_id) ?? []
    bucket.push(section)
    sectionsByChapter.set(section.chapter_id, bucket)
  }

  // Build the response — strip `content` and replace with a calculated word_count
  const plannerChapters = chapters.map((chapter) => {
    const { content, ...chapterWithoutContent } = chapter
    return {
      ...chapterWithoutContent,
      word_count: wordCountFromHtml(content ?? ''),
      sections: (sectionsByChapter.get(chapter.id) ?? []).map((s) => ({
        id: s.id,
        title: s.title,
        position: s.position,
        status: s.status,
        synopsis: s.synopsis,
      })),
    }
  })

  return NextResponse.json({ chapters: plannerChapters })
}
