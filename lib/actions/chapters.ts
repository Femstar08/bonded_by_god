'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateChapterContent(chapterId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('ltu_chapters')
    .update({ content })
    .eq('id', chapterId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateChapterWordGoal(chapterId: string, wordGoal: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('ltu_chapters')
    .update({ word_goal: wordGoal })
    .eq('id', chapterId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function renameChapter(chapterId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const trimmed = title.trim()
  if (!trimmed) return { success: false, error: 'Title cannot be empty' }

  const { error } = await supabase
    .from('ltu_chapters')
    .update({ title: trimmed })
    .eq('id', chapterId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function addChapter(
  projectId: string,
  title: string,
  position: number,
  type: 'chapter' | 'part' = 'chapter',
  parentId: string | null = null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('ltu_chapters')
    .insert({ project_id: projectId, title, position, type, parent_id: parentId })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, chapter: data }
}

/**
 * Reassign a chapter to a different part (or remove it from any part).
 * Pass `null` for `partId` to make the chapter free-standing (ungrouped).
 */
export async function moveChapterToPart(chapterId: string, partId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('ltu_chapters')
    .update({ parent_id: partId })
    .eq('id', chapterId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Delete a single chapter (not a part).
 */
export async function deleteChapter(chapterId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('ltu_chapters')
    .delete()
    .eq('id', chapterId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Delete a part row with one of three strategies for its child chapters:
 *
 *  - `merge_previous`: Re-parent children to the part that comes immediately
 *    before this one in the project (by position). If there is no previous
 *    part, children become ungrouped (parent_id = null).
 *  - `ungrouped`: Set all children's parent_id to null (keep them, just
 *    detach from this part).
 *  - `delete_all`: Permanently delete all children, then delete the part.
 */
export async function deletePart(
  partId: string,
  mode: 'merge_previous' | 'ungrouped' | 'delete_all',
  projectId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Fetch the part being deleted so we know its position
  const { data: part, error: partFetchError } = await supabase
    .from('ltu_chapters')
    .select('id, position')
    .eq('id', partId)
    .eq('project_id', projectId)
    .eq('type', 'part')
    .single()

  if (partFetchError || !part) {
    return { success: false, error: partFetchError?.message ?? 'Part not found' }
  }

  if (mode === 'delete_all') {
    // Delete all chapters that belong to this part
    const { error: childDeleteError } = await supabase
      .from('ltu_chapters')
      .delete()
      .eq('parent_id', partId)

    if (childDeleteError) return { success: false, error: childDeleteError.message }
  } else {
    // Determine the new parent_id for the orphaned children
    let newParentId: string | null = null

    if (mode === 'merge_previous') {
      // Find the nearest part that appears before this one (lower position)
      const { data: previousPart } = await supabase
        .from('ltu_chapters')
        .select('id')
        .eq('project_id', projectId)
        .eq('type', 'part')
        .lt('position', part.position)
        .order('position', { ascending: false })
        .limit(1)
        .single()

      newParentId = previousPart?.id ?? null
    }
    // For 'ungrouped', newParentId stays null

    const { error: reparentError } = await supabase
      .from('ltu_chapters')
      .update({ parent_id: newParentId })
      .eq('parent_id', partId)

    if (reparentError) return { success: false, error: reparentError.message }
  }

  // Finally delete the part itself
  const { error: deleteError } = await supabase
    .from('ltu_chapters')
    .delete()
    .eq('id', partId)

  if (deleteError) return { success: false, error: deleteError.message }
  return { success: true }
}
