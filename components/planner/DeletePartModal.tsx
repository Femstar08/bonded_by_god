'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Types ─────────────────────────────────────────────────
type DeleteMode = 'merge_previous' | 'ungrouped' | 'delete_all'

interface DeletePartModalProps {
  isOpen: boolean
  partTitle: string
  childCount: number
  hasPreviousPart: boolean
  partLabel: string
  chapterLabel: string
  onConfirm: (mode: DeleteMode) => void
  onCancel: () => void
}

// ─── Component ─────────────────────────────────────────────
export function DeletePartModal({
  isOpen,
  partTitle,
  childCount,
  hasPreviousPart,
  partLabel,
  chapterLabel,
  onConfirm,
  onCancel,
}: DeletePartModalProps) {
  const [selectedMode, setSelectedMode] = useState<DeleteMode | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Reset state when the modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMode(null)
      setDeleteConfirmText('')
    }
  }, [isOpen])

  const isConfirmEnabled =
    selectedMode !== null &&
    (selectedMode !== 'delete_all' || deleteConfirmText === 'DELETE')

  const isDeleteAllMode = selectedMode === 'delete_all'

  const handleConfirm = () => {
    if (!selectedMode || !isConfirmEnabled) return
    onConfirm(selectedMode)
  }

  // ── Option card base classes ──
  const cardBase =
    'w-full text-left rounded-lg border px-4 py-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'

  const cardSelected = 'border-amber-400 bg-amber-50 shadow-sm'
  const cardDefault = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
  const cardDisabled = 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
  const cardDeleteSelected = 'border-red-300 bg-red-50 shadow-sm'
  const cardDeleteDefault = 'border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/50'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header — dark navy matching the app's modal pattern */}
        <DialogHeader className="px-5 py-4 bg-[#0f1a2e] rounded-t-lg">
          <DialogTitle className="font-serif text-base font-semibold text-amber-100">
            Delete {partLabel}
          </DialogTitle>
          <p className="text-[11px] text-white/50 mt-0.5 truncate" title={partTitle}>
            {partTitle}
          </p>
        </DialogHeader>

        {/* Body */}
        <div className="px-5 py-5 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            This {partLabel.toLowerCase()} contains{' '}
            <span className="font-semibold text-slate-800">{childCount}</span>{' '}
            {childCount === 1
              ? chapterLabel.toLowerCase()
              : `${chapterLabel.toLowerCase()}s`}
            . Choose what to do with{' '}
            {childCount === 1 ? 'it' : 'them'} before deleting:
          </p>

          {/* ── Option 1: Merge into previous part ── */}
          <div className="relative">
            <button
              type="button"
              disabled={!hasPreviousPart}
              onClick={() => hasPreviousPart && setSelectedMode('merge_previous')}
              className={`${cardBase} ${
                !hasPreviousPart
                  ? cardDisabled
                  : selectedMode === 'merge_previous'
                  ? cardSelected
                  : cardDefault
              }`}
              aria-pressed={selectedMode === 'merge_previous'}
            >
              <div className="flex items-start gap-3">
                {/* Radio indicator */}
                <span
                  className={`mt-0.5 shrink-0 size-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedMode === 'merge_previous'
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-slate-300'
                  }`}
                  aria-hidden="true"
                >
                  {selectedMode === 'merge_previous' && (
                    <span className="size-1.5 rounded-full bg-white" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700">
                    Merge into previous {partLabel}
                  </p>
                  {!hasPreviousPart && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      No previous {partLabel.toLowerCase()} exists
                    </p>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* ── Option 2: Leave chapters ungrouped ── */}
          <button
            type="button"
            onClick={() => setSelectedMode('ungrouped')}
            className={`${cardBase} ${
              selectedMode === 'ungrouped' ? cardSelected : cardDefault
            }`}
            aria-pressed={selectedMode === 'ungrouped'}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 shrink-0 size-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedMode === 'ungrouped'
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-slate-300'
                }`}
                aria-hidden="true"
              >
                {selectedMode === 'ungrouped' && (
                  <span className="size-1.5 rounded-full bg-white" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">
                  Leave {chapterLabel}s ungrouped
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  You can manually move them to another {partLabel.toLowerCase()} later
                </p>
              </div>
            </div>
          </button>

          {/* ── Option 3: Delete part and all chapters ── */}
          <button
            type="button"
            onClick={() => setSelectedMode('delete_all')}
            className={`${cardBase} ${
              selectedMode === 'delete_all' ? cardDeleteSelected : cardDeleteDefault
            }`}
            aria-pressed={selectedMode === 'delete_all'}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 shrink-0 size-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedMode === 'delete_all'
                    ? 'border-red-500 bg-red-500'
                    : 'border-slate-300'
                }`}
                aria-hidden="true"
              >
                {selectedMode === 'delete_all' && (
                  <span className="size-1.5 rounded-full bg-white" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-700">
                  Delete {partLabel} and all {childCount} linked{' '}
                  {childCount === 1 ? chapterLabel.toLowerCase() : `${chapterLabel.toLowerCase()}s`}
                </p>
              </div>
            </div>
          </button>

          {/* ── Destructive warning + confirmation input ── */}
          {isDeleteAllMode && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-3">
              <p className="text-[11px] text-red-700 leading-relaxed">
                <span className="font-semibold">This action cannot be undone.</span> All content
                in the linked {chapterLabel.toLowerCase()}s will be permanently deleted.
              </p>
              <div className="space-y-1.5">
                <label
                  htmlFor="delete-confirm-input"
                  className="text-[10px] font-medium text-red-600 uppercase tracking-wider"
                >
                  Type DELETE to confirm
                </label>
                <Input
                  id="delete-confirm-input"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="h-8 text-xs border-red-300 focus:border-red-400 focus:ring-red-300 bg-white placeholder:text-red-200"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 rounded-b-lg">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!isConfirmEnabled}
            onClick={handleConfirm}
            className={
              isDeleteAllMode
                ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-40'
                : 'bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40'
            }
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
