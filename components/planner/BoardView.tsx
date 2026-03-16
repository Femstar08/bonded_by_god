'use client'

import { useRef, useState } from 'react'
import { Chapter, Section, ChapterStatus, SectionStatus, ColorLabel } from '@/types/database'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'

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
  onReorder: (fromIndex: number, toIndex: number) => void
  onAddChapter: () => void
  onAddSection: (chapterId: string) => void
  onChapterClick: (chapterId: string) => void
  onStatusChange: (chapterId: string, status: ChapterStatus) => void
  onSectionMove: (sectionId: string, fromChapterId: string, toChapterId: string, toPosition: number) => void
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

function getProjectLabels(projectType: string) {
  if (projectType === 'sermon') return { chapter: 'Sermon', section: 'Point' }
  return { chapter: 'Chapter', section: 'Section' }
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
  projectType,
  onReorder,
  onAddChapter,
  onAddSection,
  onChapterClick,
  onStatusChange,
  onSectionMove,
}: BoardViewProps) {
  const labels = getProjectLabels(projectType)

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
            <div className="px-3 pt-3 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => onChapterClick(chapter.id)}
                className="w-full text-left group"
                aria-label={`Open ${labels.chapter.toLowerCase()} details: ${chapter.title}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-sm font-semibold text-[#0f1a2e] leading-snug group-hover:text-amber-700 transition-colors line-clamp-2">
                    {chapter.position}. {chapter.title}
                  </h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-3.5 shrink-0 mt-0.5 text-slate-400 group-hover:text-amber-500 transition-colors"
                    aria-hidden="true"
                  >
                    <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
                  </svg>
                </div>
              </button>

              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={chapter.status} size="sm" />
                {chapter.word_count > 0 && (
                  <span className="text-[10px] text-slate-400">
                    {chapter.word_count.toLocaleString()} words
                  </span>
                )}
              </div>
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

      {/* Add Chapter column */}
      <div className="shrink-0 w-64">
        <button
          type="button"
          onClick={onAddChapter}
          className="w-full h-24 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center gap-1.5 text-sm font-medium"
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
      </div>
    </div>
  )
}
