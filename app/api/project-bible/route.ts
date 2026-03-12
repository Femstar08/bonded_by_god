import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS handles ownership check
  const { data: entries, error } = await supabase
    .from('ltu_project_bible_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('category')
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: entries ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { project_id, category, title, content, scripture_refs } = body

  if (!project_id || !category || !title || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get next sort_order for this category
  const { data: existing } = await supabase
    .from('ltu_project_bible_entries')
    .select('sort_order')
    .eq('project_id', project_id)
    .eq('category', category)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing?.length ? (existing[0].sort_order + 1) : 0

  const { data: entry, error } = await supabase
    .from('ltu_project_bible_entries')
    .insert({
      project_id,
      category,
      title,
      content,
      scripture_refs: scripture_refs ?? [],
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entry })
}
