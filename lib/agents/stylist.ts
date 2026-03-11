import { callClaude, parseJsonResponse } from './base'
import type { StyleData } from '@/types/database'

// ---------------------------------------------------------------------------
// System Prompts
// ---------------------------------------------------------------------------

const ANALYZE_SYSTEM_PROMPT = `You are analyzing the writing style of an author so that an AI assistant can mimic their voice.

Study the writing sample carefully and extract the author's stylistic characteristics.

Analyze the following elements:

• tone (reflective, conversational, academic, narrative, etc.)
• narrative voice (first person, second person, instructional, etc.)
• sentence structure (short, medium, long, varied)
• pacing (slow reflective, balanced, fast)
• emotional intensity (low, moderate, high)
• vocabulary style (simple, literary, theological, conversational)
• rhetorical patterns (storytelling, teaching, reflection, exhortation)

Return ONLY JSON:

{
  "tone": "",
  "voice": "",
  "sentenceStructure": "",
  "pacing": "",
  "emotionLevel": "",
  "vocabularyStyle": "",
  "writingPatterns": "",
  "styleSummary": ""
}

Do not include any text outside the JSON.`

const AGGREGATE_SYSTEM_PROMPT = `You are combining multiple writing samples to generate a single style profile for an author.

Analyze the samples and identify consistent writing patterns.

Focus on:

• tone consistency
• sentence length patterns
• narrative voice
• emotional tone
• vocabulary level
• storytelling vs teaching balance

Return ONLY JSON:

{
  "tone": "",
  "voice": "",
  "sentenceStructure": "",
  "pacing": "",
  "emotionLevel": "",
  "vocabularyStyle": "",
  "writingPatterns": "",
  "styleSummary": ""
}

Do not include any text outside the JSON.`

const REFRESH_SYSTEM_PROMPT = `You are updating an author's style profile based on new writing they have produced.

You have their existing style profile and a sample of their recent writing.

Compare the recent writing against the existing profile and produce an updated profile that accounts for any evolution in their style. Preserve stable patterns and incorporate new ones.

Return ONLY JSON:

{
  "tone": "",
  "voice": "",
  "sentenceStructure": "",
  "pacing": "",
  "emotionLevel": "",
  "vocabularyStyle": "",
  "writingPatterns": "",
  "styleSummary": ""
}

Do not include any text outside the JSON.`

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a single writing sample to extract a style profile.
 */
export async function analyzeStyle(sample: string): Promise<StyleData> {
  const raw = await callClaude({
    system: ANALYZE_SYSTEM_PROMPT,
    userMessage: `Writing Sample:\n${sample.slice(0, 8000)}`,
    maxTokens: 1024,
  })

  return normalizeStyleData(parseJsonResponse<StyleData>(raw))
}

/**
 * Analyze multiple writing samples and produce a unified style profile.
 */
export async function aggregateStyle(samples: string[]): Promise<StyleData> {
  const combined = samples
    .map((s, i) => `--- Sample ${i + 1} ---\n${s.slice(0, 3000)}`)
    .join('\n\n')

  const raw = await callClaude({
    system: AGGREGATE_SYSTEM_PROMPT,
    userMessage: `Samples:\n${combined.slice(0, 8000)}`,
    maxTokens: 1024,
  })

  return normalizeStyleData(parseJsonResponse<StyleData>(raw))
}

/**
 * Refresh an existing style profile using new writing produced by the author.
 */
export async function refreshStyle(
  existingProfile: StyleData,
  newWriting: string
): Promise<StyleData> {
  const userMessage = `Existing Style Profile:\n${JSON.stringify(existingProfile, null, 2)}\n\nRecent Writing:\n${newWriting.slice(0, 6000)}`

  const raw = await callClaude({
    system: REFRESH_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 1024,
  })

  return normalizeStyleData(parseJsonResponse<StyleData>(raw))
}

/**
 * Format a StyleData object into a readable prompt block for injection
 * into AI prompts. This is a pure function — no AI call.
 */
export function formatStyleForPrompt(style: StyleData): string {
  const lines = [
    'AUTHOR STYLE PROFILE',
    '',
    `Tone: ${style.tone}`,
    `Narrative Voice: ${style.voice}`,
    `Sentence Structure: ${style.sentenceStructure}`,
    `Pacing: ${style.pacing}`,
    `Emotional Intensity: ${style.emotionLevel}`,
    `Vocabulary: ${style.vocabularyStyle}`,
    `Writing Patterns: ${style.writingPatterns}`,
    '',
    `Style Summary: ${style.styleSummary}`,
    '',
    'Match this style in all generated text.',
  ]

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeStyleData(data: Partial<StyleData>): StyleData {
  return {
    tone: data.tone || '',
    voice: data.voice || '',
    sentenceStructure: data.sentenceStructure || '',
    pacing: data.pacing || '',
    emotionLevel: data.emotionLevel || '',
    vocabularyStyle: data.vocabularyStyle || '',
    writingPatterns: data.writingPatterns || '',
    styleSummary: data.styleSummary || '',
  }
}
