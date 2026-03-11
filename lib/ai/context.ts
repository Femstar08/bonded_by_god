import { Project, Chapter, StyleData } from '@/types/database'

/**
 * Format a StyleData object into a readable prompt block for AI injection.
 * Kept here (not in agents/stylist) to avoid pulling Anthropic SDK into client bundles.
 */
function formatStyleForPrompt(style: StyleData): string {
  const lines = [
    'AUTHOR STYLE PROFILE',
    '',
    `Tone: ${style.tone}`,
    `Narrative Voice: ${style.voice}`,
    `Sentence Structure: ${style.sentenceStructure}`,
    `Pacing: ${style.pacing}`,
    `Emotional Intensity: ${style.emotionLevel}`,
    `Vocabulary: ${style.vocabularyStyle}`,
    `Writing Patterns: ${style.writingPatterns}`,
    '',
    `Style Summary: ${style.styleSummary}`,
    '',
    'Match this style in all generated text.',
  ]
  return lines.join('\n')
}

export type ProjectContext = {
  projectTitle: string
  projectType: string
  userRole: string
  chapterTitle?: string
  sectionTitle?: string
  coreThemes?: string[]
  audience?: string
  tone?: string
  scriptureFocus?: string
  writingStyle?: string
  bookSummary?: string
  selectedAgents?: string[]
  recentContent?: string
  userIntent?: string
  chapterSummaries?: string
  usedScriptures?: string
  projectWritingStyle?: string
  sectionMap?: string
  authorStyleProfile?: StyleData
}

/**
 * Build a structured context packet from project + chapter data.
 * This is prepended to every AI prompt so the model responds
 * in a project-aware way instead of generically.
 *
 * Used by: /api/orchestrate, /api/chat
 */
export function buildProjectContext(
  project: Pick<Project, 'title' | 'type' | 'role' | 'audience' | 'tone' | 'scripture_focus'>,
  options?: {
    chapter?: Pick<Chapter, 'title' | 'content'>
    sectionTitle?: string
    coreThemes?: string[]
    writingStyle?: string
    bookSummary?: string
    selectedAgents?: string[]
    recentContent?: string
    userIntent?: string
    recentContentLength?: number
    chapterSummaries?: string
    usedScriptures?: string
    projectWritingStyle?: string
    sectionMap?: string
    authorStyleProfile?: StyleData
  }
): ProjectContext {
  const ctx: ProjectContext = {
    projectTitle: project.title,
    projectType: project.type,
    userRole: project.role,
  }

  if (project.audience) ctx.audience = project.audience
  if (project.tone) ctx.tone = project.tone
  if (project.scripture_focus) ctx.scriptureFocus = project.scripture_focus

  if (options?.chapter) {
    ctx.chapterTitle = options.chapter.title

    // Extract recent content (last N chars) for context
    if (options.chapter.content) {
      const maxLen = options.recentContentLength ?? 1500
      const content = options.chapter.content
      ctx.recentContent = content.length > maxLen
        ? content.slice(-maxLen)
        : content
    }
  }

  if (options?.sectionTitle) ctx.sectionTitle = options.sectionTitle
  if (options?.coreThemes?.length) ctx.coreThemes = options.coreThemes
  if (options?.writingStyle) ctx.writingStyle = options.writingStyle
  if (options?.bookSummary) ctx.bookSummary = options.bookSummary
  if (options?.selectedAgents?.length) ctx.selectedAgents = options.selectedAgents
  if (options?.recentContent) ctx.recentContent = options.recentContent
  if (options?.userIntent) ctx.userIntent = options.userIntent
  if (options?.chapterSummaries) ctx.chapterSummaries = options.chapterSummaries
  if (options?.usedScriptures) ctx.usedScriptures = options.usedScriptures
  if (options?.projectWritingStyle) ctx.projectWritingStyle = options.projectWritingStyle
  if (options?.sectionMap) ctx.sectionMap = options.sectionMap
  if (options?.authorStyleProfile) ctx.authorStyleProfile = options.authorStyleProfile

  return ctx
}

/**
 * Format a ProjectContext into the Book Memory Prompt — a structured context
 * block that ensures every AI output stays aligned with the book, chapter,
 * author's tone, and previous writing.
 *
 * This is prepended to every agent's user message so the AI feels like it
 * actually understands the book, instead of generating disconnected text.
 */
export function formatContextForPrompt(ctx: ProjectContext): string {
  const lines: string[] = []

  // ── BOOK CONTEXT ──
  lines.push('BOOK CONTEXT')
  lines.push('')
  lines.push(`Title: ${ctx.projectTitle}`)
  lines.push(`Type: ${ctx.projectType}`)
  lines.push(`Author Role: ${ctx.userRole}`)

  if (ctx.bookSummary) {
    lines.push('')
    lines.push('Book Summary:')
    lines.push(ctx.bookSummary)
  }

  if (ctx.coreThemes?.length) {
    lines.push('')
    lines.push(`Core Themes: ${ctx.coreThemes.join(', ')}`)
  }

  if (ctx.audience) lines.push(`Target Audience: ${ctx.audience}`)
  if (ctx.scriptureFocus) lines.push(`Scripture Focus: ${ctx.scriptureFocus}`)

  // ── AUTHOR STYLE ──
  // Structured style profile takes priority over plain-text style fields
  lines.push('')
  if (ctx.authorStyleProfile?.styleSummary) {
    lines.push(formatStyleForPrompt(ctx.authorStyleProfile))
  } else if (ctx.projectWritingStyle) {
    lines.push('Writing Style:')
    lines.push(ctx.projectWritingStyle)
    lines.push('')
    lines.push('Match the tone, rhythm, and style of the writing above.')
  } else if (ctx.writingStyle) {
    lines.push(`Writing Style: ${ctx.writingStyle}`)
  } else if (ctx.tone) {
    lines.push(`Writing Style: ${ctx.tone}`)
  } else {
    lines.push('Writing Style: Reflective, thoughtful, emotionally grounded, spiritually aware, and clear.')
  }

  // ── CHAPTER CONTEXT ──
  lines.push('')
  lines.push(`Current Chapter: ${ctx.chapterTitle ?? 'N/A'}`)
  if (ctx.sectionTitle) lines.push(`Current Section: ${ctx.sectionTitle}`)

  // Section map — writing structure awareness
  if (ctx.sectionMap) {
    lines.push('')
    lines.push('Chapter Structure:')
    lines.push(ctx.sectionMap)
  }

  // ── BOOK MEMORY ──
  if (ctx.chapterSummaries || ctx.usedScriptures) {
    lines.push('')
    lines.push('BOOK MEMORY')

    if (ctx.chapterSummaries) {
      lines.push('')
      lines.push('Previous Chapter Summaries:')
      lines.push(ctx.chapterSummaries)
    }

    if (ctx.usedScriptures) {
      lines.push('')
      lines.push(`Scriptures Already Used: ${ctx.usedScriptures}`)
      lines.push('(Avoid repeating these unless directly relevant.)')
    }
  }

  // ── RECENT WRITING ──
  if (ctx.recentContent) {
    lines.push('')
    lines.push('Recent Writing Context:')
    lines.push(ctx.recentContent)
  }

  // ── CONTINUITY INSTRUCTIONS ──
  lines.push('')
  lines.push('CONTINUITY RULES')
  lines.push('• Preserve the author\'s voice and tone')
  lines.push('• Maintain continuity with the chapter theme')
  lines.push('• Avoid generic AI phrasing')
  lines.push('• Write as if continuing the author\'s thoughts')
  lines.push('• Remain reflective rather than overly preachy')
  lines.push('• Do not repeat ideas already covered')
  lines.push('• Never introduce ideas that contradict the existing chapter theme')

  return lines.join('\n')
}
