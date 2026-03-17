'use client'

// ---------------------------------------------------------------------------
// CitationStyleSelector
// Lets the user pick Chicago / APA / MLA with live formatted previews,
// and choose footnote vs. endnote placement.
// ---------------------------------------------------------------------------

export type CitationStyleType = 'chicago' | 'apa' | 'mla'
export type FootnoteStyleType = 'footnote' | 'endnote'

export interface CitationStyleSelectorProps {
  currentStyle: CitationStyleType
  footnoteStyle: FootnoteStyleType
  onStyleChange: (style: CitationStyleType) => void
  onFootnoteStyleChange: (style: FootnoteStyleType) => void
}

// ---------------------------------------------------------------------------
// Static preview data per style
// ---------------------------------------------------------------------------

interface StylePreviewData {
  label: string
  description: string
  bibleExample: string
  bookExample: string
}

const STYLE_PREVIEWS: Record<CitationStyleType, StylePreviewData> = {
  chicago: {
    label: 'Chicago',
    description: 'Widely used in humanities and theology. Uses footnotes with full source details.',
    bibleExample: 'John 3:16 (NIV).',
    bookExample: 'Smith, John. \u2014\u2014\u2014. Nashville: Christian Press, 2023.',
  },
  apa: {
    label: 'APA',
    description: 'Common in social sciences and psychology. Author\u2013year citations in text.',
    bibleExample: 'John 3:16 (New International Version).',
    bookExample: 'Smith, J. (2023). \u2014\u2014\u2014. Christian Press.',
  },
  mla: {
    label: 'MLA',
    description: 'Standard in literature and language arts. Author\u2013page in-text citations.',
    bibleExample: 'John 3:16. New International Version.',
    bookExample: 'Smith, John. \u2014\u2014\u2014. Christian Press, 2023.',
  },
}

// ---------------------------------------------------------------------------
// Italic title helper (renders book title in italics visually via span)
// ---------------------------------------------------------------------------

function FormattedPreviewLine({ text, title }: { text: string; title: string }) {
  const parts = text.split('\u2014\u2014\u2014')
  if (parts.length === 1) return <span>{text}</span>
  return (
    <span>
      {parts[0]}
      <em>{title}</em>
      {parts[1]}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Style card
// ---------------------------------------------------------------------------

interface StyleCardProps {
  style: CitationStyleType
  isActive: boolean
  onClick: () => void
}

function StyleCard({ style, isActive, onClick }: StyleCardProps) {
  const preview = STYLE_PREVIEWS[style]

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={[
        'w-full text-left rounded-lg border px-3 py-3 transition-all duration-150 group',
        isActive
          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/40'
          : 'border-border bg-background hover:border-amber-300 hover:bg-amber-50/40',
      ].join(' ')}
    >
      {/* Style name + active indicator */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={[
            'text-sm font-semibold',
            isActive ? 'text-amber-800' : 'text-foreground group-hover:text-amber-800',
          ].join(' ')}
        >
          {preview.label}
        </span>
        {isActive && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 12 12"
              fill="currentColor"
              className="size-2.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.293 2.293a1 1 0 0 1 1.414 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L5 7.586l5.293-5.293Z"
                clipRule="evenodd"
              />
            </svg>
            Active
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
        {preview.description}
      </p>

      {/* Sample references */}
      <div className="space-y-1 rounded-md bg-background/70 border border-border/60 px-2.5 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 mb-1">
          Preview
        </p>
        {/* Bible reference */}
        <p className="text-[11px] text-muted-foreground font-serif leading-snug">
          {preview.bibleExample}
        </p>
        {/* Book reference */}
        <p className="text-[11px] text-muted-foreground font-serif leading-snug">
          <FormattedPreviewLine text={preview.bookExample} title="Grace Revealed" />
        </p>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Footnote / Endnote toggle
// ---------------------------------------------------------------------------

interface FootnoteToggleProps {
  footnoteStyle: FootnoteStyleType
  onChange: (style: FootnoteStyleType) => void
}

function FootnoteToggle({ footnoteStyle, onChange }: FootnoteToggleProps) {
  const options: { value: FootnoteStyleType; label: string; description: string }[] = [
    {
      value: 'footnote',
      label: 'Footnotes',
      description:
        'References appear at the bottom of each page (recommended for publishing)',
    },
    {
      value: 'endnote',
      label: 'Endnotes',
      description: 'References collected at the end of the document',
    },
  ]

  return (
    <div className="space-y-1.5">
      {options.map((opt) => {
        const isActive = footnoteStyle === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            className={[
              'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-150',
              isActive
                ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-400/40'
                : 'border-border bg-background hover:border-amber-200 hover:bg-amber-50/30',
            ].join(' ')}
          >
            <div className="flex items-center gap-2 mb-0.5">
              {/* Radio-style indicator */}
              <span
                className={[
                  'size-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  isActive ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground',
                ].join(' ')}
              >
                {isActive && (
                  <span className="size-1.5 rounded-full bg-white" />
                )}
              </span>
              <span
                className={[
                  'text-xs font-semibold',
                  isActive ? 'text-amber-800' : 'text-foreground',
                ].join(' ')}
              >
                {opt.label}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pl-5">
              {opt.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CitationStyleSelector — main export
// ---------------------------------------------------------------------------

export function CitationStyleSelector({
  currentStyle,
  footnoteStyle,
  onStyleChange,
  onFootnoteStyleChange,
}: CitationStyleSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Citation style cards */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Citation Style
        </p>
        <div className="space-y-2">
          {(['chicago', 'apa', 'mla'] as CitationStyleType[]).map((style) => (
            <StyleCard
              key={style}
              style={style}
              isActive={currentStyle === style}
              onClick={() => onStyleChange(style)}
            />
          ))}
        </div>
      </div>

      {/* Footnote / Endnote placement */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Reference Placement
        </p>
        <FootnoteToggle footnoteStyle={footnoteStyle} onChange={onFootnoteStyleChange} />
      </div>
    </div>
  )
}
