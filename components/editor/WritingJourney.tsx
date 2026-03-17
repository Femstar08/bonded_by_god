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
  onSectionSelect?: (section: Section) => void
  onSectionsGenerated?: (chapterId: string, sections: Section[]) => void
  onSectionStatusChange?: (sectionId: string, status: SectionStatus) => void
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
  onSectionSelect,
  onSectionsGenerated,
  onSectionStatusChange,
}: WritingJourneyProps) {
  const [adding, setAdding] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Focus the rename input when editing starts
  useEffect(() => {
    if (editingChapterId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [editingChapterId])

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
    // Optimistic update
    onChapterRenamed?.(editingChapterId, trimmed)
    setEditingChapterId(null)
    await renameChapter(editingChapterId, trimmed)
  }

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

  const [addingPart, setAddingPart] = useState(false)
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
          // ── Part divider — clickable group header (editable intro content) ──
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
                  <button
                    onClick={() => onSelectChapter(chapter.id)}
                    onDoubleClick={() => handleStartRename(chapter)}
                    className={`w-full text-left text-[10px] uppercase tracking-widest font-semibold transition-colors ${
                      isPartActive
                        ? 'text-amber-700'
                        : 'text-amber-600/70 hover:text-amber-700'
                    }`}
                    title="Click to edit intro, double-click to rename"
                  >
                    {chapter.title}
                  </button>
                )}
                <hr className="border-border/40 mt-1" />
              </div>
            )
          }

          const sections = sectionsByChapter[chapter.id] ?? []
          const status = getChapterStatus(chapter, sections)
          const isActive = chapter.id === activeChapterId
          const iconClass = STATUS_CHAPTER_CLASS[status]

          return (
            <div key={chapter.id}>
              {/* Chapter row — click to select, double-click to rename */}
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
                <button
                  onClick={() => onSelectChapter(chapter.id)}
                  onDoubleClick={() => handleStartRename(chapter)}
                  className={`w-full text-left flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors group ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 font-medium'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className={`shrink-0 text-xs w-4 text-center ${iconClass}`}>
                    {STATUS_ICON[status]}
                  </span>
                  <span className="truncate flex-1">
                    {chapter.title}
                  </span>
                </button>
              )}

              {/* Sections — visible when chapter is active */}
              {isActive && (
                <div className="ml-6 mt-0.5 mb-1 space-y-0.5">
                  {sections.length > 0 ? (
                    sections.map((section) => {
                      const sectionIcon = SECTION_STATUS_ICON[section.status]
                      const sectionClass = SECTION_STATUS_CLASS[section.status]

                      return (
                        <div
                          key={section.id}
                          className="flex items-center gap-1.5 text-xs group"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusToggle(section)
                            }}
                            className={`shrink-0 w-4 text-center hover:scale-110 transition-transform ${sectionClass}`}
                            title={`Click to cycle status`}
                          >
                            {sectionIcon}
                          </button>
                          <button
                            onClick={() => onSectionSelect?.(section)}
                            className="text-left truncate text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {section.title}
                          </button>
                        </div>
                      )
                    })
                  ) : (
                    <button
                      onClick={() => handleGenerateSections(chapter.id)}
                      disabled={generating === chapter.id}
                      className="text-xs text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50"
                    >
                      {generating === chapter.id ? 'Planning...' : '+ Plan sections'}
                    </button>
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
