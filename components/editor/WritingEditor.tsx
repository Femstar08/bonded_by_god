'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { upsertWritingSession } from '@/lib/actions/writing-sessions'
import { countWords } from '@/lib/utils/text'
import { decomposeSectionedContent } from '@/lib/editor/sectionContent'
import { TiptapEditor, TiptapEditorRef } from './tiptap/TiptapEditor'
import { forwardRef } from 'react'

/** Minimal section descriptor passed in from the parent. */
interface SectionMeta {
  id: string
  title: string
  position: number
}

interface WritingEditorProps {
  chapterId: string
  projectId: string
  initialContent: string
  onContentChange?: (plainText: string) => void
  lastMemoryWordCount?: number
  onMemoryTrigger?: (chapterId: string, projectId: string) => void
  onAiAction?: (action: string, selectedText: string) => void
  onLookupVerse?: (reference: string) => void
  paragraphFocus?: boolean
  /**
   * When provided, saving will decompose the HTML into the chapter intro
   * and per-section fragments, persisting each fragment to its own row in
   * `ltu_sections`.  If omitted, the save path is identical to the legacy
   * behaviour (full HTML written to `ltu_chapters.content`).
   */
  sections?: SectionMeta[]
}

export const WritingEditor = forwardRef<TiptapEditorRef, WritingEditorProps>(function WritingEditor({
  chapterId,
  projectId,
  initialContent,
  onContentChange,
  lastMemoryWordCount = 0,
  onMemoryTrigger,
  onAiAction,
  onLookupVerse,
  paragraphFocus,
  sections,
}, ref) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef(initialContent)
  const latestHtmlRef = useRef(initialContent)

  const saveContent = useCallback(
    async (html: string) => {
      if (html === lastSavedRef.current) return
      setStatus('saving')
      try {
        const supabase = createClient()

        if (sections && sections.length > 0) {
          // --- Sectioned save path ---
          // Split the composite HTML into the chapter intro and per-section
          // content fragments, then persist each fragment independently.
          const { intro, sections: decomposed } = decomposeSectionedContent(html)

          // 1. Persist the chapter intro (pre-first-section content).
          const { error: chapterError } = await supabase
            .from('ltu_chapters')
            .update({ content: intro })
            .eq('id', chapterId)

          if (chapterError) {
            setStatus('error')
            return
          }

          // 2. Persist each section's content and word count in parallel.
          //    Only update sections that were found in the decomposed output.
          const sectionUpdates = decomposed.map(({ id, content }) => {
            const wc = countWords(content.replace(/<[^>]*>/g, ''))
            return supabase
              .from('ltu_sections')
              .update({ content, word_count: wc })
              .eq('id', id)
          })

          const results = await Promise.all(sectionUpdates)
          const sectionError = results.find((r) => r.error)?.error ?? null

          if (sectionError) {
            setStatus('error')
            return
          }
        } else {
          // --- Legacy (no sections) save path ---
          // Preserve original behaviour exactly: write the full HTML to the
          // chapter row and nothing else.
          const { error } = await supabase
            .from('ltu_chapters')
            .update({ content: html })
            .eq('id', chapterId)

          if (error) {
            setStatus('error')
            return
          }
        }

        // Shared post-save logic regardless of which path ran.
        setStatus('saved')
        lastSavedRef.current = html
        const wc = countWords(html.replace(/<[^>]*>/g, ''))
        upsertWritingSession(projectId, wc)
        if (onMemoryTrigger && wc - lastMemoryWordCount >= 150) {
          onMemoryTrigger(chapterId, projectId)
        }
      } catch {
        setStatus('error')
      }
    },
    [chapterId, projectId, lastMemoryWordCount, onMemoryTrigger, sections]
  )

  const handleUpdate = useCallback(
    (html: string, _text: string) => {
      latestHtmlRef.current = html
      // Pass HTML so the parent can parse section dividers for word counts
      onContentChange?.(html)

      // Debounced auto-save
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => saveContent(html), 2000)
    },
    [onContentChange, saveContent]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col flex-1">
      <TiptapEditor
        ref={ref}
        initialContent={initialContent}
        onUpdate={handleUpdate}
        placeholder="Start writing... Type / to insert scripture, reflection, or story."
        onAiAction={onAiAction}
        onLookupVerse={onLookupVerse}
        paragraphFocus={paragraphFocus}
        sections={sections}
      />
      {/* Auto-save status — subtle indicator below editor */}
      <div className="flex justify-end pt-1.5 pr-1">
        <span className="text-[11px] text-muted-foreground/60">
          {status === 'saving' && 'Auto-saving...'}
          {status === 'saved' && 'Saved'}
          {status === 'error' && (
            <button
              onClick={() => saveContent(latestHtmlRef.current)}
              className="text-destructive hover:underline"
            >
              Save failed. Retry
            </button>
          )}
        </span>
      </div>
    </div>
  )
})
