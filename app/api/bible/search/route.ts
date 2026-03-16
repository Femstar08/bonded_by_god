import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normaliseScriptureReference } from '@/lib/bible/normalise'
import { extractScriptureReferences } from '@/lib/memory/scripture-regex'
import { fetchVerseTranslations } from '@/lib/bible/client'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || !query.trim()) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 })
  }

  // First, try to parse the query as a direct Scripture reference
  const normalised = normaliseScriptureReference(query)
  if (normalised) {
    // Fetch a preview in KJV (free, no key required)
    const verses = await fetchVerseTranslations(normalised, ['KJV'])
    const preview = verses[0]?.available
      ? verses[0].text.slice(0, 80) + (verses[0].text.length > 80 ? '...' : '')
      : ''

    return NextResponse.json({
      matches: [{ reference: normalised, preview }],
    })
  }

  // Try extracting references from the query text
  const extracted = extractScriptureReferences(query)
  if (extracted.length > 0) {
    const matches = await Promise.all(
      extracted.slice(0, 5).map(async (ref) => {
        const norm = normaliseScriptureReference(ref) || ref
        const verses = await fetchVerseTranslations(norm, ['KJV'])
        const preview = verses[0]?.available
          ? verses[0].text.slice(0, 80) + (verses[0].text.length > 80 ? '...' : '')
          : ''
        return { reference: norm, preview }
      })
    )
    return NextResponse.json({ matches })
  }

  // No recognisable references found
  return NextResponse.json({
    matches: [],
    message: 'No matching references found. Try a format like "Romans 8:28" or "Ps 23:1".',
  })
}
