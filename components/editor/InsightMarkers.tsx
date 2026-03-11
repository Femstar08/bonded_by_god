'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { countWords } from '@/lib/utils/text'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InsightAction {
  label: string
  action: string
}

interface Insight {
  type: 'story' | 'teaching' | 'emotion' | 'scripture'
  label: string
  excerpt: string
  paragraph: string
  actions: InsightAction[]
}

interface InsightMarkersProps {
  editorContent: string
  onAction: (action: string, text: string) => void
}

// ---------------------------------------------------------------------------
// Detection patterns
// ---------------------------------------------------------------------------

const STORY_PATTERNS = [
  /\bI remember\b/i,
  /\bOne day\b/i,
  /\bThere was a time\b/i,
  /\bGrowing up\b/i,
  /\bI was\b/i,
  /\byears ago\b/i,
  /\btold me\b/i,
  /\bI recall\b/i,
  /\b(he|she|they|we|I)\s+(walked|sat|stood|looked|said|told|went|came|felt|knew|thought|ran|cried|laughed)\b/i,
  /\bmy (mother|father|mom|dad|grandmother|grandfather|pastor|friend|teacher)\b/i,
]

const TEACHING_PATTERNS = [
  /\bThis means\b/i,
  /\bThe Bible says\b/i,
  /\bScripture tells\b/i,
  /\bWe must\b/i,
  /\bGod'?s word\b/i,
  /\bThe truth is\b/i,
  /\bThis principle\b/i,
  /\bwe (should|ought to|need to|are called to)\b/i,
  /\bLet us\b/i,
  /\bIn other words\b/i,
  /\bthe lesson here\b/i,
]

const EMOTION_WORDS = [
  'struggled', 'afraid', 'joy', 'pain', 'tears', 'hope', 'broken',
  'healing', 'peace', 'anxious', 'grateful', 'lonely', 'love',
  'sorrow', 'grief', 'weeping', 'rejoice', 'comfort', 'despair',
  'fearful', 'hopeless', 'blessed', 'anguish', 'triumph',
]

// Matches patterns like "John 3:16", "1 Corinthians 13:4-7", "Psalm 23", "Romans 8:28"
const SCRIPTURE_PATTERN =
  /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s*Samuel|2\s*Samuel|1\s*Kings|2\s*Kings|1\s*Chronicles|2\s*Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs?|Ecclesiastes|Song\s*of\s*Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s*Corinthians|2\s*Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s*Thessalonians|2\s*Thessalonians|1\s*Timothy|2\s*Timothy|Titus|Philemon|Hebrews|James|1\s*Peter|2\s*Peter|1\s*John|2\s*John|3\s*John|Jude|Revelation)\s+\d+(?::\d+(?:\s*[-–]\s*\d+)?)?/i

// ---------------------------------------------------------------------------
// Actions per insight type
// ---------------------------------------------------------------------------

const INSIGHT_ACTIONS: Record<Insight['type'], InsightAction[]> = {
  story: [
    { label: 'Expand Story', action: 'expand' },
    { label: 'Add Reflection', action: 'deepen' },
    { label: 'Insert Scripture', action: 'find_scripture' },
  ],
  teaching: [
    { label: 'Add Example', action: 'expand' },
    { label: 'Simplify', action: 'revise' },
    { label: 'Add Scripture', action: 'find_scripture' },
  ],
  emotion: [
    { label: 'Deepen Emotion', action: 'deepen' },
    { label: 'Add Story', action: 'continue' },
    { label: 'Add Reflection', action: 'deepen' },
  ],
  scripture: [
    { label: 'Add Commentary', action: 'expand' },
    { label: 'Expand Context', action: 'continue' },
    { label: 'Add Application', action: 'deepen' },
  ],
}

const INSIGHT_CONFIG: Record<Insight['type'], { icon: string; colorClass: string; bgClass: string; borderClass: string }> = {
  story: {
    icon: '\u{1F4D6}',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  teaching: {
    icon: '\u{1F4A1}',
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
  },
  emotion: {
    icon: '\u{1F9E1}',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
  scripture: {
    icon: '\u{2728}',
    colorClass: 'text-green-700',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
  },
}

const INSIGHT_LABELS: Record<Insight['type'], string> = {
  story: 'Story detected',
  teaching: 'Teaching found',
  emotion: 'Emotion sensed',
  scripture: 'Scripture reference',
}

// ---------------------------------------------------------------------------
// Analysis helpers
// ---------------------------------------------------------------------------

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function truncateExcerpt(text: string, maxLen = 60): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '...'
}

function detectInsights(text: string): Insight[] {
  const paragraphs = splitParagraphs(text)
  const insights: Insight[] = []
  const seenTypes = new Set<Insight['type']>()

  // Process paragraphs in reverse so the most recent content takes priority
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const para = paragraphs[i]
    if (seenTypes.size >= 4) break

    // Scripture detection (check first since it's the most specific)
    if (!seenTypes.has('scripture') && SCRIPTURE_PATTERN.test(para)) {
      seenTypes.add('scripture')
      insights.push({
        type: 'scripture',
        label: INSIGHT_LABELS.scripture,
        excerpt: truncateExcerpt(para),
        paragraph: para,
        actions: INSIGHT_ACTIONS.scripture,
      })
    }

    // Story detection
    if (!seenTypes.has('story') && STORY_PATTERNS.some((p) => p.test(para))) {
      seenTypes.add('story')
      insights.push({
        type: 'story',
        label: INSIGHT_LABELS.story,
        excerpt: truncateExcerpt(para),
        paragraph: para,
        actions: INSIGHT_ACTIONS.story,
      })
    }

    // Teaching detection
    if (!seenTypes.has('teaching') && TEACHING_PATTERNS.some((p) => p.test(para))) {
      seenTypes.add('teaching')
      insights.push({
        type: 'teaching',
        label: INSIGHT_LABELS.teaching,
        excerpt: truncateExcerpt(para),
        paragraph: para,
        actions: INSIGHT_ACTIONS.teaching,
      })
    }

    // Emotion detection
    if (!seenTypes.has('emotion')) {
      const lowerPara = para.toLowerCase()
      const matchedEmotion = EMOTION_WORDS.some((word) => lowerPara.includes(word))
      if (matchedEmotion) {
        seenTypes.add('emotion')
        insights.push({
          type: 'emotion',
          label: INSIGHT_LABELS.emotion,
          excerpt: truncateExcerpt(para),
          paragraph: para,
          actions: INSIGHT_ACTIONS.emotion,
        })
      }
    }
  }

  return insights
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InsightMarkers({ editorContent, onAction }: InsightMarkersProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExpandedIndex(null)
      }
    }
    if (expandedIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [expandedIndex])

  // Debounced analysis — 3 seconds after last content change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const wc = countWords(editorContent)
      if (wc < 50) {
        setInsights([])
        return
      }

      const detected = detectInsights(editorContent)
      setInsights(detected)
      setExpandedIndex(null)
    }, 3000)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [editorContent])

  const wordCount = useMemo(() => countWords(editorContent), [editorContent])

  // Don't render if no content or no insights
  if (wordCount < 50 || insights.length === 0) {
    return null
  }

  const handlePillClick = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index))
  }

  const handleActionClick = (action: string, paragraph: string) => {
    onAction(action, paragraph)
    setExpandedIndex(null)
  }

  return (
    <div className="relative py-2">
      {/* Pill strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium shrink-0">
          Insights:
        </span>
        {insights.map((insight, index) => {
          const config = INSIGHT_CONFIG[insight.type]
          const isExpanded = expandedIndex === index

          return (
            <div key={`${insight.type}-${index}`} className="relative">
              <button
                onClick={() => handlePillClick(index)}
                className={[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                  config.bgClass,
                  config.colorClass,
                  config.borderClass,
                  isExpanded ? 'ring-2 ring-offset-1 ring-amber-300' : '',
                  'hover:shadow-sm cursor-pointer',
                ].join(' ')}
                aria-expanded={isExpanded}
                aria-haspopup="true"
              >
                <span aria-hidden="true">{config.icon}</span>
                {insight.label}
              </button>

              {/* Dropdown */}
              {isExpanded && (
                <div
                  ref={dropdownRef}
                  className="absolute z-20 top-full mt-1.5 left-0 w-72 rounded-lg border bg-background shadow-lg p-3 space-y-2.5"
                >
                  {/* Excerpt */}
                  <p className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-amber-300 pl-2">
                    &ldquo;{insight.excerpt}&rdquo;
                  </p>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {insight.actions.map((act) => (
                      <Button
                        key={act.action}
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick(act.action, insight.paragraph)}
                        className={[
                          'h-7 text-xs',
                          config.borderClass,
                          config.colorClass,
                          `hover:${config.bgClass}`,
                        ].join(' ')}
                      >
                        {act.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
