/**
 * sectionContent.ts
 *
 * Utilities for assembling and decomposing sectioned editor content.
 *
 * When a chapter has sections, the TipTap editor stores one unified HTML
 * document. Section boundaries are encoded as self-closing divider elements:
 *
 *   <div data-type="section-divider" data-section-id="<uuid>"
 *        data-section-title="<title>"></div>
 *
 * Everything before the first divider is the "chapter intro". Everything
 * between two consecutive dividers belongs to the section identified by the
 * first of those two dividers. Content after the last divider belongs to the
 * last section.
 *
 * The functions here are pure (no I/O) so they can be unit-tested and reused
 * in both client components and server-side API handlers.
 */

import { countWords } from '@/lib/utils/text'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface SectionData {
  id: string
  title: string
  content: string
  position: number
}

export interface DecomposedContent {
  /** HTML that precedes the first section divider (the chapter-level intro). */
  intro: string
  /** Per-section content keyed by section id, in document order. */
  sections: { id: string; content: string }[]
}

export interface WordCountBreakdown {
  /** Word count for the chapter intro. */
  intro: number
  /** Word counts per section id. */
  sections: Record<string, number>
  /** Sum of all word counts. */
  total: number
}

// ---------------------------------------------------------------------------
// assembleSectionedContent
// ---------------------------------------------------------------------------

/**
 * Merge a chapter intro and an array of sections into one HTML document.
 *
 * Sections are sorted by `position` before insertion so the output order is
 * always deterministic regardless of the order they arrive from the database.
 *
 * @param chapterIntro  HTML for the part of the chapter that precedes sections.
 * @param sections      Array of section metadata + content to embed.
 * @returns             A single HTML string suitable for loading into TipTap.
 */
export function assembleSectionedContent(
  chapterIntro: string,
  sections: SectionData[]
): string {
  if (sections.length === 0) return chapterIntro || ''

  const sorted = [...sections].sort((a, b) => a.position - b.position)

  let html = chapterIntro || ''

  for (const section of sorted) {
    // Encode the divider marker. Title is HTML-attribute-escaped to prevent
    // quote injection breaking the data attribute.
    const escapedTitle = section.title
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')

    html +=
      `<div data-type="section-divider" data-section-id="${section.id}"` +
      ` data-section-title="${escapedTitle}"></div>`
    html += section.content || ''
  }

  return html
}

// ---------------------------------------------------------------------------
// decomposeSectionedContent
// ---------------------------------------------------------------------------

/**
 * Split a composite HTML document back into a chapter intro and per-section
 * content fragments.
 *
 * The function is intentionally tolerant of slight TipTap serialisation
 * variations (extra whitespace in attributes, etc.) by using a flexible regex
 * that anchors on the two mandatory attributes `data-type` and
 * `data-section-id`.
 *
 * @param html  The full HTML string from the TipTap editor.
 * @returns     `{ intro, sections }` where `sections` preserves document order.
 */
export function decomposeSectionedContent(html: string): DecomposedContent {
  // Match self-closing divider elements. The regex captures the section id
  // from the data-section-id attribute regardless of attribute ordering.
  //
  // Breakdown:
  //   <div          — opening tag
  //   [^>]*         — any attributes before data-section-id
  //   data-type="section-divider"   — required marker
  //   [^>]*         — any attributes in between
  //   data-section-id="([^"]*)"     — capture group 1: the section UUID
  //   [^>]*         — any remaining attributes
  //   ><\/div>      — closing (TipTap serialises as <div ...></div>, not <div .../>)
  const dividerPattern =
    /<div[^>]*data-type="section-divider"[^>]*data-section-id="([^"]*)"[^>]*><\/div>/g

  const sections: { id: string; content: string }[] = []
  let lastIndex = 0
  let intro = ''
  let isFirst = true
  let match: RegExpExecArray | null

  while ((match = dividerPattern.exec(html)) !== null) {
    const sectionId = match[1]
    const beforeDivider = html.slice(lastIndex, match.index)

    if (isFirst) {
      // Everything before the first divider is the chapter intro.
      intro = beforeDivider
      isFirst = false
    } else {
      // Content between the previous divider end and the current divider start
      // belongs to the section that was opened by the previous divider.
      sections[sections.length - 1].content = beforeDivider
    }

    // Open a new section slot; content will be filled on the next iteration
    // (or below after the loop).
    sections.push({ id: sectionId, content: '' })

    // Advance past the end of the matched divider element.
    lastIndex = match.index + match[0].length
  }

  // Assign remaining content after the last divider to the last section.
  if (sections.length > 0) {
    sections[sections.length - 1].content = html.slice(lastIndex)
  } else {
    // No dividers found — the entire document is the chapter intro.
    intro = html
  }

  // Edge case: the loop never ran (isFirst still true) but the html is empty
  // or sections is still empty. intro will already be '' or html respectively.
  if (isFirst) {
    intro = html
  }

  return { intro, sections }
}

// ---------------------------------------------------------------------------
// countWordsPerSection
// ---------------------------------------------------------------------------

/**
 * Compute per-section (and total) word counts for a composite HTML document.
 *
 * HTML tags are stripped before counting so only visible text words are
 * counted, consistent with how `countWords` works in `lib/utils/text.ts`.
 *
 * @param html  The full HTML string from the TipTap editor.
 * @returns     Word counts for the intro, each section, and the running total.
 */
export function countWordsPerSection(html: string): WordCountBreakdown {
  const { intro, sections } = decomposeSectionedContent(html)

  // Strip HTML tags before counting — countWords expects plain text.
  const stripTags = (s: string) => s.replace(/<[^>]*>/g, '')

  const introCount = countWords(stripTags(intro))
  const sectionCounts: Record<string, number> = {}
  let total = introCount

  for (const s of sections) {
    const wc = countWords(stripTags(s.content))
    sectionCounts[s.id] = wc
    total += wc
  }

  return { intro: introCount, sections: sectionCounts, total }
}
