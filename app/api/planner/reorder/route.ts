import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PositionUpdate {
  id: string
  position: number
}

interface ReorderBody {
  type: 'chapter' | 'section'
  updates: PositionUpdate[]
  sectionChapterUpdate?: {
    sectionId: string
    newChapterId: string
  }
}

/**
 * POST /api/planner/reorder
 *
 * Batch-updates positions for chapters or sections after a drag-and-drop
 * reorder. Optionally moves a section to a different chapter when the user
 * drags it across chapter boundaries.
 *
 * Request body:
 * {
 *   type: "chapter" | "section",
 *   updates: [{ id, position }, ...],
 *   sectionChapterUpdate?: { sectionId, newChapterId }  // optional
 * }
 *
 * Response: { success: true }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: ReorderBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { type, updates, sectionChapterUpdate } = body

  if (!type || !['chapter', 'section'].includes(type)) {
    return NextResponse.json(
      { error: 'type must be "chapter" or "section"' },
      { status: 400 }
    )
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'updates array is required and must not be empty' }, { status: 400 })
  }

  const table = type === 'chapter' ? 'ltu_chapters' : 'ltu_sections'

  // Loop through each position update. Supabase does not support a single
  // batched positional upsert via the JS client, so we run individual updates.
  // RLS on both tables ensures users can only update rows they own.
  for (const { id, position } of updates) {
    if (!id || typeof position !== 'number') {
      return NextResponse.json(
        { error: `Invalid update entry: id and numeric position are required` },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from(table)
      .update({ position })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Optionally move a section to a different parent chapter
  if (sectionChapterUpdate) {
    const { sectionId, newChapterId } = sectionChapterUpdate

    if (!sectionId || !newChapterId) {
      return NextResponse.json(
        { error: 'sectionChapterUpdate requires sectionId and newChapterId' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('ltu_sections')
      .update({ chapter_id: newChapterId })
      .eq('id', sectionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
