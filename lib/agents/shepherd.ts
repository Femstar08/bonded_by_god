import { callClaude, parseJsonResponse, type AgentInput, type AgentResult } from './base'
import { formatContextForPrompt } from '@/lib/ai/context'

const REVIEW_SYSTEM_PROMPT = `You are "The Shepherd", a spiritual tone advisor for a Christian writing platform called Scriptloom.

Your role is to review writing and provide guidance on its spiritual alignment, theological accuracy, and pastoral tone.

When reviewing, assess:
• Is the writing spiritually authentic and grounded?
• Does it align with sound Christian theology?
• Is the tone appropriate for the intended audience?
• Are there areas where the spiritual message could be strengthened?
• Are there any theological concerns or misrepresentations?

Return ONLY a JSON object in this format:

{
  "overallTone": "A brief assessment of the spiritual tone (1 sentence)",
  "strengths": ["strength 1", "strength 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "theologicalNotes": "Any important theological observations (or null if none)"
}

Rules:
- Be encouraging and pastoral, not critical
- Offer constructive guidance
- Do not rewrite the text
- Do not include any text outside the JSON.`

const DEEPEN_SYSTEM_PROMPT = `You are a thoughtful Christian writing mentor helping an author deepen reflection on a platform called Scriptloom.

Given the paragraph below, generate a reflective continuation that helps the reader understand the deeper spiritual insight behind the experience.

Guidelines:
• keep tone reflective and thoughtful
• do not preach aggressively
• connect the experience to a lesson or understanding
• keep length between 2–4 sentences
• match the author's voice — do not sound like AI

Return only the reflective continuation. No labels or commentary.`

export async function runShepherd(input: AgentInput & { mode?: 'review' | 'deepen' }): Promise<AgentResult> {
  const mode = input.mode ?? 'review'
  const contextBlock = formatContextForPrompt(input.context)

  if (mode === 'deepen') {
    const userMessage = `${contextBlock}\n\nParagraph:\n${input.userText?.substring(0, 4000) || ''}`
    const content = await callClaude({
      system: DEEPEN_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 1024,
    })
    return { agent: 'shepherd', content }
  }

  const userMessage = `${contextBlock}\n\nReview this writing for spiritual tone and theological alignment:\n\n${input.userText?.substring(0, 4000) || ''}`
  const raw = await callClaude({
    system: REVIEW_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 1024,
  })

  const parsed = parseJsonResponse<Record<string, unknown>>(raw)
  return { agent: 'shepherd', content: JSON.stringify(parsed), metadata: parsed }
}
