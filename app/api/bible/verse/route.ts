import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normaliseScriptureReference } from '@/lib/bible/normalise'
import { fetchVerseTranslations } from '@/lib/bible/client'
import { BibleTranslation } from '@/types/database'

const VALID_TRANSLATIONS: BibleTranslation[] = ['NIV', 'ESV', 'KJV', 'NKJV', 'NASB', 'NLT', 'MSG']

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')
  const translationsParam = searchParams.get('translations')

  if (!ref) {
    return NextResponse.json({ error: 'Missing ref parameter' }, { status: 400 })
  }

  const normalised = normaliseScriptureReference(ref)
  if (!normalised) {
    return NextResponse.json(
      { error: `Reference not recognised: '${ref}'` },
      { status: 400 }
    )
  }

  const requestedTranslations = translationsParam
    ? translationsParam.split(',').map(t => t.trim().toUpperCase())
    : ['NIV', 'ESV', 'KJV']

  const validTranslations = requestedTranslations.filter(
    (t): t is BibleTranslation => VALID_TRANSLATIONS.includes(t as BibleTranslation)
  )

  if (validTranslations.length === 0) {
    return NextResponse.json(
      { error: 'No valid translations requested' },
      { status: 400 }
    )
  }

  const results = await fetchVerseTranslations(normalised, validTranslations)

  return NextResponse.json({
    reference: normalised,
    results,
  })
}
