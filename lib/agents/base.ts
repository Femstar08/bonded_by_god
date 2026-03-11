import Anthropic from '@anthropic-ai/sdk'
import { AI_MODEL } from '@/lib/ai/config'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface AgentInput {
  userText?: string
  context: import('@/lib/ai/context').ProjectContext
  additionalInstructions?: string
}

export interface AgentResult {
  agent: string
  content: string
  metadata?: Record<string, unknown>
}

export async function callClaude(options: {
  system: string
  userMessage: string
  maxTokens?: number
  parseJson?: boolean
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: options.maxTokens ?? 4096,
    system: options.system,
    messages: [{ role: 'user', content: options.userMessage }],
  })

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')

  return text
}

// Helper to strip markdown fences from JSON responses
export function parseJsonResponse<T>(text: string): T {
  const cleaned = text.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
  return JSON.parse(cleaned) as T
}
