import type { ParagraphType, WritingSignals } from './writingSignals'

/**
 * Local (non-AI) heuristic classifier for quick paragraph type detection.
 * Use this for lightweight checks when a full AI call isn't needed.
 *
 * Returns a rough classification based on keyword patterns.
 * For accurate results, use analyzePassage() from storyExtractor.ts instead.
 */
export function classifyParagraphLocally(text: string): {
  likelyType: ParagraphType
  hasScriptureRef: boolean
  hasFirstPerson: boolean
  hasEmotionalLanguage: boolean
} {
  const lower = text.toLowerCase()

  // Scripture detection (simple patterns)
  const scripturePattern = /\b(?:john|matthew|mark|luke|romans|genesis|psalm|proverbs|corinthians|ephesians|hebrews|james|peter|revelation)\s+\d/i
  const hasScriptureRef = scripturePattern.test(text) || /\d+:\d+/.test(text)

  // First-person narrative detection
  const firstPersonPattern = /\b(?:i remember|i recall|i felt|i knew|i realized|i was|my father|my mother|my family|growing up|when i was|i learned)\b/i
  const hasFirstPerson = firstPersonPattern.test(text)

  // Emotional language detection
  const emotionalWords = /\b(?:heart|tears|joy|pain|fear|hope|love|broken|healing|grief|peace|overwhelm|grateful|wonder|shame|forgive|cry|laugh|weep|embrace)\b/i
  const hasEmotionalLanguage = emotionalWords.test(text)

  // Teaching/instruction detection
  const teachingPattern = /\b(?:we must|we should|the bible teaches|scripture tells|this means|the truth is|it is important|god calls us|we are called)\b/i
  const hasTeaching = teachingPattern.test(text)

  // Reflection/meditation detection
  const reflectionPattern = /\b(?:i wonder|what if|perhaps|looking back|in hindsight|reflecting on|it struck me|i've come to|i began to see)\b/i
  const hasReflection = reflectionPattern.test(text)

  // Prayer detection
  const prayerPattern = /\b(?:lord|father god|heavenly father|we pray|i pray|amen|almighty|in jesus'? name)\b/i
  const hasPrayer = prayerPattern.test(lower)

  // Classify
  let likelyType: ParagraphType = 'unknown'

  if (hasPrayer) {
    likelyType = 'prayer'
  } else if (hasFirstPerson && hasEmotionalLanguage) {
    likelyType = 'story'
  } else if (hasScriptureRef && hasTeaching) {
    likelyType = 'scripture_explanation'
  } else if (hasTeaching) {
    likelyType = 'teaching'
  } else if (hasReflection || (hasEmotionalLanguage && !hasFirstPerson)) {
    likelyType = 'reflection'
  } else if (hasFirstPerson) {
    likelyType = 'story'
  }

  return {
    likelyType,
    hasScriptureRef,
    hasFirstPerson,
    hasEmotionalLanguage,
  }
}

/**
 * Determine if a passage is substantial enough to warrant AI analysis.
 * Saves API costs by skipping trivial content.
 */
export function isWorthAnalyzing(text: string): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean)
  // At least 30 words to be meaningful
  if (words.length < 30) return false
  // Skip if it looks like just a title or heading
  if (text.trim().split('\n').length <= 1 && words.length < 15) return false
  return true
}

/**
 * Quick-check: does the new content contain new paragraph(s) worth analyzing?
 * Compares against the previously analyzed text to avoid re-analyzing.
 */
export function hasNewContent(
  currentContent: string,
  lastAnalyzedContent: string
): boolean {
  if (!currentContent.trim()) return false
  if (!lastAnalyzedContent) return currentContent.trim().length > 100

  // Check if significant new content was added
  const newChars = currentContent.length - lastAnalyzedContent.length
  return newChars > 100
}

/**
 * Build a brief label for the detected paragraph type.
 */
export function getParagraphTypeLabel(signals: WritingSignals): string {
  const labels: Record<ParagraphType, string> = {
    story: 'Personal Story',
    reflection: 'Reflection',
    teaching: 'Teaching',
    scripture_explanation: 'Scripture Explanation',
    lesson: 'Life Lesson',
    transition: 'Transition',
    prayer: 'Prayer',
    unknown: 'Writing',
  }
  return labels[signals.paragraphType] || 'Writing'
}
