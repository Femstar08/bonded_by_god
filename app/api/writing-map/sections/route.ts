import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/writing-map/sections
 * Create a blank section for a chapter.
 * Body: { chapterId, projectId, title, position }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chapterId, projectId, title, position } = await request.json()
  if (!chapterId || !projectId || !title) {
    return NextResponse.json({ error: 'Missing chapterId, projectId, or title' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ltu_sections')
    .insert({
      chapter_id: chapterId,
      project_id: projectId,
      title,
      status: 'empty',
      position: position ?? 1,
      summary: '',
      synopsis: '',
      notes: '',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ section: data }, { status: 201 })
}

/**
 * PATCH /api/writing-map/sections
 * Update a section's status, title, notes, or summary.
 * Body: { sectionId, status?, title?, notes?, summary? }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sectionId, ...updates } = await request.json()
  if (!sectionId) {
    return NextResponse.json({ error: 'Missing sectionId' }, { status: 400 })
  }

  // Only allow specific fields
  const allowed: Record<string, unknown> = {}
  if (updates.status) allowed.status = updates.status
  if (updates.title !== undefined) allowed.title = updates.title
  if (updates.notes !== undefined) allowed.notes = updates.notes
  if (updates.summary !== undefined) allowed.summary = updates.summary

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('ltu_sections')
    .update(allowed)
    .eq('id', sectionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/writing-map/sections
 * Delete a section or all sections for a chapter.
 * Body: { sectionId } or { chapterId }
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sectionId, chapterId } = await request.json()

  if (sectionId) {
    const { error } = await supabase
      .from('ltu_sections')
      .delete()
      .eq('id', sectionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else if (chapterId) {
    const { error } = await supabase
      .from('ltu_sections')
      .delete()
      .eq('chapter_id', chapterId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: 'Missing sectionId or chapterId' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
