'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChapterStatus, ColorLabel, HierarchyLabels } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { getHierarchyLabels } from '@/lib/utils/hierarchyLabels'
import { PlannerHeader } from './PlannerHeader'
import { BoardView } from './BoardView'
import { CorkBoardView } from './CorkBoardView'
import { ChapterDetailPanel } from './ChapterDetailPanel'
import type { PlannerChapter, PlannerSection } from './BoardView'

// ─── Props ─────────────────────────────────────────────────
interface VisualPlannerProps {
  projectId: string
  projectTitle: string
  projectType: string
  hierarchyLabels?: HierarchyLabels | null
  onNavigateToChapter: (chapterId: string) => void
  onClose: () => void
}

// ─── API response shape ────────────────────────────────────
interface PlannerApiResponse {
  chapters: PlannerChapter[]
}

type ViewMode = 'board' | 'corkboard'

// ─── Helpers ───────────────────────────────────────────────
function getLocalStorageKey(projectId: string) {
  return `scriptloom:planner:${projectId}:viewMode`
}

function readStoredViewMode(projectId: string): ViewMode {
  if (typeof window === 'undefined') return 'board'
  try {
    const stored = window.localStorage.getItem(getLocalStorageKey(projectId))
    if (stored === 'board' || stored === 'corkboard') return stored
  } catch {
    // localStorage unavailable
  }
  return 'board'
}

function saveViewMode(projectId: string, mode: ViewMode) {
  try {
    window.localStorage.setItem(getLocalStorageKey(projectId), mode)
  } catch {
    // localStorage unavailable
  }
}

function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...list]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result.map((item, i) => ({ ...(item as object), position: i + 1 })) as T[]
}

function applyChapterFilters(
  chapters: PlannerChapter[],
  statusFilters: ChapterStatus[],
  searchQuery: string
): PlannerChapter[] {
  let filtered = chapters

  if (statusFilters.length > 0) {
    // Always keep parts visible as structural dividers
    filtered = filtered.filter((c) => c.type === 'part' || statusFilters.includes(c.status))
  }

  const q = searchQuery.trim().toLowerCase()
  if (q) {
    filtered = filtered.filter(
      (c) =>
        c.type === 'part' ||
        c.title.toLowerCase().includes(q) ||
        c.synopsis?.toLowerCase().includes(q)
    )
  }

  return filtered
}

// ─── Main Component ────────────────────────────────────────
export function VisualPlanner({
  projectId,
  projectTitle,
  projectType,
  hierarchyLabels: hierarchyLabelsProp,
  onNavigateToChapter,
  onClose,
}: VisualPlannerProps) {
  const [chapters, setChapters] = useState<PlannerChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<ChapterStatus[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)

  // Resolve hierarchy labels
  const labels = useMemo(
    () => getHierarchyLabels({ hierarchy_labels: hierarchyLabelsProp, type: projectType }),
    [hierarchyLabelsProp, projectType]
  )

  // Extract parts list for MoveToPartSelector
  const parts = useMemo(
    () => chapters.filter((c) => c.type === 'part').map((c) => ({ id: c.id, title: c.title })),
    [chapters]
  )

  // Avoid double-fetch on strict mode
  const hasFetched = useRef(false)

  // ── Restore view mode from localStorage on mount ──────
  useEffect(() => {
    setViewMode(readStoredViewMode(projectId))
  }, [projectId])

  // ── Fetch planner data ─────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchPlanner = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/planner/${projectId}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Failed to load planner data.')
          return
        }
        const data: PlannerApiResponse = await res.json()
        setChapters(data.chapters ?? [])
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchPlanner()
  }, [projectId])

  // ── Persist view mode on change ────────────────────────
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    saveViewMode(projectId, mode)
  }

  // ── Selected chapter (for detail panel) ───────────────
  const selectedChapter =
    chapters.find((c) => c.id === selectedChapterId) ?? null

  // ── Filtered chapters for views ───────────────────────
  const filteredChapters = applyChapterFilters(chapters, statusFilters, searchQuery)

  // ── Update a chapter in local state ───────────────────
  const handleChapterUpdate = useCallback(
    (chapterId: string, updates: Partial<PlannerChapter>) => {
      setChapters((prev) =>
        prev.map((c) => (c.id === chapterId ? { ...c, ...updates } : c))
      )
      // Persist to DB via Supabase client
      const supabase = createClient()
      const { sections: _s, word_count: _w, ...dbUpdates } = updates as Record<string, unknown>
      supabase
        .from('ltu_chapters')
        .update(dbUpdates)
        .eq('id', chapterId)
        .then(() => {})
    },
    []
  )

  // ── Reorder chapters ───────────────────────────────────
  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setChapters((prev) => {
        const reordered = reorder(prev, fromIndex, toIndex)
        // Persist new positions via batch reorder API
        fetch('/api/planner/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'chapter',
            updates: reordered.map((c) => ({ id: c.id, position: c.position })),
          }),
        }).catch(() => {})
        return reordered
      })
    },
    []
  )

  // ── Add chapter or part ───────────────────────────────
  const handleAdd = useCallback(async (type: 'chapter' | 'part' = 'chapter') => {
    try {
      const supabase = createClient()
      const newPosition = chapters.length + 1
      const existingParts = chapters.filter((c) => c.type === 'part').length
      const existingChapters = chapters.filter((c) => c.type === 'chapter').length
      const title = type === 'part'
        ? `Part ${existingParts + 1}`
        : `Chapter ${existingChapters + 1}`
      const { data, error } = await supabase
        .from('ltu_chapters')
        .insert({
          project_id: projectId,
          title,
          content: '',
          position: newPosition,
          word_goal: type === 'part' ? 0 : 0,
          status: 'not_started',
          synopsis: '',
          color_label: null,
          type,
        })
        .select()
        .single()
      if (!error && data) {
        setChapters((prev) => [...prev, { ...data, word_count: 0, sections: [] }])
      }
    } catch {
      // Non-critical
    }
  }, [projectId, chapters])

  // ── Add section to a chapter ───────────────────────────
  const handleAddSection = useCallback(
    async (chapterId: string) => {
      const chapter = chapters.find((c) => c.id === chapterId)
      if (!chapter) return
      try {
        const supabase = createClient()
        const newPosition = chapter.sections.length + 1
        const { data, error } = await supabase
          .from('ltu_sections')
          .insert({
            chapter_id: chapterId,
            project_id: projectId,
            title: `Section ${newPosition}`,
            status: 'empty',
            summary: '',
            notes: '',
            synopsis: '',
            position: newPosition,
          })
          .select()
          .single()
        if (!error && data) {
          setChapters((prev) =>
            prev.map((c) =>
              c.id === chapterId
                ? { ...c, sections: [...c.sections, data] }
                : c
            )
          )
        }
      } catch {
        // Non-critical
      }
    },
    [projectId, chapters]
  )

  // ── Move section between chapters ─────────────────────
  const handleSectionMove = useCallback(
    (
      sectionId: string,
      fromChapterId: string,
      toChapterId: string,
      toPosition: number
    ) => {
      setChapters((prev) => {
        // Find the section
        const fromChapter = prev.find((c) => c.id === fromChapterId)
        const section = fromChapter?.sections.find((s) => s.id === sectionId)
        if (!section) return prev

        return prev.map((c) => {
          if (c.id === fromChapterId && c.id !== toChapterId) {
            // Remove from source
            return {
              ...c,
              sections: c.sections
                .filter((s) => s.id !== sectionId)
                .map((s, i) => ({ ...s, position: i + 1 })),
            }
          }
          if (c.id === toChapterId && c.id !== fromChapterId) {
            // Insert into destination
            const newSections = [...c.sections]
            const insertAt = Math.min(toPosition, newSections.length)
            newSections.splice(insertAt, 0, { ...section, chapter_id: toChapterId })
            return {
              ...c,
              sections: newSections.map((s, i) => ({ ...s, position: i + 1 })),
            }
          }
          if (c.id === fromChapterId && c.id === toChapterId) {
            // Reorder within same chapter
            const fromPos = c.sections.findIndex((s) => s.id === sectionId)
            if (fromPos === -1) return c
            const reordered = reorder(c.sections, fromPos, toPosition) as PlannerSection[]
            return { ...c, sections: reordered }
          }
          return c
        })
      })

      // Persist via reorder API
      const body: Record<string, unknown> = {
        type: 'section' as const,
        updates: [{ id: sectionId, position: toPosition + 1 }],
      }
      if (fromChapterId !== toChapterId) {
        body.sectionChapterUpdate = { sectionId, newChapterId: toChapterId }
      }
      fetch('/api/planner/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {})
    },
    [projectId]
  )

  // ── Status change ──────────────────────────────────────
  const handleStatusChange = useCallback(
    (chapterId: string, status: ChapterStatus) => {
      handleChapterUpdate(chapterId, { status })
    },
    [handleChapterUpdate]
  )

  // ── Color change ───────────────────────────────────────
  const handleColorChange = useCallback(
    (chapterId: string, color: ColorLabel) => {
      handleChapterUpdate(chapterId, { color_label: color })
    },
    [handleChapterUpdate]
  )

  // ── Synopsis change ────────────────────────────────────
  const handleSynopsisChange = useCallback(
    (chapterId: string, synopsis: string) => {
      handleChapterUpdate(chapterId, { synopsis })
    },
    [handleChapterUpdate]
  )

  // ── Title change ───────────────────────────────────────
  const handleTitleChange = useCallback(
    (chapterId: string, title: string) => {
      handleChapterUpdate(chapterId, { title })
    },
    [handleChapterUpdate]
  )

  // ── Move chapter to part ──────────────────────────────
  const handleMoveToPart = useCallback(
    (chapterId: string, partId: string | null) => {
      setChapters((prev) =>
        prev.map((c) => (c.id === chapterId ? { ...c, parent_id: partId } : c))
      )
      fetch(`/api/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: partId }),
      }).catch(() => {})
    },
    []
  )

  // ── Delete chapter (non-part) ─────────────────────────
  const handleDeleteChapter = useCallback(
    async (chapterId: string) => {
      try {
        const res = await fetch(`/api/chapters/${chapterId}`, { method: 'DELETE' })
        if (res.ok) {
          setChapters((prev) => prev.filter((c) => c.id !== chapterId))
          if (selectedChapterId === chapterId) setSelectedChapterId(null)
        }
      } catch {
        // Non-critical
      }
    },
    [selectedChapterId]
  )

  // ── Update a section ───────────────────────────────────
  const handleSectionUpdate = useCallback(
    async (sectionId: string, updates: { title?: string; status?: string }) => {
      // Optimistic local update
      setChapters((prev) =>
        prev.map((c) => ({
          ...c,
          sections: c.sections.map((s) =>
            s.id === sectionId ? ({ ...s, ...updates } as PlannerSection) : s
          ),
        }))
      )
      try {
        await fetch('/api/writing-map/sections', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionId, ...updates }),
        })
      } catch {
        // Non-critical — optimistic update already applied
      }
    },
    []
  )

  // ── Delete a section ───────────────────────────────────
  const handleSectionDelete = useCallback(
    async (sectionId: string) => {
      // Optimistic local removal
      setChapters((prev) =>
        prev.map((c) => ({
          ...c,
          sections: c.sections
            .filter((s) => s.id !== sectionId)
            .map((s, i) => ({ ...s, position: i + 1 })),
        }))
      )
      try {
        await fetch('/api/writing-map/sections', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionId }),
        })
      } catch {
        // Non-critical — optimistic update already applied
      }
    },
    []
  )

  // ── Delete part ──────────────────────────────────────
  const handleDeletePart = useCallback(
    async (partId: string, mode: 'merge_previous' | 'ungrouped' | 'delete_all') => {
      try {
        const res = await fetch(`/api/chapters/${partId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deleteMode: mode }),
        })
        if (res.ok) {
          // Refresh planner data
          const plannerRes = await fetch(`/api/planner/${projectId}`)
          if (plannerRes.ok) {
            const data = await plannerRes.json()
            setChapters(data.chapters ?? [])
          }
          if (selectedChapterId === partId) {
            setSelectedChapterId(null)
          }
        }
      } catch {
        // Non-critical
      }
    },
    [projectId, selectedChapterId]
  )

  // ── Navigate to editor ─────────────────────────────────
  const handleNavigateToEditor = (chapterId: string) => {
    onNavigateToChapter(chapterId)
    onClose()
  }

  // ── Keyboard shortcut to close ─────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !selectedChapterId) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, selectedChapterId])

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-slate-50" role="main">
      {/* Header: close button on far right */}
      <div className="relative">
        <PlannerHeader
          projectTitle={projectTitle}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilters={statusFilters}
          onStatusFiltersChange={setStatusFilters}
          chapters={chapters.map((c) => ({
            id: c.id,
            status: c.status,
            word_count: c.word_count,
            type: c.type,
          }))}
          hierarchyLabels={labels}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-4 p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close planner"
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

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <svg
                className="size-8 animate-spin text-amber-500"
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
              <p className="text-sm text-slate-500">Loading planner…</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm space-y-3">
              <p className="text-slate-500 text-sm">{error}</p>
              <button
                type="button"
                onClick={() => {
                  hasFetched.current = false
                  setError(null)
                  setLoading(true)
                  // Retrigger fetch by resetting flag and forcing re-run
                  fetch(`/api/planner/${projectId}`)
                    .then((r) => r.json())
                    .then((data) => {
                      setChapters(data.chapters ?? [])
                      setError(null)
                    })
                    .catch(() => setError('Network error. Please try again.'))
                    .finally(() => setLoading(false))
                }}
                className="text-amber-600 hover:text-amber-700 text-sm font-medium underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && filteredChapters.length === 0 && chapters.length > 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-xs space-y-2">
              <p className="text-slate-500 text-sm">
                No chapters match your current filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilters([])
                  setSearchQuery('')
                }}
                className="text-amber-600 hover:text-amber-700 text-sm font-medium underline"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {viewMode === 'board' ? (
              <BoardView
                chapters={filteredChapters}
                projectType={projectType}
                hierarchyLabels={labels}
                parts={parts}
                onReorder={handleReorder}
                onAddChapter={() => handleAdd('chapter')}
                onAddPart={() => handleAdd('part')}
                onAddSection={handleAddSection}
                onChapterClick={(id) => setSelectedChapterId(id)}
                onStatusChange={handleStatusChange}
                onSectionMove={handleSectionMove}
                onMoveToPart={handleMoveToPart}
                onTitleChange={handleTitleChange}
                onDeleteChapter={handleDeleteChapter}
              />
            ) : (
              <CorkBoardView
                chapters={filteredChapters}
                projectType={projectType}
                hierarchyLabels={labels}
                parts={parts}
                onReorder={handleReorder}
                onAddChapter={() => handleAdd('chapter')}
                onAddPart={() => handleAdd('part')}
                onChapterClick={(id) => setSelectedChapterId(id)}
                onStatusChange={handleStatusChange}
                onColorChange={handleColorChange}
                onSynopsisChange={handleSynopsisChange}
                onTitleChange={handleTitleChange}
                onMoveToPart={handleMoveToPart}
                onDeleteChapter={handleDeleteChapter}
              />
            )}
          </>
        )}
      </div>

      {/* Chapter detail slide-over */}
      <ChapterDetailPanel
        chapter={selectedChapter}
        projectType={projectType}
        hierarchyLabels={labels}
        parts={parts}
        isOpen={selectedChapterId !== null}
        onClose={() => setSelectedChapterId(null)}
        onUpdate={handleChapterUpdate}
        onNavigateToEditor={handleNavigateToEditor}
        onMoveToPart={handleMoveToPart}
        onDeletePart={handleDeletePart}
        onDeleteChapter={handleDeleteChapter}
        onSectionUpdate={handleSectionUpdate}
        onSectionDelete={handleSectionDelete}
        onAddSection={handleAddSection}
        chapters={chapters}
      />
    </div>
  )
}
