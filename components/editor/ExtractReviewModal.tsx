'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ProjectBibleCategory, ProjectBibleEntry } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractorCandidate {
  category: ProjectBibleCategory
  title: string
  content: string
  scripture_refs: string[]
}

export interface ExtractReviewModalProps {
  isOpen: boolean
  onClose: () => void
  candidates: ExtractorCandidate[]
  projectId: string
  onEntriesAccepted: (entries: ProjectBibleEntry[]) => void
}

type CandidateStatus = 'pending' | 'accepting' | 'accepted' | 'dismissed'

interface CandidateState {
  candidate: ExtractorCandidate
  status: CandidateStatus
}

// ---------------------------------------------------------------------------
// Category metadata (labels + accent colours)
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<
  ProjectBibleCategory,
  { label: string; color: string; bg: string }
> = {
  theological_positions: {
    label: 'Theological Positions',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
  },
  themes: {
    label: 'Themes',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
  },
  key_figures: {
    label: 'Key Figures',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  core_scriptures: {
    label: 'Core Scripture References',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
  },
  audience_profile: {
    label: 'Audience Profile',
    color: 'text-teal-700',
    bg: 'bg-teal-50 border-teal-200',
  },
  tone_voice_notes: {
    label: 'Tone & Voice Notes',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
  },
  custom_notes: {
    label: 'Custom Notes',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className ?? 'size-4'}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className ?? 'size-4'}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Individual candidate card
// ---------------------------------------------------------------------------

interface CandidateCardProps {
  state: CandidateState
  index: number
  onAccept: (index: number) => void
  onDismiss: (index: number) => void
}

function CandidateCard({ state, index, onAccept, onDismiss }: CandidateCardProps) {
  const { candidate, status } = state
  const meta = CATEGORY_META[candidate.category]
  const isAccepted = status === 'accepted'
  const isDismissed = status === 'dismissed'
  const isAccepting = status === 'accepting'
  const isResolved = isAccepted || isDismissed

  return (
    <div
      className={[
        'rounded-xl border p-3.5 transition-all duration-200',
        isAccepted
          ? 'border-green-300 bg-green-50/60 opacity-70'
          : isDismissed
          ? 'border-border bg-muted/30 opacity-40'
          : 'border-amber-200 bg-background hover:border-amber-300',
      ].join(' ')}
      aria-label={`Candidate: ${candidate.title}`}
    >
      {/* Card header: title + status badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p
          className={[
            'text-sm font-semibold leading-snug',
            isDismissed ? 'line-through text-muted-foreground' : 'text-foreground',
          ].join(' ')}
        >
          {candidate.title}
        </p>

        {/* Resolved status badge */}
        {isAccepted && (
          <span className="flex items-center gap-1 text-xs text-green-700 font-medium shrink-0">
            <CheckCircleIcon className="size-3.5 text-green-600" />
            Accepted
          </span>
        )}
        {isDismissed && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium shrink-0">
            <XCircleIcon className="size-3.5" />
            Dismissed
          </span>
        )}
      </div>

      {/* Content preview */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
        {candidate.content}
      </p>

      {/* Scripture ref pills */}
      {candidate.scripture_refs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {candidate.scripture_refs.map((ref) => (
            <Badge
              key={ref}
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 border-amber-300 text-amber-700 bg-amber-50"
            >
              {ref}
            </Badge>
          ))}
        </div>
      )}

      {/* Action buttons — only shown while pending */}
      {!isResolved && (
        <div className="flex items-center gap-2 pt-0.5">
          <Button
            size="sm"
            onClick={() => onAccept(index)}
            disabled={isAccepting}
            className="h-6 px-3 text-[11px] bg-amber-600 hover:bg-amber-700 text-white"
            aria-label={`Accept: ${candidate.title}`}
          >
            {isAccepting ? (
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Accepting…
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="size-3 text-white" />
                Accept
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss(index)}
            disabled={isAccepting}
            className="h-6 px-3 text-[11px] text-muted-foreground hover:text-foreground"
            aria-label={`Dismiss: ${candidate.title}`}
          >
            <span className="flex items-center gap-1">
              <XCircleIcon className="size-3" />
              Dismiss
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExtractReviewModal
// ---------------------------------------------------------------------------

export function ExtractReviewModal({
  isOpen,
  onClose,
  candidates,
  projectId,
  onEntriesAccepted,
}: ExtractReviewModalProps) {
  // Initialise state from candidates on open — reset when modal reopens
  const [states, setStates] = useState<CandidateState[]>(() =>
    candidates.map((c) => ({ candidate: c, status: 'pending' }))
  )
  const [acceptAllLoading, setAcceptAllLoading] = useState(false)

  // Re-sync states if candidates change (e.g. modal is reused)
  // We use a key derived from candidate count to reset when modal reopens
  const acceptedEntries = states
    .filter((s) => s.status === 'accepted')
    .map((s) => s.candidate)

  const pendingCount = states.filter((s) => s.status === 'pending').length
  const acceptedCount = states.filter((s) => s.status === 'accepted').length
  const allReviewed = pendingCount === 0

  // Group pending + accepted by category (dismissed are shown inline but subdued)
  const categoriesInOrder: ProjectBibleCategory[] = [
    'theological_positions',
    'themes',
    'key_figures',
    'core_scriptures',
    'audience_profile',
    'tone_voice_notes',
    'custom_notes',
  ]

  const groupedByCategory = categoriesInOrder.reduce<
    Record<ProjectBibleCategory, { index: number; state: CandidateState }[]>
  >(
    (acc, cat) => {
      acc[cat] = states
        .map((s, i) => ({ index: i, state: s }))
        .filter(({ state }) => state.candidate.category === cat)
      return acc
    },
    {} as Record<ProjectBibleCategory, { index: number; state: CandidateState }[]>
  )

  // -------------------------------------------------------------------------
  // Accept single candidate
  // -------------------------------------------------------------------------

  const acceptCandidate = useCallback(
    async (index: number) => {
      const cand = states[index]?.candidate
      if (!cand) return

      // Mark as accepting
      setStates((prev) =>
        prev.map((s, i) => (i === index ? { ...s, status: 'accepting' } : s))
      )

      try {
        const res = await fetch('/api/project-bible', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            category: cand.category,
            title: cand.title,
            content: cand.content,
            scripture_refs: cand.scripture_refs,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to create entry')

        // Mark as accepted and notify parent
        setStates((prev) =>
          prev.map((s, i) => (i === index ? { ...s, status: 'accepted' } : s))
        )
        onEntriesAccepted([(data as { entry: ProjectBibleEntry }).entry])
      } catch {
        // Revert to pending on error so user can retry
        setStates((prev) =>
          prev.map((s, i) => (i === index ? { ...s, status: 'pending' } : s))
        )
      }
    },
    [states, projectId, onEntriesAccepted]
  )

  // -------------------------------------------------------------------------
  // Dismiss single candidate
  // -------------------------------------------------------------------------

  const dismissCandidate = useCallback((index: number) => {
    setStates((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status: 'dismissed' } : s))
    )
  }, [])

  // -------------------------------------------------------------------------
  // Accept all pending candidates sequentially
  // -------------------------------------------------------------------------

  const handleAcceptAll = async () => {
    setAcceptAllLoading(true)

    const pendingIndices = states
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.status === 'pending')
      .map(({ i }) => i)

    // Run sequentially to avoid rate-limit bursts
    for (const idx of pendingIndices) {
      await acceptCandidate(idx)
    }

    setAcceptAllLoading(false)
  }

  // -------------------------------------------------------------------------
  // Handle modal close — notify parent of all accepted so far
  // -------------------------------------------------------------------------

  const handleClose = () => {
    onClose()
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const hasAnyCandidates = candidates.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-xl p-0 overflow-hidden border-border shadow-2xl"
        aria-describedby="extract-modal-description"
      >
        {/* ------------------------------------------------------------------ */}
        {/* Header                                                              */}
        {/* ------------------------------------------------------------------ */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-serif text-xl font-semibold text-foreground">
            Review Extracted Entries
          </DialogTitle>
          <DialogDescription
            id="extract-modal-description"
            className="text-sm text-muted-foreground"
          >
            {hasAnyCandidates ? (
              <>
                The AI found{' '}
                <span className="font-semibold text-foreground/80">
                  {candidates.length} potential{' '}
                  {candidates.length === 1 ? 'entry' : 'entries'}
                </span>{' '}
                from your chapters. Accept those you want to keep.
              </>
            ) : (
              'No entries were extracted from your chapters.'
            )}
          </DialogDescription>

          {/* Stats bar */}
          {hasAnyCandidates && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
                {pendingCount} pending
              </span>
              <span className="flex items-center gap-1.5 text-xs text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                {acceptedCount} accepted
              </span>

              {/* Accept All button */}
              {pendingCount > 0 && (
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  disabled={acceptAllLoading}
                  className="ml-auto h-7 px-4 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                  aria-label="Accept all remaining candidates"
                >
                  {acceptAllLoading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Accepting…
                    </span>
                  ) : (
                    <>Accept All ({pendingCount})</>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogHeader>

        {/* ------------------------------------------------------------------ */}
        {/* Candidate list — scrollable body                                   */}
        {/* ------------------------------------------------------------------ */}
        <div
          className={[
            'px-6 py-4 space-y-5 overflow-y-auto',
            'max-h-[60vh]',
            // Thin styled scrollbar
            '[&::-webkit-scrollbar]:w-1.5',
            '[&::-webkit-scrollbar-track]:bg-transparent',
            '[&::-webkit-scrollbar-thumb]:rounded-full',
            '[&::-webkit-scrollbar-thumb]:bg-border',
            '[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40',
          ].join(' ')}
          role="list"
          aria-label="Extracted entry candidates"
        >
          {!hasAnyCandidates && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              {/* Empty-state icon */}
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted/40 border border-border">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No candidates were extracted. Try writing more content first.
              </p>
            </div>
          )}

          {categoriesInOrder.map((cat) => {
            const group = groupedByCategory[cat]
            if (!group || group.length === 0) return null

            const meta = CATEGORY_META[cat]

            return (
              <section key={cat} role="group" aria-labelledby={`cat-heading-${cat}`}>
                {/* Category heading */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span
                    id={`cat-heading-${cat}`}
                    className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                      meta.bg,
                      meta.color,
                    ].join(' ')}
                  >
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {group.length} {group.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2" role="list" aria-label={meta.label}>
                  {group.map(({ index, state }) => (
                    <div key={index} role="listitem">
                      <CandidateCard
                        state={state}
                        index={index}
                        onAccept={acceptCandidate}
                        onDismiss={dismissCandidate}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )
          })}

          {/* All reviewed state */}
          {allReviewed && hasAnyCandidates && (
            <div className="flex flex-col items-center gap-2 py-4 text-center border-t border-border">
              <CheckCircleIcon className="size-6 text-green-500" />
              <p className="text-sm font-medium text-foreground">All entries reviewed</p>
              <p className="text-xs text-muted-foreground">
                {acceptedCount > 0
                  ? `${acceptedCount} ${acceptedCount === 1 ? 'entry has' : 'entries have'} been added to your Project Bible.`
                  : 'No entries were accepted.'}
              </p>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Footer                                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <p className="text-[11px] text-muted-foreground">
            {acceptedCount > 0 && (
              <>
                <span className="font-semibold text-amber-700">{acceptedCount}</span>{' '}
                {acceptedCount === 1 ? 'entry' : 'entries'} added to Project Bible
              </>
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="h-8 px-4 text-xs border-border hover:bg-muted/50"
          >
            {allReviewed ? 'Done' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
