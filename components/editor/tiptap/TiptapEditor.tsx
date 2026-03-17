'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useCallback, useRef } from 'react'
import { getExtensions } from './extensions'
import { Toolbar } from './Toolbar'
import { FloatingToolbar } from './FloatingToolbar'
import { useVoiceDictation } from '@/lib/hooks/useVoiceDictation'

interface TiptapEditorProps {
  initialContent: string
  onUpdate: (html: string, text: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  onAiAction?: (action: string, selectedText: string) => void
  onLookupVerse?: (reference: string) => void
  paragraphFocus?: boolean
}

/**
 * Convert plain text content to basic HTML paragraphs.
 * If content already contains HTML tags, return as-is.
 */
function ensureHtml(content: string): string {
  if (!content) return ''
  // Already HTML — return as-is
  if (/<[a-z][\s\S]*>/i.test(content)) return content
  // Plain text — convert line breaks to paragraphs
  return content
    .split(/\n\s*\n/)
    .map((para) => {
      const withBreaks = para.trim().replace(/\n/g, '<br>')
      return withBreaks ? `<p>${withBreaks}</p>` : ''
    })
    .filter(Boolean)
    .join('')
}

export function TiptapEditor({
  initialContent,
  onUpdate,
  placeholder,
  editable = true,
  className,
  onAiAction,
  onLookupVerse,
  paragraphFocus = false,
}: TiptapEditorProps) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  // ─── Voice dictation ────────────────────────────────────────────────────
  // handleDictationResult is defined before the hook so it can be passed as
  // a stable callback. The editor ref ensures we always have the latest instance.
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  const handleDictationResult = useCallback((text: string) => {
    editorRef.current?.chain().focus().insertContent(text + ' ').run()
  }, [])

  const {
    isListening: isDictating,
    isSupported: isDictationSupported,
    interimTranscript,
    toggleListening: toggleDictation,
  } = useVoiceDictation({ onResult: handleDictationResult })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getExtensions(placeholder),
    content: ensureHtml(initialContent),
    editable,
    editorProps: {
      attributes: {
        class: [
          'tiptap-editor prose prose-sm max-w-none',
          'focus:outline-none',
          'font-serif text-base leading-relaxed tracking-wide',
          'min-h-[60vh] px-6 py-4',
          paragraphFocus ? 'paragraph-focus' : '',
        ].filter(Boolean).join(' '),
      },
    },
    onUpdate: ({ editor: e }) => {
      onUpdateRef.current(e.getHTML(), e.getText())
    },
  })

  // Keep editorRef in sync so handleDictationResult always has the live instance
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  // Sync editable prop
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  // Sync paragraph focus class
  useEffect(() => {
    if (!editor) return
    const el = editor.view.dom
    if (paragraphFocus) {
      el.classList.add('paragraph-focus')
    } else {
      el.classList.remove('paragraph-focus')
    }
  }, [editor, paragraphFocus])

  // Keyboard shortcut: Ctrl+Shift+M / Cmd+Shift+M → toggle dictation
  useEffect(() => {
    if (!isDictationSupported) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        toggleDictation()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDictationSupported, toggleDictation])

  if (!editor) return null

  return (
    <div
      className={`bg-background overflow-hidden ${
        className ?? ''
      }`}
    >
      <Toolbar
        editor={editor}
        onLookupVerse={onLookupVerse}
        onToggleDictation={toggleDictation}
        isDictating={isDictating}
        isDictationSupported={isDictationSupported}
      />

      {/* Listening status bar — visible only while dictation is active */}
      {isDictating && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-1.5 border-b border-red-100">
          <span
            className="inline-block size-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"
            aria-hidden="true"
          />
          <span className="font-medium">Listening&hellip;</span>
          {interimTranscript && (
            <span className="text-red-500 truncate italic">&ldquo;{interimTranscript}&rdquo;</span>
          )}
        </div>
      )}

      <FloatingToolbar editor={editor} onAiAction={onAiAction} />
      <EditorContent editor={editor} />
    </div>
  )
}
