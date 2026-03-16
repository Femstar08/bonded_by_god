'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ChapterStatus, ColorLabel, SectionStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from './StatusBadge'
import type { PlannerChapter, PlannerSection } from './BoardView'

interface ChapterDetailPanelProps {
  chapter: PlannerChapter | null
  projectType: string
  isOpen: boolean
  onClose: () => void
  onUpdate: (chapterId: string, updates: Partial<PlannerChapter>) => void
  onNavigateToEditor: (chapterId: string) => void
}

// ─── Color label constants ─────────────────────────────────
const COLOR_LABEL_HEX: Record<NonNullable<ColorLabel>, string> = {
  red: '#E57373',
  orange: '#FFB74D',
  yellow: '#FFF176',
  green: '#81C784',
  teal: '#4DB6AC',
  blue: '#64B5F6',
  purple: '#BA68C8',
}

const ALL_COLOR_LABELS = Object.keys(COLOR_LABEL_HEX) as NonNullable<ColorLabel>[]

const STATUS_OPTIONS: ChapterStatus[] = [
  'not_started',
  'in_progress',
  'draft',
  'revision',
  'complete',
]

const STATUS_LABELS: Record<ChapterStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  draft: 'Draft',
  revision: 'Revision',
  complete: 'Complete',
}

function getProjectLabels(projectType: string) {
  if (projectType === 'sermon') return { chapter: 'Sermon', section: 'Point' }
  return { chapter: 'Chapter', section: 'Section' }
}

export function ChapterDetailPanel({
  chapter,
  projectType,
  isOpen,
  onClose,
  onUpdate,
  onNavigateToEditor,
}: ChapterDetailPanelProps) {
  const labels = getProjectLabels(projectType)

  const [synopsis, setSynopsis] = useState(chapter?.synopsis ?? '')
  const [wordGoal, setWordGoal] = useState(String(chapter?.word_goal ?? 0))
  const [generatingSynopsis, setGeneratingSynopsis] = useState(false)
  const [synopsisError, setSynopsisError] = useState<string | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local state when chapter prop changes
  useEffect(() => {
    setSynopsis(chapter?.synopsis ?? '')
    setWordGoal(String(chapter?.word_goal ?? 0))
  }, [chapter?.id, chapter?.synopsis, chapter?.word_goal])

  // Auto-save synopsis with 600ms debounce
  const scheduleSave = useCallback(
    (updates: Partial<PlannerChapter>) => {
      if (!chapter) return
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        onUpdate(chapter.id, updates)
      }, 600)
    },
    [chapter, onUpdate]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const handleSynopsisChange = (value: string) => {
    setSynopsis(value)
    scheduleSave({ synopsis: value })
  }

  const handleStatusChange = (value: string) => {
    if (!chapter) return
    const status = value as ChapterStatus
    onUpdate(chapter.id, { status })
  }

  const handleColorChange = (color: ColorLabel) => {
    if (!chapter) return
    onUpdate(chapter.id, { color_label: color })
  }

  const handleWordGoalBlur = () => {
    if (!chapter) return
    const parsed = parseInt(wordGoal, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdate(chapter.id, { word_goal: parsed })
    } else {
      setWordGoal(String(chapter.word_goal ?? 0))
    }
  }

  const handleGenerateSynopsis = async () => {
    if (!chapter) return
    setGeneratingSynopsis(true)
    setSynopsisError(null)
    try {
      const res = await fetch('/api/planner/synopsis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: chapter.id }),
      })
      const data = await res.json()
      if (res.ok && data.synopsis) {
        setSynopsis(data.synopsis)
        onUpdate(chapter.id, { synopsis: data.synopsis })
      } else {
        setSynopsisError(data.error ?? 'Could not generate synopsis. Please try again.')
      }
    } catch {
      setSynopsisError('Network error. Please try again.')
    } finally {
      setGeneratingSynopsis(false)
    }
  }

  // Keyboard: Escape to close
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const borderColor = chapter?.color_label
    ? COLOR_LABEL_HEX[chapter.color_label]
    : '#e2e8f0'

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={chapter ? `${chapter.title} details` : 'Chapter details'}
        className={`fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ borderLeft: `4px solid ${borderColor}` }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0f1a2e] text-white shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] text-white/50 uppercase tracking-widest mb-0.5">
              {labels.chapter} Details
            </p>
            <h2 className="font-serif text-base font-semibold truncate text-amber-100">
              {chapter
                ? `${chapter.position}. ${chapter.title}`
                : 'Select a chapter'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 rounded hover:bg-white/10 transition-colors"
            aria-label="Close panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {!chapter ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-8 text-center">
            Click a chapter card to view and edit its details.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-5 space-y-5">
              {/* Status + word count row */}
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-slate-500">Status</Label>
                  <Select value={chapter.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-28 space-y-1.5">
                  <Label className="text-xs text-slate-500">Word Goal</Label>
                  <Input
                    type="number"
                    value={wordGoal}
                    min={0}
                    onChange={(e) => setWordGoal(e.target.value)}
                    onBlur={handleWordGoalBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleWordGoalBlur()}
                    className="h-8 text-xs"
                    aria-label="Word goal for this chapter"
                  />
                </div>
              </div>

              {/* Word count display */}
              {chapter.word_count > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 rounded-full bg-slate-100 flex-1 overflow-hidden"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{
                        width:
                          chapter.word_goal > 0
                            ? `${Math.min((chapter.word_count / chapter.word_goal) * 100, 100)}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {chapter.word_count.toLocaleString()}
                    {chapter.word_goal > 0 && ` / ${chapter.word_goal.toLocaleString()}`} words
                  </span>
                </div>
              )}

              {/* Color label */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Color Label</Label>
                <div className="flex items-center gap-2">
                  {/* Clear */}
                  <button
                    type="button"
                    onClick={() => handleColorChange(null)}
                    className={`size-6 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
                      chapter.color_label === null
                        ? 'border-slate-500 scale-110'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    title="No color"
                    aria-label="Remove color label"
                    aria-pressed={chapter.color_label === null}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-3 text-slate-400"
                      aria-hidden="true"
                    >
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>

                  {ALL_COLOR_LABELS.map((colorKey) => (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => handleColorChange(colorKey)}
                      className={`size-6 rounded-full border-2 transition-all ${
                        chapter.color_label === colorKey
                          ? 'border-slate-600 scale-125 shadow-sm'
                          : 'border-white shadow hover:scale-110'
                      }`}
                      style={{ backgroundColor: COLOR_LABEL_HEX[colorKey] }}
                      aria-label={`${colorKey} label`}
                      aria-pressed={chapter.color_label === colorKey}
                      title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                    />
                  ))}
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-500">Synopsis</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSynopsis}
                    disabled={generatingSynopsis}
                    className="h-6 px-2 text-[10px] text-amber-700 hover:bg-amber-50 gap-1"
                  >
                    {generatingSynopsis ? (
                      <>
                        <svg
                          className="size-3 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Generating…
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-3"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 16.5 0 8.25 8.25 0 0 1-16.5 0Zm4.5-1.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Zm6 0a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Zm-3 1.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Generate Synopsis
                      </>
                    )}
                  </Button>
                </div>

                <Textarea
                  value={synopsis}
                  onChange={(e) => handleSynopsisChange(e.target.value)}
                  placeholder={`Describe what happens in this ${labels.chapter.toLowerCase()}…`}
                  className="text-xs resize-none min-h-[100px] leading-relaxed"
                  rows={5}
                />

                {synopsisError && (
                  <p className="text-xs text-red-500">{synopsisError}</p>
                )}
              </div>

              {/* Sections list */}
              {chapter.sections.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">
                    {labels.section}s ({chapter.sections.length})
                  </Label>
                  <div className="space-y-1.5">
                    {chapter.sections.map((section: PlannerSection) => (
                      <div
                        key={section.id}
                        className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {section.position}. {section.title}
                          </p>
                          {section.synopsis && (
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                              {section.synopsis}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={section.status as SectionStatus} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer actions */}
        {chapter && (
          <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white">
            <Button
              type="button"
              onClick={() => onNavigateToEditor(chapter.id)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4"
                aria-hidden="true"
              >
                <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
              </svg>
              Go to Editor
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
