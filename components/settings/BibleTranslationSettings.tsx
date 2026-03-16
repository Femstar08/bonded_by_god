'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BibleTranslation, BibleComparisonLayout } from '@/types/database'

const TRANSLATIONS: { value: BibleTranslation; label: string }[] = [
  { value: 'NIV', label: 'NIV — New International Version' },
  { value: 'ESV', label: 'ESV — English Standard Version' },
  { value: 'KJV', label: 'KJV — King James Version' },
  { value: 'NKJV', label: 'NKJV — New King James Version' },
  { value: 'NASB', label: 'NASB — New American Standard Bible' },
  { value: 'NLT', label: 'NLT — New Living Translation' },
  { value: 'MSG', label: 'MSG — The Message' },
]

interface BibleTranslationSettingsProps {
  userId: string
  initialPreferredTranslation: BibleTranslation
  initialLayout: BibleComparisonLayout
  initialTranslationsCount: number
}

export function BibleTranslationSettings({
  userId,
  initialPreferredTranslation,
  initialLayout,
  initialTranslationsCount,
}: BibleTranslationSettingsProps) {
  const [preferred, setPreferred] = useState<BibleTranslation>(initialPreferredTranslation)
  const [layout, setLayout] = useState<BibleComparisonLayout>(initialLayout)
  const [count, setCount] = useState(initialTranslationsCount)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasChanges =
    preferred !== initialPreferredTranslation ||
    layout !== initialLayout ||
    count !== initialTranslationsCount

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings/bible', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_translation: preferred,
          bible_comparison_layout: layout,
          bible_translations_count: count,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // Handle silently
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[15px] font-medium text-foreground mb-1">Scripture & Bible</h3>
        <p className="text-[13px] text-muted-foreground/60">
          Configure your preferred Bible translation and comparison settings
        </p>
      </div>

      {/* Preferred Translation */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="preferred-translation">
          Default Translation
        </label>
        <select
          id="preferred-translation"
          value={preferred}
          onChange={(e) => setPreferred(e.target.value as BibleTranslation)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {TRANSLATIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Comparison Layout */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Comparison Layout</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLayout('side_by_side')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
              layout === 'side_by_side'
                ? 'border-amber-500 bg-amber-50 text-amber-800 font-medium'
                : 'border-input text-muted-foreground hover:bg-muted'
            }`}
          >
            Side by Side
          </button>
          <button
            type="button"
            onClick={() => setLayout('stacked')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
              layout === 'stacked'
                ? 'border-amber-500 bg-amber-50 text-amber-800 font-medium'
                : 'border-input text-muted-foreground hover:bg-muted'
            }`}
          >
            Stacked
          </button>
        </div>
      </div>

      {/* Translations Count */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Translations to Show</label>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={`w-12 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                count === n
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-input text-muted-foreground hover:bg-muted'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="bg-amber-600 hover:bg-amber-700 text-white"
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </Button>
    </div>
  )
}
