'use server'

import { createClient } from '@/lib/supabase/server'
import type { ProjectType } from '@/types/database'

export type CreateProjectInput = {
  title: string
  type: ProjectType
  role: string
  audience?: string | null
  tone?: string | null
  scripture_focus?: string | null
}

export type CreateProjectResult =
  | { success: true; id: string }
  | { success: false; error: string }

/**
 * Server action that creates a new project row in ltu_projects.
 *
 * Validates the three required fields (title, type, role), resolves the
 * authenticated user from the Supabase server client, then performs the
 * INSERT and returns the generated project id on success.
 *
 * @param formData - Raw FormData submitted from the project creation form.
 * @returns       - A discriminated union carrying either the new project id
 *                  or a descriptive error string.
 */
export async function createProject(formData: FormData): Promise<CreateProjectResult> {
  // Extract fields from the submitted form
  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const type = (formData.get('type') as string | null)?.trim() ?? ''
  const role = (formData.get('role') as string | null)?.trim() ?? ''
  const audience = (formData.get('audience') as string | null)?.trim() || null
  const tone = (formData.get('tone') as string | null)?.trim() || null
  const scripture_focus = (formData.get('scripture_focus') as string | null)?.trim() || null

  // Validate required fields before touching the database
  if (!title) {
    return { success: false, error: 'Project title is required.' }
  }
  if (!type) {
    return { success: false, error: 'Project type is required.' }
  }
  if (!role) {
    return { success: false, error: 'Project role is required.' }
  }

  const validTypes: ProjectType[] = [
    'book',
    'sermon',
    'devotional',
    'notes',
    'bible_study',
    'article',
    'other',
  ]
  if (!validTypes.includes(type as ProjectType)) {
    return { success: false, error: `Invalid project type: "${type}".` }
  }

  // Resolve the authenticated user via the server Supabase client
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be signed in to create a project.' }
  }

  // Insert the project; user_id is sourced from the server session, never
  // from the form, so the RLS WITH CHECK (auth.uid() = user_id) will always
  // pass and the value cannot be spoofed by the client.
  const { data, error: insertError } = await supabase
    .from('ltu_projects')
    .insert({
      user_id: user.id,
      title,
      type: type as ProjectType,
      role,
      audience,
      tone,
      scripture_focus,
    })
    .select('id')
    .single()

  if (insertError || !data) {
    console.error('[createProject] insert error:', insertError)
    return { success: false, error: 'Failed to create project. Please try again.' }
  }

  return { success: true, id: data.id }
}
