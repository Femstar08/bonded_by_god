'use server'

import { createClient } from '@/lib/supabase/server'
import type { HierarchyLabels, ProjectType } from '@/types/database'
import type { StructureItem } from '@/components/projects/StructureBuilder'

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
 * Server action that creates a new project row in ltu_projects and, when a
 * `structure` JSON payload is included in the form, replaces the
 * trigger-created "Chapter 1" with the user-defined hierarchy of parts and
 * chapters.
 *
 * FormData fields consumed:
 *  - title, type, role          — required
 *  - audience, tone, scripture_focus — optional strings
 *  - hierarchy_labels           — optional JSON string of HierarchyLabels
 *  - structure                  — optional JSON string of StructureItem[]
 *
 * @param formData - Raw FormData submitted from the project creation form.
 * @returns        A discriminated union carrying either the new project id
 *                 or a descriptive error string.
 */
export async function createProject(formData: FormData): Promise<CreateProjectResult> {
  // ── Extract fields ─────────────────────────────────────────────────────────
  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const type = (formData.get('type') as string | null)?.trim() ?? ''
  const role = (formData.get('role') as string | null)?.trim() ?? ''
  const audience = (formData.get('audience') as string | null)?.trim() || null
  const tone = (formData.get('tone') as string | null)?.trim() || null
  const scripture_focus = (formData.get('scripture_focus') as string | null)?.trim() || null
  const hierarchyLabelsRaw = (formData.get('hierarchy_labels') as string | null)?.trim() || null
  const structureRaw = (formData.get('structure') as string | null)?.trim() || null

  // ── Validate required fields ───────────────────────────────────────────────
  if (!title) return { success: false, error: 'Project title is required.' }
  if (!type) return { success: false, error: 'Project type is required.' }
  if (!role) return { success: false, error: 'Project role is required.' }

  const validTypes: ProjectType[] = [
    'book', 'sermon', 'devotional', 'notes', 'bible_study', 'article', 'other',
  ]
  if (!validTypes.includes(type as ProjectType)) {
    return { success: false, error: `Invalid project type: "${type}".` }
  }

  // ── Parse optional JSON payloads ───────────────────────────────────────────
  let hierarchyLabels: HierarchyLabels | null = null
  if (hierarchyLabelsRaw) {
    try {
      hierarchyLabels = JSON.parse(hierarchyLabelsRaw) as HierarchyLabels
    } catch {
      // Malformed — ignore and keep null; DB default will apply
    }
  }

  let structureItems: StructureItem[] = []
  if (structureRaw) {
    try {
      const parsed = JSON.parse(structureRaw)
      if (Array.isArray(parsed)) {
        structureItems = parsed as StructureItem[]
      }
    } catch {
      // Malformed — fall through to trigger-created "Chapter 1"
    }
  }

  const hasStructure = structureItems.length > 0

  // ── Auth ───────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be signed in to create a project.' }
  }

  // ── Insert project ─────────────────────────────────────────────────────────
  // The on_project_created trigger will fire here and insert "Chapter 1".
  // We'll deal with that below if the user provided their own structure.
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
      ...(hierarchyLabels ? { hierarchy_labels: hierarchyLabels } : {}),
    })
    .select('id')
    .single()

  if (insertError || !data) {
    console.error('[createProject] insert error:', insertError)
    return { success: false, error: 'Failed to create project. Please try again.' }
  }

  const projectId = data.id

  // ── Build custom structure ─────────────────────────────────────────────────
  if (hasStructure) {
    // Step 1: Remove the trigger-created "Chapter 1" (only if it matches the
    // auto-generated title, so we never accidentally delete user content).
    const { data: existingChapters } = await supabase
      .from('ltu_chapters')
      .select('id, title')
      .eq('project_id', projectId)

    if (existingChapters && existingChapters.length > 0) {
      const autoChapterId = existingChapters[0].id
      await supabase
        .from('ltu_chapters')
        .delete()
        .eq('id', autoChapterId)
    }

    // Step 2: Insert parts first so we can resolve their DB ids for chapters.
    // We maintain a map from client temp-id → real DB id.
    const clientToDbId = new Map<string, string>()

    const partItems = structureItems.filter((it) => it.type === 'part')
    if (partItems.length > 0) {
      const partRows = partItems.map((it, idx) => ({
        project_id: projectId,
        title: it.title,
        type: 'part' as const,
        position: idx + 1,
        parent_id: null,
      }))

      const { data: insertedParts, error: partError } = await supabase
        .from('ltu_chapters')
        .insert(partRows)
        .select('id, title')

      if (partError) {
        console.error('[createProject] part insert error:', partError)
        // Non-fatal — the project was created; user can add structure later
        return { success: true, id: projectId }
      }

      // Map client temp-ids to real DB ids by matching insertion order
      partItems.forEach((it, idx) => {
        if (insertedParts && insertedParts[idx]) {
          clientToDbId.set(it.id, insertedParts[idx].id)
        }
      })
    }

    // Step 3: Insert chapters, resolving parentId from the map.
    const chapterItems = structureItems.filter((it) => it.type === 'chapter')
    if (chapterItems.length > 0) {
      // Position within chapters only (separate from part positions)
      let chapterPosition = partItems.length + 1

      const chapterRows = chapterItems.map((it) => {
        const dbParentId = it.parentId ? (clientToDbId.get(it.parentId) ?? null) : null
        return {
          project_id: projectId,
          title: it.title,
          type: 'chapter' as const,
          position: chapterPosition++,
          parent_id: dbParentId,
        }
      })

      const { error: chapterError } = await supabase
        .from('ltu_chapters')
        .insert(chapterRows)

      if (chapterError) {
        console.error('[createProject] chapter insert error:', chapterError)
        // Non-fatal — project exists, partial structure may have been saved
      }
    }
  }

  return { success: true, id: projectId }
}
