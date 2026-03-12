import { callClaude, type AgentInput, type AgentResult } from './base'
import { formatContextForPrompt } from '@/lib/ai/context'

const REVISE_SYSTEM_PROMPT = `You are an expert writing editor for a Christian writing platform called Scriptloom.

Improve the clarity and flow of the paragraph below while preserving the author's voice.

Guidelines:
• maintain meaning
• remove awkward phrasing
• improve sentence flow
• do not change the author's tone
• do not sound like AI
• match the tone of the original paragraph
• keep the author's emotional voice
• avoid generic phrases

Return only the improved paragraph. Do not include explanations, labels, or meta-commentary.`

const SUMMARISE_SYSTEM_PROMPT = `You are a writing editor for a Christian writing platform called Scriptloom.

Summarise the text into a concise version that captures the core message and spiritual essence.

Guidelines:
• Distill to the key spiritual message and main points
• Preserve theological accuracy
• Keep the author's tone
• Aim for roughly 1/3 of the original length
• Useful for chapter summaries, back-cover text, or study guide overviews

Return ONLY the summarised text. Do not include explanations, labels, or meta-commentary.`

export async function runRefiner(input: AgentInput & { mode: 'revise' | 'summarise' }): Promise<AgentResult> {
  const systemPrompt = input.mode === 'revise' ? REVISE_SYSTEM_PROMPT : SUMMARISE_SYSTEM_PROMPT
  const contextBlock = formatContextForPrompt(input.context)
  const userMessage = `${contextBlock}\n\nParagraph:\n${input.userText?.substring(0, 4000) || ''}`

  const content = await callClaude({
    system: systemPrompt,
    userMessage,
  })

  return { agent: 'refiner', content }
}
