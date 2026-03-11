import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Note } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

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
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView?.(note)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">
              {note.title || note.content.split('\n')[0].substring(0, 50)}
            </CardTitle>
            {note.event_name && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{note.event_name}</p>
            )}
          </div>
          <div className="flex gap-2 ml-2 shrink-0">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(note) }}
                className="text-sm text-primary hover:underline"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                className="text-sm text-destructive hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <CardDescription>
          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
          {preview}
        </p>
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
