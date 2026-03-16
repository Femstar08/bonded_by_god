'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BibleTranslation,
  BibleComparisonLayout,
  TranslationVerse,
} from '@/types/database'
import { fetchVersesWithCache } from '@/lib/hooks/useVerseCache'

const ALL_TRANSLATIONS: BibleTranslation[] = ['NIV', 'ESV', 'KJV', 'NKJV', 'NASB', 'NLT', 'MSG']

const DEFAULT_ORDER: BibleTranslation[] = ['NIV', 'ESV', 'KJV']

interface TranslationComparisonPanelProps {
  reference: string
  onInsert?: (text: string, translation: BibleTranslation) => void
  onClose: () => void
  preferredTranslation?: BibleTranslation
  layout?: BibleComparisonLayout
  translationsCount?: number
}

export function TranslationComparisonPanel({
  reference,
  onInsert,
  onClose,
  preferredTranslation = 'NIV',
  layout: initialLayout = 'side_by_side',
  translationsCount = 3,
}: TranslationComparisonPanelProps) {
  const [layout, setLayout] = useState<BibleComparisonLayout>(initialLayout)
  const [activeTranslations, setActiveTranslations] = useState<BibleTranslation[]>(() => {
    const initial: BibleTranslation[] = [preferredTranslation]
    for (const t of DEFAULT_ORDER) {
      if (!initial.includes(t) && initial.length < translationsCount) {
        initial.push(t)
      }
    }
    return initial
  })
  const [verses, setVerses] = useState<TranslationVerse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  // Responsive: force stacked on small viewports
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    if (mq.matches) setLayout('stacked')
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setLayout('stacked')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const loadVerses = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const results = await fetchVersesWithCache(reference, activeTranslations)
      setVerses(results)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [reference, activeTranslations])

  useEffect(() => {
    loadVerses()
  }, [loadVerses])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const toggleTranslation = (t: BibleTranslation) => {
    setActiveTranslations((prev) => {
      if (prev.includes(t)) {
        if (prev.length <= 1) return prev // Must have at least 1
        return prev.filter((x) => x !== t)
      }
      if (prev.length >= 4) {
        // Replace the oldest (first) non-preferred translation
        const replaced = [...prev]
        replaced.shift()
        return [...replaced, t]
      }
      return [...prev, t]
    })
  }

  const handleCopyAll = async () => {
    const text = verses
      .filter((v) => v.available && activeTranslations.includes(v.translation))
      .map((v) => `[${v.translation}]\n${v.text}`)
      .join('\n\n')
    await navigator.clipboard.writeText(`${reference}\n\n${text}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getVerseForTranslation = (t: BibleTranslation) =>
    verses.find((v) => v.translation === t)

  return (
    <div className="border border-amber-200 rounded-lg bg-amber-50/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200">
        <span className="font-serif font-semibold text-sm text-amber-900 truncate">
          {reference}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Layout toggle */}
          <button
            type="button"
            onClick={() => setLayout(layout === 'side_by_side' ? 'stacked' : 'side_by_side')}
            className="p-1 rounded hover:bg-amber-100 text-amber-700 transition-colors"
            title={layout === 'side_by_side' ? 'Switch to stacked' : 'Switch to side by side'}
          >
            {layout === 'side_by_side' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
                <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h11A2.5 2.5 0 0 1 18 4.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 2 15.5v-11Zm8.5 0v11h5a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-5Zm-1 0h-5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h5v-11Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
                <path fillRule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.166a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          {/* Copy All */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAll}
            disabled={loading || verses.length === 0}
            className="h-6 px-2 text-[10px] text-amber-700 hover:bg-amber-100"
          >
            {copied ? 'Copied!' : 'Copy All'}
          </Button>
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-amber-100 text-amber-700 transition-colors"
            aria-label="Close comparison panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Translation pills */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-amber-100">
        {ALL_TRANSLATIONS.map((t) => {
          const isActive = activeTranslations.includes(t)
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleTranslation(t)}
              disabled={!isActive && activeTranslations.length >= 4}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                isActive
                  ? 'bg-amber-600 text-white'
                  : activeTranslations.length >= 4
                  ? 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="px-3 py-4 text-center">
          <p className="text-sm text-destructive mb-2">Failed to load translations</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadVerses}
            className="border-amber-200 hover:bg-amber-50 text-amber-800"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Verse content */}
      {!error && (
        <div
          className={
            layout === 'side_by_side'
              ? `grid gap-0 divide-x divide-amber-100 max-h-64 overflow-y-auto`
              : 'flex flex-col divide-y divide-amber-100 max-h-64 overflow-y-auto'
          }
          style={
            layout === 'side_by_side'
              ? { gridTemplateColumns: `repeat(${activeTranslations.length}, 1fr)` }
              : undefined
          }
        >
          {activeTranslations.map((t) => {
            const verse = getVerseForTranslation(t)
            const isLoading = loading && !verse
            return (
              <div key={t} className="px-3 py-2 flex flex-col gap-1.5">
                <Badge className="w-fit bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                  {t}
                </Badge>
                {isLoading ? (
                  <div className="space-y-1.5 animate-pulse">
                    <div className="h-3 bg-amber-100 rounded w-full" />
                    <div className="h-3 bg-amber-100 rounded w-5/6" />
                    <div className="h-3 bg-amber-100 rounded w-4/6" />
                  </div>
                ) : verse?.available ? (
                  <>
                    <p className="text-sm leading-relaxed text-foreground">
                      {verse.text}
                    </p>
                    {onInsert && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onInsert(verse.text, t)}
                        className="self-start h-6 px-2 text-[10px] border-amber-200 hover:bg-amber-100 text-amber-800 mt-1"
                      >
                        Insert
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {t === 'MSG'
                      ? 'The Message presents this passage differently — try the surrounding verses'
                      : `Not available in ${t}`}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
