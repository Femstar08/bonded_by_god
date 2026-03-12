'use client'

import { Note } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { Pencil, Trash2, X } from 'lucide-react'

interface NoteDetailProps {
  note: Note
  onClose: () => void
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
}

export function NoteDetail({ note, onClose, onEdit, onDelete }: NoteDetailProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0 pr-6">
          <h2 className="font-serif text-2xl font-normal text-foreground">
            {note.title || 'Untitled Note'}
          </h2>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
            {note.event_name && (
              <span className="text-[13px] text-muted-foreground/60">
                <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/40 mr-1.5">
                  Event
                </span>
                {note.event_name}
              </span>
            )}
            <span className="text-[13px] text-muted-foreground/50">
              <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/40 mr-1.5">
                Added
              </span>
              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </span>
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {note.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onEdit(note)}
            className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-[13px] font-medium text-foreground/70 hover:text-foreground hover:border-border transition-colors duration-150"
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-[13px] font-medium text-muted-foreground/60 hover:text-destructive hover:border-destructive/30 transition-colors duration-150"
          >
            <Trash2 size={13} />
            Delete
          </button>
          <button
            onClick={onClose}
            aria-label="Close detail view"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors duration-150 ml-1"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/40 mb-6" />

      {/* Note content */}
      <div className="prose prose-sm max-w-none leading-relaxed text-foreground whitespace-pre-wrap">
        {note.content}
      </div>
    </div>
  )
}
