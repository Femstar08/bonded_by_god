'use client'

import { BibleTranslation, TranslationVerse } from '@/types/database'
import { referenceToCacheKey } from '@/lib/bible/normalise'

const CACHE_PREFIX = 'scriptloom:verse:'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEntry {
  text: string
  fetchedAt: number
}

function storageKey(translation: BibleTranslation, reference: string): string {
  return `${CACHE_PREFIX}${translation}:${referenceToCacheKey(reference)}`
}

export function getCachedVerse(
  reference: string,
  translation: BibleTranslation
): string | null {
  try {
    const raw = localStorage.getItem(storageKey(translation, reference))
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.fetchedAt > TTL_MS) {
      localStorage.removeItem(storageKey(translation, reference))
      return null
    }
    return entry.text
  } catch {
    return null
  }
}

export function setCachedVerse(
  reference: string,
  translation: BibleTranslation,
  text: string
): void {
  try {
    const entry: CacheEntry = { text, fetchedAt: Date.now() }
    localStorage.setItem(storageKey(translation, reference), JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — silently degrade
  }
}

export function cleanExpiredCache(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key)
    }
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const entry: CacheEntry = JSON.parse(raw)
        if (Date.now() - entry.fetchedAt > TTL_MS) {
          localStorage.removeItem(key)
        }
      } catch {
        localStorage.removeItem(key)
      }
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Fetch verses with cache-first strategy.
 * Returns cached results instantly and fetches uncached ones from the API.
 */
export async function fetchVersesWithCache(
  reference: string,
  translations: BibleTranslation[]
): Promise<TranslationVerse[]> {
  const cached: TranslationVerse[] = []
  const uncached: BibleTranslation[] = []

  for (const t of translations) {
    const text = getCachedVerse(reference, t)
    if (text) {
      cached.push({ translation: t, text, available: true })
    } else {
      uncached.push(t)
    }
  }

  if (uncached.length === 0) return cached

  try {
    const params = new URLSearchParams({
      ref: reference,
      translations: uncached.join(','),
    })
    const res = await fetch(`/api/bible/verse?${params}`)
    if (!res.ok) return cached

    const data = await res.json()
    const fetched: TranslationVerse[] = data.results || []

    // Cache the fetched results
    for (const verse of fetched) {
      if (verse.available && verse.text) {
        setCachedVerse(reference, verse.translation, verse.text)
      }
    }

    return [...cached, ...fetched]
  } catch {
    return cached
  }
}
