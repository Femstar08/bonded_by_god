'use client'

import { useRef, useState } from 'react'
import { Chapter, Section, ChapterStatus, SectionStatus, ColorLabel, HierarchyLabels } from '@/types/database'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { MoveToPartSelector } from './MoveToPartSelector'

// ────────────────────────────────────────────────────────────
// Extended types for planner (sections are nested on chapter)
// ────────────────────────────────────────────────────────────
export type PlannerSection = Omit<Section, 'summary' | 'notes'>

export type PlannerChapter = Omit<Chapter, 'content'> & {
  word_count: number
  sections: PlannerSection[]
}

interface BoardViewProps {
  chapters: PlannerChapter[]
  projectType: string
  hierarchyLabels: HierarchyLabels
  parts: { id: string; title: string }[]
  onReorder: (fromIndex: number, toIndex: number) => void
  onAddChapter: () => void
  onAddPart: () => void
  onAddSection: (chapterId: string) => void
  onChapterClick: (chapterId: string) => void
  onStatusChange: (chapterId: string, status: ChapterStatus) => void
  onSectionMove: (sectionId: string, fromChapterId: string, toChapterId: string, toPosition: number) => void
  onMoveToPart: (chapterId: string, partId: string | null) => void
  onTitleChange: (chapterId: string, title: string) => void
  onDeleteChapter?: (chapterId: string) => void
}

// ─── Color label left-border helper ───────────────────────
const COLOR_LABEL_HEX: Record<NonNullable<ColorLabel>, string> = {
  red: '#E57373',
  orange: '#FFB74D',
  yellow: '#FFF176',
  green: '#81C784',
  teal: '#4DB6AC',
  blue: '#64B5F6',
  purple: '#BA68C8',
}

// ─── Drag data ─────────────────────────────────────────────
interface DragData {
  type: 'chapter' | 'section'
  id: string
  sourceChapterId?: string
  sourcePosition: number
}

export function BoardView({
  chapters,
  projectType: _projectType,
  hierarchyLabels,
  parts,
  onReorder,
  onAddChapter,
  onAddPart,
  onAddSection,
  onChapterClick,
  onStatusChange,
  onSectionMove,
  onMoveToPart,
  onTitleChange,
  onDeleteChapter,
}: BoardViewProps) {
  const labels = hierarchyLabels

  // Inline title editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  const startEditing = (id: string, title: string) => {
    setEditingId(id)
    setEditTitle(title)
    setTimeout(() => editInputRef.current?.select(), 0)
  }

  const commitEdit = (id: string, originalTitle: string) => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== originalTitle) {
      onTitleChange(id, trimmed)
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  // Track which element is being dragged over for visual feedback
  const [dragOverChapterIndex, setDragOverChapterIndex] = useState<number | null>(null)
  const [dragOverSectionInfo, setDragOverSectionInfo] = useState<{
    chapterId: string
    position: number
  } | null>(null)

  const dragData = useRef<DragData | null>(null)

  // ── Chapter drag handlers ──────────────────────────────
  const handleChapterDragStart = (e: React.DragEvent<HTMLDivElement>, chapter: PlannerChapter, index: number) => {
    dragData.current = {
      type: 'chapter',
      id: chapter.id,
      sourcePosition: index,
    }
    e.dataTransfer.effectAllowed = 'move'
    // Tiny timeout so the drag ghost captures the original look
    setTimeout(() => {
      if (e.currentTarget) {
        e.currentTarget.style.opacity = '0.4'
      }
    }, 0)
  }

  const handleChapterDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1'
    setDragOverChapterIndex(null)
    dragData.current = null
  }

  const handleChapterDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragData.current?.type !== 'chapter') return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverChapterIndex(index)
  }

  const handleChapterDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault()
    if (dragData.current?.type !== 'chapter') return
    const fromIndex = dragData.current.sourcePosition
    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex)
    }
    setDragOverChapterIndex(null)
    dragData.current = null
  }

  // ── Section drag handlers ──────────────────────────────
  const handleSectionDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    section: PlannerSection,
    chapterId: string
  ) => {
    e.stopPropagation()
    dragData.current = {
      type: 'section',
      id: section.id,
      sourceChapterId: chapterId,
      sourcePosition: section.position,
    }
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => {
      if (e.currentTarget) e.currentTarget.style.opacity = '0.4'
    }, 0)
  }

  const handleSectionDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1'
    setDragOverSectionInfo(null)
    dragData.current = null
  }

  const handleSectionDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    chapterId: string,
    position: number
  ) => {
    if (dragData.current?.type !== 'section') return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSectionInfo({ chapterId, position })
  }

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, chapterId: string, sectionCount: number) => {
    if (dragData.current?.type !== 'section') return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    // Dropping onto empty column area means append at end
    setDragOverSectionInfo({ chapterId, position: sectionCount })
  }

  const handleSectionDrop = (
    e: React.DragEvent<HTMLDivElement>,
    toChapterId: string,
    toPosition: number
  ) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragData.current?.type !== 'section') return
    const { id, sourceChapterId } = dragData.current
    if (!sourceChapterId) return
    onSectionMove(id, sourceChapterId, toChapterId, toPosition)
    setDragOverSectionInfo(null)
    dragData.current = null
  }

  return (
    <div
      className="flex gap-4 overflow-x-auto h-full px-6 py-4 pb-8"
      style={{ minHeight: 0 }}
    >
      {chapters.map((chapter, index) => {
        const borderColor = chapter.color_label
          ? COLOR_LABEL_HEX[chapter.color_label]
          : '#e2e8f0'
        const isDragOverColumn = dragOverChapterIndex === index

        // ── Part divider column ──
        if (chapter.type === 'part') {
          return (
            <div
              key={chapter.id}
              draggable
              onDragStart={(e) => handleChapterDragStart(e, chapter, index)}
              onDragEnd={handleChapterDragEnd}
              onDragOver={(e) => handleChapterDragOver(e, index)}
              onDrop={(e) => handleChapterDrop(e, index)}
              className={`flex flex-col shrink-0 w-48 rounded-xl bg-[#0f1a2e] border shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing ${
                isDragOverColumn
                  ? 'ring-2 ring-amber-400 border-amber-300'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="px-3 py-4 group/part">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-amber-400/60 uppercase tracking-widest mb-1">{labels.part}</p>
                    {editingId === chapter.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => commitEdit(chapter.id, chapter.title)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(chapter.id, chapter.title)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="w-full text-sm font-semibold font-serif bg-amber-900/40 border border-amber-400/50 rounded px-2 py-0.5 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        maxLength={120}
                        autoFocus
                      />
                    ) : (
                      <h3
                        className="font-serif text-sm font-semibold text-amber-100 hover:text-amber-50 transition-colors line-clamp-2 cursor-text"
                        onDoubleClick={() => startEditing(chapter.id, chapter.title)}
                        title="Double-click to rename"
                      >
                        {chapter.title}
                      </h3>
                    )}
                  </div>
                  {onDeleteChapter && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`Delete "${chapter.title}"? This cannot be undone.`)) {
                          onDeleteChapter(chapter.id)
                        }
                      }}
                      className="shrink-0 p-0.5 rounded text-white/20 hover:text-red-400 hover:bg-white/10 transition-colors opacity-0 group-hover/part:opacity-100"
                      aria-label={`Delete part ${chapter.title}`}
                      title="Delete part"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="size-3.5"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {chapter.synopsis && (
                  <p className="text-[10px] text-white/50 mt-2 line-clamp-4 leading-relaxed">
                    {chapter.synopsis}
                  </p>
                )}
              </div>
            </div>
          )
        }

        // ── Regular chapter column ──
        return (
          <div
            key={chapter.id}
            draggable
            onDragStart={(e) => handleChapterDragStart(e, chapter, index)}
            onDragEnd={handleChapterDragEnd}
            onDragOver={(e) => handleChapterDragOver(e, index)}
            onDrop={(e) => handleChapterDrop(e, index)}
            className={`flex flex-col shrink-0 w-64 rounded-xl bg-white border shadow-sm transition-all duration-150 ${
              isDragOverColumn
                ? 'ring-2 ring-amber-400 border-amber-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            style={{ borderLeft: `5px solid ${borderColor}` }}
          >
            {/* Column header */}
            <div className="px-3 pt-3 pb-2 border-b border-slate-100 group/header">
              <div className="flex items-start gap-1">
                <div className="flex-1 min-w-0">
                  {editingId === chapter.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => commitEdit(chapter.id, chapter.title)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit(chapter.id, chapter.title)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="w-full text-sm font-semibold font-serif bg-amber-50 border border-amber-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      maxLength={120}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-2 group">
                      <h3
                        className="font-serif text-sm font-semibold text-[#0f1a2e] leading-snug group-hover:text-amber-700 transition-colors line-clamp-2 cursor-text"
                        onDoubleClick={() => startEditing(chapter.id, chapter.title)}
                        title="Double-click to rename"
                      >
                        {chapter.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onChapterClick(chapter.id)}
                        className="shrink-0 mt-0.5"
                        aria-label={`Open ${labels.chapter.toLowerCase()} details: ${chapter.title}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-3.5 text-slate-400 hover:text-amber-500 transition-colors"
                          aria-hidden="true"
                        >
                          <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                {onDeleteChapter && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`Delete "${chapter.title}"? This cannot be undone.`)) {
                        onDeleteChapter(chapter.id)
                      }
                    }}
                    className="shrink-0 p-0.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover/header:opacity-100"
                    aria-label={`Delete ${labels.chapter.toLowerCase()} ${chapter.title}`}
                    title={`Delete ${labels.chapter}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-3.5"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <StatusBadge status={chapter.status} size="sm" />
                {chapter.word_count > 0 && (
                  <span className="text-[10px] text-slate-400">
                    {chapter.word_count.toLocaleString()} words
                  </span>
                )}
                {chapter.parent_id && (() => {
                  const partTitle = parts.find((p) => p.id === chapter.parent_id)?.title
                  return partTitle ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium truncate max-w-[80px]">
                      {partTitle}
                    </span>
                  ) : null
                })()}
              </div>
              {parts.length > 0 && (
                <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                  <MoveToPartSelector
                    currentPartId={chapter.parent_id ?? null}
                    parts={parts}
                    partLabel={labels.part}
                    onMove={(partId) => onMoveToPart(chapter.id, partId)}
                    compact
                  />
                </div>
              )}
            </div>

            {/* Section cards */}
            <div
              className="flex-1 overflow-y-auto px-2 py-2 space-y-2"
              onDragOver={(e) => handleColumnDragOver(e, chapter.id, chapter.sections.length)}
              onDrop={(e) => handleSectionDrop(e, chapter.id, chapter.sections.length)}
            >
              {chapter.sections.length === 0 && (
                <div className="flex items-center justify-center h-16 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No {labels.section.toLowerCase()}s yet
                </div>
              )}

              {chapter.sections.map((section) => {
                const isDropTarget =
                  dragOverSectionInfo?.chapterId === chapter.id &&
                  dragOverSectionInfo?.position === section.position

                return (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={(e) => handleSectionDragStart(e, section, chapter.id)}
                    onDragEnd={handleSectionDragEnd}
                    onDragOver={(e) => handleSectionDragOver(e, chapter.id, section.position)}
                    onDrop={(e) => handleSectionDrop(e, chapter.id, section.position)}
                    className={`rounded-lg bg-slate-50 border px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all duration-100 ${
                      isDropTarget
                        ? 'border-amber-400 ring-1 ring-amber-300 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2">
                        {section.title}
                      </p>
                      <StatusBadge status={section.status as SectionStatus} size="sm" />
                    </div>

                    {section.synopsis && (
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-1">
                        {section.synopsis}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add section button */}
            <div className="px-2 pb-2 pt-1 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAddSection(chapter.id)}
                className="w-full h-7 text-[11px] text-slate-500 hover:text-amber-700 hover:bg-amber-50"
              >
                + Add {labels.section}
              </Button>
            </div>
          </div>
        )
      })}

      {/* Add Chapter / Part area */}
      <div className="shrink-0 w-64 space-y-2">
        <button
          type="button"
          onClick={onAddChapter}
          className="w-full h-20 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center gap-1 text-sm font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5"
            aria-hidden="true"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add {labels.chapter}
        </button>
        <button
          type="button"
          onClick={onAddPart}
          className="w-full h-14 rounded-xl border-2 border-dashed border-slate-500 text-slate-400 hover:border-amber-400 hover:text-amber-500 hover:bg-[#0f1a2e]/10 transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add {labels.part}
        </button>
      </div>
    </div>
  )
}
