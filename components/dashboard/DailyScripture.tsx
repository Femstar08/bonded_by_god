'use client'

import { useEffect, useState } from 'react'

interface DailyScriptureProps {
  showDailyScripture: boolean
}

interface ScriptureData {
  reference: string
  text: string
}

export function DailyScripture({ showDailyScripture }: DailyScriptureProps) {
  const [scripture, setScripture] = useState<ScriptureData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!showDailyScripture) {
      setLoading(false)
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `bbg_daily_scripture_${today}`

    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        setScripture(JSON.parse(cached))
        setLoading(false)
        return
      } catch {
        // ignore bad cache
      }
    }

    fetch('/api/daily-scripture')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data: ScriptureData) => {
        setScripture(data)
        localStorage.setItem(cacheKey, JSON.stringify(data))
      })
      .catch(() => {
        // Silently hide on error
      })
      .finally(() => setLoading(false))
  }, [showDailyScripture])

  if (!showDailyScripture) return null

  if (loading) {
    return (
      <div className="w-full rounded-2xl bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-transparent border border-amber-200/30 p-8 animate-pulse">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-3 bg-amber-100/30 rounded w-4" />
          <div className="h-3 bg-amber-100/30 rounded w-24" />
        </div>
        <div className="h-4 bg-amber-100/30 rounded w-full mb-3" />
        <div className="h-4 bg-amber-100/30 rounded w-5/6 mb-3" />
        <div className="h-4 bg-amber-100/30 rounded w-4/6 mb-4" />
        <div className="h-3 bg-amber-100/30 rounded w-1/4" />
      </div>
    )
  }

  if (!scripture) return null

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-transparent border border-amber-200/30 p-8">
      {/* Decorative header: icon + label */}
      <div className="flex items-center gap-2 mb-5">
        <svg
          viewBox="0 0 16 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-amber-400/40 shrink-0"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="5" y1="1" x2="5" y2="19" stroke="currentColor" strokeWidth="1.5" />
          <line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.2" />
          <line x1="5" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-amber-700/50">
          Daily Scripture
        </span>
      </div>

      {/* Decorative opening quotation mark */}
      <div className="text-4xl font-serif text-amber-300/40 leading-none mb-1" aria-hidden="true">
        &ldquo;
      </div>

      {/* Scripture body */}
      <p className="font-serif text-xl text-foreground leading-relaxed font-normal">
        {scripture.text}
      </p>

      {/* Reference */}
      <p className="text-[13px] font-medium text-amber-600/70 mt-4">
        {scripture.reference}
      </p>
    </div>
  )
}
