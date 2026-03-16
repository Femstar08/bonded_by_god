/**
 * Server-side Bible API client.
 * Fetches verse text from bible-api.com (free, KJV/ASV/WEB)
 * and API.Bible (keyed, for NIV/ESV/NKJV/NASB/NLT/MSG).
 */

import { BibleTranslation, TranslationVerse } from '@/types/database'

// bible-api.com supports these translations (free, no key)
const FREE_TRANSLATIONS: Record<string, string> = {
  KJV: 'kjv',
  ASV: 'asv',
  WEB: 'web',
}

// API.Bible translation IDs (from api.scripture.api.bible)
// These are the Bible IDs for each translation in API.Bible
const API_BIBLE_IDS: Record<string, string> = {
  NIV: 'de4e12af7f28f599-02',
  ESV: '01b29f4b342c6571-01',
  NKJV: 'de4e12af7f28f599-01',
  NASB: 'a]567b1eed7e2039-01',
  NLT: '65eec8e0b60e656b-01',
  MSG: 'bf8f1c7f3f9045a5-01',
}

/**
 * Fetch a verse from bible-api.com (free endpoint).
 */
async function fetchFromBibleApi(
  reference: string,
  translationCode: string
): Promise<string | null> {
  try {
    const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=${translationCode}`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null

    const data = await res.json()
    if (data.error) return null

    // bible-api.com returns { text: "verse text", ... }
    return data.text?.trim() || null
  } catch {
    return null
  }
}

/**
 * Fetch a verse from API.Bible (requires BIBLE_API_KEY).
 */
async function fetchFromApiBible(
  reference: string,
  bibleId: string
): Promise<string | null> {
  const apiKey = process.env.BIBLE_API_KEY
  if (!apiKey) return null

  try {
    // API.Bible uses a passage search endpoint
    const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/search?query=${encodeURIComponent(reference)}&limit=1`
    const res = await fetch(url, {
      headers: { 'api-key': apiKey },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null

    const data = await res.json()
    const passages = data.data?.passages
    if (!passages || passages.length === 0) {
      // Try verses endpoint as fallback
      const verses = data.data?.verses
      if (verses && verses.length > 0) {
        return verses.map((v: { text: string }) => v.text.trim()).join(' ')
      }
      return null
    }

    // Strip HTML tags from the passage content
    const content = passages[0].content || ''
    return content.replace(/<[^>]*>/g, '').trim() || null
  } catch {
    return null
  }
}

/**
 * Fetch a single verse in a specific translation.
 */
async function fetchVerse(
  reference: string,
  translation: BibleTranslation
): Promise<TranslationVerse> {
  // Try free API first for supported translations
  if (FREE_TRANSLATIONS[translation]) {
    const text = await fetchFromBibleApi(reference, FREE_TRANSLATIONS[translation])
    if (text) {
      return { translation, text, available: true }
    }
  }

  // Try API.Bible for keyed translations
  if (API_BIBLE_IDS[translation]) {
    const text = await fetchFromApiBible(reference, API_BIBLE_IDS[translation])
    if (text) {
      return { translation, text, available: true }
    }
  }

  // For KJV, always try the free fallback
  if (translation === 'KJV') {
    const text = await fetchFromBibleApi(reference, 'kjv')
    if (text) {
      return { translation, text, available: true }
    }
  }

  return {
    translation,
    text: '',
    available: false,
  }
}

/**
 * Fetch a verse in multiple translations in parallel.
 */
export async function fetchVerseTranslations(
  reference: string,
  translations: BibleTranslation[]
): Promise<TranslationVerse[]> {
  const results = await Promise.allSettled(
    translations.map(t => fetchVerse(reference, t))
  )

  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value
    return { translation: translations[i], text: '', available: false }
  })
}
