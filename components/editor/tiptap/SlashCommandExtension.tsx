'use client'

import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'

interface SlashCommandItem {
  title: string
  description: string
  command: string
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Scripture Block',
    description: 'Insert a styled scripture quote',
    command: 'scripture',
  },
  {
    title: 'Reflection',
    description: 'Add a reflection or application prompt',
    command: 'reflection',
  },
  {
    title: 'Story / Illustration',
    description: 'Start a narrative illustration',
    command: 'story',
  },
  {
    title: 'Teaching',
    description: 'Start a teaching or explanation section',
    command: 'teaching',
  },
  {
    title: 'Prayer',
    description: 'Insert a closing prayer',
    command: 'prayer',
  },
  {
    title: 'Quote',
    description: 'Insert a blockquote',
    command: 'quote',
  },
  {
    title: 'Divider',
    description: 'Insert a horizontal rule',
    command: 'divider',
  },
  {
    title: 'Heading 2',
    description: 'Large section heading',
    command: 'h2',
  },
  {
    title: 'Heading 3',
    description: 'Smaller section heading',
    command: 'h3',
  },
  {
    title: 'Bullet List',
    description: 'Start a bulleted list',
    command: 'list',
  },
]

interface CommandListProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) command(item)
      },
      [items, command]
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (!items.length) return null

    return (
      <div
        ref={listRef}
        className="z-50 min-w-[200px] rounded-lg border bg-background shadow-lg p-1"
      >
        {items.map((item, index) => (
          <button
            key={item.command}
            type="button"
            onClick={() => selectItem(index)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              index === selectedIndex
                ? 'bg-amber-50 text-amber-900'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <span className="font-medium">{item.title}</span>
            <span className="block text-xs text-muted-foreground">
              {item.description}
            </span>
          </button>
        ))}
      </div>
    )
  }
)

CommandList.displayName = 'CommandList'

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: ReturnType<typeof import('@tiptap/core').Editor.prototype.chain> extends infer C ? { chain: () => C; [key: string]: unknown } : never
          range: { from: number; to: number }
          props: SlashCommandItem
        }) => {
          const cmd = props.command

          // Delete the slash command text first
          editor.chain().focus().deleteRange(range).run()

          switch (cmd) {
            case 'scripture':
              editor.chain().focus().toggleScriptureBlock().run()
              break
            case 'story':
              editor
                .chain()
                .focus()
                .insertContent(
                  '<p><em>[ Story / Illustration - begin writing your narrative here... ]</em></p>'
                )
                .run()
              break
            case 'reflection':
              editor
                .chain()
                .focus()
                .insertContent(
                  '<blockquote><p><em>Reflection: What does this mean for us today?</em></p></blockquote>'
                )
                .run()
              break
            case 'teaching':
              editor
                .chain()
                .focus()
                .insertContent(
                  '<p><em>[ Teaching - explain the principle or truth here... ]</em></p>'
                )
                .run()
              break
            case 'prayer':
              editor
                .chain()
                .focus()
                .insertContent(
                  '<blockquote><p><em>Lord, [write your prayer here...]</em></p></blockquote>'
                )
                .run()
              break
            case 'h2':
              editor.chain().focus().toggleHeading({ level: 2 }).run()
              break
            case 'h3':
              editor.chain().focus().toggleHeading({ level: 3 }).run()
              break
            case 'quote':
              editor.chain().focus().toggleBlockquote().run()
              break
            case 'list':
              editor.chain().focus().toggleBulletList().run()
              break
            case 'divider':
              editor.chain().focus().setHorizontalRule().run()
              break
          }
        },
        items: ({ query }: { query: string }) => {
          return SLASH_COMMANDS.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.command.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          let component: ReactRenderer<CommandListRef> | null = null
          let popup: HTMLDivElement | null = null

          return {
            onStart: (props: { editor: unknown; clientRect: (() => DOMRect | null) | null }) => {
              popup = document.createElement('div')
              popup.style.position = 'absolute'
              popup.style.zIndex = '50'
              document.body.appendChild(popup)

              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor as import('@tiptap/core').Editor,
              })

              if (popup && component.element) {
                popup.appendChild(component.element)
              }

              const rect = props.clientRect?.()
              if (rect && popup) {
                popup.style.left = `${rect.left}px`
                popup.style.top = `${rect.bottom + 4}px`
              }
            },
            onUpdate: (props: { clientRect: (() => DOMRect | null) | null }) => {
              component?.updateProps(props)

              const rect = props.clientRect?.()
              if (rect && popup) {
                popup.style.left = `${rect.left}px`
                popup.style.top = `${rect.bottom + 4}px`
              }
            },
            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === 'Escape') {
                popup?.remove()
                component?.destroy()
                return true
              }
              return component?.ref?.onKeyDown(props) ?? false
            },
            onExit: () => {
              popup?.remove()
              component?.destroy()
            },
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
