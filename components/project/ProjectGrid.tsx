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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Project Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving || !editTitle.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
