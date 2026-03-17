import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CitationType } from '@/types/database'

const VALID_TYPES: CitationType[] = ['bible', 'book', 'article', 'website', 'dictionary', 'other']

// ---------------------------------------------------------------------------
// GET /api/citations?projectId=xxx
// Returns all citations for a project ordered by sort_order ascending.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS policy guarantees the user can only see citations from their own projects.
  const { data: citations, error } = await supabase
    .from('ltu_citations')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ citations: citations ?? [] })
}

// ---------------------------------------------------------------------------
// POST /api/citations
// Creates a new citation for a project.
// Body: { projectId, type, title?, ...all optional citation fields }
// Returns: { citation }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { projectId, type } = body

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  // Determine the next sort_order for this project so new citations append
  // at the bottom of the list rather than sorting arbitrarily.
  const { data: existing } = await supabase
    .from('ltu_citations')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing?.length ? (existing[0].sort_order + 1) : 0

  const { data: citation, error } = await supabase
    .from('ltu_citations')
    .insert({
      project_id:       projectId,
      type,
      title:            body.title            ?? '',
      bible_reference:  body.bible_reference  ?? null,
      bible_translation:body.bible_translation?? null,
      author:           body.author           ?? null,
      editor:           body.editor           ?? null,
      publisher:        body.publisher        ?? null,
      year:             body.year             ?? null,
      edition:          body.edition          ?? null,
      pages:            body.pages            ?? null,
      city:             body.city             ?? null,
      journal:          body.journal          ?? null,
      volume:           body.volume           ?? null,
      issue:            body.issue            ?? null,
      doi:              body.doi              ?? null,
      url:              body.url              ?? null,
      access_date:      body.access_date      ?? null,
      site_name:        body.site_name        ?? null,
      dictionary_name:  body.dictionary_name  ?? null,
      entry_word:       body.entry_word       ?? null,
      short_label:      body.short_label      ?? null,
      notes:            body.notes            ?? null,
      sort_order:       nextOrder,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ citation }, { status: 201 })
}

// ---------------------------------------------------------------------------
// PATCH /api/citations
// Updates an existing citation.
// Body: { citationId, ...fields to update }
// Returns: { citation }
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { citationId, ...fields } = body

  if (!citationId) {
    return NextResponse.json({ error: 'citationId is required' }, { status: 400 })
  }

  // Build the update object from only the fields that were explicitly provided.
  // Never allow project_id or id to be changed via this endpoint.
  const ALLOWED_FIELDS = [
    'type', 'title',
    'bible_reference', 'bible_translation',
    'author', 'editor', 'publisher', 'year', 'edition', 'pages', 'city',
    'journal', 'volume', 'issue', 'doi',
    'url', 'access_date', 'site_name',
    'dictionary_name', 'entry_word',
    'short_label', 'notes', 'sort_order',
  ] as const

  const updates: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in fields) {
      updates[key] = fields[key]
    }
  }

  // Validate type if it is being changed
  if (updates.type !== undefined && !VALID_TYPES.includes(updates.type as CitationType)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  // RLS ensures the user can only update citations that belong to their own projects.
  const { data: citation, error } = await supabase
    .from('ltu_citations')
    .update(updates)
    .eq('id', citationId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ citation })
}

// ---------------------------------------------------------------------------
// DELETE /api/citations
// Deletes a citation by ID.
// Body: { citationId }
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { citationId } = body

  if (!citationId) {
    return NextResponse.json({ error: 'citationId is required' }, { status: 400 })
  }

  // RLS ensures the user can only delete citations from their own projects.
  const { error } = await supabase
    .from('ltu_citations')
    .delete()
    .eq('id', citationId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
