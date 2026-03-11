import { callClaude, parseJsonResponse, type AgentInput, type AgentResult } from './base'
import { formatContextForPrompt } from '@/lib/ai/context'

interface Verse {
  reference: string
  text: string
  reason?: string
}

const SUGGEST_SYSTEM_PROMPT = `You are a Bible scholar assisting a Christian writer on a platform called Scriptloom.

Given the paragraph below, suggest 3 Bible verses that strongly support the theme or idea.

Return ONLY JSON:

{
  "verses": [
    {
      "reference": "Book Chapter:Verse",
      "text": "verse text",
      "reason": "why this verse fits"
    }
  ]
}

Guidelines:
• choose verses that match the theme
• prioritize clarity and relevance
• avoid obscure references
• balance Old Testament and New Testament where appropriate
• use the NIV translation

Do not include any text outside the JSON.`

const SEARCH_SYSTEM_PROMPT = `You are a Bible scholar assisting a Christian writer on a platform called Scriptloom.

Given a keyword, theme, or verse reference, return 3–5 relevant Bible verses.

Prioritize verses that:
• clearly address the theme
• are widely recognized in Christian teaching
• are clear and applicable for reflection, writing, or preaching

Return ONLY JSON:

{
  "verses": [
    {
      "reference": "Book Chapter:Verse",
      "text": "verse text",
      "reason": "why this verse fits"
    }
  ]
}

Rules:
- Use the NIV translation.
- Do not include any text outside the JSON.`

const INSERT_SYSTEM_PROMPT = `You are assisting a Christian author writing a book on a platform called Scriptloom.

The user has requested a scripture to support their writing.

Given the paragraph below, suggest one Bible verse that fits naturally and supports the message.

Return the verse formatted as:

SCRIPTURE

Book Chapter:Verse
"Verse text"

Do not include any other text.`

export async function runInterpreter(input: AgentInput & { mode: 'suggest' | 'search' | 'insert'; query?: string }): Promise<AgentResult> {
  if (input.mode === 'insert') {
    const contextBlock = formatContextForPrompt(input.context)
    const userMessage = `${contextBlock}\n\nParagraph:\n${input.userText?.substring(0, 2000) || ''}`
    const content = await callClaude({
      system: INSERT_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 512,
    })
    return { agent: 'interpreter', content }
  }

  const systemPrompt = input.mode === 'search' ? SEARCH_SYSTEM_PROMPT : SUGGEST_SYSTEM_PROMPT

  let userMessage: string
  if (input.mode === 'search') {
    userMessage = `Find Bible verses related to: ${input.query || input.userText}`
  } else {
    const contextBlock = formatContextForPrompt(input.context)
    userMessage = `${contextBlock}\n\nParagraph:\n${input.userText?.substring(0, 2000) || ''}`
  }

  const raw = await callClaude({
    system: systemPrompt,
    userMessage,
    maxTokens: 1024,
  })

  const parsed = parseJsonResponse<{ verses: Verse[] }>(raw)
  return { agent: 'interpreter', content: JSON.stringify(parsed), metadata: parsed }
}
