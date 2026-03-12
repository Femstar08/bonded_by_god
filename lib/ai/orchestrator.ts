import { type ProjectContext } from '@/lib/ai/context'
import { type AgentResult } from '@/lib/agents/base'
import { runScribe } from '@/lib/agents/scribe'
import { runInterpreter } from '@/lib/agents/interpreter'
import { runRefiner } from '@/lib/agents/refiner'
import { runShepherd } from '@/lib/agents/shepherd'
import { runResearcher } from '@/lib/agents/researcher'
import { runGuide } from '@/lib/agents/guide'

export type AgentAction =
  | 'expand'
  | 'continue'
  | 'draft'
  | 'find_scripture'
  | 'search_scripture'
  | 'insert_scripture'
  | 'revise'
  | 'summarise'
  | 'spiritual_check'
  | 'deepen'
  | 'research'
  | 'guide'
  | 'reflection_prompts'

export interface OrchestratorInput {
  action: AgentAction
  userText?: string
  query?: string
  context: ProjectContext
}

export async function orchestrate(input: OrchestratorInput): Promise<AgentResult> {
  const { action, userText, query, context } = input
  const agentInput = { userText, context }

  switch (action) {
    // Scribe — writing generation
    case 'expand':
      return runScribe({ ...agentInput, mode: 'expand' })
    case 'continue':
      return runScribe({ ...agentInput, mode: 'continue' })
    case 'draft':
      return runScribe({ ...agentInput, mode: 'draft' })

    // Interpreter — scripture
    case 'find_scripture':
      return runInterpreter({ ...agentInput, mode: 'suggest' })
    case 'search_scripture':
      return runInterpreter({ ...agentInput, mode: 'search', query })
    case 'insert_scripture':
      return runInterpreter({ ...agentInput, mode: 'insert' })

    // Refiner — clarity and editing
    case 'revise':
      return runRefiner({ ...agentInput, mode: 'revise' })
    case 'summarise':
      return runRefiner({ ...agentInput, mode: 'summarise' })

    // Shepherd — spiritual review + reflection generation
    case 'spiritual_check':
      return runShepherd({ ...agentInput, mode: 'review' })
    case 'deepen':
      return runShepherd({ ...agentInput, mode: 'deepen' })

    // Researcher — theological background
    case 'research':
      return runResearcher({ ...agentInput, query })

    // Guide — chapter direction
    case 'guide':
      return runGuide(agentInput)

    default:
      return runGuide(agentInput)
  }
}
