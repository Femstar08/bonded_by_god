'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
  chapterId: string
  chapterTitle: string
  chapterContent: string
}

type ExportFormat = 'pdf' | 'docx' | 'email'
type CardState = 'idle' | 'loading' | 'success' | 'error'

// ---------------------------------------------------------------------------
// Inline SVG icons — no third-party icon library required
// ---------------------------------------------------------------------------

function PdfIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-7 text-amber-600"
      aria-hidden="true"
    >
      {/* Document outline */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      {/* "PDF" label band */}
      <rect x="4" y="13" width="16" height="6" rx="1" fill="currentColor" stroke="none" className="text-amber-100" />
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fontSize="4.5"
        fontWeight="700"
        fill="#92400e"
        stroke="none"
        fontFamily="sans-serif"
      >
        PDF
      </text>
    </svg>
  )
}

function DocxIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-7 text-amber-600"
      aria-hidden="true"
    >
      {/* Document outline */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      {/* "W" label band */}
      <rect x="4" y="13" width="16" height="6" rx="1" fill="currentColor" stroke="none" className="text-blue-100" />
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fontSize="5"
        fontWeight="700"
        fill="#1e40af"
        stroke="none"
        fontFamily="sans-serif"
      >
        W
      </text>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-7 text-amber-600"
      aria-hidden="true"
    >
      {/* Envelope body */}
      <rect x="2" y="4" width="20" height="16" rx="2" />
      {/* Envelope flap */}
      <polyline points="2,4 12,13 22,4" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="size-5 animate-spin text-amber-600"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 text-green-600"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Utility — slugify a filename
// ---------------------------------------------------------------------------

function toFilename(projectTitle: string, chapterTitle: string, ext: string) {
  const slug = `${projectTitle}-${chapterTitle}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  return `${slug}.${ext}`
}

// ---------------------------------------------------------------------------
// ExportModal
// ---------------------------------------------------------------------------

export function ExportModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  chapterId,
  chapterTitle,
  chapterContent,
}: ExportModalProps) {
  // Per-card state machine: idle | loading | success | error
  const [pdfState, setPdfState] = useState<CardState>('idle')
  const [docxState, setDocxState] = useState<CardState>('idle')
  const [emailState, setEmailState] = useState<CardState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Reset all states when the modal reopens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    } else {
      setPdfState('idle')
      setDocxState('idle')
      setEmailState('idle')
      setErrorMessage(null)
    }
  }

  // -------------------------------------------------------------------------
  // PDF / DOCX — binary download via API
  // -------------------------------------------------------------------------

  async function handleBinaryExport(format: 'pdf' | 'docx') {
    const setState = format === 'pdf' ? setPdfState : setDocxState
    const ext = format === 'pdf' ? 'pdf' : 'docx'

    setErrorMessage(null)
    setState('loading')

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, projectId, format }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error')
        throw new Error(text || `Export failed with status ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = toFilename(projectTitle, chapterTitle, ext)
      a.click()
      URL.revokeObjectURL(url)

      setState('success')

      // Brief success flash, then close
      setTimeout(() => {
        setState('idle')
        onClose()
      }, 1200)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setErrorMessage(message)
      setState('error')

      // Reset card back to idle after a moment so the user can retry
      setTimeout(() => setState('idle'), 3000)
    }
  }

  // -------------------------------------------------------------------------
  // Email — client-side clipboard copy, no API call
  // -------------------------------------------------------------------------

  async function handleEmailCopy() {
    setErrorMessage(null)
    setEmailState('loading')

    const formatted = [
      projectTitle,
      chapterTitle,
      '',
      chapterContent,
      '',
      '---',
      'Created with Scriptloom',
    ].join('\n')

    try {
      await navigator.clipboard.writeText(formatted)
      setEmailState('success')

      setTimeout(() => {
        setEmailState('idle')
        onClose()
      }, 2000)
    } catch {
      setErrorMessage('Could not access clipboard. Please copy manually.')
      setEmailState('error')
      setTimeout(() => setEmailState('idle'), 3000)
    }
  }

  // -------------------------------------------------------------------------
  // Export card definitions
  // -------------------------------------------------------------------------

  const cards: {
    format: ExportFormat
    icon: React.ReactNode
    title: string
    description: string
    state: CardState
    onClick: () => void
    successLabel: string
  }[] = [
    {
      format: 'pdf',
      icon: <PdfIcon />,
      title: 'Export as PDF',
      description: 'Download a formatted PDF for printing or sharing',
      state: pdfState,
      onClick: () => handleBinaryExport('pdf'),
      successLabel: 'Downloading…',
    },
    {
      format: 'docx',
      icon: <DocxIcon />,
      title: 'Export as Word',
      description: 'Download a .docx file for further editing',
      state: docxState,
      onClick: () => handleBinaryExport('docx'),
      successLabel: 'Downloading…',
    },
    {
      format: 'email',
      icon: <EmailIcon />,
      title: 'Copy as Email Draft',
      description: 'Copy formatted text to your clipboard',
      state: emailState,
      onClick: handleEmailCopy,
      successLabel: 'Copied!',
    },
  ]

  // Whether any card is mid-flight — prevents double-triggering
  const anyLoading = pdfState === 'loading' || docxState === 'loading' || emailState === 'loading'

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md border-border shadow-xl p-0 overflow-hidden"
        aria-describedby="export-modal-description"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-serif font-semibold text-foreground">
            Export Chapter
          </DialogTitle>
          <DialogDescription id="export-modal-description" className="text-sm text-muted-foreground">
            Choose a format to export{' '}
            <span className="font-medium text-foreground/80">{chapterTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Cards */}
        <div className="flex flex-col gap-3 px-6 pb-2" role="list" aria-label="Export format options">
          {cards.map((card) => {
            const isLoading = card.state === 'loading'
            const isSuccess = card.state === 'success'
            const isError = card.state === 'error'
            const isDisabled = anyLoading

            return (
              <button
                key={card.format}
                type="button"
                role="listitem"
                disabled={isDisabled}
                onClick={card.onClick}
                aria-label={card.title}
                aria-busy={isLoading}
                className={[
                  // Base layout
                  'flex items-center gap-4 w-full text-left rounded-lg border p-4 transition-all duration-150',
                  // Default border + bg
                  'border-border bg-background',
                  // Hover — only when not disabled
                  !isDisabled
                    ? 'hover:border-amber-300 hover:bg-amber-50 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed',
                  // Active states
                  isLoading && 'border-amber-300 bg-amber-50',
                  isSuccess && 'border-green-400 bg-green-50',
                  isError && 'border-red-400 bg-red-50',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* Icon column */}
                <div className="shrink-0">{card.icon}</div>

                {/* Text column */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {card.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {card.description}
                  </p>
                </div>

                {/* Status indicator */}
                <div className="shrink-0 flex items-center justify-center w-6">
                  {isLoading && <SpinnerIcon />}
                  {isSuccess && (
                    <span className="flex flex-col items-center gap-0.5">
                      <CheckIcon />
                      <span className="text-[10px] font-medium text-green-700 leading-none">
                        {card.successLabel}
                      </span>
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div
            role="alert"
            className="mx-6 mb-2 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 leading-snug"
          >
            {errorMessage}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <p className="text-[11px] text-muted-foreground text-center">
            Exported from{' '}
            <span className="font-semibold text-amber-700">Scriptloom</span>
            {' '}&mdash; {projectTitle}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
