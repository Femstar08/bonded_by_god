'use client'

import { useRef, useState, useEffect } from 'react'
import { ChapterStatus, ColorLabel } from '@/types/database'
import { StatusBadge } from './StatusBadge'
import type { PlannerChapter } from './BoardView'

interface CorkBoardViewProps {
  chapters: PlannerChapter[]
  projectType: string
  onReorder: (fromIndex: number, toIndex: number) => void
  onAddChapter: () => void
  onAddPart: () => void
  onChapterClick: (chapterId: string) => void
  onStatusChange: (chapterId: string, status: ChapterStatus) => void
  onColorChange: (chapterId: string, color: ColorLabel) => void
  onSynopsisChange: (chapterId: string, synopsis: string) => void
  onTitleChange: (chapterId: string, title: string) => void
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

const ALL_STATUSES: ChapterStatus[] = [
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

// ─── Individual card component ────────────────────────────
interface ChapterCardProps {
  chapter: PlannerChapter
  index: number
  isDragOver: boolean
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void
  onChapterClick: (chapterId: string) => void
  onStatusChange: (chapterId: string, status: ChapterStatus) => void
  onColorChange: (chapterId: string, color: ColorLabel) => void
  onSynopsisChange: (chapterId: string, synopsis: string) => void
  onTitleChange: (chapterId: string, title: string) => void
}

function ChapterCard({
  chapter,
  index,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onChapterClick,
  onStatusChange,
  onColorChange,
  onSynopsisChange,
  onTitleChange,
}: ChapterCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(chapter.title)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Sync local edit state when chapter.title changes externally
  useEffect(() => {
    if (!isEditingTitle) {
      setEditTitle(chapter.title)
    }
  }, [chapter.title, isEditingTitle])

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const commitTitleEdit = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== chapter.title) {
      onTitleChange(chapter.id, trimmed)
    } else {
      setEditTitle(chapter.title)
    }
    setIsEditingTitle(false)
  }

  const borderColor = chapter.color_label
    ? COLOR_LABEL_HEX[chapter.color_label]
    : '#e2e8f0'

  const truncatedSynopsis = chapter.synopsis
    ? chapter.synopsis.slice(0, 300)
    : ''

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`relative flex flex-col rounded-xl bg-white shadow-sm border transition-all duration-150 ${
        isDragOver
          ? 'ring-2 ring-amber-400 border-amber-300 shadow-md scale-[1.01]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
      style={{ borderLeft: `6px solid ${borderColor}` }}
    >
      {/* Card header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          {/* Title — double-click to edit inline */}
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitTitleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitleEdit()
                if (e.key === 'Escape') {
                  setEditTitle(chapter.title)
                  setIsEditingTitle(false)
                }
              }}
              className="flex-1 text-sm font-semibold font-serif bg-amber-50 border border-amber-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
              maxLength={120}
            />
          ) : (
            <h3
              className="flex-1 text-sm font-semibold font-serif text-[#0f1a2e] leading-snug cursor-text line-clamp-2 hover:text-amber-700 transition-colors"
              onDoubleClick={() => setIsEditingTitle(true)}
              title="Double-click to edit title"
            >
              {chapter.position}. {chapter.title}
            </h3>
          )}

          {/* Expand / detail button */}
          <button
            type="button"
            onClick={() => onChapterClick(chapter.id)}
            className="shrink-0 p-0.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            aria-label={`Open chapter details for ${chapter.title}`}
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
          </button>
        </div>

        {/* Status select */}
        <div className="flex items-center gap-2">
          <select
            value={chapter.status}
            onChange={(e) => onStatusChange(chapter.id, e.target.value as ChapterStatus)}
            className="text-[10px] bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Chapter status"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <StatusBadge status={chapter.status} size="sm" />
        </div>
      </div>

      {/* Synopsis */}
      <div className="px-3 pb-2 flex-1">
        {truncatedSynopsis ? (
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-4">
            {truncatedSynopsis}
            {chapter.synopsis && chapter.synopsis.length > 300 && (
              <span className="text-slate-400">…</span>
            )}
          </p>
        ) : (
          <p className="text-[11px] text-slate-300 italic">No synopsis yet</p>
        )}
      </div>

      {/* Footer: word count + color picker */}
      <div className="px-3 pb-3 flex items-center justify-between gap-2">
        {chapter.word_count > 0 ? (
          <span className="text-[10px] text-slate-400 font-medium">
            {chapter.word_count.toLocaleString()} words
          </span>
        ) : (
          <span />
        )}

        {/* Color label picker */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowColorPicker((prev) => !prev)
            }}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Change color label"
            aria-expanded={showColorPicker}
          >
            <span
              className="size-3 rounded-full border border-white shadow-sm"
              style={{
                backgroundColor: chapter.color_label
                  ? COLOR_LABEL_HEX[chapter.color_label]
                  : '#cbd5e1',
              }}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-3"
              aria-hidden="true"
            >
              <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474Z" />
              <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
            </svg>
          </button>

          {showColorPicker && (
            <div
              className="absolute bottom-full right-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex items-center gap-1.5 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Clear color */}
              <button
                type="button"
                onClick={() => {
                  onColorChange(chapter.id, null)
                  setShowColorPicker(false)
                }}
                className="size-5 rounded-full border-2 border-dashed border-slate-300 hover:border-slate-500 transition-colors flex items-center justify-center"
                aria-label="Remove color label"
                title="No color"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-2.5 text-slate-400"
                  aria-hidden="true"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>

              {(Object.entries(COLOR_LABEL_HEX) as [NonNullable<ColorLabel>, string][]).map(
                ([colorKey, hex]) => (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => {
                      onColorChange(chapter.id, colorKey)
                      setShowColorPicker(false)
                    }}
                    className={`size-5 rounded-full border-2 transition-transform hover:scale-110 ${
                      chapter.color_label === colorKey
                        ? 'border-slate-600 scale-110'
                        : 'border-white shadow-sm'
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={`${colorKey} label`}
                    title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main CorkBoardView ────────────────────────────────────
export function CorkBoardView({
  chapters,
  projectType,
  onReorder,
  onAddChapter,
  onAddPart,
  onChapterClick,
  onStatusChange,
  onColorChange,
  onSynopsisChange,
  onTitleChange,
}: CorkBoardViewProps) {
  const labels = getProjectLabels(projectType)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragFromIndex = useRef<number | null>(null)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragFromIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => {
      if (e.currentTarget) e.currentTarget.style.opacity = '0.4'
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault()
    if (dragFromIndex.current !== null && dragFromIndex.current !== toIndex) {
      onReorder(dragFromIndex.current, toIndex)
    }
    setDragOverIndex(null)
    dragFromIndex.current = null
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1'
    setDragOverIndex(null)
    dragFromIndex.current = null
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {chapters.map((chapter, index) => {
          // ── Part divider — spans full width ──
          if (chapter.type === 'part') {
            return (
              <div
                key={chapter.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`col-span-full cursor-grab active:cursor-grabbing transition-all duration-150 ${
                  dragOverIndex === index ? 'ring-2 ring-amber-400' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => onChapterClick(chapter.id)}
                  className="w-full text-left"
                >
                  <div className="bg-[#0f1a2e] rounded-lg px-4 py-3 flex items-center gap-3 group hover:bg-[#142035] transition-colors">
                    <p className="text-[10px] text-amber-400/60 uppercase tracking-widest shrink-0">Part</p>
                    <h3 className="font-serif text-sm font-semibold text-amber-100 group-hover:text-amber-50 transition-colors">
                      {chapter.title}
                    </h3>
                    {chapter.synopsis && (
                      <p className="text-[10px] text-white/40 truncate ml-2">
                        {chapter.synopsis}
                      </p>
                    )}
                  </div>
                </button>
              </div>
            )
          }

          // ── Regular chapter card ──
          return (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={index}
              isDragOver={dragOverIndex === index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onChapterClick={onChapterClick}
              onStatusChange={onStatusChange}
              onColorChange={onColorChange}
              onSynopsisChange={onSynopsisChange}
              onTitleChange={onTitleChange}
            />
          )
        })}

        {/* Add Chapter card */}
        <button
          type="button"
          onClick={onAddChapter}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-all min-h-[140px] text-sm font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-6"
            aria-hidden="true"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add {labels.chapter}
        </button>

        {/* Add Part card */}
        <button
          type="button"
          onClick={onAddPart}
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-500 text-slate-400 hover:border-amber-400 hover:text-amber-500 hover:bg-[#0f1a2e]/10 transition-all min-h-[80px] text-xs font-medium col-span-full"
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
          Add Part
        </button>
      </div>
    </div>
  )
}
