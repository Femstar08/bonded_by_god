import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Section } from '@/types/database'

/**
 * GET /api/writing-map?projectId=X
 * Fetch all sections for a project, grouped by chapter_id.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = request.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ltu_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by chapter_id
  const grouped: Record<string, Section[]> = {}
  for (const section of (data ?? []) as Section[]) {
    if (!grouped[section.chapter_id]) {
      grouped[section.chapter_id] = []
    }
    grouped[section.chapter_id].push(section)
  }

  return NextResponse.json(grouped)
}
