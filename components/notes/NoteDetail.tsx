'use client'

import { Note } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

interface NoteDetailProps {
  note: Note
  onClose: () => void
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
}

export function NoteDetail({ note, onClose, onEdit, onDelete }: NoteDetailProps) {
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{note.title || 'Untitled Note'}</CardTitle>
            {note.event_name && (
              <p className="text-sm text-muted-foreground mt-1">Event: {note.event_name}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Created {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(note)}>Edit</Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(note.id)}>Delete</Button>
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
          {note.content}
        </div>
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {note.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
