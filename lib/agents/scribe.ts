import { callClaude, type AgentInput, type AgentResult } from './base'
import { formatContextForPrompt } from '@/lib/ai/context'

const SYSTEM_PROMPT = `You are a thoughtful writing assistant helping a Christian author develop reflective, spiritually grounded writing for a platform called Scriptloom.

When expanding or editing text:
• do not sound like AI
• match the tone of the original paragraph
• keep the author's emotional voice
• avoid generic phrases
• add meaningful detail, not filler
• weave in theological depth where natural

Return ONLY the written text. Do not include explanations, labels, or meta-commentary.`

export async function runScribe(input: AgentInput & { mode: 'expand' | 'continue' | 'draft' }): Promise<AgentResult> {
  const contextBlock = formatContextForPrompt(input.context)

  const modeInstructions: Record<string, string> = {
    expand: `Expand the paragraph below while preserving the author's voice and tone.

Guidelines:
• keep the original meaning
• add sensory or emotional detail
• do not overwrite the author's voice
• extend naturally into the next thought

Return only the expanded paragraph.`,
    continue: 'Continue writing from where the author left off. Write 2-3 natural paragraphs that flow from the existing text. Match the author\'s tone and spiritual depth.',
    draft: "Draft a new section based on the author's intent and project context. Write 3-4 paragraphs that feel authentic to the author's voice.",
  }

  const userMessage = `${contextBlock}\n\n${modeInstructions[input.mode]}\n\nParagraph:\n${input.userText?.substring(0, 4000) || ''}`

  const content = await callClaude({
    system: SYSTEM_PROMPT,
    userMessage,
  })

  return { agent: 'scribe', content }
}
