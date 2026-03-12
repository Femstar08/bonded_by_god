import { callClaude, type AgentInput, type AgentResult } from './base'
import { formatContextForPrompt } from '@/lib/ai/context'
import { getRepurposeInstructions } from '@/lib/ai/repurposePrompts'
import type { RepurposeFormat } from '@/types/repurposing'

const SYSTEM_PROMPT = `You are a thoughtful writing assistant helping a Christian author develop reflective, spiritually grounded writing for a platform called Scriptloom.

When expanding or editing text:
• do not sound like AI
• match the tone of the original paragraph
• keep the author's emotional voice
• avoid generic phrases
• add meaningful detail, not filler
• weave in theological depth where natural

Return ONLY the written text. Do not include explanations, labels, or meta-commentary.`

const REPURPOSE_SYSTEM_PROMPT = `You are a content transformation specialist for a Christian writing platform called Scriptloom.

Your role is to take existing writing (sermons, chapters, devotionals, articles) and transform it into a specific output format while:
• Preserving the author's core message and theological intent
• Matching the author's voice and style
• Adapting tone and structure to fit the target format
• Maintaining spiritual authenticity — never dilute the message
• Following the format-specific rules exactly

Return ONLY the transformed content in the requested format. No explanations, no meta-commentary.`

export type ScribeMode = 'expand' | 'continue' | 'draft' | 'repurpose'

export async function runScribe(
  input: AgentInput & { mode: ScribeMode; repurposeFormat?: RepurposeFormat }
): Promise<AgentResult> {
  const contextBlock = formatContextForPrompt(input.context)

  if (input.mode === 'repurpose' && input.repurposeFormat) {
    const formatInstructions = getRepurposeInstructions(
      input.repurposeFormat,
      input.context.userRole
    )

    const userMessage = `${contextBlock}\n\n${formatInstructions}\n\nSource content:\n${input.userText?.substring(0, 8000) || ''}`

    const content = await callClaude({
      system: REPURPOSE_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 4096,
    })

    return { agent: 'scribe', content }
  }

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
