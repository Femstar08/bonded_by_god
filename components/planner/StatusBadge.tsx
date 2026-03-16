'use client'

import { ChapterStatus, SectionStatus } from '@/types/database'

type AnyStatus = ChapterStatus | SectionStatus

interface StatusBadgeProps {
  status: AnyStatus
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<AnyStatus, { label: string; bg: string; text: string }> = {
  not_started: {
    label: 'Not Started',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
  },
  draft: {
    label: 'Draft',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  revision: {
    label: 'Revision',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
  },
  complete: {
    label: 'Complete',
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  // SectionStatus variants
  empty: {
    label: 'Empty',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
  },
  review: {
    label: 'Review',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[10px] font-medium'
      : 'px-2 py-1 text-xs font-medium'

  return (
    <span
      className={`inline-flex items-center rounded-full ${config.bg} ${config.text} ${sizeClasses} leading-none whitespace-nowrap`}
    >
      {config.label}
    </span>
  )
}
