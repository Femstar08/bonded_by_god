import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deletePart } from '@/lib/actions/chapters'

type RouteContext = { params: Promise<{ chapterId: string }> }

/**
 * PATCH /api/chapters/[chapterId]
 *
 * Accepts: { parent_id?: string | null, title?: string }
 *
 * Updates the chapter row with any supplied fields. Both fields are optional —
 * callers may supply one or both. Supplying `parent_id: null` explicitly
 * detaches the chapter from its current part.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { chapterId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { parent_id?: string | null; title?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if ('parent_id' in body) {
    updates.parent_id = body.parent_id ?? null
  }

  if ('title' in body) {
    const trimmed = (body.title ?? '').trim()
    if (!trimmed) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 422 })
    }
    updates.title = trimmed
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ltu_chapters')
    .update(updates)
    .eq('id', chapterId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ chapter: data })
}

/**
 * DELETE /api/chapters/[chapterId]
 *
 * Accepts an optional JSON body: { deleteMode?: 'merge_previous' | 'ungrouped' | 'delete_all' }
 *
 * Behaviour:
 *  - If the chapter is a `part`, `deleteMode` is required and the appropriate
 *    `deletePart` strategy is executed (child chapters are handled accordingly).
 *  - If the chapter is a regular `chapter`, it is deleted directly.
 *    `deleteMode` is ignored.
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { chapterId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse optional body — a missing or empty body is valid for regular chapters
  let deleteMode: 'merge_previous' | 'ungrouped' | 'delete_all' | undefined
  try {
    const text = await req.text()
    if (text) {
      const body = JSON.parse(text) as { deleteMode?: 'merge_previous' | 'ungrouped' | 'delete_all' }
      deleteMode = body.deleteMode
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Fetch the chapter to determine its type and project
  const { data: chapter, error: fetchError } = await supabase
    .from('ltu_chapters')
    .select('id, type, project_id')
    .eq('id', chapterId)
    .single()

  if (fetchError || !chapter) {
    return NextResponse.json({ error: fetchError?.message ?? 'Chapter not found' }, { status: 404 })
  }

  if (chapter.type === 'part') {
    const VALID_MODES = ['merge_previous', 'ungrouped', 'delete_all'] as const
    if (!deleteMode || !VALID_MODES.includes(deleteMode)) {
      return NextResponse.json(
        { error: 'deleteMode is required for parts and must be merge_previous | ungrouped | delete_all' },
        { status: 422 }
      )
    }

    const result = await deletePart(chapterId, deleteMode, chapter.project_id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  // Regular chapter — delete directly
  const { error: deleteError } = await supabase
    .from('ltu_chapters')
    .delete()
    .eq('id', chapterId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
