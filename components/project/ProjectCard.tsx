'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Project } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

type ProjectCardProps = Pick<Project, 'id' | 'title' | 'type' | 'role' | 'updated_at'>

interface ProjectCardComponentProps {
  project: ProjectCardProps
  onEdit?: (project: ProjectCardProps) => void
  onDelete?: (projectId: string) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardComponentProps) {
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

  const hasActions = onEdit || onDelete

  return (
    <Link href={`/editor/${project.id}`} className="block h-full">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 flex-1">{project.title}</CardTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant="secondary">{typeLabels[project.type] || project.type}</Badge>
              {hasActions && (
                <div className="relative" ref={menuRef}>
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
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-base leading-none font-bold tracking-widest select-none">
                      &middot;&middot;&middot;
                    </span>
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-md border bg-popover text-popover-foreground shadow-md py-1"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      {onEdit && (
                        <button
                          role="menuitem"
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setMenuOpen(false)
                            onEdit(project)
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          role="menuitem"
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
          </div>
          <CardDescription>{project.role}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
