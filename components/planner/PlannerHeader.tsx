'use client'

import { ChapterStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PlannerChapter {
  id: string
  status: ChapterStatus
  word_count: number
}

interface PlannerHeaderProps {
  projectTitle: string
  viewMode: 'board' | 'corkboard'
  onViewModeChange: (mode: 'board' | 'corkboard') => void
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilters: ChapterStatus[]
  onStatusFiltersChange: (filters: ChapterStatus[]) => void
  chapters: PlannerChapter[]
}

const ALL_STATUSES: ChapterStatus[] = [
  'not_started',
  'in_progress',
  'draft',
  'revision',
  'complete',
]

const STATUS_LABELS: Record<ChapterStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  draft: 'Draft',
  revision: 'Revision',
  complete: 'Complete',
}

// Bar segment colors per status
const STATUS_BAR_COLORS: Record<ChapterStatus, string> = {
  not_started: '#94A3B8',
  in_progress: '#F59E0B',
  draft: '#3B82F6',
  revision: '#A855F7',
  complete: '#22C55E',
}

// Chip active colors for filter buttons
const STATUS_CHIP_ACTIVE: Record<ChapterStatus, string> = {
  not_started: 'bg-slate-200 text-slate-800 border-slate-400',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-400',
  draft: 'bg-blue-100 text-blue-800 border-blue-400',
  revision: 'bg-purple-100 text-purple-800 border-purple-400',
  complete: 'bg-green-100 text-green-800 border-green-400',
}

export function PlannerHeader({
  projectTitle,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  statusFilters,
  onStatusFiltersChange,
  chapters,
}: PlannerHeaderProps) {
  const total = chapters.length

  const statusCounts = ALL_STATUSES.reduce<Record<ChapterStatus, number>>(
    (acc, s) => {
      acc[s] = chapters.filter((c) => c.status === s).length
      return acc
    },
    {
      not_started: 0,
      in_progress: 0,
      draft: 0,
      revision: 0,
      complete: 0,
    }
  )

  const statusWords = ALL_STATUSES.reduce<Record<ChapterStatus, number>>(
    (acc, s) => {
      acc[s] = chapters
        .filter((c) => c.status === s)
        .reduce((sum, c) => sum + (c.word_count ?? 0), 0)
      return acc
    },
    {
      not_started: 0,
      in_progress: 0,
      draft: 0,
      revision: 0,
      complete: 0,
    }
  )

  const toggleFilter = (status: ChapterStatus) => {
    if (statusFilters.includes(status)) {
      onStatusFiltersChange(statusFilters.filter((s) => s !== status))
    } else {
      onStatusFiltersChange([...statusFilters, status])
    }
  }

  const hasFilters = statusFilters.length > 0 || searchQuery.trim().length > 0

  return (
    <div className="bg-[#0f1a2e] text-white px-6 py-4 space-y-4 border-b border-white/10">
      {/* Top row: title + view toggles */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-serif text-xl font-semibold text-amber-100 truncate">
          {projectTitle}
        </h2>

        <div className="flex items-center gap-2">
          {/* View toggle group */}
          <div
            className="flex items-center rounded-lg border border-white/20 overflow-hidden"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('board')}
              aria-pressed={viewMode === 'board'}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-amber-500 text-white'
                  : 'bg-transparent text-white/70 hover:bg-white/10'
              }`}
            >
              {/* Board (kanban columns) icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-3.5"
                aria-hidden="true"
              >
                <path d="M2 4.25A2.25 2.25 0 0 1 4.25 2h2.5A2.25 2.25 0 0 1 9 4.25v11.5A2.25 2.25 0 0 1 6.75 18h-2.5A2.25 2.25 0 0 1 2 15.75V4.25ZM11 4.25A2.25 2.25 0 0 1 13.25 2h2.5A2.25 2.25 0 0 1 18 4.25v4.5A2.25 2.25 0 0 1 15.75 11h-2.5A2.25 2.25 0 0 1 11 8.75v-4.5Z" />
              </svg>
              Board
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('corkboard')}
              aria-pressed={viewMode === 'corkboard'}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'corkboard'
                  ? 'bg-amber-500 text-white'
                  : 'bg-transparent text-white/70 hover:bg-white/10'
              }`}
            >
              {/* Cork board (grid) icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-3.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm6.75-9A2.25 2.25 0 0 0 8.75 4.25v2.5A2.25 2.25 0 0 0 11 9h2.5A2.25 2.25 0 0 0 15.75 6.75v-2.5A2.25 2.25 0 0 0 13.25 2h-2.5Zm0 9A2.25 2.25 0 0 0 8.75 13.25v2.5A2.25 2.25 0 0 0 11 18h2.5a2.25 2.25 0 0 0 2.25-2.25v-2.5A2.25 2.25 0 0 0 13.5 11H11Z"
                  clipRule="evenodd"
                />
              </svg>
              Cork Board
            </button>
          </div>
        </div>
      </div>

      {/* Status filter chips + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-white/50 shrink-0">Filter:</span>

        {ALL_STATUSES.map((status) => {
          const isActive = statusFilters.includes(status)
          const count = statusCounts[status]

          return (
            <button
              key={status}
              type="button"
              onClick={() => toggleFilter(status)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                isActive
                  ? STATUS_CHIP_ACTIVE[status]
                  : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white/80 bg-transparent'
              }`}
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_BAR_COLORS[status] }}
                aria-hidden="true"
              />
              {STATUS_LABELS[status]}
              {count > 0 && (
                <span className="opacity-70">({count})</span>
              )}
            </button>
          )
        })}

        {/* Search */}
        <div className="ml-auto">
          <Input
            type="search"
            placeholder="Search chapters..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-7 w-48 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-amber-400/50"
          />
        </div>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onStatusFiltersChange([])
              onSearchChange('')
            }}
            className="text-xs text-white/50 hover:text-white h-7 px-2"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Progress bar + counts */}
      {total > 0 && (
        <div className="space-y-2">
          {/* Segmented progress bar */}
          <div
            className="flex h-2 w-full rounded-full overflow-hidden"
            role="progressbar"
            aria-label="Chapter progress by status"
          >
            {ALL_STATUSES.map((status) => {
              const count = statusCounts[status]
              if (count === 0) return null
              const pct = (count / total) * 100
              return (
                <div
                  key={status}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: STATUS_BAR_COLORS[status],
                  }}
                  title={`${STATUS_LABELS[status]}: ${count}`}
                />
              )
            })}
          </div>

          {/* Status count pills */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {ALL_STATUSES.map((status) => {
              const count = statusCounts[status]
              if (count === 0) return null
              const words = statusWords[status]

              return (
                <span key={status} className="text-[11px] text-white/60">
                  <span
                    className="font-medium"
                    style={{ color: STATUS_BAR_COLORS[status] }}
                  >
                    {STATUS_LABELS[status]}:
                  </span>{' '}
                  {count} {count === 1 ? 'chapter' : 'chapters'}
                  {words > 0 && (
                    <span className="text-white/40">
                      , {words.toLocaleString()} words
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
