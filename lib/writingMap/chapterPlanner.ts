import { callClaude, parseJsonResponse } from '@/lib/agents/base'
import { formatContextForPrompt, type ProjectContext } from '@/lib/ai/context'

interface PlannedSection {
  title: string
  summary: string
}

/**
 * Use AI to generate a section plan for a chapter.
 * Returns a list of suggested sections with titles and brief summaries.
 */
export async function generateChapterPlan(
  context: ProjectContext,
  chapterTitle: string,
  existingContent?: string
): Promise<PlannedSection[]> {
  const system = `You are a Christian book structure planner for a writing platform called Scriptloom.

Given a chapter title and project context, suggest 3-6 sections that should be in this chapter.

Each section should be a distinct building block — e.g., a personal story, a scripture exploration, a reflection, a teaching point, a practical takeaway, or a transition.

Return ONLY a JSON array of objects with "title" and "summary" fields.

Example output:
[
  {"title": "Story: Early lesson of love", "summary": "A personal narrative illustrating the first encounter with unconditional love"},
  {"title": "Scripture: 1 Corinthians 13", "summary": "Exploration of Paul's definition of love and its application"},
  {"title": "Reflection: What love endures", "summary": "Guided reflection on how love persists through trials"},
  {"title": "Takeaway", "summary": "Practical steps for demonstrating love in daily life"}
]

Rules:
- Sections should follow a natural narrative flow
- Include a mix of story, teaching, scripture, and application
- Keep summaries to one sentence
- Do not include any text outside the JSON array`

  const contextBlock = formatContextForPrompt(context)

  let userMessage = `${contextBlock}\n\nChapter Title: "${chapterTitle}"\n\nGenerate a section plan for this chapter.`

  if (existingContent && existingContent.trim().length > 100) {
    userMessage += `\n\nThe author has already started writing. Here is the existing content (use it to inform your plan):\n\n${existingContent.slice(0, 3000)}`
  }

  const raw = await callClaude({
    system,
    userMessage,
    maxTokens: 1024,
  })

  try {
    const sections = parseJsonResponse<PlannedSection[]>(raw)
    return Array.isArray(sections) ? sections : []
  } catch {
    return []
  }
}
