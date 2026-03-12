import { Project, Chapter, StyleData, ProjectBibleEntry, ProjectBibleCategory } from '@/types/database'

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
  projectBible?: ProjectBibleEntry[]
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
    projectBible?: ProjectBibleEntry[]
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
  if (options?.projectBible?.length) ctx.projectBible = options.projectBible

  return ctx
}

/**
 * Category display order for Project Bible prompt injection.
 * Higher-priority categories are inserted first so they survive any
 * downstream truncation that might cut the tail of the prompt.
 */
const BIBLE_CATEGORY_ORDER: ProjectBibleCategory[] = [
  'theological_positions',
  'core_scriptures',
  'themes',
  'audience_profile',
  'tone_voice_notes',
  'key_figures',
  'custom_notes',
]

/** Human-readable labels for each Project Bible category. */
const BIBLE_CATEGORY_LABELS: Record<ProjectBibleCategory, string> = {
  theological_positions: 'Theological Positions',
  core_scriptures: 'Core Scriptures',
  themes: 'Themes',
  audience_profile: 'Audience Profile',
  tone_voice_notes: 'Tone & Voice Notes',
  key_figures: 'Key Figures',
  custom_notes: 'Custom Notes',
}

/**
 * Format Project Bible entries into a compact, token-safe prompt block.
 *
 * Entries are grouped by category and emitted in priority order.
 * The output is hard-capped at ~6 000 characters (≈ 1 500 tokens) so it
 * cannot crowd out the author's actual writing context.
 *
 * @param entries - The full list of ProjectBibleEntry rows for the project
 * @returns A formatted string block, or an empty string when there are no entries
 */
export function formatProjectBibleForPrompt(entries: ProjectBibleEntry[]): string {
  if (!entries.length) return ''

  const MAX_CHARS = 6000

  // Group entries by category for ordered emission
  const byCategory = new Map<ProjectBibleCategory, ProjectBibleEntry[]>()
  for (const entry of entries) {
    const bucket = byCategory.get(entry.category) ?? []
    bucket.push(entry)
    byCategory.set(entry.category, bucket)
  }

  const headerLine = 'PROJECT BIBLE'
  const lines: string[] = [headerLine, '']
  let charCount = headerLine.length + 1 // +1 for the blank line

  for (const category of BIBLE_CATEGORY_ORDER) {
    const bucket = byCategory.get(category)
    if (!bucket?.length) continue

    const categoryHeader = BIBLE_CATEGORY_LABELS[category]
    // +2: the header line + blank separator below it
    charCount += categoryHeader.length + 2

    if (charCount >= MAX_CHARS) break

    lines.push(categoryHeader)

    for (const entry of bucket) {
      // Format: "• Title: Content [Refs: …]"
      const refs =
        entry.scripture_refs.length > 0
          ? ` [Refs: ${entry.scripture_refs.join(', ')}]`
          : ''
      const entryLine = `• ${entry.title}: ${entry.content}${refs}`

      if (charCount + entryLine.length > MAX_CHARS) break

      lines.push(entryLine)
      charCount += entryLine.length + 1 // +1 for newline
    }

    lines.push('')
    charCount += 1 // blank separator line
  }

  return lines.join('\n').trimEnd()
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

  // ── PROJECT BIBLE ──
  // Structured knowledge extracted from the author's own writing.
  // Inserted between book context and style so agents understand the project's
  // theology, themes, and audience before deciding how to write.
  if (ctx.projectBible?.length) {
    lines.push('')
    lines.push(formatProjectBibleForPrompt(ctx.projectBible))
  }

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
