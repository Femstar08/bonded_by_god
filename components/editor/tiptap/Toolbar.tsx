'use client'

import { useState } from 'react'
import type { Editor } from '@tiptap/react'

interface ToolbarProps {
  editor: Editor
  onLookupVerse?: (reference: string) => void
  /** Called when the user clicks the microphone button to toggle dictation. */
  onToggleDictation?: () => void
  /** Whether voice dictation is currently active. Controls button appearance. */
  isDictating?: boolean
  /** Whether the browser supports the Web Speech API. Hides the button when false. */
  isDictationSupported?: boolean
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
        active
          ? 'bg-amber-100 text-amber-900'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-border/50 mx-0.5" />
}

export function Toolbar({
  editor,
  onLookupVerse,
  onToggleDictation,
  isDictating = false,
  isDictationSupported = false,
}: ToolbarProps) {
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupRef, setLookupRef] = useState('')

  const handleLookup = () => {
    if (lookupRef.trim() && onLookupVerse) {
      onLookupVerse(lookupRef.trim())
      setLookupRef('')
      setLookupOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-0.5 border-b border-border/40 bg-muted/20 px-2 py-1">
      {/* Text formatting */}
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <span className="italic">I</span>
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <Divider />

      {/* List */}
      <ToolbarButton
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
          <path fillRule="evenodd" d="M6 4.75A.75.75 0 0 1 6.75 4h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 4.75ZM6 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 10Zm0 5.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75ZM1.99 4.75a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2h-.01a1 1 0 0 1-1-1ZM2.99 9a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM1.99 15.25a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2h-.01a1 1 0 0 1-1-1Z" clipRule="evenodd" />
        </svg>
      </ToolbarButton>

      {/* Quote */}
      <ToolbarButton
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
          <path fillRule="evenodd" d="M4.5 3A2.5 2.5 0 0 0 2 5.5v3.086a2.5 2.5 0 0 0 .336 1.258l2.2 3.667A2.5 2.5 0 0 0 6.68 14.5h.32A1.5 1.5 0 0 0 8.5 13V9.5A1.5 1.5 0 0 0 7 8H5v-.5A.5.5 0 0 1 5.5 7h.75a.75.75 0 0 0 0-1.5H5.5A2 2 0 0 0 3.5 7.5v.586A2.5 2.5 0 0 0 2 10.5v-5A2.5 2.5 0 0 1 4.5 3Zm7 0A2.5 2.5 0 0 0 9 5.5v3.086a2.5 2.5 0 0 0 .336 1.258l2.2 3.667a2.5 2.5 0 0 0 2.144 1.189h.32a1.5 1.5 0 0 0 1.5-1.5V9.5A1.5 1.5 0 0 0 14 8h-2v-.5a.5.5 0 0 1 .5-.5h.75a.75.75 0 0 0 0-1.5h-.75a2 2 0 0 0-2 2v.586A2.5 2.5 0 0 0 9 10.5v-5A2.5 2.5 0 0 1 11.5 3Z" clipRule="evenodd" />
        </svg>
      </ToolbarButton>

      {/* Scripture */}
      <ToolbarButton
        active={editor.isActive('scriptureBlock')}
        onClick={() => editor.chain().focus().toggleScriptureBlock().run()}
        title="Scripture Block"
      >
        <span className="text-[10px] tracking-tight">Verse</span>
      </ToolbarButton>

      {/* Scripture Lookup */}
      {onLookupVerse && (
        <div className="relative">
          <ToolbarButton
            active={lookupOpen}
            onClick={() => setLookupOpen(!lookupOpen)}
            title="Look Up Scripture Translation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
              <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06V3.94a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.34A.75.75 0 0 0 2 4.06v11.12a.75.75 0 0 0 .954.721A7.462 7.462 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
            </svg>
          </ToolbarButton>
          {lookupOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-background border border-border rounded-lg shadow-lg p-2 w-56">
              <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Look up a verse</p>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={lookupRef}
                  onChange={(e) => setLookupRef(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="e.g. Romans 8:28"
                  className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={!lookupRef.trim()}
                  className="rounded bg-amber-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  Go
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Divider />

      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo (Ctrl+Z)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
          <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clipRule="evenodd" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo (Ctrl+Shift+Z)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
          <path fillRule="evenodd" d="M12.207 2.232a.75.75 0 0 1 1.06-.025l5.5 5.25a.75.75 0 0 1 0 1.085l-5.5 5.25a.75.75 0 0 1-1.036-1.085l4.146-3.957H6.375a3.875 3.875 0 0 0 0 7.75H9.25a.75.75 0 0 1 0 1.5H6.375a5.375 5.375 0 0 1 0-10.75h10.003l-4.146-3.957a.75.75 0 0 1-.025-1.06Z" clipRule="evenodd" />
        </svg>
      </ToolbarButton>

      {/* Voice dictation — hidden when the browser does not support the API */}
      {isDictationSupported && onToggleDictation && (
        <>
          <Divider />
          <button
            type="button"
            onClick={onToggleDictation}
            title="Toggle voice dictation (Ctrl+Shift+M)"
            className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
              isDictating
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {/* Heroicons microphone — solid, viewBox 0 0 20 20 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-3.5"
              aria-hidden="true"
            >
              <path d="M7 4a3 3 0 0 1 6 0v6a3 3 0 1 1-6 0V4Z" />
              <path d="M5.5 9.643a.75.75 0 0 0-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5H10.75v-1.546A6.001 6.001 0 0 0 16 10v-.357a.75.75 0 0 0-1.5 0V10a4.5 4.5 0 0 1-9 0v-.357Z" />
            </svg>
            <span className="sr-only">{isDictating ? 'Stop dictation' : 'Start dictation'}</span>
          </button>
        </>
      )}
    </div>
  )
}
