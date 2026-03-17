'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface StructureItem {
  id: string
  type: 'part' | 'chapter'
  title: string
  parentId: string | null
}

interface StructureBuilderProps {
  items: StructureItem[]
  onChange: (items: StructureItem[]) => void
  hierarchyLabels: { part: string; chapter: string; section: string }
}

// ────────────────────────────────────────────────────────────────────────────
// Drag-and-drop state stored in a ref so re-renders don't reset it mid-drag
// ────────────────────────────────────────────────────────────────────────────
interface DragState {
  dragId: string
  overItemId: string | null
}

export function StructureBuilder({ items, onChange, hierarchyLabels }: StructureBuilderProps) {
  // Track which item title is being edited (its id)
  const [editingId, setEditingId] = useState<string | null>(null)
  const dragState = useRef<DragState | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // ── helpers ────────────────────────────────────────────────────────────────

  function getLastPartId(): string | null {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].type === 'part') return items[i].id
    }
    return null
  }

  function countChaptersForPart(partId: string): number {
    return items.filter((it) => it.type === 'chapter' && it.parentId === partId).length
  }

  // ── mutations ──────────────────────────────────────────────────────────────

  function addPart() {
    const id = crypto.randomUUID()
    const partNumber = items.filter((it) => it.type === 'part').length + 1
    const newItem: StructureItem = {
      id,
      type: 'part',
      title: `${hierarchyLabels.part} ${partNumber}`,
      parentId: null,
    }
    onChange([...items, newItem])
    setEditingId(id)
  }

  function addChapter() {
    const id = crypto.randomUUID()
    const parentId = getLastPartId()
    const chapterNumber = items.filter((it) => it.type === 'chapter').length + 1
    const newItem: StructureItem = {
      id,
      type: 'chapter',
      title: `${hierarchyLabels.chapter} ${chapterNumber}`,
      parentId,
    }
    onChange([...items, newItem])
    setEditingId(id)
  }

  function updateTitle(id: string, title: string) {
    onChange(items.map((it) => (it.id === id ? { ...it, title } : it)))
  }

  function deleteItem(id: string) {
    // When a part is deleted, orphan its chapters (set parentId = null)
    const deleted = items.find((it) => it.id === id)
    let updated = items.filter((it) => it.id !== id)
    if (deleted?.type === 'part') {
      updated = updated.map((it) =>
        it.type === 'chapter' && it.parentId === id ? { ...it, parentId: null } : it
      )
    }
    onChange(updated)
  }

  // ── drag-and-drop ──────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    dragState.current = { dragId: id, overItemId: null }
    e.dataTransfer.effectAllowed = 'move'
    // Browsers require some data
    e.dataTransfer.setData('text/plain', id)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, overId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragState.current) {
      dragState.current.overItemId = overId
    }
    setDragOverId(overId)
  }

  function handleDragLeave() {
    setDragOverId(null)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault()
    setDragOverId(null)
    if (!dragState.current) return

    const { dragId } = dragState.current
    dragState.current = null

    if (dragId === targetId) return

    const dragIndex = items.findIndex((it) => it.id === dragId)
    const targetIndex = items.findIndex((it) => it.id === targetId)
    if (dragIndex === -1 || targetIndex === -1) return

    const dragged = items[dragIndex]

    // Determine new parentId for a chapter: use the nearest part above the
    // drop position, or null if there isn't one
    let newParentId = dragged.parentId
    if (dragged.type === 'chapter') {
      const targetItem = items[targetIndex]
      if (targetItem.type === 'part') {
        // Dropped onto a part header → assign to that part
        newParentId = targetItem.id
      } else {
        // Dropped onto another chapter → use that chapter's parentId
        newParentId = targetItem.parentId
      }
    }

    const reordered = [...items]
    reordered.splice(dragIndex, 1)

    // Recalculate insert index after removal
    const newTargetIndex = reordered.findIndex((it) => it.id === targetId)
    reordered.splice(newTargetIndex + 1, 0, { ...dragged, parentId: newParentId })

    onChange(reordered)
  }

  function handleDragEnd() {
    dragState.current = null
    setDragOverId(null)
  }

  // ── render helpers ─────────────────────────────────────────────────────────

  function renderItem(item: StructureItem) {
    const isPart = item.type === 'part'
    const isDragTarget = dragOverId === item.id

    return (
      <div
        key={item.id}
        draggable
        onDragStart={(e) => handleDragStart(e, item.id)}
        onDragOver={(e) => handleDragOver(e, item.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, item.id)}
        onDragEnd={handleDragEnd}
        className={[
          'group flex items-center gap-2 rounded-xl transition-all duration-100',
          isPart
            ? 'bg-slate-800 px-3 py-2.5 mt-3 first:mt-0'
            : 'bg-white border border-border/40 px-3 py-2 ml-6',
          isDragTarget ? 'ring-2 ring-amber-400/60 scale-[1.01]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Drag handle */}
        <span
          className={[
            'cursor-grab active:cursor-grabbing shrink-0 opacity-30 group-hover:opacity-60 transition-opacity',
            isPart ? 'text-slate-300' : 'text-slate-400',
          ].join(' ')}
          aria-hidden="true"
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="9" cy="3" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="9" cy="8" r="1.5" />
            <circle cx="3" cy="13" r="1.5" />
            <circle cx="9" cy="13" r="1.5" />
          </svg>
        </span>

        {/* Title */}
        {editingId === item.id ? (
          <Input
            autoFocus
            value={item.title}
            onChange={(e) => updateTitle(item.id, e.target.value)}
            onBlur={() => setEditingId(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setEditingId(null)
            }}
            className={[
              'h-7 flex-1 text-[13px] border-0 shadow-none focus-visible:ring-1 focus-visible:ring-amber-400/60 px-1',
              isPart ? 'bg-slate-700 text-white placeholder:text-slate-400 rounded' : 'bg-transparent text-foreground',
            ].join(' ')}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingId(item.id)}
            title="Click to edit title"
            className={[
              'flex-1 text-left text-[13px] truncate focus:outline-none focus-visible:underline',
              isPart ? 'font-semibold text-white tracking-wide' : 'text-foreground/80',
            ].join(' ')}
          >
            {item.title}
          </button>
        )}

        {/* Chapter count badge on parts */}
        {isPart && (
          <span className="shrink-0 text-[10px] font-medium text-slate-400 tabular-nums">
            {countChaptersForPart(item.id)}{' '}
            {countChaptersForPart(item.id) === 1
              ? hierarchyLabels.chapter.toLowerCase()
              : `${hierarchyLabels.chapter.toLowerCase()}s`}
          </span>
        )}

        {/* Delete button */}
        <button
          type="button"
          onClick={() => deleteItem(item.id)}
          aria-label={`Remove ${item.title}`}
          className={[
            'shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100',
            isPart
              ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700'
              : 'text-slate-400 hover:text-red-500 hover:bg-red-50',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Item list */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-slate-50/50 px-4 py-6 text-center">
          <p className="text-[13px] text-muted-foreground/50">
            No structure yet. Add a {hierarchyLabels.part.toLowerCase()} or{' '}
            {hierarchyLabels.chapter.toLowerCase()} below.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 bg-slate-50/60 p-3 space-y-1.5 overflow-hidden">
          {items.map((item) => renderItem(item))}
        </div>
      )}

      {/* Add buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPart}
          className="rounded-lg border-border/50 text-[12px] font-medium text-foreground/70 hover:text-foreground hover:border-border hover:bg-slate-50 gap-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add {hierarchyLabels.part}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addChapter}
          className="rounded-lg border-border/50 text-[12px] font-medium text-foreground/70 hover:text-foreground hover:border-border hover:bg-slate-50 gap-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add {hierarchyLabels.chapter}
        </Button>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="ml-auto text-[11px] text-muted-foreground/40 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
