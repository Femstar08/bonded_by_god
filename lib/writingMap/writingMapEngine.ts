import type { Section } from '@/types/database'

export type WritingMap = {
  projectId: string
  chapters: WritingMapChapter[]
}

export type WritingMapChapter = {
  id: string
  title: string
  position: number
  sections: Section[]
}

/**
 * Get the next empty section across the entire writing map.
 */
export function getNextSection(map: WritingMap): { chapter: WritingMapChapter; section: Section } | null {
  for (const chapter of map.chapters) {
    for (const section of chapter.sections) {
      if (section.status === 'empty') {
        return { chapter, section }
      }
    }
  }
  return null
}

/**
 * Get the next incomplete section in a specific chapter (empty or draft).
 */
export function getNextIncompleteSection(
  sections: Section[]
): Section | null {
  return sections.find((s) => s.status === 'empty' || s.status === 'draft') ?? null
}

/**
 * Format a chapter's section map as a text block for AI prompt injection.
 */
export function formatSectionMapForPrompt(
  chapterTitle: string,
  sections: Section[]
): string {
  if (sections.length === 0) return ''

  const statusIcons: Record<string, string> = {
    complete: '[COMPLETE]',
    review: '[REVIEW]',
    draft: '[DRAFT]',
    empty: '[NOT STARTED]',
  }

  const lines = [`Chapter Sections for "${chapterTitle}":`]
  for (const section of sections) {
    const icon = statusIcons[section.status] || '[?]'
    lines.push(`  ${icon} ${section.title}`)
  }

  return lines.join('\n')
}

/**
 * Calculate completion stats for a set of sections.
 */
export function calculateSectionProgress(sections: Section[]): {
  total: number
  complete: number
  draft: number
  review: number
  empty: number
  percentage: number
} {
  const total = sections.length
  const complete = sections.filter((s) => s.status === 'complete').length
  const draft = sections.filter((s) => s.status === 'draft').length
  const review = sections.filter((s) => s.status === 'review').length
  const empty = sections.filter((s) => s.status === 'empty').length
  const percentage = total > 0 ? Math.round((complete / total) * 100) : 0

  return { total, complete, draft, review, empty, percentage }
}
