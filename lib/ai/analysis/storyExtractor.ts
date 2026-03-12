import { callClaude, parseJsonResponse } from '@/lib/agents/base'
import type { WritingSignals, ParagraphType, SuggestedAction, WritingIntent } from './writingSignals'

/**
 * Analyze a passage to detect stories, teachings, emotions, scripture,
 * classify paragraph type, and determine writing intent — all in one call.
 */
export async function analyzePassage(passage: string): Promise<WritingSignals> {
  const system = `You are an intelligent writing assistant helping a Christian author develop thoughtful, reflective writing.

Analyze the paragraph below and determine:

1. What it contains (story, teaching, emotion, scripture, reflection)
2. What the author's primary writing intent is
3. What the author should do next

Possible writing intents:
• story — narrating a personal experience
• reflection — exploring meaning or spiritual insight
• teaching — presenting a doctrine, principle, or lesson
• encouragement — uplifting or motivating the reader
• explanation — clarifying a concept or idea
• application — giving practical steps or takeaways
• scripture_interpretation — explaining or contextualizing a Bible passage
• transition — bridging between ideas or sections

Return ONLY JSON:

{
  "containsStory": true/false,
  "containsTeaching": true/false,
  "containsEmotion": true/false,
  "containsScripture": true/false,
  "containsReflection": true/false,
  "paragraphType": "story" | "reflection" | "teaching" | "scripture_explanation" | "lesson" | "transition" | "prayer" | "unknown",
  "dominantTheme": "short theme label",
  "emotionalTone": "1-2 word descriptor",
  "writingIntent": "story" | "reflection" | "teaching" | "encouragement" | "explanation" | "application" | "scripture_interpretation" | "transition",
  "intentConfidence": 0.0 to 1.0,
  "suggestedNextAction": "expand_story" | "add_scripture" | "deepen_reflection" | "add_takeaway" | "explain_verse" | "add_story" | "add_reflection" | "continue_writing",
  "suggestionText": "one-sentence suggestion to the author"
}

Rules for suggestedNextAction:
- If containsStory && !containsReflection → "add_reflection"
- If containsTeaching && !containsScripture → "add_scripture"
- If containsEmotion && containsStory → "expand_story"
- If containsEmotion && !containsStory → "deepen_reflection"
- If containsReflection && !containsTeaching → "add_takeaway"
- If containsScripture && paragraphType == "scripture_explanation" → "explain_verse"
- If containsTeaching && !containsStory → "add_story"
- Default: "continue_writing"

Return ONLY valid JSON, no markdown fences or extra text.`

  const raw = await callClaude({
    system,
    userMessage: passage.slice(0, 2000),
    maxTokens: 384,
  })

  try {
    const parsed = parseJsonResponse<WritingSignals>(raw)

    return {
      containsStory: Boolean(parsed.containsStory),
      containsTeaching: Boolean(parsed.containsTeaching),
      containsEmotion: Boolean(parsed.containsEmotion),
      containsScripture: Boolean(parsed.containsScripture),
      containsReflection: Boolean(parsed.containsReflection),
      paragraphType: validateParagraphType(parsed.paragraphType),
      dominantTheme: parsed.dominantTheme || '',
      emotionalTone: parsed.emotionalTone || 'neutral',
      writingIntent: validateIntent(parsed.writingIntent),
      intentConfidence: normalizeConfidence(parsed.intentConfidence),
      suggestedNextAction: validateAction(parsed.suggestedNextAction),
      suggestionText: parsed.suggestionText || '',
    }
  } catch {
    return defaultSignals()
  }
}

const VALID_TYPES: ParagraphType[] = [
  'story', 'reflection', 'teaching', 'scripture_explanation',
  'lesson', 'transition', 'prayer', 'unknown',
]

const VALID_ACTIONS: SuggestedAction[] = [
  'expand_story', 'add_scripture', 'deepen_reflection', 'add_takeaway',
  'explain_verse', 'add_story', 'add_reflection', 'continue_writing',
]

const VALID_INTENTS: WritingIntent[] = [
  'story', 'reflection', 'teaching', 'encouragement',
  'explanation', 'application', 'scripture_interpretation', 'transition',
]

function validateParagraphType(type: string): ParagraphType {
  return VALID_TYPES.includes(type as ParagraphType)
    ? (type as ParagraphType)
    : 'unknown'
}

function validateAction(action: string): SuggestedAction {
  return VALID_ACTIONS.includes(action as SuggestedAction)
    ? (action as SuggestedAction)
    : 'continue_writing'
}

function validateIntent(intent: string): WritingIntent {
  return VALID_INTENTS.includes(intent as WritingIntent)
    ? (intent as WritingIntent)
    : 'story'
}

function normalizeConfidence(value: unknown): number {
  const num = Number(value)
  if (isNaN(num)) return 0.5
  return Math.max(0, Math.min(1, num))
}

function defaultSignals(): WritingSignals {
  return {
    containsStory: false,
    containsTeaching: false,
    containsEmotion: false,
    containsScripture: false,
    containsReflection: false,
    paragraphType: 'unknown',
    dominantTheme: '',
    emotionalTone: 'neutral',
    writingIntent: 'story',
    intentConfidence: 0,
    suggestedNextAction: 'continue_writing',
    suggestionText: '',
  }
}
