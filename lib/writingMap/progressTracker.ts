import { createClient } from '@/lib/supabase/server'
import type { Section } from '@/types/database'

/**
 * Fetch all sections for a project, grouped by chapter_id.
 */
export async function getSectionsForProject(
  projectId: string
): Promise<Record<string, Section[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ltu_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })

  if (error) {
    console.error('Failed to fetch sections:', error)
    return {}
  }

  const grouped: Record<string, Section[]> = {}
  for (const section of (data ?? []) as Section[]) {
    if (!grouped[section.chapter_id]) {
      grouped[section.chapter_id] = []
    }
    grouped[section.chapter_id].push(section)
  }

  return grouped
}

/**
 * Fetch sections for a specific chapter.
 */
export async function getSectionsForChapter(
  chapterId: string
): Promise<Section[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ltu_sections')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('position', { ascending: true })

  if (error) {
    console.error('Failed to fetch sections for chapter:', error)
    return []
  }

  return (data ?? []) as Section[]
}

/**
 * Insert multiple sections for a chapter (used after AI plan generation).
 */
export async function insertSections(
  chapterId: string,
  projectId: string,
  sections: { title: string; summary: string }[]
): Promise<Section[]> {
  const supabase = await createClient()

  const rows = sections.map((s, i) => ({
    chapter_id: chapterId,
    project_id: projectId,
    title: s.title,
    summary: s.summary,
    status: 'empty' as const,
    position: i + 1,
  }))

  const { data, error } = await supabase
    .from('ltu_sections')
    .insert(rows)
    .select()

  if (error) {
    console.error('Failed to insert sections:', error)
    return []
  }

  return (data ?? []) as Section[]
}

/**
 * Update a section's status.
 */
export async function updateSectionStatus(
  sectionId: string,
  status: 'empty' | 'draft' | 'review' | 'complete'
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ltu_sections')
    .update({ status })
    .eq('id', sectionId)

  if (error) {
    console.error('Failed to update section status:', error)
    throw error
  }
}

/**
 * Update a section's title and/or notes.
 */
export async function updateSection(
  sectionId: string,
  updates: { title?: string; notes?: string; summary?: string }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ltu_sections')
    .update(updates)
    .eq('id', sectionId)

  if (error) {
    console.error('Failed to update section:', error)
    throw error
  }
}

/**
 * Delete a section.
 */
export async function deleteSection(sectionId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ltu_sections')
    .delete()
    .eq('id', sectionId)

  if (error) {
    console.error('Failed to delete section:', error)
    throw error
  }
}
