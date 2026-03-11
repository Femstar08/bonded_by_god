'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface RoleCardProps {
  icon: React.ReactNode
  title: string
  description: string
  selected: boolean
  onSelect: () => void
}

export function RoleCard({ icon, title, description, selected, onSelect }: RoleCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Select ${title} role`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={[
        'group relative flex flex-col items-center gap-3 rounded-xl p-5 cursor-pointer transition-all duration-200 outline-none',
        'bg-white/90 backdrop-blur-sm shadow-md',
        'hover:shadow-lg hover:-translate-y-0.5',
        'focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
        selected
          ? 'border-2 border-amber-500 shadow-amber-200 shadow-lg -translate-y-0.5'
          : 'border border-white/60',
      ].join(' ')}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}

      {/* Icon */}
      <div
        className={[
          'flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200',
          selected
            ? 'bg-amber-100 text-amber-600'
            : 'bg-slate-100 text-slate-600 group-hover:bg-amber-50 group-hover:text-amber-600',
        ].join(' ')}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Text content */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h3
          className={[
            'text-sm font-bold leading-tight transition-colors duration-200',
            selected ? 'text-slate-900' : 'text-slate-800',
          ].join(' ')}
        >
          {title}
        </h3>
        <p className="text-xs leading-snug text-slate-500 line-clamp-3">{description}</p>
      </div>

      {/* Select Toolkit button */}
      <Button
        type="button"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        className={[
          'mt-1 w-full text-xs font-semibold transition-all duration-200',
          selected
            ? 'bg-amber-600 text-white hover:bg-amber-700'
            : 'bg-amber-500 text-white hover:bg-amber-600',
        ].join(' ')}
        aria-label={selected ? `${title} selected` : `Select ${title} toolkit`}
      >
        {selected ? 'Toolkit Selected' : 'Select Toolkit'}
      </Button>
    </div>
  )
}
