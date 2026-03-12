'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectCard } from './ProjectCard'
import { deleteProject, updateProject } from '@/lib/actions/projects-manage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Project } from '@/types/database'

type ProjectCardData = Pick<Project, 'id' | 'title' | 'type' | 'role' | 'updated_at'>

interface ProjectGridProps {
  initialProjects: ProjectCardData[]
}

export function ProjectGrid({ initialProjects }: ProjectGridProps) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [editingProject, setEditingProject] = useState<ProjectCardData | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return
    const result = await deleteProject(projectId)
    if (result.success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
    }
  }

  const handleEdit = (project: ProjectCardData) => {
    setEditingProject(project)
    setEditTitle(project.title)
  }

  const handleEditSave = async () => {
    if (!editingProject || !editTitle.trim()) return
    setSaving(true)
    const result = await updateProject(editingProject.id, { title: editTitle.trim() })
    if (result.success) {
      setProjects((prev) =>
        prev.map((p) => p.id === editingProject.id ? { ...p, title: editTitle.trim() } : p)
      )
      setEditingProject(null)
    }
    setSaving(false)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="rounded-2xl border border-border/50 shadow-xl shadow-black/[0.06] p-0 overflow-hidden max-w-md">
          <DialogHeader className="px-7 pt-7 pb-0">
            <DialogTitle className="font-serif text-xl font-normal text-foreground">
              Rename Project
            </DialogTitle>
            <p className="text-[13px] text-muted-foreground/60 mt-1">
              Update the title for this project.
            </p>
          </DialogHeader>

          <div className="px-7 pt-5 pb-2">
            <div className="space-y-2">
              <Label
                htmlFor="edit-title"
                className="text-[11px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/50"
              >
                Project Title
              </Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                className="rounded-xl border-border/50 py-3 px-4 text-[15px] focus-visible:ring-2 focus-visible:ring-amber-400/30 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <DialogFooter className="px-7 py-5 border-t border-border/30 flex flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingProject(null)}
              className="rounded-xl border-border/50 text-[13px] font-medium flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={saving || !editTitle.trim()}
              className="rounded-xl bg-[#0f1a2e] hover:bg-[#1a2d4d] text-white text-[13px] font-semibold flex-1"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
