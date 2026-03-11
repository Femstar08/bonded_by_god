'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useCallback, useRef } from 'react'
import { getExtensions } from './extensions'
import { Toolbar } from './Toolbar'
import { FloatingToolbar } from './FloatingToolbar'

interface TiptapEditorProps {
  initialContent: string
  onUpdate: (html: string, text: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  onAiAction?: (action: string, selectedText: string) => void
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
  paragraphFocus = false,
}: TiptapEditorProps) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

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
          'min-h-[500px] px-8 py-6',
          paragraphFocus ? 'paragraph-focus' : '',
        ].filter(Boolean).join(' '),
      },
    },
    onUpdate: ({ editor: e }) => {
      onUpdateRef.current(e.getHTML(), e.getText())
    },
  })

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

  if (!editor) return null

  return (
    <div
      className={`rounded-md border border-border/30 bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring/30 ${
        className ?? ''
      }`}
    >
      <Toolbar editor={editor} />
      <FloatingToolbar editor={editor} onAiAction={onAiAction} />
      <EditorContent editor={editor} />
    </div>
  )
}
