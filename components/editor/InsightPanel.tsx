'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { type ProjectContext } from '@/lib/ai/context'
import {
  type WritingSignals,
  type SuggestedAction,
  SUGGESTION_CONFIG,
  INTENT_SUGGESTIONS,
  getLastParagraph,
} from '@/lib/ai/analysis/writingSignals'
import { isWorthAnalyzing, hasNewContent } from '@/lib/ai/analysis/insightClassifier'
import { TranslationComparisonPanel } from './TranslationComparisonPanel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InsightPanelProps {
  editorContent: string
  projectContext: ProjectContext
  onApplyResult: (result: string) => void
}

type TabId = 'suggestions' | 'tools' | 'scripture'

// Writing tools
type TextToolType = 'expand' | 'continue' | 'revise' | 'summarise'
type StructuredToolType = 'spiritual_check' | 'research' | 'guide'
type ToolType = TextToolType | StructuredToolType

interface SpiritualCheckResult {
  overallTone: string
  strengths: string[]
  suggestions: string[]
  theologicalNotes: string
}

interface ResearchResult {
  topic: string
  background: string
  keyInsights: string[]
  relatedPassages: string[]
  applicationNotes: string
}

interface GuideResult {
  nextSteps: string[]
  writingPrompt: string
  themesSuggestion: string
  transitionIdea: string
}

type StructuredResult = SpiritualCheckResult | ResearchResult | GuideResult

// Scripture
interface Verse {
  reference: string
  text: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isTextTool(tool: ToolType): tool is TextToolType {
  return ['expand', 'continue', 'revise', 'summarise'].includes(tool)
}

const TEXT_TOOLS: TextToolType[] = ['expand', 'continue', 'revise', 'summarise']
const STRUCTURED_TOOLS: StructuredToolType[] = ['spiritual_check', 'research', 'guide']

const toolLabels: Record<ToolType, string> = {
  expand: 'Expand',
  continue: 'Continue',
  revise: 'Revise',
  summarise: 'Summarise',
  spiritual_check: 'Spiritual Check',
  research: 'Research',
  guide: 'Guide',
}

// ---------------------------------------------------------------------------
// Structured result display sub-components (Tools tab)
// ---------------------------------------------------------------------------

function SpiritualCheckCard({ result }: { result: SpiritualCheckResult }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Overall Tone
        </p>
        <Badge variant="secondary" className="text-amber-700 bg-amber-50 border-amber-200">
          {result.overallTone}
        </Badge>
      </div>

      {result.strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Strengths
          </p>
          <ul className="space-y-1">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber-600 font-bold shrink-0">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Suggestions
          </p>
          <ul className="space-y-1">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-blue-500 font-bold shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="size-3 mt-0.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.theologicalNotes && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Theological Notes
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground italic border-l-2 border-amber-300 pl-3">
            {result.theologicalNotes}
          </p>
        </div>
      )}
    </div>
  )
}

function ResearchCard({ result }: { result: ResearchResult }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Topic
        </p>
        <p className="text-sm font-medium text-amber-700">{result.topic}</p>
      </div>

      {result.background && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Background
          </p>
          <p className="text-sm leading-relaxed">{result.background}</p>
        </div>
      )}

      {result.keyInsights.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Key Insights
          </p>
          <ul className="space-y-1">
            {result.keyInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber-600 font-bold shrink-0">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.relatedPassages.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Related Passages
          </p>
          <div className="flex flex-wrap gap-1">
            {result.relatedPassages.map((passage, i) => (
              <Badge key={i} variant="outline" className="text-xs text-amber-700 border-amber-300">
                {passage}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {result.applicationNotes && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Application Notes
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground italic border-l-2 border-amber-300 pl-3">
            {result.applicationNotes}
          </p>
        </div>
      )}
    </div>
  )
}

function GuideCard({ result }: { result: GuideResult }) {
  return (
    <div className="space-y-3">
      {result.writingPrompt && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Writing Prompt
          </p>
          <p className="text-sm leading-relaxed font-serif italic bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {result.writingPrompt}
          </p>
        </div>
      )}

      {result.nextSteps.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Next Steps
          </p>
          <ol className="space-y-1">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber-600 font-bold shrink-0 w-4">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {result.themesSuggestion && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Themes Suggestion
          </p>
          <p className="text-sm leading-relaxed">{result.themesSuggestion}</p>
        </div>
      )}

      {result.transitionIdea && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Transition Idea
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground italic border-l-2 border-amber-300 pl-3">
            {result.transitionIdea}
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Suggestions tab content
// ---------------------------------------------------------------------------

interface SuggestionsTabProps {
  editorContent: string
  onAction: (orchestratorAction: string) => void
}

function SuggestionsTab({ editorContent, onAction }: SuggestionsTabProps) {
  const [signals, setSignals] = useState<WritingSignals | null>(null)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastAnalyzedRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounced analysis: 8s after typing stops
  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current)
    }

    // Reset dismissed state when content changes significantly
    if (dismissed && hasNewContent(editorContent, lastAnalyzedRef.current)) {
      setDismissed(false)
    }

    analysisTimeoutRef.current = setTimeout(() => {
      const lastParagraph = getLastParagraph(editorContent)
      if (
        !lastParagraph ||
        !isWorthAnalyzing(lastParagraph) ||
        !hasNewContent(editorContent, lastAnalyzedRef.current)
      ) {
        return
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      setLoading(true)
      fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: lastParagraph }),
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error('Analysis failed')
          return res.json()
        })
        .then((data: WritingSignals) => {
          setSignals(data)
          lastAnalyzedRef.current = editorContent
          setDismissed(false)
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setSignals(null)
          }
        })
        .finally(() => {
          setLoading(false)
        })
    }, 8000)

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }
    }
  }, [editorContent, dismissed])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleAction = useCallback(
    (action: SuggestedAction) => {
      const config = SUGGESTION_CONFIG[action]
      if (config) {
        onAction(config.orchestratorAction)
        setDismissed(true)
      }
    },
    [onAction]
  )

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    setSignals(null)
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent shrink-0" />
        Analysing your writing...
      </div>
    )
  }

  // No content or dismissed
  const hasNoSuggestion =
    dismissed ||
    !signals ||
    (signals.suggestedNextAction === 'continue_writing' &&
      !signals.containsStory &&
      !signals.containsEmotion)

  if (hasNoSuggestion) {
    return (
      <p className="py-4 text-sm text-muted-foreground italic">
        Keep writing. Suggestions will appear after a meaningful paragraph.
      </p>
    )
  }

  const config = SUGGESTION_CONFIG[signals.suggestedNextAction]
  if (!config) return null

  // Build signal badges
  const badges: { label: string; className: string }[] = []
  if (signals.containsStory)
    badges.push({ label: 'Story', className: 'bg-purple-50 text-purple-700 border-purple-200' })
  if (signals.containsTeaching)
    badges.push({ label: 'Teaching', className: 'bg-blue-50 text-blue-700 border-blue-200' })
  if (signals.containsEmotion)
    badges.push({
      label: signals.emotionalTone,
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    })
  if (signals.containsScripture)
    badges.push({ label: 'Scripture', className: 'bg-green-50 text-green-700 border-green-200' })
  if (signals.containsReflection)
    badges.push({
      label: 'Reflection',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    })

  const intentConfig = signals.writingIntent
    ? INTENT_SUGGESTIONS[signals.writingIntent]
    : null

  return (
    <div className="py-2 space-y-3">
      {/* Writing Intent — the key insight */}
      {intentConfig && signals.intentConfidence > 0.5 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Writing Insight
          </p>
          <p className="text-sm font-medium text-foreground">{intentConfig.label}</p>
          <p className="text-xs text-muted-foreground">{intentConfig.guidance}</p>
        </div>
      )}

      {/* Signal badges */}
      {badges.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {signals.dominantTheme && (
            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
              {signals.dominantTheme}
            </Badge>
          )}
          {badges.map((badge) => (
            <Badge
              key={badge.label}
              variant="outline"
              className={`text-xs ${badge.className}`}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Suggestion text from AI */}
      {signals.suggestionText && (
        <p className="text-xs text-muted-foreground italic">
          {signals.suggestionText}
        </p>
      )}

      {/* Intent-aware action buttons */}
      <div className="flex flex-col gap-1.5">
        {intentConfig && signals.intentConfidence > 0.5 ? (
          // Use intent-driven suggestions
          intentConfig.actions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant="outline"
              onClick={() => onAction(action.orchestratorAction)}
              className="h-7 text-xs justify-start border-amber-200 text-amber-800 hover:bg-amber-50"
            >
              {action.label}
            </Button>
          ))
        ) : (
          // Fallback to signal-based suggestion
          <Button
            size="sm"
            onClick={() => handleAction(signals.suggestedNextAction)}
            className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs"
          >
            {config.buttonLabel}
          </Button>
        )}
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={handleDismiss}
        className="h-6 text-[10px] text-muted-foreground"
      >
        Dismiss
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tools tab content
// ---------------------------------------------------------------------------

interface ToolsTabProps {
  editorContent: string
  projectContext: ProjectContext
  onApplyResult: (result: string) => void
}

function ToolsTab({ editorContent, projectContext, onApplyResult }: ToolsTabProps) {
  const [loadingTool, setLoadingTool] = useState<ToolType | null>(null)
  const [textResult, setTextResult] = useState<string | null>(null)
  const [structuredResult, setStructuredResult] = useState<StructuredResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastTool, setLastTool] = useState<ToolType | null>(null)

  const handleTool = async (tool: ToolType) => {
    if (!editorContent.trim()) return
    setLoadingTool(tool)
    setError(null)
    setTextResult(null)
    setStructuredResult(null)
    setLastTool(tool)

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: tool,
          userText: editorContent,
          context: projectContext,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      if (isTextTool(tool)) {
        setTextResult(data.result)
      } else {
        const { agent: _agent, ...payload } = data
        setStructuredResult(payload as StructuredResult)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
    } finally {
      setLoadingTool(null)
    }
  }

  const handleApply = () => {
    if (textResult) {
      onApplyResult(textResult)
      setTextResult(null)
      setLastTool(null)
    }
  }

  const handleDiscard = () => {
    setTextResult(null)
    setStructuredResult(null)
    setLastTool(null)
  }

  const isDisabled = loadingTool !== null || !editorContent.trim()

  return (
    <div className="py-2 space-y-4">
      {/* Writing tools row */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Writing Tools
        </p>
        <div className="flex items-center flex-wrap gap-2">
          {TEXT_TOOLS.map((tool) => (
            <Button
              key={tool}
              onClick={() => handleTool(tool)}
              disabled={isDisabled}
              variant={tool === 'expand' ? 'default' : 'outline'}
              size="sm"
              className={
                tool === 'expand'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800'
              }
            >
              {loadingTool === tool ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {toolLabels[tool]}ing...
                </span>
              ) : (
                toolLabels[tool]
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Writing insights row */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Writing Insights
        </p>
        <div className="flex items-center flex-wrap gap-2">
          {STRUCTURED_TOOLS.map((tool) => (
            <Button
              key={tool}
              onClick={() => handleTool(tool)}
              disabled={isDisabled}
              variant="outline"
              size="sm"
              className="border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800"
            >
              {loadingTool === tool ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  {toolLabels[tool]}...
                </span>
              ) : (
                toolLabels[tool]
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Text result preview */}
      {textResult && lastTool && isTextTool(lastTool) && (
        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/40 p-3">
          <p className="text-xs font-medium text-amber-700">
            {toolLabels[lastTool]} result. Preview before applying
          </p>
          <div className="max-h-48 overflow-y-auto rounded-md bg-background/80 p-3 text-sm leading-relaxed whitespace-pre-wrap font-serif border border-border">
            {textResult}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApply}
              className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs"
            >
              Apply to Editor
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDiscard}
              className="h-7 text-xs"
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Structured result */}
      {structuredResult && lastTool && !isTextTool(lastTool) && (
        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/40 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
              {toolLabels[lastTool]} Results
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDiscard}
              className="h-6 px-2 text-xs text-muted-foreground"
            >
              Dismiss
            </Button>
          </div>

          <div className="pt-1">
            {lastTool === 'spiritual_check' && (
              <SpiritualCheckCard result={structuredResult as SpiritualCheckResult} />
            )}
            {lastTool === 'research' && (
              <ResearchCard result={structuredResult as ResearchResult} />
            )}
            {lastTool === 'guide' && (
              <GuideCard result={structuredResult as GuideResult} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scripture tab content
// ---------------------------------------------------------------------------

interface ScriptureTabProps {
  editorContent: string
  projectContext: ProjectContext
}

function ScriptureTab({ editorContent, projectContext }: ScriptureTabProps) {
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [comparingRef, setComparingRef] = useState<string | null>(null)

  const fetchVerses = async (mode: 'suggest' | 'search') => {
    setLoading(true)
    setError(null)
    try {
      const body =
        mode === 'search'
          ? {
              action: 'search_scripture',
              query: searchQuery,
              userText: editorContent,
              context: projectContext,
            }
          : { action: 'find_scripture', userText: editorContent, context: projectContext }

      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch verses')
      setVerses(data.verses || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (verse: Verse, index: number) => {
    const text = `${verse.reference} - "${verse.text}"`
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="py-2 space-y-3">
      {/* Search row */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by keyword or reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) =>
            e.key === 'Enter' && searchQuery.trim() && fetchVerses('search')
          }
          className="text-sm h-8"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchVerses('search')}
          disabled={loading || !searchQuery.trim()}
          className="shrink-0 h-8 border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800"
        >
          Find Verses
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent shrink-0" />
          Finding verses...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          <button
            onClick={() => fetchVerses('suggest')}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Verses */}
      {!loading && verses.length > 0 && (
        <ul className="space-y-2">
          {verses.map((verse, i) => (
            <li key={i}>
              <div className="flex items-start justify-between gap-2 rounded-md bg-amber-50/50 border border-amber-100 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-amber-700 text-sm">{verse.reference}</span>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    &quot;{verse.text}&quot;
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(verse, i)}
                    className="shrink-0 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-amber-100 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === i ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setComparingRef(verse.reference)}
                    className="shrink-0 rounded px-2 py-1 text-xs text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Compare translations"
                  >
                    Compare
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Translation Comparison Dialog */}
      <Dialog open={!!comparingRef} onOpenChange={(open) => !open && setComparingRef(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-amber-900">
              Compare Translations
            </DialogTitle>
          </DialogHeader>
          {comparingRef && (
            <TranslationComparisonPanel
              reference={comparingRef}
              onClose={() => setComparingRef(null)}
              layout="stacked"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Empty state */}
      {!loading && !error && verses.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Search for a keyword or click &quot;Find Verses&quot; to get suggestions based on your
          writing.
        </p>
      )}

      {/* Find Verses button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800"
        onClick={() => fetchVerses('suggest')}
        disabled={loading || !editorContent.trim()}
      >
        {loading ? 'Finding...' : 'Find Verses from My Writing'}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// InsightPanel — main exported component
// ---------------------------------------------------------------------------

// Lightweight hook to track whether there's an unread suggestion available.
// Shared between the tab bar indicator and the SuggestionsTab itself.
function useHasSuggestion(editorContent: string): boolean {
  const [hasSuggestion, setHasSuggestion] = useState(false)
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastAnalyzedRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current)
    }

    // Clear indicator when content changes significantly (user is still writing)
    if (hasNewContent(editorContent, lastAnalyzedRef.current)) {
      setHasSuggestion(false)
    }

    analysisTimeoutRef.current = setTimeout(() => {
      const lastParagraph = getLastParagraph(editorContent)
      if (
        !lastParagraph ||
        !isWorthAnalyzing(lastParagraph) ||
        !hasNewContent(editorContent, lastAnalyzedRef.current)
      ) {
        return
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: lastParagraph }),
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error('Analysis failed')
          return res.json()
        })
        .then((data: WritingSignals) => {
          lastAnalyzedRef.current = editorContent
          // Only flag as having a suggestion if it's something meaningful
          const isActionable =
            data.suggestedNextAction !== 'continue_writing' ||
            data.containsStory ||
            data.containsEmotion
          setHasSuggestion(isActionable && !!SUGGESTION_CONFIG[data.suggestedNextAction])
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setHasSuggestion(false)
          }
        })
    }, 8000)

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }
    }
  }, [editorContent])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return hasSuggestion
}

// Tab configuration
const TABS: { id: TabId; label: string }[] = [
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'tools', label: 'Tools' },
  { id: 'scripture', label: 'Scripture' },
]

export function InsightPanel({ editorContent, projectContext, onApplyResult }: InsightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('suggestions')
  // Track if the user has visited the Suggestions tab since the last suggestion appeared
  const [suggestionSeen, setSuggestionSeen] = useState(false)
  const hasSuggestion = useHasSuggestion(editorContent)

  // When a new suggestion arrives, mark it as unseen
  useEffect(() => {
    if (hasSuggestion) {
      setSuggestionSeen(false)
    }
  }, [hasSuggestion])

  // Mark suggestion as seen when user clicks into the Suggestions tab
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    if (tab === 'suggestions') {
      setSuggestionSeen(true)
    }
  }

  const showDot = hasSuggestion && !suggestionSeen && activeTab !== 'suggestions'

  return (
    <div className="border-t border-border bg-background">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border px-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const isSuggestionsWithDot = tab.id === 'suggestions' && showDot

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={[
                'relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
                isActive
                  ? 'text-amber-700 border-b-2 border-amber-500 -mb-px'
                  : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent -mb-px',
              ].join(' ')}
              aria-selected={isActive}
              role="tab"
            >
              {tab.label}

              {/* Badge count for Suggestions tab when there's an active suggestion */}
              {tab.id === 'suggestions' && hasSuggestion && (
                <Badge
                  className={[
                    'h-4 min-w-4 px-1 text-[10px] font-bold leading-none',
                    isActive
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 text-amber-700 border border-amber-300',
                  ].join(' ')}
                >
                  1
                </Badge>
              )}

              {/* Amber dot indicator for unread suggestion */}
              {isSuggestionsWithDot && (
                <span
                  aria-label="New suggestion available"
                  className="absolute top-1.5 right-1 h-1.5 w-1.5 rounded-full bg-amber-500"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab panel content */}
      <div className="px-4 pb-4 max-h-72 overflow-y-auto" role="tabpanel">
        {activeTab === 'suggestions' && (
          <SuggestionsTab
            editorContent={editorContent}
            onAction={(orchestratorAction) => {
              // Delegate the orchestrator action to the parent via onApplyResult
              // The parent (EditorClient) knows how to map orchestrator actions
              onApplyResult(orchestratorAction)
            }}
          />
        )}

        {activeTab === 'tools' && (
          <ToolsTab
            editorContent={editorContent}
            projectContext={projectContext}
            onApplyResult={onApplyResult}
          />
        )}

        {activeTab === 'scripture' && (
          <ScriptureTab
            editorContent={editorContent}
            projectContext={projectContext}
          />
        )}
      </div>
    </div>
  )
}
