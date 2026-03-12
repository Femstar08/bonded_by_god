'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Project } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

type ProjectCardProps = Pick<Project, 'id' | 'title' | 'type' | 'role' | 'updated_at'>

interface ProjectCardComponentProps {
  project: ProjectCardProps
  onEdit?: (project: ProjectCardProps) => void
  onDelete?: (projectId: string) => void
  onRepurpose?: (projectId: string) => void
}

const typeColors: Record<string, string> = {
  book:        'bg-amber-50 text-amber-700',
  sermon:      'bg-blue-50 text-blue-700',
  devotional:  'bg-purple-50 text-purple-700',
  notes:       'bg-slate-50 text-slate-600',
  bible_study: 'bg-emerald-50 text-emerald-700',
  article:     'bg-rose-50 text-rose-700',
  other:       'bg-stone-50 text-stone-600',
}

export function ProjectCard({ project, onEdit, onDelete, onRepurpose }: ProjectCardComponentProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const typeLabels: Record<string, string> = {
    book: 'Book',
    sermon: 'Sermon',
    devotional: 'Devotional',
    notes: 'Notes',
    bible_study: 'Bible Study',
    article: 'Article',
    other: 'Other',
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const hasActions = onEdit || onDelete || onRepurpose
  const badgeColor = typeColors[project.type] ?? typeColors.other

  return (
    <Link href={`/editor/${project.id}`} className="block h-full group">
      <div className="relative h-full rounded-2xl border border-border/50 bg-white p-6 cursor-pointer transition-all duration-250 hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-0.5 hover:border-border/80">

        {/* Top row: badge + menu */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <span
            className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${badgeColor}`}
          >
            {typeLabels[project.type] || project.type}
          </span>

          {hasActions && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                type="button"
                aria-label="Project options"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMenuOpen((prev) => !prev)
                }}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-base leading-none font-bold tracking-widest select-none">
                  &middot;&middot;&middot;
                </span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 z-50 min-w-[130px] rounded-xl border border-border/50 bg-white text-foreground shadow-lg shadow-black/[0.06] py-1.5"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  {onEdit && (
                    <button
                      role="menuitem"
                      type="button"
                      className="w-full text-left px-3.5 py-2 text-[13px] text-foreground/80 hover:bg-slate-50 transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setMenuOpen(false)
                        onEdit(project)
                      }}
                    >
                      Rename
                    </button>
                  )}
                  {onRepurpose && (
                    <button
                      role="menuitem"
                      type="button"
                      className="w-full text-left px-3.5 py-2 text-[13px] text-foreground/80 hover:bg-slate-50 transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setMenuOpen(false)
                        onRepurpose(project.id)
                      }}
                    >
                      Repurpose
                    </button>
                  )}
                  {onDelete && (
                    <button
                      role="menuitem"
                      type="button"
                      className="w-full text-left px-3.5 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setMenuOpen(false)
                        onDelete(project.id)
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-normal text-foreground leading-snug line-clamp-2 mb-2">
          {project.title}
        </h3>

        {/* Role */}
        <p className="text-[13px] text-muted-foreground/60 mb-4">{project.role}</p>

        {/* Timestamp */}
        <p className="text-[11px] text-muted-foreground/50">
          Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
        </p>
      </div>
    </Link>
  )
}
