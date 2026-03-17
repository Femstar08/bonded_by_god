'use client'

import { useState, useEffect, useRef } from 'react'
import { CitationStyleSelector } from './CitationStyleSelector'
import type { CitationStyleType, FootnoteStyleType } from './CitationStyleSelector'

// ---------------------------------------------------------------------------
// CitationSettings
// Wraps CitationStyleSelector and auto-saves to /api/settings/citation.
// ---------------------------------------------------------------------------

export interface CitationSettingsProps {
  projectId: string
  initialStyle: CitationStyleType
  initialFootnoteStyle: FootnoteStyleType
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function CitationSettings({
  projectId,
  initialStyle,
  initialFootnoteStyle,
}: CitationSettingsProps) {
  const [style, setStyle] = useState<CitationStyleType>(initialStyle)
  const [footnoteStyle, setFootnoteStyle] = useState<FootnoteStyleType>(initialFootnoteStyle)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Debounce auto-save: wait 600ms after the last change
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  const triggerSave = (
    newStyle: CitationStyleType,
    newFootnoteStyle: FootnoteStyleType
  ) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const res = await fetch('/api/settings/citation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            citationStyle: newStyle,
            footnoteStyle: newFootnoteStyle,
          }),
        })
        if (!res.ok) throw new Error('Save failed')
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    }, 600)
  }

  // Don't fire on initial mount
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    triggerSave(style, footnoteStyle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, footnoteStyle])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const handleStyleChange = (newStyle: CitationStyleType) => {
    setStyle(newStyle)
  }

  const handleFootnoteStyleChange = (newFootnoteStyle: FootnoteStyleType) => {
    setFootnoteStyle(newFootnoteStyle)
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-medium text-foreground mb-0.5">
            Citation &amp; References
          </h3>
          <p className="text-[13px] text-muted-foreground/60">
            Choose how citations are formatted throughout your project
          </p>
        </div>

        {/* Auto-save status indicator */}
        <div className="shrink-0 text-[11px] font-medium tabular-nums">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-amber-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-3.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  clipRule="evenodd"
                />
              </svg>
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600">Save failed</span>
          )}
        </div>
      </div>

      {/* Selector */}
      <CitationStyleSelector
        currentStyle={style}
        footnoteStyle={footnoteStyle}
        onStyleChange={handleStyleChange}
        onFootnoteStyleChange={handleFootnoteStyleChange}
      />
    </div>
  )
}
