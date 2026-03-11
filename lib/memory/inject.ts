import { getChapterMemories, getProjectMemory } from './store'
import { getStyleProfile } from './style-store'
import type { ChapterMemory, StyleData } from '@/types/database'

export interface MemoryContext {
  chapterSummaries: string
  usedScriptures: string
  projectWritingStyle: string
  authorStyleProfile?: StyleData
}

/**
 * Build memory context for AI prompt injection.
 * Fetches chapter memories + project memory + style profile and formats them.
 *
 * Token budget: ~1000 tokens total.
 */
export async function buildMemoryContext(
  projectId: string,
  activeChapterId: string,
  userId?: string
): Promise<MemoryContext> {
  const [chapterMemories, projectMemory, styleProfile] = await Promise.all([
    getChapterMemories(projectId),
    getProjectMemory(projectId),
    userId ? getStyleProfile(userId, projectId) : Promise.resolve(null),
  ])

  // Build chapter summaries — exclude the active chapter, limit to 10
  const otherChapters = chapterMemories
    .filter((m: ChapterMemory) => m.chapter_id !== activeChapterId && m.summary)
    .slice(0, 10)

  const chapterSummaries = otherChapters.length > 0
    ? otherChapters
        .map((m: ChapterMemory) => `- ${m.summary}`)
        .join('\n')
    : ''

  // Aggregate all scriptures used across chapters
  const allScriptures = new Set<string>()
  for (const m of chapterMemories) {
    for (const s of m.scriptures_used) {
      allScriptures.add(s)
    }
  }
  // Also include project-level scriptures
  if (projectMemory?.all_scriptures_used) {
    for (const s of projectMemory.all_scriptures_used) {
      allScriptures.add(s)
    }
  }

  const usedScriptures = allScriptures.size > 0
    ? Array.from(allScriptures).join(', ')
    : ''

  const projectWritingStyle = projectMemory?.writing_style || ''

  const result: MemoryContext = {
    chapterSummaries,
    usedScriptures,
    projectWritingStyle,
  }

  if (styleProfile?.style_data) {
    result.authorStyleProfile = styleProfile.style_data
  }

  return result
}
