import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CitationStyle, FootnoteStyle } from '@/types/database'

const VALID_CITATION_STYLES: CitationStyle[] = ['chicago', 'apa', 'mla']
const VALID_FOOTNOTE_STYLES: FootnoteStyle[] = ['footnote', 'endnote']

// ---------------------------------------------------------------------------
// GET /api/settings/citation?projectId=xxx
// Returns the citation_style and footnote_style for a project.
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

  const { data, error } = await supabase
    .from('ltu_projects')
    .select('citation_style, footnote_style')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    // Treat "not found" as a 404 so the caller can distinguish it from a 500.
    const status = error.code === 'PGRST116' ? 404 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json(data)
}

// ---------------------------------------------------------------------------
// POST /api/settings/citation
// Updates citation_style and/or footnote_style for a project.
// Body: { projectId, citation_style?, footnote_style? }
// Returns the updated fields.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { projectId } = body

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (body.citation_style !== undefined) {
    if (!VALID_CITATION_STYLES.includes(body.citation_style)) {
      return NextResponse.json(
        { error: `citation_style must be one of: ${VALID_CITATION_STYLES.join(', ')}` },
        { status: 400 }
      )
    }
    updates.citation_style = body.citation_style
  }

  if (body.footnote_style !== undefined) {
    if (!VALID_FOOTNOTE_STYLES.includes(body.footnote_style)) {
      return NextResponse.json(
        { error: `footnote_style must be one of: ${VALID_FOOTNOTE_STYLES.join(', ')}` },
        { status: 400 }
      )
    }
    updates.footnote_style = body.footnote_style
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Scope the update to the authenticated user's project so a user cannot
  // modify settings for a project they do not own.
  const { data, error } = await supabase
    .from('ltu_projects')
    .update(updates)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select('citation_style, footnote_style')
    .single()

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json(data)
}
