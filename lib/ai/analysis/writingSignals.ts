/**
 * Writing Signals — types and suggestion mapping for the Story & Insight Extractor.
 *
 * WritingSignals are detected from the user's recent writing and drive
 * intelligent suggestions in the editor.
 */

export type ParagraphType =
  | 'story'
  | 'reflection'
  | 'teaching'
  | 'scripture_explanation'
  | 'lesson'
  | 'transition'
  | 'prayer'
  | 'unknown'

export type WritingIntent =
  | 'story'
  | 'reflection'
  | 'teaching'
  | 'encouragement'
  | 'explanation'
  | 'application'
  | 'scripture_interpretation'
  | 'transition'

export type SuggestedAction =
  | 'expand_story'
  | 'add_scripture'
  | 'deepen_reflection'
  | 'add_takeaway'
  | 'explain_verse'
  | 'add_story'
  | 'add_reflection'
  | 'continue_writing'

export type WritingSignals = {
  containsStory: boolean
  containsTeaching: boolean
  containsEmotion: boolean
  containsScripture: boolean
  containsReflection: boolean
  paragraphType: ParagraphType
  dominantTheme: string
  emotionalTone: string
  suggestedNextAction: SuggestedAction
  suggestionText: string
  writingIntent: WritingIntent
  intentConfidence: number
}

/**
 * Map detected signals to human-readable suggestions and orchestrator actions.
 */
export const SUGGESTION_CONFIG: Record<
  SuggestedAction,
  { label: string; description: string; orchestratorAction: string; buttonLabel: string }
> = {
  expand_story: {
    label: 'Personal Story Detected',
    description: 'This looks like a personal story. Would you like to expand it into a full narrative section?',
    orchestratorAction: 'expand',
    buttonLabel: 'Expand Story',
  },
  add_scripture: {
    label: 'Teaching Point Detected',
    description: 'You\'ve introduced a teaching point. Would you like to support it with scripture?',
    orchestratorAction: 'find_scripture',
    buttonLabel: 'Find Scripture',
  },
  deepen_reflection: {
    label: 'Emotional Moment Detected',
    description: 'This paragraph carries emotional weight. Would you like to deepen this reflection?',
    orchestratorAction: 'deepen',
    buttonLabel: 'Deepen Reflection',
  },
  add_takeaway: {
    label: 'Reflection Detected',
    description: 'You\'ve written a thoughtful reflection. Would you like to add a practical takeaway?',
    orchestratorAction: 'continue',
    buttonLabel: 'Add Takeaway',
  },
  explain_verse: {
    label: 'Scripture Reference Detected',
    description: 'You\'ve referenced scripture. Would you like to add an explanation or application?',
    orchestratorAction: 'expand',
    buttonLabel: 'Explain Verse',
  },
  add_story: {
    label: 'Teaching Without Illustration',
    description: 'This section teaches but lacks a personal story. Would you like to add one?',
    orchestratorAction: 'draft',
    buttonLabel: 'Draft a Story',
  },
  add_reflection: {
    label: 'Story Without Reflection',
    description: 'Great story! Would you like to add a reflection on what God was teaching you here?',
    orchestratorAction: 'deepen',
    buttonLabel: 'Add Reflection',
  },
  continue_writing: {
    label: 'Good Momentum',
    description: 'Your writing is flowing well. Would you like AI to continue from where you left off?',
    orchestratorAction: 'continue',
    buttonLabel: 'Continue Writing',
  },
}

/**
 * Intent-aware suggestions — what actions make sense given the detected writing intent.
 */
export const INTENT_SUGGESTIONS: Record<
  WritingIntent,
  { label: string; guidance: string; actions: { label: string; orchestratorAction: string }[] }
> = {
  story: {
    label: 'You are developing a personal story.',
    guidance: 'Consider adding emotional detail or connecting this to a reflection.',
    actions: [
      { label: 'Expand Story', orchestratorAction: 'expand' },
      { label: 'Add Reflection', orchestratorAction: 'deepen' },
      { label: 'Add Scripture', orchestratorAction: 'find_scripture' },
    ],
  },
  reflection: {
    label: 'You are writing a reflection.',
    guidance: 'Consider deepening the insight or connecting it to a practical takeaway.',
    actions: [
      { label: 'Deepen Reflection', orchestratorAction: 'deepen' },
      { label: 'Connect to Reader', orchestratorAction: 'continue' },
      { label: 'Add Takeaway', orchestratorAction: 'continue' },
    ],
  },
  teaching: {
    label: 'You are developing a teaching point.',
    guidance: 'Consider supporting this with scripture or adding a practical example.',
    actions: [
      { label: 'Add Scripture Support', orchestratorAction: 'find_scripture' },
      { label: 'Add Example', orchestratorAction: 'expand' },
      { label: 'Clarify Lesson', orchestratorAction: 'revise' },
    ],
  },
  encouragement: {
    label: 'You are offering encouragement.',
    guidance: 'Consider grounding this with a verse or personal testimony.',
    actions: [
      { label: 'Add Scripture', orchestratorAction: 'find_scripture' },
      { label: 'Add Story', orchestratorAction: 'draft' },
      { label: 'Expand', orchestratorAction: 'expand' },
    ],
  },
  explanation: {
    label: 'You are explaining a concept.',
    guidance: 'Consider simplifying for clarity or adding an illustration.',
    actions: [
      { label: 'Simplify', orchestratorAction: 'revise' },
      { label: 'Add Illustration', orchestratorAction: 'draft' },
      { label: 'Add Scripture', orchestratorAction: 'find_scripture' },
    ],
  },
  application: {
    label: 'You are providing practical application.',
    guidance: 'Consider making this more specific or adding a reflection on why it matters.',
    actions: [
      { label: 'Make Specific', orchestratorAction: 'expand' },
      { label: 'Add Reflection', orchestratorAction: 'deepen' },
      { label: 'Add Scripture', orchestratorAction: 'find_scripture' },
    ],
  },
  scripture_interpretation: {
    label: 'You are interpreting scripture.',
    guidance: 'Consider adding context, a personal connection, or a practical takeaway.',
    actions: [
      { label: 'Add Context', orchestratorAction: 'expand' },
      { label: 'Add Application', orchestratorAction: 'continue' },
      { label: 'Research Background', orchestratorAction: 'research' },
    ],
  },
  transition: {
    label: 'You are bridging between ideas.',
    guidance: 'Consider what section should come next to maintain flow.',
    actions: [
      { label: 'Continue Writing', orchestratorAction: 'continue' },
      { label: 'Get Guidance', orchestratorAction: 'guide' },
    ],
  },
}

/**
 * Get the last meaningful paragraph from content.
 * Skips empty lines and very short lines.
 */
export function getLastParagraph(content: string): string {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30) // Skip very short fragments

  if (paragraphs.length === 0) return ''
  return paragraphs[paragraphs.length - 1]
}
