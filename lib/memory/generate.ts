import { callClaude, parseJsonResponse } from '@/lib/agents/base'
import { extractScriptureReferences } from './scripture-regex'

interface ChapterMemoryResult {
  summary: string
  key_themes: string[]
  key_ideas: string[]
  scriptures_used: string[]
}

/**
 * Generate a memory summary for a chapter using Claude.
 * Returns summary, key themes, key ideas, and extracted scriptures.
 */
export async function generateChapterMemory(
  chapterContent: string,
  projectTitle: string
): Promise<ChapterMemoryResult> {
  // Extract scriptures via regex (fast, no AI call)
  const scriptures_used = extractScriptureReferences(chapterContent)

  // If content is too short, return minimal memory
  if (chapterContent.trim().split(/\s+/).length < 30) {
    return {
      summary: '',
      key_themes: [],
      key_ideas: [],
      scriptures_used,
    }
  }

  const system = `You are a literary analyst for a Christian writing project called "${projectTitle}". Analyze the given chapter content and return a JSON object with:
- "summary": A 2-3 sentence summary of what this chapter covers (max 60 words)
- "key_themes": An array of 2-5 theological or narrative themes (short phrases)
- "key_ideas": An array of 2-4 key arguments or ideas presented (short phrases)

Return ONLY valid JSON, no markdown fences.`

  const text = await callClaude({
    system,
    userMessage: chapterContent.slice(0, 4000), // Limit input to ~1000 tokens
    maxTokens: 512,
  })

  try {
    const parsed = parseJsonResponse<{
      summary: string
      key_themes: string[]
      key_ideas: string[]
    }>(text)

    return {
      summary: parsed.summary || '',
      key_themes: parsed.key_themes || [],
      key_ideas: parsed.key_ideas || [],
      scriptures_used,
    }
  } catch {
    // If JSON parsing fails, return scriptures only
    return {
      summary: '',
      key_themes: [],
      key_ideas: [],
      scriptures_used,
    }
  }
}

/**
 * Generate a writing style description from sample content.
 */
export async function generateProjectStyle(sampleContent: string): Promise<string> {
  if (sampleContent.trim().split(/\s+/).length < 50) {
    return ''
  }

  const system = `You are a literary style analyst. Describe the author's writing style in 2-3 sentences. Focus on tone, sentence structure, use of scripture, rhetorical patterns, and emotional quality. Be specific and concise. Return ONLY the style description, no JSON.`

  const style = await callClaude({
    system,
    userMessage: sampleContent.slice(0, 6000),
    maxTokens: 256,
  })

  return style.trim()
}
