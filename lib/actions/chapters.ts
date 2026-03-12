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

export async function addChapter(projectId: string, title: string, position: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('ltu_chapters')
    .insert({ project_id: projectId, title, position })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, chapter: data }
}
