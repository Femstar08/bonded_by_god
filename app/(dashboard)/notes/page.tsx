'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NoteCard } from '@/components/notes/NoteCard'
import { NoteDialog } from '@/components/notes/NoteDialog'
import { NoteDetail } from '@/components/notes/NoteDetail'
import { Note } from '@/types/database'
import { Search } from 'lucide-react'

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
    <div className="max-w-4xl mx-auto px-10 py-12">

      {/* Page header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground">
            Notes Vault
          </h1>
          <p className="text-muted-foreground/60 text-[15px] mt-3">
            Store and organise your sermon notes, reflections, and church teachings
          </p>
        </div>
        <button
          onClick={handleNewNote}
          className="bg-[#0f1a2e] hover:bg-[#1a2d4d] text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors duration-200 shrink-0 mt-1"
        >
          New Note
        </button>
      </div>

      {/* Search and tag filters */}
      <div className="space-y-4 mb-8">
        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
            size={16}
          />
          <input
            type="text"
            placeholder="Search notes by title, content, or tag…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border/50 bg-white py-3 px-4 pl-10 text-[15px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-shadow"
          />
        </div>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50 mr-1">
              Filter
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 ${
                selectedTag === null
                  ? 'bg-[#0f1a2e] text-white'
                  : 'bg-white border border-border/50 text-muted-foreground hover:border-border'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 ${
                  selectedTag === tag
                    ? 'bg-[#0f1a2e] text-white'
                    : 'bg-white border border-border/50 text-muted-foreground hover:border-border'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content area */}
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
        <div className="text-center py-16 text-muted-foreground/50 text-[15px]">
          Loading notes…
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/40 rounded-2xl">
          <p className="text-[15px] text-muted-foreground/50 mb-5">
            {notes.length === 0
              ? 'Your vault is empty. Add your first sermon notes'
              : 'No notes match your search'}
          </p>
          {notes.length === 0 && (
            <button
              onClick={handleNewNote}
              className="bg-[#0f1a2e] hover:bg-[#1a2d4d] text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors duration-200"
            >
              Add Your First Note
            </button>
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
