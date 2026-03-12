'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { upsertWritingSession } from '@/lib/actions/writing-sessions'
import { countWords } from '@/lib/utils/text'
import { TiptapEditor } from './tiptap/TiptapEditor'

interface WritingEditorProps {
  chapterId: string
  projectId: string
  initialContent: string
  onContentChange?: (plainText: string) => void
  lastMemoryWordCount?: number
  onMemoryTrigger?: (chapterId: string, projectId: string) => void
  onAiAction?: (action: string, selectedText: string) => void
  paragraphFocus?: boolean
}

export function WritingEditor({
  chapterId,
  projectId,
  initialContent,
  onContentChange,
  lastMemoryWordCount = 0,
  onMemoryTrigger,
  onAiAction,
  paragraphFocus,
}: WritingEditorProps) {
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
        const { error } = await supabase
          .from('ltu_chapters')
          .update({ content: html })
          .eq('id', chapterId)
        if (error) {
          setStatus('error')
        } else {
          setStatus('saved')
          lastSavedRef.current = html
          const wc = countWords(html.replace(/<[^>]*>/g, ''))
          upsertWritingSession(projectId, wc)
          if (onMemoryTrigger && wc - lastMemoryWordCount >= 150) {
            onMemoryTrigger(chapterId, projectId)
          }
        }
      } catch {
        setStatus('error')
      }
    },
    [chapterId, projectId, lastMemoryWordCount, onMemoryTrigger]
  )

  const handleUpdate = useCallback(
    (html: string, text: string) => {
      latestHtmlRef.current = html
      onContentChange?.(text)

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
        initialContent={initialContent}
        onUpdate={handleUpdate}
        placeholder="Start writing... Type / to insert scripture, reflection, or story."
        onAiAction={onAiAction}
        paragraphFocus={paragraphFocus}
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
}
