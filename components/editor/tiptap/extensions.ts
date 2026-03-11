import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Focus from '@tiptap/extension-focus'
import { ScriptureBlock } from './ScriptureBlockExtension'
import { SlashCommands } from './SlashCommandExtension'
import type { Extensions } from '@tiptap/core'

export function getExtensions(placeholder?: string): Extensions {
  return [
    StarterKit.configure({
      heading: {
        levels: [2, 3],
      },
      blockquote: {
        HTMLAttributes: {
          class: 'editor-blockquote',
        },
      },
    }),
    Placeholder.configure({
      placeholder: placeholder ?? 'Type / for commands...',
      emptyEditorClass: 'is-editor-empty',
    }),
    Focus.configure({
      className: 'has-focus',
      mode: 'deepest',
    }),
    Typography,
    ScriptureBlock,
    SlashCommands,
  ]
}
