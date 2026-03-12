'use client'

import { BubbleMenu } from '@tiptap/react/menus'
import type { Editor } from '@tiptap/react'

interface FloatingToolbarProps {
  editor: Editor
  onAiAction?: (action: string, selectedText: string) => void
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
      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
        active
          ? 'bg-amber-100 text-amber-900'
          : 'text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )
}

function AiButton({
  onClick,
  children,
  title,
}: {
  onClick: () => void
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="px-2 py-1 text-[11px] font-medium rounded transition-colors text-amber-800 bg-amber-50 hover:bg-amber-100"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-border/50 mx-0.5" />
}

export function FloatingToolbar({ editor, onAiAction }: FloatingToolbarProps) {
  const getSelectedText = () => {
    const { from, to } = editor.state.selection
    return editor.state.doc.textBetween(from, to, ' ')
  }

  return (
    <BubbleMenu
      editor={editor}
      className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background shadow-md px-1.5 py-1"
    >
      {/* Formatting row */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <span className="italic">I</span>
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          &ldquo;&rdquo;
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('scriptureBlock')}
          onClick={() => editor.chain().focus().toggleScriptureBlock().run()}
          title="Scripture Block"
        >
          Verse
        </ToolbarButton>
      </div>

      {/* AI actions row — appears on text selection */}
      {onAiAction && (
        <div className="flex items-center gap-0.5 border-t border-border/40 pt-1">
          <AiButton
            onClick={() => onAiAction('expand', getSelectedText())}
            title="Expand selected text"
          >
            Expand
          </AiButton>
          <AiButton
            onClick={() => onAiAction('rewrite', getSelectedText())}
            title="Improve clarity"
          >
            Rewrite
          </AiButton>
          <AiButton
            onClick={() => onAiAction('scripture', getSelectedText())}
            title="Add supporting scripture"
          >
            Scripture
          </AiButton>
          <AiButton
            onClick={() => onAiAction('deepen', getSelectedText())}
            title="Deepen reflection"
          >
            Deepen
          </AiButton>
        </div>
      )}
    </BubbleMenu>
  )
}
