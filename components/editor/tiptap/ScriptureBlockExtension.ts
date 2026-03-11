import { Node, mergeAttributes } from '@tiptap/core'

export interface ScriptureBlockOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    scriptureBlock: {
      setScriptureBlock: (attrs?: { reference?: string }) => ReturnType
      toggleScriptureBlock: () => ReturnType
    }
  }
}

export const ScriptureBlock = Node.create<ScriptureBlockOptions>({
  name: 'scriptureBlock',
  group: 'block',
  content: 'block+',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      reference: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-reference'),
        renderHTML: (attributes) => {
          if (!attributes.reference) return {}
          return { 'data-reference': attributes.reference }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'blockquote[data-type="scripture"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'blockquote',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'scripture',
        class: 'scripture-block',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setScriptureBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attrs)
        },
      toggleScriptureBlock:
        () =>
        ({ commands }) => {
          return commands.toggleWrap(this.name)
        },
    }
  },
})
