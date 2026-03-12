'use client'

import React from 'react'

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
        'group relative flex flex-col items-center rounded-2xl border-2 p-6 text-center cursor-pointer transition-all duration-200 outline-none',
        'focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2',
        selected
          ? 'border-amber-400 bg-amber-50/30 shadow-lg shadow-amber-400/10'
          : 'border-border/40 bg-white hover:border-border/80 hover:shadow-lg hover:shadow-black/[0.03]',
      ].join(' ')}
    >
      {/* Selected checkmark badge */}
      {selected && (
        <span
          className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400"
          aria-hidden="true"
        >
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
          'text-3xl mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200',
          selected
            ? 'bg-amber-100 text-amber-600'
            : 'bg-muted/50 text-muted-foreground group-hover:bg-amber-50 group-hover:text-amber-600',
        ].join(' ')}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Text content */}
      <div className="flex flex-col items-center">
        <h3 className="font-serif text-lg font-normal text-foreground leading-tight">
          {title}
        </h3>
        <p className="text-[13px] text-muted-foreground/60 mt-1 leading-snug line-clamp-3">
          {description}
        </p>
      </div>
    </div>
  )
}
