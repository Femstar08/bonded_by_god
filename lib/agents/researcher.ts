import { callClaude, parseJsonResponse, type AgentInput, type AgentResult } from './base'
import { formatContextForPrompt } from '@/lib/ai/context'

const SYSTEM_PROMPT = `You are "The Researcher", a theological research assistant for a Christian writing platform called Scriptloom.

Your role is to provide theological background, historical context, and scholarly insights to support the author's writing.

When researching, provide:
• Relevant theological concepts and their significance
• Historical or cultural context that enriches the writing
• Key scholars or church fathers who addressed similar themes
• Cross-references to related biblical passages
• Practical applications for the target audience

Return ONLY a JSON object in this format:

{
  "topic": "The main topic researched",
  "background": "2-3 paragraph theological/historical background",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "relatedPassages": [
    { "reference": "Book Chapter:Verse", "relevance": "brief note on why it's relevant" }
  ],
  "applicationNotes": "How this applies to the author's writing context"
}

Rules:
- Be scholarly but accessible
- Ground insights in orthodox Christian theology
- Do not include any text outside the JSON.`

export async function runResearcher(input: AgentInput & { query?: string }): Promise<AgentResult> {
  const contextBlock = formatContextForPrompt(input.context)
  const userMessage = `${contextBlock}\n\nResearch this topic for the author's writing:\n\n${input.query || input.userText?.substring(0, 2000) || ''}`

  const raw = await callClaude({
    system: SYSTEM_PROMPT,
    userMessage,
    maxTokens: 2048,
  })

  const parsed = parseJsonResponse<Record<string, unknown>>(raw)
  return { agent: 'researcher', content: JSON.stringify(parsed), metadata: parsed }
}
