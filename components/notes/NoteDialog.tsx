'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Note } from '@/types/database'

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: Note | null
  onSave: (title: string, content: string, eventName: string, tags: string[]) => Promise<void>
}

export function NoteDialog({ open, onOpenChange, note, onSave }: NoteDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [eventName, setEventName] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title || '')
      setContent(note.content)
      setEventName(note.event_name || '')
      setTagsInput(note.tags.join(', '))
    } else {
      setTitle('')
      setContent('')
      setEventName('')
      setTagsInput('')
    }
  }, [note, open])

  const handleSave = async () => {
    setLoading(true)
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    await onSave(title, content, eventName, tags)
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'Add New Note'}</DialogTitle>
          <DialogDescription>
            Paste your sermon or church notes here. Add tags to organize them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sunday Sermon on Grace"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-name">Event Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="event-name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Sunday Service, Bible Study, Conference"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Note Content <span className="text-destructive">*</span></Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your notes here..."
              rows={10}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., sermon, love, John 3:16"
            />
            <p className="text-sm text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !title.trim() || !content.trim()}>
            {loading ? 'Saving...' : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
