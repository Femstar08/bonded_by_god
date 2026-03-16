import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BibleTranslation, BibleComparisonLayout } from '@/types/database'

const VALID_TRANSLATIONS: BibleTranslation[] = ['NIV', 'ESV', 'KJV', 'NKJV', 'NASB', 'NLT', 'MSG']
const VALID_LAYOUTS: BibleComparisonLayout[] = ['side_by_side', 'stacked']

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.preferred_translation) {
    if (!VALID_TRANSLATIONS.includes(body.preferred_translation)) {
      return NextResponse.json({ error: 'Invalid translation' }, { status: 400 })
    }
    updates.preferred_translation = body.preferred_translation
  }

  if (body.bible_comparison_layout) {
    if (!VALID_LAYOUTS.includes(body.bible_comparison_layout)) {
      return NextResponse.json({ error: 'Invalid layout' }, { status: 400 })
    }
    updates.bible_comparison_layout = body.bible_comparison_layout
  }

  if (body.bible_translations_count != null) {
    const count = Number(body.bible_translations_count)
    if (count < 2 || count > 4) {
      return NextResponse.json({ error: 'Translations count must be 2, 3, or 4' }, { status: 400 })
    }
    updates.bible_translations_count = count
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ltu_profiles')
    .update(updates)
    .eq('id', user.id)
    .select('preferred_translation, bible_comparison_layout, bible_translations_count')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
