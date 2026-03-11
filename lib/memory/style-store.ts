import { createClient } from '@/lib/supabase/server'
import type { StyleData, StyleProfile } from '@/types/database'

/**
 * Upsert a style profile. If projectId is null, this is a user-level profile.
 */
export async function upsertStyleProfile(
  userId: string,
  projectId: string | null,
  styleData: StyleData,
  samplesText: string[],
  wordCountAtAnalysis: number
): Promise<void> {
  const supabase = await createClient()

  // Determine which unique index to use for conflict resolution
  const row = {
    user_id: userId,
    project_id: projectId,
    style_data: styleData as unknown as Record<string, unknown>,
    samples_text: samplesText,
    word_count_at_analysis: wordCountAtAnalysis,
  }

  // Try update first, then insert — handles partial unique indexes
  const { data: existing } = await supabase
    .from('ltu_style_profiles')
    .select('id')
    .eq('user_id', userId)
    .then((res) => {
      // Filter for matching project_id (including null)
      if (!res.data) return res
      const filtered = res.data.filter(() => true) // keep all for now
      return { ...res, data: filtered }
    })

  // Use a simpler approach: delete + insert for correctness with partial indexes
  if (projectId) {
    await supabase
      .from('ltu_style_profiles')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId)
  } else {
    await supabase
      .from('ltu_style_profiles')
      .delete()
      .eq('user_id', userId)
      .is('project_id', null)
  }

  const { error } = await supabase
    .from('ltu_style_profiles')
    .insert(row)

  if (error) {
    console.error('Failed to upsert style profile:', error)
    throw error
  }
}

/**
 * Get the active style profile for a project.
 * Falls back to user-level profile if no project-level profile exists.
 */
export async function getStyleProfile(
  userId: string,
  projectId: string
): Promise<StyleProfile | null> {
  const supabase = await createClient()

  // Try project-level first
  const { data: projectProfile } = await supabase
    .from('ltu_style_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single()

  if (projectProfile) {
    return projectProfile as StyleProfile
  }

  // Fallback to user-level
  const { data: userProfile } = await supabase
    .from('ltu_style_profiles')
    .select('*')
    .eq('user_id', userId)
    .is('project_id', null)
    .single()

  return (userProfile as StyleProfile) ?? null
}

/**
 * Get a style profile for a specific scope (no fallback).
 * Used by the settings UI to show exactly what's stored.
 */
export async function getStyleProfileByScope(
  userId: string,
  projectId: string | null
): Promise<StyleProfile | null> {
  const supabase = await createClient()

  let query = supabase
    .from('ltu_style_profiles')
    .select('*')
    .eq('user_id', userId)

  if (projectId) {
    query = query.eq('project_id', projectId)
  } else {
    query = query.is('project_id', null)
  }

  const { data } = await query.single()
  return (data as StyleProfile) ?? null
}
