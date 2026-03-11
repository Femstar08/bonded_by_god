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
      <div className="w-full rounded-lg bg-amber-50/60 border border-amber-200/50 p-6 animate-pulse">
        <div className="h-4 bg-amber-200/40 rounded w-3/4 mb-3" />
        <div className="h-3 bg-amber-200/30 rounded w-1/3" />
      </div>
    )
  }

  if (!scripture) return null

  return (
    <div className="w-full rounded-lg bg-amber-50/60 border border-amber-200/50 p-6">
      <p className="text-sm font-medium text-amber-800/70 mb-2">Daily Scripture</p>
      <p className="font-serif italic text-lg text-amber-950 leading-relaxed">
        &ldquo;{scripture.text}&rdquo;
      </p>
      <p className="mt-2 text-sm font-medium text-amber-700">
        — {scripture.reference}
      </p>
    </div>
  )
}
