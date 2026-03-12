import { Note } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'

interface NoteCardProps {
  note: Note
  onView?: (note: Note) => void
  onEdit?: (note: Note) => void
  onDelete?: (noteId: string) => void
}

export function NoteCard({ note, onView, onEdit, onDelete }: NoteCardProps) {
  const preview = note.content.length > 100
    ? note.content.substring(0, 100) + '...'
    : note.content

  return (
    <div
      className="group relative rounded-2xl border border-border/50 bg-white p-6 cursor-pointer hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-0.5 transition-all duration-[250ms]"
      onClick={() => onView?.(note)}
    >
      {/* Action buttons — fade in on hover */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(note) }}
            aria-label="Edit note"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Pencil size={13} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
            aria-label="Delete note"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Title */}
      <h3 className="font-serif text-lg font-normal text-foreground line-clamp-2 pr-14">
        {note.title || note.content.split('\n')[0].substring(0, 50)}
      </h3>

      {/* Event name */}
      {note.event_name && (
        <p className="text-[12px] text-muted-foreground/50 mt-0.5 truncate">
          {note.event_name}
        </p>
      )}

      {/* Content preview */}
      <p className="text-[13px] text-muted-foreground/60 line-clamp-3 mt-2 leading-relaxed whitespace-pre-wrap">
        {preview}
      </p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
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

      {/* Timestamp */}
      <p className="text-[11px] text-muted-foreground/40 mt-4">
        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
      </p>
    </div>
  )
}
