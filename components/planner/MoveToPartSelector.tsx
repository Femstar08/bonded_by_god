'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Constants ─────────────────────────────────────────────
const UNGROUPED_VALUE = '__none__'

// ─── Props ─────────────────────────────────────────────────
interface MoveToPartSelectorProps {
  currentPartId: string | null
  parts: { id: string; title: string }[]
  partLabel: string
  onMove: (partId: string | null) => void
  compact?: boolean
}

// ─── Component ─────────────────────────────────────────────
export function MoveToPartSelector({
  currentPartId,
  parts,
  partLabel,
  onMove,
  compact = false,
}: MoveToPartSelectorProps) {
  const value = currentPartId ?? UNGROUPED_VALUE

  const handleValueChange = (selected: string) => {
    onMove(selected === UNGROUPED_VALUE ? null : selected)
  }

  if (compact) {
    return (
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger
          className="h-6 text-[10px] border-slate-200 bg-white text-slate-600 hover:border-slate-300 focus:ring-amber-400 focus:border-amber-400 px-2 gap-1"
          aria-label={`Move to ${partLabel}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="text-[10px]">
          <SelectItem value={UNGROUPED_VALUE} className="text-[10px] text-slate-500 italic">
            Ungrouped
          </SelectItem>
          {parts.map((part) => (
            <SelectItem key={part.id} value={part.id} className="text-[10px]">
              {part.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger
        className="h-8 text-xs border-slate-200 bg-white text-slate-600 hover:border-slate-300 focus:ring-amber-400 focus:border-amber-400"
        aria-label={`Move to ${partLabel}`}
      >
        <SelectValue placeholder={`Select ${partLabel}…`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNGROUPED_VALUE} className="text-xs text-slate-500 italic">
          Ungrouped
        </SelectItem>
        {parts.map((part) => (
          <SelectItem key={part.id} value={part.id} className="text-xs">
            {part.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
