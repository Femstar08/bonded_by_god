import { createClient } from '@/lib/supabase/server'
import type { ChapterMemory, ProjectMemory } from '@/types/database'

/**
 * Upsert a chapter memory row (insert or update on chapter_id conflict).
 */
export async function upsertChapterMemory(
  chapterId: string,
  projectId: string,
  memory: {
    summary: string
    key_themes: string[]
    scriptures_used: string[]
    key_ideas: string[]
    word_count_at_generation: number
  }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ltu_chapter_memories')
    .upsert(
      {
        chapter_id: chapterId,
        project_id: projectId,
        summary: memory.summary,
        key_themes: memory.key_themes,
        scriptures_used: memory.scriptures_used,
        key_ideas: memory.key_ideas,
        word_count_at_generation: memory.word_count_at_generation,
      },
      { onConflict: 'chapter_id' }
    )

  if (error) {
    console.error('Failed to upsert chapter memory:', error)
    throw error
  }
}

/**
 * Upsert the project memory row (insert or update on project_id conflict).
 */
export async function upsertProjectMemory(
  projectId: string,
  data: {
    writing_style: string
    recurring_themes: string[]
    all_scriptures_used: string[]
  }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ltu_project_memory')
    .upsert(
      {
        project_id: projectId,
        writing_style: data.writing_style,
        recurring_themes: data.recurring_themes,
        all_scriptures_used: data.all_scriptures_used,
      },
      { onConflict: 'project_id' }
    )

  if (error) {
    console.error('Failed to upsert project memory:', error)
    throw error
  }
}

/**
 * Fetch all chapter memories for a project.
 */
export async function getChapterMemories(
  projectId: string
): Promise<ChapterMemory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ltu_chapter_memories')
    .select('*')
    .eq('project_id', projectId)

  if (error) {
    console.error('Failed to fetch chapter memories:', error)
    return []
  }

  return (data ?? []) as ChapterMemory[]
}

/**
 * Fetch the project memory row.
 */
export async function getProjectMemory(
  projectId: string
): Promise<ProjectMemory | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ltu_project_memory')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) {
    // PGRST116 = no rows found, which is expected for new projects
    if (error.code !== 'PGRST116') {
      console.error('Failed to fetch project memory:', error)
    }
    return null
  }

  return data as ProjectMemory
}
