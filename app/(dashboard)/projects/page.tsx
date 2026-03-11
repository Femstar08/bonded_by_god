'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ProjectCard } from '@/components/project/ProjectCard'
import { deleteProject, updateProject } from '@/lib/actions/projects-manage'
import { createClient } from '@/lib/supabase/client'
import { Project } from '@/types/database'

type ProjectCardData = Pick<Project, 'id' | 'title' | 'type' | 'role' | 'updated_at'>

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProject, setEditingProject] = useState<ProjectCardData | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchProjects() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('ltu_projects')
        .select('id, title, type, role, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
      }

      setProjects((data as ProjectCardData[]) ?? [])
      setLoading(false)
    }

    fetchProjects()
  }, [router])

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">Manage your writing projects</p>
        </div>
        <Link href="/projects/new">
          <Button>Create New Project</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-muted-foreground mb-4">No projects yet</p>
          <Link href="/projects/new">
            <Button>Create Your First Project</Button>
          </Link>
        </div>
      )}

      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projects-edit-title">Project Title</Label>
              <Input
                id="projects-edit-title"
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
    </div>
  )
}
