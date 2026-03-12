'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ProjectBibleEntryForm } from './ProjectBibleEntryForm'
import { ExtractReviewModal, type ExtractorCandidate } from './ExtractReviewModal'
import type { ProjectBibleCategory, ProjectBibleEntry } from '@/types/database'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProjectBiblePanelProps {
  projectId: string
  totalChapterWords: number
}

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------

interface CategoryConfig {
  id: ProjectBibleCategory
  label: string
  icon: React.ReactNode
  description: string
}

function TheologicalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
      aria-hidden="true"
    >
      {/* Cross shape */}
      <path d="M7.25 1a.75.75 0 0 1 1.5 0v3.25H12a.75.75 0 0 1 0 1.5H8.75V15a.75.75 0 0 1-1.5 0V5.75H4a.75.75 0 0 1 0-1.5h3.25V1Z" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8 1.5a.75.75 0 0 1 .712.513l.956 2.868 2.868.956a.75.75 0 0 1 0 1.426l-2.868.956-.956 2.868a.75.75 0 0 1-1.424 0l-.956-2.868-2.868-.956a.75.75 0 0 1 0-1.426l2.868-.956.956-2.868A.75.75 0 0 1 8 1.5ZM2.5 9a.5.5 0 0 1 .474.342l.547 1.643 1.643.547a.5.5 0 0 1 0 .948l-1.643.547-.547 1.643a.5.5 0 0 1-.948 0l-.547-1.643-1.643-.547a.5.5 0 0 1 0-.948l1.643-.547.547-1.643A.5.5 0 0 1 2.5 9Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
    </svg>
  )
}

function BookOpenIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M7.25 3.688a8.035 8.035 0 0 0-4.75-.688V12c1.66 0 3.185.437 4.75 1.25V3.688ZM8.75 13.25A8.036 8.036 0 0 1 13.5 12V3a8.035 8.035 0 0 0-4.75.688v9.562Z" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M8 1a2.5 2.5 0 0 0-2.5 2.5v4a2.5 2.5 0 0 0 5 0v-4A2.5 2.5 0 0 0 8 1Z" />
      <path d="M4.5 7.5a.75.75 0 0 0-1.5 0A5.001 5.001 0 0 0 7.25 12.4v1.1h-1a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-1V12.4A5.001 5.001 0 0 0 13 7.5a.75.75 0 0 0-1.5 0 3.5 3.5 0 1 1-7 0Z" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.414A2 2 0 0 0 13.414 5L11 2.586A2 2 0 0 0 9.586 2H4Zm5 2H4v8h8V7H9V4Zm1 0v2h1.586L10 4Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3"
      aria-hidden="true"
    >
      <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
    </svg>
  )
}

function SparklesExtractIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937ZM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162ZM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1Z" />
    </svg>
  )
}

// Map of icon components
const CATEGORY_ICONS: Record<ProjectBibleCategory, React.ReactNode> = {
  theological_positions: <TheologicalIcon />,
  themes: <SparklesIcon />,
  key_figures: <UsersIcon />,
  core_scriptures: <BookOpenIcon />,
  audience_profile: <UsersIcon />,
  tone_voice_notes: <MicIcon />,
  custom_notes: <FileTextIcon />,
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'theological_positions',
    label: 'Theological Positions',
    icon: CATEGORY_ICONS.theological_positions,
    description: 'Core beliefs and doctrinal stances in this work',
  },
  {
    id: 'themes',
    label: 'Themes',
    icon: CATEGORY_ICONS.themes,
    description: 'Recurring spiritual and narrative themes',
  },
  {
    id: 'key_figures',
    label: 'Key Figures',
    icon: CATEGORY_ICONS.key_figures,
    description: 'People, characters, and historical figures referenced',
  },
  {
    id: 'core_scriptures',
    label: 'Core Scripture References',
    icon: CATEGORY_ICONS.core_scriptures,
    description: 'Foundational Bible passages for this project',
  },
  {
    id: 'audience_profile',
    label: 'Audience Profile',
    icon: CATEGORY_ICONS.audience_profile,
    description: 'Who this work is written for',
  },
  {
    id: 'tone_voice_notes',
    label: 'Tone & Voice Notes',
    icon: CATEGORY_ICONS.tone_voice_notes,
    description: 'Notes on writing style, voice, and tone',
  },
  {
    id: 'custom_notes',
    label: 'Custom Notes',
    icon: CATEGORY_ICONS.custom_notes,
    description: 'Miscellaneous notes and reference material',
  },
]

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-2 py-2 animate-pulse" aria-busy="true" aria-label="Loading entries">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-muted/30 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded bg-muted" />
            <div className="h-2.5 w-3/4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Entry card
// ---------------------------------------------------------------------------

interface EntryCardProps {
  entry: ProjectBibleEntry
  searchQuery: string
  isEditing: boolean
  onEdit: () => void
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-amber-200 text-amber-900 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

function EntryCard({ entry, searchQuery, isEditing, onEdit }: EntryCardProps) {
  const preview = entry.content.length > 80
    ? entry.content.slice(0, 80).trimEnd() + '…'
    : entry.content

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-pressed={isEditing}
      aria-label={`Edit entry: ${entry.title}`}
      className={[
        'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-150 group',
        isEditing
          ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300/60'
          : 'border-border bg-background hover:border-amber-200 hover:bg-amber-50/40',
      ].join(' ')}
    >
      {/* Title */}
      <p className="text-xs font-semibold text-foreground leading-snug mb-1 group-hover:text-amber-800 transition-colors">
        {highlight(entry.title, searchQuery)}
      </p>

      {/* Content preview */}
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {highlight(preview, searchQuery)}
      </p>

      {/* Scripture ref pills */}
      {entry.scripture_refs.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {entry.scripture_refs.slice(0, 3).map((ref) => (
            <Badge
              key={ref}
              variant="outline"
              className="text-[9px] px-1 py-0 h-3.5 border-amber-300 text-amber-700 bg-amber-50 leading-none"
            >
              {ref}
            </Badge>
          ))}
          {entry.scripture_refs.length > 3 && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 h-3.5 border-amber-300 text-amber-600 bg-amber-50 leading-none"
            >
              +{entry.scripture_refs.length - 3}
            </Badge>
          )}
        </div>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Category section
// ---------------------------------------------------------------------------

interface CategorySectionProps {
  config: CategoryConfig
  entries: ProjectBibleEntry[]
  searchQuery: string
  isExpanded: boolean
  onToggle: () => void
  editingEntryId: string | 'new' | null
  onEditEntry: (entryId: string) => void
  onAddNew: () => void
  onEntrySaved: (entry: ProjectBibleEntry) => void
  onEntryDeleted: (id: string) => void
  onCancelEdit: () => void
  projectId: string
}

function CategorySection({
  config,
  entries,
  searchQuery,
  isExpanded,
  onToggle,
  editingEntryId,
  onEditEntry,
  onAddNew,
  onEntrySaved,
  onEntryDeleted,
  onCancelEdit,
  projectId,
}: CategorySectionProps) {
  const isAddingNew = editingEntryId === 'new'

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Category header — toggle button */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`bible-cat-${config.id}`}
        className={[
          'w-full flex items-center gap-2.5 px-3.5 py-2.5 transition-colors',
          isExpanded
            ? 'bg-amber-50/60 border-b border-amber-100'
            : 'bg-background hover:bg-muted/40',
        ].join(' ')}
      >
        {/* Icon */}
        <span className="text-amber-600 shrink-0">{config.icon}</span>

        {/* Label */}
        <span className="flex-1 text-left text-xs font-semibold text-foreground tracking-wide">
          {config.label}
        </span>

        {/* Count badge */}
        {entries.length > 0 && (
          <Badge
            className={[
              'h-4 min-w-[1.25rem] px-1 text-[10px] font-bold leading-none shrink-0',
              isExpanded
                ? 'bg-amber-600 text-white border-transparent'
                : 'bg-amber-100 text-amber-700 border-amber-200',
            ].join(' ')}
            aria-label={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
          >
            {entries.length}
          </Badge>
        )}

        {/* Chevron */}
        <span className="text-muted-foreground shrink-0 transition-transform duration-200">
          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          id={`bible-cat-${config.id}`}
          className="px-3 pt-2.5 pb-3 space-y-2 bg-background"
        >
          {/* Empty state (no entries yet and not adding) */}
          {entries.length === 0 && !isAddingNew && (
            <p className="text-[11px] text-muted-foreground italic py-1 px-0.5">
              {config.description}. No entries yet.
            </p>
          )}

          {/* Entry cards */}
          {entries.map((entry) => {
            const isEditing = editingEntryId === entry.id

            return (
              <div key={entry.id} className="space-y-1.5">
                {!isEditing && (
                  <EntryCard
                    entry={entry}
                    searchQuery={searchQuery}
                    isEditing={false}
                    onEdit={() => onEditEntry(entry.id)}
                  />
                )}

                {isEditing && (
                  <ProjectBibleEntryForm
                    projectId={projectId}
                    category={config.id}
                    entry={entry}
                    onSaved={onEntrySaved}
                    onCancel={onCancelEdit}
                    onDelete={onEntryDeleted}
                  />
                )}
              </div>
            )
          })}

          {/* New entry form */}
          {isAddingNew && (
            <ProjectBibleEntryForm
              projectId={projectId}
              category={config.id}
              entry={null}
              onSaved={onEntrySaved}
              onCancel={onCancelEdit}
            />
          )}

          {/* Add Entry button */}
          {!isAddingNew && editingEntryId == null && (
            <button
              type="button"
              onClick={onAddNew}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-transparent py-1.5 text-[11px] font-medium text-amber-700 hover:border-amber-400 hover:bg-amber-50/60 transition-colors"
              aria-label={`Add new entry to ${config.label}`}
            >
              <PlusIcon />
              Add Entry
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ProjectBiblePanel — main export
// ---------------------------------------------------------------------------

// Minimum words before auto-extract becomes available
const MIN_WORDS_FOR_EXTRACT = 200

export function ProjectBiblePanel({ projectId, totalChapterWords }: ProjectBiblePanelProps) {
  const [entries, setEntries] = useState<ProjectBibleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Track which categories are expanded (all open by default)
  const [expandedCategories, setExpandedCategories] = useState<Set<ProjectBibleCategory>>(
    () => new Set(CATEGORIES.map((c) => c.id))
  )

  // Track active edit: { categoryId, entryId | 'new' }
  const [activeEdit, setActiveEdit] = useState<{
    categoryId: ProjectBibleCategory
    entryId: string | 'new'
  } | null>(null)

  // Extract modal
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractCandidates, setExtractCandidates] = useState<ExtractorCandidate[]>([])
  const [showExtractModal, setShowExtractModal] = useState(false)

  const canExtract = totalChapterWords >= MIN_WORDS_FOR_EXTRACT

  // -------------------------------------------------------------------------
  // Fetch entries on mount
  // -------------------------------------------------------------------------

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/project-bible?projectId=${projectId}`)
      const data = await res.json()
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to load entries')
      setEntries((data as { entries: ProjectBibleEntry[] }).entries ?? [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load Project Bible'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // -------------------------------------------------------------------------
  // Search filtering
  // -------------------------------------------------------------------------

  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return entries
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.scripture_refs.some((r) => r.toLowerCase().includes(q))
    )
  }, [entries, searchQuery])

  // Group filtered entries by category
  const entriesByCategory = useMemo(() => {
    const map: Record<ProjectBibleCategory, ProjectBibleEntry[]> = {
      theological_positions: [],
      themes: [],
      key_figures: [],
      core_scriptures: [],
      audience_profile: [],
      tone_voice_notes: [],
      custom_notes: [],
    }
    for (const entry of filteredEntries) {
      map[entry.category].push(entry)
    }
    // Sort each category by sort_order
    for (const cat of Object.keys(map) as ProjectBibleCategory[]) {
      map[cat].sort((a, b) => a.sort_order - b.sort_order)
    }
    return map
  }, [filteredEntries])

  const totalCount = entries.length

  // -------------------------------------------------------------------------
  // Category toggle
  // -------------------------------------------------------------------------

  const toggleCategory = useCallback((catId: ProjectBibleCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) {
        next.delete(catId)
      } else {
        next.add(catId)
      }
      return next
    })
  }, [])

  // -------------------------------------------------------------------------
  // Edit state handlers
  // -------------------------------------------------------------------------

  const handleEditEntry = useCallback((categoryId: ProjectBibleCategory, entryId: string) => {
    setActiveEdit({ categoryId, entryId })
    // Ensure the category is expanded
    setExpandedCategories((prev) => new Set([...prev, categoryId]))
  }, [])

  const handleAddNew = useCallback((categoryId: ProjectBibleCategory) => {
    setActiveEdit({ categoryId, entryId: 'new' })
    setExpandedCategories((prev) => new Set([...prev, categoryId]))
  }, [])

  const handleCancelEdit = useCallback(() => {
    setActiveEdit(null)
  }, [])

  // -------------------------------------------------------------------------
  // CRUD handlers
  // -------------------------------------------------------------------------

  const handleEntrySaved = useCallback((saved: ProjectBibleEntry) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === saved.id)
      if (exists) {
        return prev.map((e) => (e.id === saved.id ? saved : e))
      }
      return [...prev, saved]
    })
    setActiveEdit(null)
  }, [])

  const handleEntryDeleted = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setActiveEdit(null)
  }, [])

  // -------------------------------------------------------------------------
  // Auto-extract handler
  // -------------------------------------------------------------------------

  const handleAutoExtract = async () => {
    if (!canExtract || extracting) return
    setExtracting(true)
    setExtractError(null)

    try {
      const res = await fetch('/api/project-bible/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Extraction failed')

      const candidates = (data as { candidates?: ExtractorCandidate[] }).candidates ?? []
      setExtractCandidates(candidates)
      setShowExtractModal(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not extract entries'
      setExtractError(msg)
    } finally {
      setExtracting(false)
    }
  }

  const handleExtractAccepted = useCallback((newEntries: ProjectBibleEntry[]) => {
    setEntries((prev) => {
      const updated = [...prev]
      for (const entry of newEntries) {
        const exists = updated.some((e) => e.id === entry.id)
        if (!exists) updated.push(entry)
      }
      return updated
    })
  }, [])

  // When search has content, expand all categories so results are visible
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedCategories(new Set(CATEGORIES.map((c) => c.id)))
    }
  }, [searchQuery])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full bg-background" aria-label="Project Bible panel">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border bg-amber-50/30">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h2 className="font-serif text-base font-semibold text-foreground leading-tight">
              Project Bible
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {loading ? (
                <span className="inline-block h-2.5 w-20 rounded bg-muted animate-pulse" />
              ) : (
                <>
                  {totalCount === 0
                    ? 'No entries yet'
                    : `${totalCount} ${totalCount === 1 ? 'entry' : 'entries'}`}
                </>
              )}
            </p>
          </div>

          {/* Auto-Extract button */}
          <Button
            size="sm"
            onClick={handleAutoExtract}
            disabled={!canExtract || extracting}
            title={
              canExtract
                ? 'AI-extract entries from your chapters'
                : `Write at least ${MIN_WORDS_FOR_EXTRACT} words to enable auto-extract`
            }
            className={[
              'h-7 px-2.5 text-[11px] shrink-0 gap-1',
              canExtract
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            ].join(' ')}
            aria-label={extracting ? 'Extracting entries…' : 'Auto-extract entries from chapters'}
          >
            {extracting ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Extracting…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <SparklesExtractIcon />
                Auto-Extract
              </span>
            )}
          </Button>
        </div>

        {/* Word count hint for extract */}
        {!canExtract && !loading && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Auto-extract available after {MIN_WORDS_FOR_EXTRACT} words
            {totalChapterWords > 0 && (
              <>
                {' '}
                ({totalChapterWords}/{MIN_WORDS_FOR_EXTRACT})
              </>
            )}
          </p>
        )}

        {/* Extract error */}
        {extractError && (
          <div
            role="alert"
            className="mt-2 rounded-md bg-red-50 border border-red-200 px-2.5 py-1.5 text-[11px] text-red-700"
          >
            {extractError}
          </div>
        )}

        {/* Search */}
        <div className="relative mt-2.5">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-3"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries…"
            className="h-8 pl-7 text-xs bg-background border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-300/40"
            aria-label="Search Project Bible entries"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-3"
                aria-hidden="true"
              >
                <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
              </svg>
            </button>
          )}
        </div>

        {/* Search results count */}
        {searchQuery.trim() && !loading && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {filteredEntries.length === 0
              ? 'No entries match your search'
              : `${filteredEntries.length} ${filteredEntries.length === 1 ? 'entry' : 'entries'} found`}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Body — scrollable category list                                     */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={[
          'flex-1 overflow-y-auto px-3 py-3 space-y-2',
          '[&::-webkit-scrollbar]:w-1.5',
          '[&::-webkit-scrollbar-track]:bg-transparent',
          '[&::-webkit-scrollbar-thumb]:rounded-full',
          '[&::-webkit-scrollbar-thumb]:bg-border',
          '[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40',
        ].join(' ')}
        role="region"
        aria-label="Project Bible categories"
        aria-live="polite"
      >
        {/* Global load error */}
        {error && !loading && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p className="font-medium mb-1">Could not load Project Bible</p>
            <p className="text-xs mb-2 text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchEntries}
              className="text-xs underline underline-offset-2 hover:no-underline font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Skeleton while loading */}
        {loading && <LoadingSkeleton />}

        {/* Category sections */}
        {!loading &&
          !error &&
          CATEGORIES.map((config) => {
            const catEntries = entriesByCategory[config.id] ?? []
            const isExpanded = expandedCategories.has(config.id)

            // When searching and no entries match, hide the category
            if (searchQuery.trim() && catEntries.length === 0) return null

            const editingThisCat = activeEdit?.categoryId === config.id

            return (
              <CategorySection
                key={config.id}
                config={config}
                entries={catEntries}
                searchQuery={searchQuery}
                isExpanded={isExpanded}
                onToggle={() => toggleCategory(config.id)}
                editingEntryId={editingThisCat ? activeEdit!.entryId : null}
                onEditEntry={(entryId) => handleEditEntry(config.id, entryId)}
                onAddNew={() => handleAddNew(config.id)}
                onEntrySaved={handleEntrySaved}
                onEntryDeleted={handleEntryDeleted}
                onCancelEdit={handleCancelEdit}
                projectId={projectId}
              />
            )
          })}

        {/* Empty state: no entries and not loading */}
        {!loading && !error && totalCount === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3 px-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-50 border border-amber-200">
              <BookOpenIcon />
            </div>
            <div>
              <p className="font-serif text-sm font-semibold text-foreground">
                Your Project Bible is empty
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Add entries manually or use Auto-Extract once you have written enough content.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Extract review modal                                                */}
      {/* ------------------------------------------------------------------ */}
      {showExtractModal && (
        <ExtractReviewModal
          isOpen={showExtractModal}
          onClose={() => {
            setShowExtractModal(false)
            setExtractCandidates([])
          }}
          candidates={extractCandidates}
          projectId={projectId}
          onEntriesAccepted={handleExtractAccepted}
        />
      )}
    </div>
  )
}
