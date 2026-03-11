'use server'

import { createClient } from '@/lib/supabase/server'

export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('ltu_projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateProject(projectId: string, data: {
  title?: string
  type?: string
  role?: string
  audience?: string | null
  tone?: string | null
  scripture_focus?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('ltu_projects')
    .update(data)
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
