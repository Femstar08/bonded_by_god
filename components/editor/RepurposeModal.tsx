'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { ProjectContext } from '@/lib/ai/context'
import type { RepurposeFormat, RepurposedOutput } from '@/types/repurposing'
import { REPURPOSE_FORMATS } from '@/types/repurposing'
import { countWords } from '@/lib/utils/text'

interface RepurposeModalProps {
  isOpen: boolean
  onClose: () => void
  sourceContent: string
  sourceTitle: string
  projectContext: ProjectContext
  projectId: string
  projectTitle: string
}

type ModalStep = 'select' | 'generate'

// Session cache: survives modal close/reopen for 30 minutes
const sessionCache: {
  outputs: Map<RepurposeFormat, RepurposedOutput>
  timestamp: number
  sourceHash: string
} = {
  outputs: new Map(),
  timestamp: 0,
  sourceHash: '',
}

function hashSource(content: string): string {
  return `${content.length}-${content.slice(0, 100)}`
}

export function RepurposeModal({
  isOpen,
  onClose,
  sourceContent,
  sourceTitle,
  projectContext,
  projectId,
  projectTitle,
}: RepurposeModalProps) {
  const [step, setStep] = useState<ModalStep>('select')
  const [selectedFormats, setSelectedFormats] = useState<Set<RepurposeFormat>>(new Set())
  const [outputs, setOutputs] = useState<Map<RepurposeFormat, RepurposedOutput>>(new Map())
  const [generatingCount, setGeneratingCount] = useState(0)
  const [editingFormat, setEditingFormat] = useState<RepurposeFormat | null>(null)
  const [editBuffer, setEditBuffer] = useState('')
  const [truncated, setTruncated] = useState(false)
  const [savedNotes, setSavedNotes] = useState<Set<RepurposeFormat>>(new Set())
  const [copyFeedback, setCopyFeedback] = useState<RepurposeFormat | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const wordCount = countWords(sourceContent)

  // Restore session cache on open
  useEffect(() => {
    if (isOpen) {
      const now = Date.now()
      const currentHash = hashSource(sourceContent)
      if (
        sessionCache.outputs.size > 0 &&
        now - sessionCache.timestamp < 30 * 60 * 1000 &&
        sessionCache.sourceHash === currentHash
      ) {
        setOutputs(new Map(sessionCache.outputs))
        setStep('generate')
      }
    }
  }, [isOpen, sourceContent])

  // Save to session cache when outputs change
  useEffect(() => {
    if (outputs.size > 0) {
      sessionCache.outputs = new Map(outputs)
      sessionCache.timestamp = Date.now()
      sessionCache.sourceHash = hashSource(sourceContent)
    }
  }, [outputs, sourceContent])

  const toggleFormat = (format: RepurposeFormat) => {
    setSelectedFormats((prev) => {
      const next = new Set(prev)
      if (next.has(format)) next.delete(format)
      else next.add(format)
      return next
    })
  }

  const selectAll = () => {
    if (selectedFormats.size === REPURPOSE_FORMATS.length) {
      setSelectedFormats(new Set())
    } else {
      setSelectedFormats(new Set(REPURPOSE_FORMATS.map((f) => f.id)))
    }
  }

  const handleGenerate = useCallback(async () => {
    if (selectedFormats.size === 0) return

    const formats = Array.from(selectedFormats)

    // Set all selected to generating
    const initialOutputs = new Map<RepurposeFormat, RepurposedOutput>()
    for (const format of formats) {
      initialOutputs.set(format, { format, content: '', status: 'generating' })
    }
    setOutputs(initialOutputs)
    setStep('generate')
    setGeneratingCount(formats.length)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceContent,
          formats,
          context: projectContext,
        }),
        signal: controller.signal,
      })

      const data = await res.json()

      if (data.error) {
        // All failed
        const errorOutputs = new Map<RepurposeFormat, RepurposedOutput>()
        for (const format of formats) {
          errorOutputs.set(format, {
            format,
            content: '',
            status: 'error',
            errorMessage: data.error,
          })
        }
        setOutputs(errorOutputs)
      } else if (data.results) {
        const newOutputs = new Map<RepurposeFormat, RepurposedOutput>()
        for (const result of data.results as RepurposedOutput[]) {
          newOutputs.set(result.format, result)
        }
        setOutputs(newOutputs)
        setTruncated(data.truncated || false)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorOutputs = new Map<RepurposeFormat, RepurposedOutput>()
        for (const format of formats) {
          errorOutputs.set(format, {
            format,
            content: '',
            status: 'error',
            errorMessage: 'Network error. Please try again.',
          })
        }
        setOutputs(errorOutputs)
      }
    } finally {
      setGeneratingCount(0)
      abortRef.current = null
    }
  }, [selectedFormats, sourceContent, projectContext])

  const handleRegenerate = useCallback(async (format: RepurposeFormat) => {
    // Warn if user has edits
    const current = outputs.get(format)
    if (editingFormat === format && editBuffer !== current?.content) {
      if (!window.confirm('Regenerating will overwrite your edits. Continue?')) return
    }

    setEditingFormat(null)
    setOutputs((prev) => {
      const next = new Map(prev)
      next.set(format, { format, content: '', status: 'generating' })
      return next
    })

    try {
      const res = await fetch('/api/repurpose/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceContent,
          format,
          context: projectContext,
        }),
      })

      const data = await res.json()

      setOutputs((prev) => {
        const next = new Map(prev)
        if (data.error) {
          next.set(format, { format, content: '', status: 'error', errorMessage: data.error })
        } else {
          next.set(format, { format, content: data.content, status: data.status || 'complete' })
        }
        return next
      })
    } catch {
      setOutputs((prev) => {
        const next = new Map(prev)
        next.set(format, { format, content: '', status: 'error', errorMessage: 'Network error' })
        return next
      })
    }
  }, [sourceContent, projectContext, outputs, editingFormat, editBuffer])

  const handleCopy = useCallback(async (format: RepurposeFormat) => {
    const output = outputs.get(format)
    if (!output?.content) return

    await navigator.clipboard.writeText(output.content)
    setCopyFeedback(format)
    setTimeout(() => setCopyFeedback(null), 2000)
  }, [outputs])

  const handleSaveToNotes = useCallback(async (format: RepurposeFormat) => {
    if (savedNotes.has(format)) return

    const output = outputs.get(format)
    if (!output?.content) return

    const formatInfo = REPURPOSE_FORMATS.find((f) => f.id === format)
    const date = new Date().toISOString().split('T')[0]
    const title = `${projectTitle} — ${formatInfo?.name || format} — ${date}`

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: output.content,
          tags: ['repurposed'],
        }),
      })

      if (res.ok) {
        setSavedNotes((prev) => new Set(prev).add(format))
      }
    } catch {
      // Silent fail
    }
  }, [outputs, savedNotes, projectTitle])

  const handleEdit = (format: RepurposeFormat) => {
    const output = outputs.get(format)
    if (!output?.content) return
    setEditingFormat(format)
    setEditBuffer(output.content)
  }

  const handleSaveEdit = (format: RepurposeFormat) => {
    setOutputs((prev) => {
      const next = new Map(prev)
      const existing = next.get(format)
      if (existing) {
        next.set(format, { ...existing, content: editBuffer })
      }
      return next
    })
    setEditingFormat(null)
  }

  const handleBulkExport = useCallback(async () => {
    const completedOutputs = Array.from(outputs.values()).filter(
      (o) => o.status === 'complete' && o.content
    )

    if (completedOutputs.length === 0) return

    // Dynamic import JSZip
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (const output of completedOutputs) {
      const formatInfo = REPURPOSE_FORMATS.find((f) => f.id === output.format)
      const fileName = `${formatInfo?.name || output.format}.md`
      zip.file(fileName, output.content)
    }

    // Add readme if some formats errored
    const erroredFormats = Array.from(outputs.values()).filter((o) => o.status === 'error')
    if (erroredFormats.length > 0) {
      const readme = `Some formats could not be generated:\n\n${erroredFormats
        .map((o) => {
          const info = REPURPOSE_FORMATS.find((f) => f.id === o.format)
          return `- ${info?.name || o.format}: ${o.errorMessage || 'Unknown error'}`
        })
        .join('\n')}`
      zip.file('README.md', readme)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectTitle} — Repurposed Content.zip`
    a.click()
    URL.revokeObjectURL(url)
  }, [outputs, projectTitle])

  const handleClose = () => {
    if (generatingCount > 0) {
      setConfirmClose(true)
      return
    }
    resetAndClose()
  }

  const resetAndClose = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setConfirmClose(false)
    setEditingFormat(null)
    // Don't clear outputs — session cache preserves them
    onClose()
  }

  const handleConfirmCloseYes = () => {
    resetAndClose()
  }

  if (!isOpen) return null

  const allFormatsSelected = selectedFormats.size === REPURPOSE_FORMATS.length
  const completedCount = Array.from(outputs.values()).filter((o) => o.status === 'complete').length
  const allDone = generatingCount === 0 && outputs.size > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-border/30 bg-[#1a2744]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif text-white">
                {step === 'select' ? 'Repurpose' : generatingCount > 0 ? `Generating ${generatingCount} formats...` : 'Repurposed Content'}
              </h2>
              <p className="text-sm text-white/60 mt-0.5">
                {sourceTitle} — {wordCount.toLocaleString()} words
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-white/60 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
          {truncated && (
            <p className="text-xs text-amber-300 mt-2">
              Content was trimmed to 8,000 words for generation. The full chapter has been preserved.
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select' && (
            <FormatSelectionStep
              selectedFormats={selectedFormats}
              onToggle={toggleFormat}
              onSelectAll={selectAll}
              allSelected={allFormatsSelected}
            />
          )}

          {step === 'generate' && (
            <GenerationPreviewStep
              outputs={outputs}
              editingFormat={editingFormat}
              editBuffer={editBuffer}
              savedNotes={savedNotes}
              copyFeedback={copyFeedback}
              onEdit={handleEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => setEditingFormat(null)}
              onEditChange={setEditBuffer}
              onCopy={handleCopy}
              onSaveToNotes={handleSaveToNotes}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border/30 bg-muted/10">
          {step === 'select' && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedFormats.size} format{selectedFormats.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={selectedFormats.size === 0}
                  onClick={handleGenerate}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Generate Selected Formats
                </Button>
              </div>
            </div>
          )}

          {step === 'generate' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {generatingCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Generating... {completedCount}/{outputs.size}
                  </p>
                )}
                {!projectContext.authorStyleProfile && (
                  <p className="text-xs text-muted-foreground/60 italic">
                    No style profile found. Add writing samples in Settings to personalise output.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStep('select')
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!allDone || completedCount === 0}
                  onClick={handleBulkExport}
                >
                  Bulk Export All
                </Button>
                <Button
                  size="sm"
                  onClick={handleClose}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Confirm close dialog */}
        {confirmClose && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
              <p className="text-sm font-medium mb-4">
                Generation is still in progress. Leaving will cancel remaining formats. Continue?
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setConfirmClose(false)}>
                  Stay
                </Button>
                <Button size="sm" variant="destructive" onClick={handleConfirmCloseYes}>
                  Leave
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Step 1: Format Selection ──

function FormatSelectionStep({
  selectedFormats,
  onToggle,
  onSelectAll,
  allSelected,
}: {
  selectedFormats: Set<RepurposeFormat>
  onToggle: (f: RepurposeFormat) => void
  onSelectAll: () => void
  allSelected: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Choose the formats you want to generate from your content.
        </p>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-sm text-amber-700 hover:text-amber-800 font-medium"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REPURPOSE_FORMATS.map((format) => {
          const isSelected = selectedFormats.has(format.id)
          return (
            <button
              key={format.id}
              type="button"
              onClick={() => onToggle(format.id)}
              className={`relative text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                  : 'border-border/50 bg-white hover:border-border hover:shadow-sm'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-amber-500 border-amber-500'
                    : 'border-border/60 bg-white'
                }`}
              >
                {isSelected && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="size-3.5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              <h3 className="font-serif text-sm font-semibold text-foreground pr-6">
                {format.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {format.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2: Generation & Preview ──

function GenerationPreviewStep({
  outputs,
  editingFormat,
  editBuffer,
  savedNotes,
  copyFeedback,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onEditChange,
  onCopy,
  onSaveToNotes,
  onRegenerate,
}: {
  outputs: Map<RepurposeFormat, RepurposedOutput>
  editingFormat: RepurposeFormat | null
  editBuffer: string
  savedNotes: Set<RepurposeFormat>
  copyFeedback: RepurposeFormat | null
  onEdit: (f: RepurposeFormat) => void
  onSaveEdit: (f: RepurposeFormat) => void
  onCancelEdit: () => void
  onEditChange: (val: string) => void
  onCopy: (f: RepurposeFormat) => void
  onSaveToNotes: (f: RepurposeFormat) => void
  onRegenerate: (f: RepurposeFormat) => void
}) {
  // Sort by status: complete first, then generating, then error
  const sorted = Array.from(outputs.values()).sort((a, b) => {
    const order = { complete: 0, generating: 1, error: 2, idle: 3 }
    return (order[a.status] ?? 3) - (order[b.status] ?? 3)
  })

  return (
    <div className="space-y-4">
      {sorted.map((output) => {
        const formatInfo = REPURPOSE_FORMATS.find((f) => f.id === output.format)
        const isEditing = editingFormat === output.format

        return (
          <div
            key={output.format}
            className="rounded-xl border border-border/50 bg-white overflow-hidden"
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/10 border-b border-border/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                {formatInfo?.name || output.format}
              </span>
              {output.status === 'generating' && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg className="animate-spin size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </span>
              )}
              {output.status === 'complete' && (
                <span className="text-xs text-emerald-600 font-medium">Complete</span>
              )}
              {output.status === 'error' && (
                <span className="text-xs text-red-500 font-medium">Error</span>
              )}
            </div>

            {/* Card content */}
            <div className="p-4">
              {output.status === 'generating' && (
                <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                  Transforming your content...
                </div>
              )}

              {output.status === 'error' && (
                <div className="text-center py-6">
                  <p className="text-sm text-red-500 mb-3">
                    {output.errorMessage || 'Generation failed.'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRegenerate(output.format)}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {output.status === 'complete' && (
                <>
                  {isEditing ? (
                    <div>
                      <textarea
                        value={editBuffer}
                        onChange={(e) => onEditChange(e.target.value)}
                        className="w-full h-48 p-3 border border-border/50 rounded-lg text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button size="sm" variant="outline" onClick={onCancelEdit}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onSaveEdit(output.format)}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Save Edits
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-foreground/80 font-sans leading-relaxed bg-transparent p-0 m-0 border-0">
                        {output.content}
                      </pre>
                    </div>
                  )}

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => onEdit(output.format)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => onCopy(output.format)}
                      >
                        {copyFeedback === output.format ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => onSaveToNotes(output.format)}
                        disabled={savedNotes.has(output.format)}
                      >
                        {savedNotes.has(output.format) ? 'Saved' : 'Save to Notes'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-muted-foreground"
                        onClick={() => onRegenerate(output.format)}
                      >
                        Regenerate
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
