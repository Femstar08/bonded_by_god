'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Chapter, Section, SectionStatus } from '@/types/database'
import { countWords } from '@/lib/utils/text'
import { addChapter, renameChapter } from '@/lib/actions/chapters'

interface WritingJourneyProps {
  chapters: Chapter[]
  activeChapterId: string
  sectionsByChapter: Record<string, Section[]>
  projectId: string
  projectTitle: string
  onSelectChapter: (chapterId: string) => void
  onChapterAdded: (chapter: Chapter) => void
  onChapterRenamed?: (chapterId: string, newTitle: string) => void
  onChapterDeleted?: (chapterId: string) => void
  onSectionSelect?: (section: Section) => void
  onSectionsGenerated?: (chapterId: string, sections: Section[]) => void
  onSectionStatusChange?: (sectionId: string, status: SectionStatus) => void
  onSectionAdded?: (chapterId: string, section: Section) => void
  onSectionDeleted?: (chapterId: string, sectionId: string) => void
  onSectionRenamed?: (sectionId: string, newTitle: string) => void
}

type ChapterStatus = 'complete' | 'in_progress' | 'not_started'

const STATUS_ICON: Record<ChapterStatus, string> = {
  complete: '\u2713',
  in_progress: '\u270E',
  not_started: '\u25CB',
}

const STATUS_CHAPTER_CLASS: Record<ChapterStatus, string> = {
  complete: 'text-emerald-600',
  in_progress: 'text-amber-600',
  not_started: 'text-muted-foreground',
}

const SECTION_STATUS_ICON: Record<SectionStatus, string> = {
  complete: '\u2713',
  review: '\u25C9',
  draft: '\u270E',
  empty: '\u25CB',
}

const SECTION_STATUS_CLASS: Record<SectionStatus, string> = {
  complete: 'text-emerald-600',
  review: 'text-blue-600',
  draft: 'text-amber-600',
  empty: 'text-muted-foreground',
}

const STATUS_CYCLE: SectionStatus[] = ['empty', 'draft', 'review', 'complete']

function getChapterStatus(chapter: Chapter, sections: Section[]): ChapterStatus {
  const wc = countWords(chapter.content)

  if (sections.length > 0) {
    const complete = sections.filter((s) => s.status === 'complete').length
    const inProgress = sections.filter(
      (s) => s.status === 'draft' || s.status === 'review'
    ).length
    if (complete === sections.length) return 'complete'
    if (complete > 0 || inProgress > 0) return 'in_progress'
    if (wc > 50) return 'in_progress'
    return 'not_started'
  }

  if (wc === 0) return 'not_started'
  const goalProgress = Math.min(Math.round((wc / chapter.word_goal) * 100), 100)
  if (goalProgress >= 100) return 'complete'
  return 'in_progress'
}

export function WritingJourney({
  chapters,
  activeChapterId,
  sectionsByChapter,
  projectId,
  projectTitle,
  onSelectChapter,
  onChapterAdded,
  onChapterRenamed,
  onChapterDeleted,
  onSectionSelect,
  onSectionsGenerated,
  onSectionStatusChange,
  onSectionAdded,
  onSectionDeleted,
  onSectionRenamed,
}: WritingJourneyProps) {
  const [adding, setAdding] = useState(false)
  const [addingPart, setAddingPart] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [addingSection, setAddingSection] = useState<string | null>(null)

  // Chapter rename state
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Section rename state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editSectionTitle, setEditSectionTitle] = useState('')
  const sectionRenameInputRef = useRef<HTMLInputElement>(null)

  // Focus the chapter rename input when editing starts
  useEffect(() => {
    if (editingChapterId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [editingChapterId])

  // Focus the section rename input when editing starts
  useEffect(() => {
    if (editingSectionId && sectionRenameInputRef.current) {
      sectionRenameInputRef.current.focus()
      sectionRenameInputRef.current.select()
    }
  }, [editingSectionId])

  // ── Chapter rename ──────────────────────────────────────────────────────────

  const handleStartRename = (chapter: Chapter) => {
    setEditingChapterId(chapter.id)
    setEditTitle(chapter.title)
  }

  const handleCommitRename = async () => {
    if (!editingChapterId) return
    const trimmed = editTitle.trim()
    if (!trimmed) {
      setEditingChapterId(null)
      return
    }
    onChapterRenamed?.(editingChapterId, trimmed)
    setEditingChapterId(null)
    await renameChapter(editingChapterId, trimmed)
  }

  // ── Chapter delete ──────────────────────────────────────────────────────────

  const handleDeleteChapter = async (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation()
    const label = chapter.type === 'part' ? 'part' : 'chapter'
    const confirmed = window.confirm(
      `Delete "${chapter.title}"? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      const body =
        chapter.type === 'part'
          ? JSON.stringify({ deleteMode: 'ungrouped' })
          : undefined

      const res = await fetch(`/api/chapters/${chapter.id}`, {
        method: 'DELETE',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      })
      if (res.ok) {
        onChapterDeleted?.(chapter.id)
      }
    } catch {
      // Non-critical
      void label
    }
  }

  // ── Chapter add ─────────────────────────────────────────────────────────────

  const chapterItems = chapters.filter((ch) => ch.type !== 'part')
  const completedChapters = chapterItems.filter((ch) => {
    const sections = sectionsByChapter[ch.id] ?? []
    return getChapterStatus(ch, sections) === 'complete'
  }).length

  const handleAddChapter = async () => {
    setAdding(true)
    const nextPosition = chapters.length + 1
    const chapterCount = chapters.filter((c) => c.type !== 'part').length
    const result = await addChapter(projectId, `Chapter ${chapterCount + 1}`, nextPosition)
    if (result.success && result.chapter) {
      onChapterAdded(result.chapter as Chapter)
    }
    setAdding(false)
  }

  const handleAddPart = async () => {
    setAddingPart(true)
    const nextPosition = chapters.length + 1
    const partCount = chapters.filter((c) => c.type === 'part').length
    const result = await addChapter(projectId, `Part ${partCount + 1}`, nextPosition, 'part')
    if (result.success && result.chapter) {
      onChapterAdded(result.chapter as Chapter)
    }
    setAddingPart(false)
  }

  // ── Section add (blank) ─────────────────────────────────────────────────────

  const handleAddSection = async (chapterId: string) => {
    const existingSections = sectionsByChapter[chapterId] ?? []
    const nextPosition = existingSections.length + 1
    const title = `Section ${nextPosition}`

    setAddingSection(chapterId)
    try {
      const res = await fetch('/api/writing-map/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, projectId, title, position: nextPosition }),
      })
      const data = await res.json()
      if (res.ok && data.section) {
        onSectionAdded?.(chapterId, data.section)
      }
    } catch {
      // Non-critical
    } finally {
      setAddingSection(null)
    }
  }

  // ── Section generate via AI ─────────────────────────────────────────────────

  const handleGenerateSections = async (chapterId: string) => {
    setGenerating(chapterId)
    try {
      const res = await fetch('/api/writing-map/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, projectId }),
      })
      const data = await res.json()
      if (res.ok && data.sections) {
        onSectionsGenerated?.(chapterId, data.sections)
      }
    } catch {
      // Non-critical
    } finally {
      setGenerating(null)
    }
  }

  // ── Section delete ──────────────────────────────────────────────────────────

  const handleDeleteSection = async (
    chapterId: string,
    section: Section,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    const confirmed = window.confirm(`Delete section "${section.title}"?`)
    if (!confirmed) return

    // Optimistic update
    onSectionDeleted?.(chapterId, section.id)

    try {
      const res = await fetch('/api/writing-map/sections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: section.id }),
      })
      if (!res.ok) {
        // Revert by re-adding is complex; the parent can refetch if needed.
      }
    } catch {
      // Non-critical
    }
  }

  // ── Section rename ──────────────────────────────────────────────────────────

  const handleStartSectionRename = (section: Section) => {
    setEditingSectionId(section.id)
    setEditSectionTitle(section.title)
  }

  const handleCommitSectionRename = async (chapterId: string) => {
    if (!editingSectionId) return
    const trimmed = editSectionTitle.trim()
    if (!trimmed) {
      setEditingSectionId(null)
      return
    }
    // Optimistic update
    onSectionRenamed?.(editingSectionId, trimmed)
    setEditingSectionId(null)

    try {
      await fetch('/api/writing-map/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: editingSectionId, title: trimmed }),
      })
    } catch {
      // Non-critical
    }
    void chapterId
  }

  // ── Section status toggle ───────────────────────────────────────────────────

  const handleStatusToggle = async (section: Section) => {
    const currentIdx = STATUS_CYCLE.indexOf(section.status)
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length]
    onSectionStatusChange?.(section.id, nextStatus)

    try {
      await fetch('/api/writing-map/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: section.id, status: nextStatus }),
      })
    } catch {
      onSectionStatusChange?.(section.id, section.status)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="px-4 pt-4 pb-3 border-b">
        <h2 className="font-serif font-semibold text-sm text-foreground truncate">
          {projectTitle}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {completedChapters}/{chapterItems.length} chapters complete
        </p>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {chapters.map((chapter) => {
          // ── Part divider ─────────────────────────────────────────────────────
          if (chapter.type === 'part') {
            const isPartActive = chapter.id === activeChapterId
            return (
              <div key={chapter.id} className="px-2.5 pt-3 pb-1 mt-2 first:mt-0">
                {editingChapterId === chapter.id ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleCommitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitRename()
                      if (e.key === 'Escape') setEditingChapterId(null)
                    }}
                    className="w-full text-[10px] uppercase tracking-widest font-semibold bg-background border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                ) : (
                  <div className="flex items-center group/part">
                    <button
                      onClick={() => onSelectChapter(chapter.id)}
                      onDoubleClick={() => handleStartRename(chapter)}
                      className={`flex-1 text-left text-[10px] uppercase tracking-widest font-semibold transition-colors ${
                        isPartActive
                          ? 'text-amber-700'
                          : 'text-amber-600/70 hover:text-amber-700'
                      }`}
                      title="Click to edit intro, double-click to rename"
                    >
                      {chapter.title}
                    </button>
                    <button
                      onClick={(e) => handleDeleteChapter(chapter, e)}
                      className="shrink-0 opacity-0 group-hover/part:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-0.5 rounded"
                      title={`Delete ${chapter.title}`}
                      aria-label={`Delete ${chapter.title}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
                        <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                      </svg>
                    </button>
                  </div>
                )}
                <hr className="border-border/40 mt-1" />
              </div>
            )
          }

          // ── Regular chapter ──────────────────────────────────────────────────
          const sections = sectionsByChapter[chapter.id] ?? []
          const status = getChapterStatus(chapter, sections)
          const isActive = chapter.id === activeChapterId
          const iconClass = STATUS_CHAPTER_CLASS[status]

          return (
            <div key={chapter.id}>
              {/* Chapter row */}
              {editingChapterId === chapter.id ? (
                <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5">
                  <span className={`shrink-0 text-xs w-4 text-center ${iconClass}`}>
                    {STATUS_ICON[status]}
                  </span>
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleCommitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitRename()
                      if (e.key === 'Escape') setEditingChapterId(null)
                    }}
                    className="flex-1 text-sm bg-background border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400 min-w-0"
                  />
                </div>
              ) : (
                <div className="flex items-center group/chapter rounded-md">
                  <button
                    onClick={() => onSelectChapter(chapter.id)}
                    onDoubleClick={() => handleStartRename(chapter)}
                    className={`flex-1 min-w-0 text-left flex items-center gap-2 px-2.5 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-amber-50 text-amber-900 font-medium rounded-md'
                        : 'text-foreground hover:bg-muted/60 rounded-md'
                    }`}
                  >
                    <span className={`shrink-0 text-xs w-4 text-center ${iconClass}`}>
                      {STATUS_ICON[status]}
                    </span>
                    <span className="truncate flex-1">
                      {chapter.title}
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteChapter(chapter, e)}
                    className="shrink-0 opacity-0 group-hover/chapter:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-1 rounded mr-1"
                    title={`Delete ${chapter.title}`}
                    aria-label={`Delete ${chapter.title}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
                      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Sections — visible when chapter is active */}
              {isActive && (
                <div className="ml-6 mt-0.5 mb-1 space-y-0.5">
                  {sections.length > 0 ? (
                    <>
                      {sections.map((section) => {
                        const sectionIcon = SECTION_STATUS_ICON[section.status]
                        const sectionClass = SECTION_STATUS_CLASS[section.status]

                        return (
                          <div
                            key={section.id}
                            className="flex items-center gap-1.5 text-xs group/section"
                          >
                            {/* Status toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusToggle(section)
                              }}
                              className={`shrink-0 w-4 text-center hover:scale-110 transition-transform ${sectionClass}`}
                              title="Click to cycle status"
                            >
                              {sectionIcon}
                            </button>

                            {/* Section title — double-click to rename */}
                            {editingSectionId === section.id ? (
                              <input
                                ref={sectionRenameInputRef}
                                type="text"
                                value={editSectionTitle}
                                onChange={(e) => setEditSectionTitle(e.target.value)}
                                onBlur={() => handleCommitSectionRename(chapter.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCommitSectionRename(chapter.id)
                                  if (e.key === 'Escape') setEditingSectionId(null)
                                }}
                                className="flex-1 min-w-0 text-xs bg-background border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                              />
                            ) : (
                              <button
                                onClick={() => onSectionSelect?.(section)}
                                onDoubleClick={() => handleStartSectionRename(section)}
                                className="flex-1 min-w-0 text-left truncate text-muted-foreground hover:text-foreground transition-colors"
                                title="Click to focus, double-click to rename"
                              >
                                {section.title}
                              </button>
                            )}

                            {/* Delete section */}
                            {editingSectionId !== section.id && (
                              <button
                                onClick={(e) => handleDeleteSection(chapter.id, section, e)}
                                className="shrink-0 opacity-0 group-hover/section:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-0.5 rounded"
                                title={`Delete ${section.title}`}
                                aria-label={`Delete section ${section.title}`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-2.5">
                                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )
                      })}

                      {/* Add section row (when sections already exist) */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          onClick={() => handleAddSection(chapter.id)}
                          disabled={addingSection === chapter.id}
                          className="text-xs text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50"
                        >
                          {addingSection === chapter.id ? 'Adding...' : '+ Add Section'}
                        </button>
                        <span className="text-muted-foreground/30 text-[10px]">·</span>
                        <button
                          onClick={() => handleGenerateSections(chapter.id)}
                          disabled={generating === chapter.id}
                          className="text-xs text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50"
                          title="AI Plan — auto-generate sections"
                        >
                          {generating === chapter.id ? 'Planning...' : 'AI Plan'}
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Empty state — show both buttons side by side */
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddSection(chapter.id)}
                        disabled={addingSection === chapter.id}
                        className="text-xs text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50"
                      >
                        {addingSection === chapter.id ? 'Adding...' : '+ Add Section'}
                      </button>
                      <span className="text-muted-foreground/30 text-[10px]">·</span>
                      <button
                        onClick={() => handleGenerateSections(chapter.id)}
                        disabled={generating === chapter.id}
                        className="text-xs text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50"
                        title="AI Plan — auto-generate sections"
                      >
                        {generating === chapter.id ? 'Planning...' : 'AI Plan'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add chapter / part */}
      <div className="px-2 py-2 border-t space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground text-xs h-8"
          onClick={handleAddChapter}
          disabled={adding}
        >
          {adding ? 'Adding...' : '+ Add Chapter'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground text-xs h-7"
          onClick={handleAddPart}
          disabled={addingPart}
        >
          {addingPart ? 'Adding...' : '+ Add Part'}
        </Button>
      </div>
    </div>
  )
}
