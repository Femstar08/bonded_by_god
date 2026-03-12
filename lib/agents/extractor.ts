import { callClaude, parseJsonResponse } from './base'
import type { ProjectBibleCategory } from '@/types/database'

/**
 * System prompt for the Project Bible extractor.
 *
 * The extractor's sole job is to read the author's writing and surface
 * structured knowledge entries that other agents can reference later.
 * It must only extract what is clearly present — no hallucination.
 */
const EXTRACTOR_SYSTEM_PROMPT = `You are a theological and literary analyst for a Christian writing studio called Scriptloom.

Your job is to read an author's writing and extract structured knowledge about their project. This knowledge will be stored in a "Project Bible" that helps AI agents understand the project deeply.

Analyze the writing and extract entries for these categories:

1. theological_positions - Key doctrines, beliefs, and stances the work takes
2. themes - Recurring motifs, metaphors, or spiritual ideas
3. key_figures - Real or composite characters, historical persons, or biblical figures referenced
4. core_scriptures - The primary Scripture passages the project is built around
5. audience_profile - Who the writing is for (age, faith level, cultural context, needs)
6. tone_voice_notes - How this project sounds (pastorally warm, academic, conversational, etc.)
7. custom_notes - Any important project-specific context that doesn't fit above

Rules:
- Extract ONLY what is clearly present or strongly implied in the text
- Do not invent or assume theological positions not supported by the writing
- Maximum 5 entries per category
- Each entry needs a clear, descriptive title and substantive content
- For core_scriptures, list specific verse references in scripture_refs
- For theological_positions, ground each one in the text evidence
- If a category has no clear entries, return an empty array for that category
- Return ONLY valid JSON, no other text

Return JSON in this exact format:
{
  "candidates": [
    {
      "category": "theological_positions",
      "title": "Short descriptive title",
      "content": "Detailed description of this element as found in the writing",
      "scripture_refs": ["John 3:16"]
    }
  ]
}`

export interface ExtractorInput {
  projectTitle: string
  projectType: string
  role: string
  audience?: string
  tone?: string
  scriptureFocus?: string
  chapters: { title: string; content: string }[]
}

export interface ExtractorCandidate {
  category: ProjectBibleCategory
  title: string
  content: string
  scripture_refs: string[]
}

/**
 * Run the Project Bible extractor over a set of chapter content.
 *
 * Each chapter's content is capped at 5,000 characters to keep the total
 * prompt within safe limits. The combined chapter block is additionally
 * capped at 25,000 characters before being sent to Claude.
 *
 * @param input - Project metadata and an array of chapter title + content pairs
 * @returns An array of candidate entries ready for review or direct insertion
 */
export async function runProjectBibleExtractor(
  input: ExtractorInput
): Promise<ExtractorCandidate[]> {
  // Build chapter block, truncating each chapter to avoid oversized prompts
  const chapterBlock = input.chapters
    .map((ch, i) => `--- Chapter ${i + 1}: ${ch.title} ---\n${ch.content.slice(0, 5000)}`)
    .join('\n\n')

  // Build project metadata header lines, omitting optional fields that are absent
  const projectInfo = [
    `Project: ${input.projectTitle}`,
    `Type: ${input.projectType}`,
    `Author Role: ${input.role}`,
    input.audience ? `Target Audience: ${input.audience}` : '',
    input.tone ? `Intended Tone: ${input.tone}` : '',
    input.scriptureFocus ? `Scripture Focus: ${input.scriptureFocus}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  // Combined cap: keep total chapter text under 25 000 chars
  const userMessage = `${projectInfo}\n\nChapter Content:\n\n${chapterBlock.slice(0, 25000)}`

  const raw = await callClaude({
    system: EXTRACTOR_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 4096,
  })

  const parsed = parseJsonResponse<{ candidates: ExtractorCandidate[] }>(raw)
  return parsed.candidates ?? []
}
