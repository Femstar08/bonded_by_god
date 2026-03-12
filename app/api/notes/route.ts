import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { title, content, tags, event_name } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Check for duplicate title (prevent double-save)
    const { data: existing } = await supabase
      .from('ltu_notes')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', title)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already saved to Notes Vault.', duplicate: true }, { status: 409 })
    }

    const { data, error } = await supabase.from('ltu_notes').insert({
      user_id: user.id,
      title,
      content,
      event_name: event_name || null,
      tags: tags || [],
    }).select('id').single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
