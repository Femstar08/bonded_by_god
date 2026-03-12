'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
      <DialogContent className="max-w-lg w-full rounded-2xl bg-white shadow-2xl p-8 border-0 [&>button]:hidden">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-serif text-2xl font-normal text-foreground">
            {note ? 'Edit Note' : 'New Note'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground/60 mt-1">
            Paste your sermon or church notes here. Add tags to organise them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="note-title"
              className="block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2"
            >
              Title <span className="text-red-400 normal-case tracking-normal">*</span>
            </label>
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sunday Sermon on Grace"
              className="w-full rounded-xl border border-border/50 py-3 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-shadow"
            />
          </div>

          {/* Event name */}
          <div>
            <label
              htmlFor="note-event"
              className="block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2"
            >
              Event{' '}
              <span className="text-muted-foreground/40 normal-case tracking-normal font-normal">
                (optional)
              </span>
            </label>
            <input
              id="note-event"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Sunday Service, Bible Study, Conference"
              className="w-full rounded-xl border border-border/50 py-3 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-shadow"
            />
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="note-content"
              className="block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2"
            >
              Content <span className="text-red-400 normal-case tracking-normal">*</span>
            </label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your notes here…"
              rows={10}
              className="w-full rounded-xl border border-border/50 py-3 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/35 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-shadow resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="note-tags"
              className="block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2"
            >
              Tags
            </label>
            <input
              id="note-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., sermon, love, John 3:16"
              className="w-full rounded-xl border border-border/50 py-3 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-shadow"
            />
            <p className="text-[12px] text-muted-foreground/40 mt-1.5">
              Separate multiple tags with commas
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={() => onOpenChange(false)}
            className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 px-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !title.trim() || !content.trim()}
            className="bg-[#0f1a2e] hover:bg-[#1a2d4d] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 px-6 text-[14px] font-semibold transition-colors duration-150"
          >
            {loading ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
