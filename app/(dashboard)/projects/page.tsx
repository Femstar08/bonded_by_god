'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ProjectCard } from '@/components/project/ProjectCard'
import { RepurposeModal } from '@/components/editor/RepurposeModal'
import { deleteProject, updateProject } from '@/lib/actions/projects-manage'
import { buildProjectContext } from '@/lib/ai/context'
import { createClient } from '@/lib/supabase/client'
import { Project, Chapter } from '@/types/database'
import type { ProjectContext } from '@/lib/ai/context'

type ProjectCardData = Pick<Project, 'id' | 'title' | 'type' | 'role' | 'updated_at'>

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProject, setEditingProject] = useState<ProjectCardData | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [repurposeOpen, setRepurposeOpen] = useState(false)
  const [repurposeData, setRepurposeData] = useState<{
    content: string
    title: string
    context: ProjectContext
    projectId: string
    projectTitle: string
  } | null>(null)

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

  const handleRepurpose = async (projectId: string) => {
    const supabase = createClient()

    // Fetch full project data
    const { data: project } = await supabase
      .from('ltu_projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (!project) return

    // Fetch all chapters in order
    const { data: chapters } = await supabase
      .from('ltu_chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })

    const allChapters = (chapters as Chapter[]) || []
    const concatenatedContent = allChapters
      .map((ch) => ch.content || '')
      .join('\n\n')

    if (!concatenatedContent.trim()) return

    const ctx = buildProjectContext(project as Project)

    setRepurposeData({
      content: concatenatedContent,
      title: project.title,
      context: ctx,
      projectId: project.id,
      projectTitle: project.title,
    })
    setRepurposeOpen(true)
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
    <div className="max-w-4xl mx-auto px-10 py-12">

      {/* Page header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50 mb-3">
            Scriptloom
          </p>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground">
            My Projects
          </h1>
          <p className="text-muted-foreground/60 text-[15px] mt-3">
            Manage and continue your writing projects.
          </p>
        </div>

        <Link href="/projects/new">
          <button
            type="button"
            className="bg-[#0f1a2e] hover:bg-[#1a2d4d] text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors duration-200 mt-1"
          >
            New Project
          </button>
        </Link>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/40 bg-white p-6 animate-pulse h-44"
            >
              <div className="h-5 w-16 rounded-md bg-slate-100 mb-5" />
              <div className="h-4 w-3/4 rounded bg-slate-100 mb-2" />
              <div className="h-4 w-1/2 rounded bg-slate-100 mb-6" />
              <div className="h-3 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRepurpose={handleRepurpose}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-full max-w-sm border-2 border-dashed border-border/40 rounded-2xl px-10 py-14 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-border/40 flex items-center justify-center mb-1">
              <span className="text-2xl text-muted-foreground/30 leading-none select-none">+</span>
            </div>
            <div>
              <p className="font-serif text-lg font-normal text-foreground mb-1">No projects yet</p>
              <p className="text-[13px] text-muted-foreground/50">
                Create your first project to begin writing.
              </p>
            </div>
            <Link href="/projects/new">
              <button
                type="button"
                className="mt-2 bg-[#0f1a2e] hover:bg-[#1a2d4d] text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors duration-200"
              >
                Create Your First Project
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Edit dialog */}
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
                htmlFor="projects-edit-title"
                className="text-[11px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/50"
              >
                Project Title
              </Label>
              <Input
                id="projects-edit-title"
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

      {/* Repurpose Modal */}
      {repurposeData && (
        <RepurposeModal
          isOpen={repurposeOpen}
          onClose={() => setRepurposeOpen(false)}
          sourceContent={repurposeData.content}
          sourceTitle={repurposeData.title}
          projectContext={repurposeData.context}
          projectId={repurposeData.projectId}
          projectTitle={repurposeData.projectTitle}
        />
      )}
    </div>
  )
}
