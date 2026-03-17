import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

export interface SectionDividerOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sectionDivider: {
      insertSectionDivider: (attrs?: {
        sectionId?: string
        sectionTitle?: string
      }) => ReturnType
    }
  }
}

function SectionDividerView({ node }: NodeViewProps) {
  const title: string = (node.attrs.sectionTitle as string) || 'Untitled Section'

  return (
    <NodeViewWrapper
      className="section-divider"
      data-type="section-divider"
      data-section-id={node.attrs.sectionId ?? undefined}
      data-section-title={title}
      contentEditable={false}
    >
      <div className="section-divider-inner">
        <span className="section-divider-line" aria-hidden="true" />
        <span className="section-divider-label">{title}</span>
        <span className="section-divider-line" aria-hidden="true" />
      </div>
    </NodeViewWrapper>
  )
}

export const SectionDivider = Node.create<SectionDividerOptions>({
  name: 'sectionDivider',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      sectionId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-section-id'),
        renderHTML: (attributes) => {
          if (!attributes.sectionId) return {}
          return { 'data-section-id': attributes.sectionId }
        },
      },
      sectionTitle: {
        default: 'Untitled Section',
        parseHTML: (element) =>
          element.getAttribute('data-section-title') ?? 'Untitled Section',
        renderHTML: (attributes) => ({
          'data-section-title': attributes.sectionTitle ?? 'Untitled Section',
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="section-divider"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'section-divider',
        class: 'section-divider',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SectionDividerView)
  },

  addCommands() {
    return {
      insertSectionDivider:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },
})
