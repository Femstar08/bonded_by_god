'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectBibleCategory, ProjectBibleEntry } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectBibleEntryFormProps {
  projectId: string
  category: ProjectBibleCategory
  entry?: ProjectBibleEntry | null
  onSaved: (entry: ProjectBibleEntry) => void
  onCancel: () => void
  onDelete?: (id: string) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TITLE_MAX = 100
const CONTENT_MAX = 2000

// ---------------------------------------------------------------------------
// Confirm Delete button — inline confirmation pattern
// ---------------------------------------------------------------------------

function DeleteConfirmButton({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-cancel confirmation after 4s if user doesn't click again
  useEffect(() => {
    if (confirming) {
      timeoutRef.current = setTimeout(() => setConfirming(false), 4000)
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [confirming])

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 font-medium">Are you sure?</span>
        <button
          type="button"
          onClick={() => {
            setConfirming(false)
            onConfirm()
          }}
          className="text-xs font-semibold text-red-600 underline underline-offset-2 hover:no-underline"
        >
          Yes, delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:no-underline"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
      aria-label="Delete this entry"
    >
      {/* Trash icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="size-3.5"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
          clipRule="evenodd"
        />
      </svg>
      Delete
    </button>
  )
}

// ---------------------------------------------------------------------------
// Character count indicator
// ---------------------------------------------------------------------------

function CharCount({ current, max }: { current: number; max: number }) {
  const nearLimit = current > max * 0.85
  const atLimit = current >= max

  return (
    <span
      className={[
        'text-[10px] tabular-nums transition-colors',
        atLimit
          ? 'text-red-500 font-semibold'
          : nearLimit
          ? 'text-amber-600'
          : 'text-muted-foreground',
      ].join(' ')}
      aria-live="polite"
      aria-label={`${current} of ${max} characters used`}
    >
      {current}/{max}
    </span>
  )
}

// ---------------------------------------------------------------------------
// ProjectBibleEntryForm
// ---------------------------------------------------------------------------

export function ProjectBibleEntryForm({
  projectId,
  category,
  entry,
  onSaved,
  onCancel,
  onDelete,
}: ProjectBibleEntryFormProps) {
  const isEditMode = entry != null

  const [title, setTitle] = useState(entry?.title ?? '')
  const [content, setContent] = useState(entry?.content ?? '')
  const [scriptureInput, setScriptureInput] = useState(
    entry?.scripture_refs?.join(', ') ?? ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const titleRef = useRef<HTMLInputElement>(null)

  // Focus title on mount
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const trimmedTitle = title.trim()
  const trimmedContent = content.trim()
  const canSave =
    trimmedTitle.length > 0 &&
    trimmedTitle.length <= TITLE_MAX &&
    trimmedContent.length > 0 &&
    trimmedContent.length <= CONTENT_MAX &&
    !saving

  // -------------------------------------------------------------------------
  // Save handler
  // -------------------------------------------------------------------------

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError(null)

    // Parse scripture refs — split by comma, trim each, filter empties
    const refs = scriptureInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      project_id: projectId,
      category,
      title: trimmedTitle,
      content: trimmedContent,
      scripture_refs: refs,
    }

    try {
      const res = await fetch(
        isEditMode
          ? `/api/project-bible/${entry.id}`
          : '/api/project-bible',
        {
          method: isEditMode ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save entry')

      onSaved((data as { entry: ProjectBibleEntry }).entry)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Delete handler
  // -------------------------------------------------------------------------

  const handleDelete = async () => {
    if (!isEditMode || !onDelete) return
    setError(null)

    try {
      const res = await fetch(`/api/project-bible/${entry.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Failed to delete entry')
      }
      onDelete(entry.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not delete entry'
      setError(msg)
    }
  }

  // -------------------------------------------------------------------------
  // Keyboard shortcut — Cmd/Ctrl+Enter to save
  // -------------------------------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50/30 p-3.5 space-y-3"
      role="form"
      aria-label={isEditMode ? 'Edit bible entry' : 'New bible entry'}
      onKeyDown={handleKeyDown}
    >
      {/* Title field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="bible-entry-title"
            className="text-xs font-semibold text-foreground/80 tracking-wide"
          >
            Title <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <CharCount current={title.length} max={TITLE_MAX} />
        </div>
        <Input
          ref={titleRef}
          id="bible-entry-title"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
          placeholder="Entry title…"
          className="h-8 text-sm bg-background border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-300/40"
          aria-required="true"
          aria-invalid={title.length > TITLE_MAX}
          maxLength={TITLE_MAX}
          disabled={saving}
        />
      </div>

      {/* Content field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="bible-entry-content"
            className="text-xs font-semibold text-foreground/80 tracking-wide"
          >
            Description <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <CharCount current={content.length} max={CONTENT_MAX} />
        </div>
        <Textarea
          id="bible-entry-content"
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
          placeholder="Describe this entry in detail…"
          className="text-sm min-h-[80px] bg-background border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-300/40 resize-none leading-relaxed"
          aria-required="true"
          aria-invalid={content.length > CONTENT_MAX}
          maxLength={CONTENT_MAX}
          disabled={saving}
        />
      </div>

      {/* Scripture references field */}
      <div className="space-y-1">
        <label
          htmlFor="bible-entry-scripture"
          className="text-xs font-semibold text-foreground/80 tracking-wide"
        >
          Scripture References
          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="bible-entry-scripture"
          value={scriptureInput}
          onChange={(e) => setScriptureInput(e.target.value)}
          placeholder="e.g. John 3:16, Romans 8:28"
          className="h-8 text-sm bg-background border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-300/40"
          disabled={saving}
          aria-describedby="scripture-hint"
        />
        <p id="scripture-hint" className="text-[10px] text-muted-foreground">
          Separate multiple references with commas
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 leading-snug"
        >
          {error}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between pt-0.5">
        {/* Left: delete (edit mode only) */}
        <div>
          {isEditMode && onDelete && (
            <DeleteConfirmButton onConfirm={handleDelete} />
          )}
        </div>

        {/* Right: cancel + save */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={saving}
            className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!canSave}
            className="h-7 px-4 text-xs bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
            aria-label={saving ? 'Saving…' : isEditMode ? 'Update entry' : 'Create entry'}
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving…
              </span>
            ) : isEditMode ? (
              'Update'
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-[10px] text-muted-foreground text-right -mt-1">
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        Cmd+Enter to save &middot; Esc to cancel
      </p>
    </div>
  )
}
