'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NoteCard } from '@/components/notes/NoteCard'
import { NoteDialog } from '@/components/notes/NoteDialog'
import { NoteDetail } from '@/components/notes/NoteDetail'
import { Note } from '@/types/database'

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchNotes = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('ltu_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
    } else {
      setNotes(data as Note[])
      setFilteredNotes(data as Note[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    let filtered = notes

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter((note) => note.tags.includes(selectedTag))
    }

    setFilteredNotes(filtered)
  }, [searchQuery, selectedTag, notes])

  const handleSaveNote = async (title: string, content: string, eventName: string, tags: string[]) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    if (editingNote) {
      // Update existing note
      const { error } = await supabase
        .from('ltu_notes')
        .update({ title, content, event_name: eventName || null, tags, updated_at: new Date().toISOString() })
        .eq('id', editingNote.id)

      if (error) {
        console.error('Error updating note:', error)
        return
      }
    } else {
      // Create new note
      const { error } = await supabase.from('ltu_notes').insert({
        user_id: user.id,
        title,
        content,
        event_name: eventName || null,
        tags,
      })

      if (error) {
        console.error('Error creating note:', error)
        return
      }
    }

    await fetchNotes()
    setEditingNote(null)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    const { error } = await supabase.from('ltu_notes').delete().eq('id', noteId)

    if (error) {
      console.error('Error deleting note:', error)
    } else {
      await fetchNotes()
    }
  }

  const handleEditNote = (note: Note) => {
    setViewingNote(null)
    setEditingNote(note)
    setIsDialogOpen(true)
  }

  const handleNewNote = () => {
    setEditingNote(null)
    setIsDialogOpen(true)
  }

  // Get all unique tags
  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags || []))
  ).sort()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Store and organize your sermon and church notes</p>
        </div>
        <Button onClick={handleNewNote} className="bg-amber-600 hover:bg-amber-700 text-white">Add New Note</Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              All
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {viewingNote ? (
        <NoteDetail
          note={viewingNote}
          onClose={() => setViewingNote(null)}
          onEdit={handleEditNote}
          onDelete={async (noteId) => {
            await handleDeleteNote(noteId)
            setViewingNote(null)
          }}
        />
      ) : loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading notes...</div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onView={(note) => setViewingNote(note)}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            {notes.length === 0
              ? 'Your vault is empty — add your first sermon notes'
              : 'No notes match your search'}
          </p>
          {notes.length === 0 && (
            <Button onClick={handleNewNote} className="bg-amber-600 hover:bg-amber-700 text-white">Add Your First Note</Button>
          )}
        </div>
      )}

      <NoteDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        note={editingNote}
        onSave={handleSaveNote}
      />
    </div>
  )
}
