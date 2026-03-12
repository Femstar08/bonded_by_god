'use client'

import type { Editor } from '@tiptap/react'

interface ToolbarProps {
  editor: Editor
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

export function Toolbar({ editor }: ToolbarProps) {
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
    </div>
  )
}
