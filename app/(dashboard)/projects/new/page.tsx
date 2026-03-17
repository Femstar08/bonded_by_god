'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StructureBuilder } from '@/components/projects/StructureBuilder'
import type { StructureItem } from '@/components/projects/StructureBuilder'
import { createProject } from '@/lib/actions/projects'
import type { ProjectType } from '@/types/database'

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_TYPES: {
  value: ProjectType
  label: string
  template: StructureItem[]
}[] = [
  {
    value: 'book',
    label: 'Book',
    template: (() => {
      const p1 = crypto.randomUUID()
      const p2 = crypto.randomUUID()
      return [
        { id: p1, type: 'part', title: 'Part I', parentId: null },
        { id: crypto.randomUUID(), type: 'chapter', title: 'Chapter 1', parentId: p1 },
        { id: crypto.randomUUID(), type: 'chapter', title: 'Chapter 2', parentId: p1 },
        { id: crypto.randomUUID(), type: 'chapter', title: 'Chapter 3', parentId: p1 },
        { id: p2, type: 'part', title: 'Part II', parentId: null },
        { id: crypto.randomUUID(), type: 'chapter', title: 'Chapter 4', parentId: p2 },
        { id: crypto.randomUUID(), type: 'chapter', title: 'Chapter 5', parentId: p2 },
        { id: crypto.randomUUID(), type: 'chapter', title: 'Chapter 6', parentId: p2 },
      ] as StructureItem[]
    })(),
  },
  {
    value: 'sermon',
    label: 'Sermon',
    template: [
      { id: crypto.randomUUID(), type: 'chapter', title: 'Sermon 1', parentId: null },
      { id: crypto.randomUUID(), type: 'chapter', title: 'Sermon 2', parentId: null },
      { id: crypto.randomUUID(), type: 'chapter', title: 'Sermon 3', parentId: null },
    ] as StructureItem[],
  },
  {
    value: 'devotional',
    label: 'Devotional',
    template: Array.from({ length: 7 }, (_, i) => ({
      id: crypto.randomUUID(),
      type: 'chapter' as const,
      title: `Day ${i + 1}`,
      parentId: null,
    })),
  },
  {
    value: 'notes',
    label: 'Notes',
    template: [],
  },
  {
    value: 'bible_study',
    label: 'Bible Study',
    template: [
      { id: crypto.randomUUID(), type: 'chapter', title: 'Session 1', parentId: null },
      { id: crypto.randomUUID(), type: 'chapter', title: 'Session 2', parentId: null },
      { id: crypto.randomUUID(), type: 'chapter', title: 'Session 3', parentId: null },
      { id: crypto.randomUUID(), type: 'chapter', title: 'Session 4', parentId: null },
    ] as StructureItem[],
  },
  {
    value: 'article',
    label: 'Article',
    template: [
      { id: crypto.randomUUID(), type: 'chapter', title: 'Article', parentId: null },
    ] as StructureItem[],
  },
  {
    value: 'other',
    label: 'Other',
    template: [
      { id: crypto.randomUUID(), type: 'chapter', title: 'Chapter 1', parentId: null },
      { id: crypto.randomUUID(), type: 'chapter', title: 'Chapter 2', parentId: null },
      { id: crypto.randomUUID(), type: 'chapter', title: 'Chapter 3', parentId: null },
    ] as StructureItem[],
  },
]

const ROLES = [
  { value: 'author', label: 'Author / Christian Writer' },
  { value: 'preacher', label: 'Preacher / Pastor / Speaker' },
  { value: 'bible_study_leader', label: 'Bible Study Leader / Teacher' },
  { value: 'devotionalist', label: 'Devotionalist / Journal Creator' },
  { value: 'evangelist', label: 'Evangelist / Outreach Leader' },
  { value: 'content_creator', label: 'Content Creator' },
]

const TONE_OPTIONS = [
  { value: 'mentor', label: 'Mentor' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'preacher', label: 'Preacher' },
  { value: 'writer', label: 'Writer' },
]

// ─── Default hierarchy labels per project type ─────────────────────────────
const DEFAULT_LABELS: Record<
  ProjectType,
  { part: string; chapter: string; section: string }
> = {
  book: { part: 'Part', chapter: 'Chapter', section: 'Section' },
  sermon: { part: 'Series', chapter: 'Sermon', section: 'Point' },
  devotional: { part: 'Week', chapter: 'Day', section: 'Section' },
  notes: { part: 'Part', chapter: 'Chapter', section: 'Section' },
  bible_study: { part: 'Unit', chapter: 'Session', section: 'Section' },
  article: { part: 'Part', chapter: 'Article', section: 'Section' },
  other: { part: 'Part', chapter: 'Chapter', section: 'Section' },
}

const FALLBACK_LABELS = { part: 'Part', chapter: 'Chapter', section: 'Section' }

// ─── Shared style helpers ──────────────────────────────────────────────────
const inputClass =
  'w-full rounded-xl border border-border/50 bg-white py-3 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-border/80 transition-all duration-150'

const labelClass =
  'block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2'

// ─── Page component ────────────────────────────────────────────────────────
export default function NewProjectPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  // Controlled form state
  const [projectType, setProjectType] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [tone, setTone] = useState<string>('')

  // Structure builder state
  const [structureItems, setStructureItems] = useState<StructureItem[]>([])
  const [templateAppliedFor, setTemplateAppliedFor] = useState<string | null>(null)

  // Hierarchy labels
  const [hierarchyLabels, setHierarchyLabels] = useState(FALLBACK_LABELS)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // AI outline
  const [generatingOutline, setGeneratingOutline] = useState(false)

  // Validation errors
  const [titleError, setTitleError] = useState<string | null>(null)
  const [typeError, setTypeError] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleTypeChange(value: string) {
    setProjectType(value)
    if (typeError) setTypeError(null)

    // Apply type-specific hierarchy labels
    const labels = DEFAULT_LABELS[value as ProjectType] ?? FALLBACK_LABELS
    setHierarchyLabels(labels)

    // Apply template only if the user hasn't already customised the structure
    if (templateAppliedFor !== value) {
      const selected = PROJECT_TYPES.find((t) => t.value === value)
      if (selected && selected.template.length > 0) {
        // Re-generate fresh UUIDs so IDs are unique each time the type changes
        const fresh = freshTemplate(selected.template)
        setStructureItems(fresh)
        setTemplateAppliedFor(value)
      }
    }
  }

  /** Deep-clone a template with fresh UUIDs while preserving part-chapter links. */
  function freshTemplate(template: StructureItem[]): StructureItem[] {
    const idMap = new Map<string, string>()
    template.forEach((it) => idMap.set(it.id, crypto.randomUUID()))
    return template.map((it) => ({
      ...it,
      id: idMap.get(it.id)!,
      parentId: it.parentId ? (idMap.get(it.parentId) ?? null) : null,
    }))
  }

  async function handleGenerateOutline() {
    const titleInput = document.getElementById('title') as HTMLInputElement | null
    const titleValue = titleInput?.value?.trim() ?? ''
    if (!titleValue || !projectType) return

    setGeneratingOutline(true)
    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guide',
          text: `Project title: "${titleValue}"\nProject type: ${projectType}\nRole: ${role || 'author'}\n\nSuggest a chapter/section outline. Return ONLY a JSON array of objects like:\n[{"type":"part","title":"Part I"},{"type":"chapter","title":"Chapter 1"}]\nFor chapters under a part, include the part title in a "partTitle" field so I can link them. No markdown, no explanation — just the JSON array.`,
          context: { projectTitle: titleValue, projectType, role: role || 'author' },
        }),
      })

      if (res.ok) {
        const responseData = await res.json()
        const content: string = responseData.content || responseData.result || ''
        if (content) {
          const items = parseAiOutline(content, hierarchyLabels)
          if (items.length > 0) {
            setStructureItems(items)
            setTemplateAppliedFor(projectType)
          }
        }
      }
    } catch {
      // Silently fail — user can continue building manually
    } finally {
      setGeneratingOutline(false)
    }
  }

  /**
   * Attempt to parse an AI-generated outline string into StructureItems.
   * Handles both the structured JSON array format and plain-text line lists.
   */
  function parseAiOutline(
    content: string,
    labels: { part: string; chapter: string; section: string }
  ): StructureItem[] {
    // Try JSON parse first
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const raw = JSON.parse(jsonMatch[0]) as Array<{
          type?: string
          title?: string
          partTitle?: string
        }>

        const items: StructureItem[] = []
        const partTitleToId = new Map<string, string>()

        raw.forEach((entry) => {
          const id = crypto.randomUUID()
          if (entry.type === 'part' && entry.title) {
            items.push({ id, type: 'part', title: entry.title, parentId: null })
            partTitleToId.set(entry.title, id)
          } else if (entry.title) {
            const parentId = entry.partTitle
              ? (partTitleToId.get(entry.partTitle) ?? null)
              : null
            items.push({ id, type: 'chapter', title: entry.title, parentId })
          }
        })

        if (items.length > 0) return items
      }
    } catch {
      // Fall through to plain-text parsing
    }

    // Plain-text fallback: one item per non-empty line
    const lines = content
      .split('\n')
      .map((l) => l.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)

    return lines.map((title) => ({
      id: crypto.randomUUID(),
      type: 'chapter' as const,
      title,
      parentId: null,
    }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Inject controlled select values (not captured by native FormData)
    formData.set('type', projectType)
    formData.set('role', role)
    formData.set('tone', tone)

    // Inject structure and hierarchy labels as JSON
    formData.set('structure', JSON.stringify(structureItems))
    formData.set('hierarchy_labels', JSON.stringify(hierarchyLabels))

    // Client-side validation
    const title = (formData.get('title') as string).trim()
    let hasError = false

    if (!title) {
      setTitleError('Project title is required.')
      hasError = true
    } else {
      setTitleError(null)
    }

    if (!projectType) {
      setTypeError('Please select a project type.')
      hasError = true
    } else {
      setTypeError(null)
    }

    if (!role) {
      setRoleError('Please select a role.')
      hasError = true
    } else {
      setRoleError(null)
    }

    if (hasError) return

    startTransition(async () => {
      const result = await createProject(formData)
      if (result.success) {
        router.push(`/editor/${result.id}`)
      } else {
        setServerError(result.error)
      }
    })
  }

  const selectedType = PROJECT_TYPES.find((t) => t.value === projectType)
  const effectiveLabels = hierarchyLabels

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-10 py-12">

      {/* Page header */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50 mb-3">
          Scriptloom
        </p>
        <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground">
          New Project
        </h1>
        <p className="text-muted-foreground/60 text-[15px] mt-3">
          Set up your writing project. Choose a type to get a suggested structure, or build your own.
        </p>
      </div>

      {/* Form card */}
      <div className="max-w-2xl rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} noValidate>

          {/* Error banner */}
          {serverError && (
            <div className="px-8 pt-6">
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600">
                {serverError}
              </div>
            </div>
          )}

          {/* ── Section: Basics ──────────────────────────────────────────── */}
          <div className="px-8 pt-8 pb-6 space-y-6">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50">
              Basics
            </p>

            {/* Title */}
            <div>
              <label htmlFor="title" className={labelClass}>
                Project Title <span className="text-red-500 normal-case">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Walking in Grace, Sunday Sermon Series"
                className={`${inputClass} ${titleError ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                onChange={() => titleError && setTitleError(null)}
              />
              {titleError && (
                <p className="mt-1.5 text-[12px] text-red-500">{titleError}</p>
              )}
            </div>

            {/* Project Type */}
            <div>
              <Label htmlFor="type-trigger" className={labelClass}>
                Project Type <span className="text-red-500 normal-case">*</span>
              </Label>
              <Select value={projectType} onValueChange={handleTypeChange}>
                <SelectTrigger
                  id="type-trigger"
                  className={`w-full rounded-xl border border-border/50 bg-white py-3 px-4 text-[15px] focus:ring-2 focus:ring-amber-400/30 focus:ring-offset-0 h-auto ${typeError ? 'border-red-400' : ''}`}
                >
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/50">
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-[14px]">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {typeError && (
                <p className="mt-1.5 text-[12px] text-red-500">{typeError}</p>
              )}
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* ── Section: Role & Tone ─────────────────────────────────────── */}
          <div className="px-8 pt-6 pb-6 space-y-6">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50">
              Role & Tone
            </p>

            {/* Your Role */}
            <div>
              <Label htmlFor="role-trigger" className={labelClass}>
                Your Role <span className="text-red-500 normal-case">*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(v) => { setRole(v); if (roleError) setRoleError(null) }}
              >
                <SelectTrigger
                  id="role-trigger"
                  className={`w-full rounded-xl border border-border/50 bg-white py-3 px-4 text-[15px] focus:ring-2 focus:ring-amber-400/30 focus:ring-offset-0 h-auto ${roleError ? 'border-red-400' : ''}`}
                >
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/50">
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-[14px]">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roleError && (
                <p className="mt-1.5 text-[12px] text-red-500">{roleError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Audience */}
              <div>
                <label htmlFor="audience" className={labelClass}>
                  Audience{' '}
                  <span className="font-normal text-foreground/40 normal-case text-[12px]">(optional)</span>
                </label>
                <input
                  id="audience"
                  name="audience"
                  type="text"
                  placeholder="e.g. Young adults, My congregation"
                  className={inputClass}
                />
              </div>

              {/* Tone */}
              <div>
                <Label htmlFor="tone-trigger" className={labelClass}>
                  Tone{' '}
                  <span className="font-normal text-foreground/40 normal-case text-[12px]">(optional)</span>
                </Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger
                    id="tone-trigger"
                    className="w-full rounded-xl border border-border/50 bg-white py-3 px-4 text-[15px] focus:ring-2 focus:ring-amber-400/30 focus:ring-offset-0 h-auto"
                  >
                    <SelectValue placeholder="Select a tone" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/50">
                    {TONE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-[14px]">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scripture Focus */}
            <div>
              <label htmlFor="scripture_focus" className={labelClass}>
                Scripture Focus{' '}
                <span className="font-normal text-foreground/40 normal-case text-[12px]">(optional)</span>
              </label>
              <input
                id="scripture_focus"
                name="scripture_focus"
                type="text"
                placeholder="e.g. John 15, Love and covenant, Romans 8:28"
                className={inputClass}
              />
            </div>
          </div>

          <div className="border-t border-border/30" />

          {/* ── Section: Structure ───────────────────────────────────────── */}
          <div className="px-8 pt-6 pb-6 space-y-4">

            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50 mb-1">
                  Structure
                </p>
                <p className="text-[12px] text-muted-foreground/50">
                  Build the outline for your project. Drag items to reorder. Click a title to edit it.
                </p>
              </div>

              {/* AI suggest button */}
              <button
                type="button"
                disabled={generatingOutline || !projectType}
                onClick={handleGenerateOutline}
                className="shrink-0 flex items-center gap-1.5 text-[12px] font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {generatingOutline ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v18" /><path d="m5 12 7-7 7 7" />
                    </svg>
                    AI Suggest Outline
                  </>
                )}
              </button>
            </div>

            {/* Template notice */}
            {selectedType && templateAppliedFor === projectType && structureItems.length > 0 && (
              <p className="text-[12px] text-amber-600/70">
                Suggested structure for {selectedType.label}. Edit as needed.
              </p>
            )}

            {/* Visual structure builder */}
            <StructureBuilder
              items={structureItems}
              onChange={setStructureItems}
              hierarchyLabels={effectiveLabels}
            />
          </div>

          <div className="border-t border-border/30" />

          {/* ── Section: Advanced Structure (collapsible) ─────────────────── */}
          <div className="px-8 pt-4 pb-6">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground/50 hover:text-foreground/70 transition-colors"
              aria-expanded={showAdvanced}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Advanced Structure Labels
            </button>

            {showAdvanced && (
              <div className="mt-4 rounded-xl border border-border/40 bg-slate-50/60 p-4 space-y-4">
                <p className="text-[12px] text-muted-foreground/60 leading-relaxed">
                  Customise the names used for each level of your project hierarchy.
                  These labels appear throughout the editor.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {/* Top level / Part */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/50 mb-1.5">
                      Top Level
                    </label>
                    <Input
                      value={hierarchyLabels.part}
                      onChange={(e) =>
                        setHierarchyLabels((prev) => ({ ...prev, part: e.target.value }))
                      }
                      placeholder="Part"
                      className="h-9 rounded-lg text-[13px] border-border/50 focus-visible:ring-amber-400/30"
                    />
                  </div>

                  {/* Middle level / Chapter */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/50 mb-1.5">
                      Middle Level
                    </label>
                    <Input
                      value={hierarchyLabels.chapter}
                      onChange={(e) =>
                        setHierarchyLabels((prev) => ({ ...prev, chapter: e.target.value }))
                      }
                      placeholder="Chapter"
                      className="h-9 rounded-lg text-[13px] border-border/50 focus-visible:ring-amber-400/30"
                    />
                  </div>

                  {/* Bottom level / Section */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/50 mb-1.5">
                      Bottom Level
                    </label>
                    <Input
                      value={hierarchyLabels.section}
                      onChange={(e) =>
                        setHierarchyLabels((prev) => ({ ...prev, section: e.target.value }))
                      }
                      placeholder="Section"
                      className="h-9 rounded-lg text-[13px] border-border/50 focus-visible:ring-amber-400/30"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground/40">
                  Example: a sermon series might use Series / Sermon / Point
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border/30" />

          {/* ── Footer actions ───────────────────────────────────────────── */}
          <div className="px-8 py-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isPending}
              className="flex-1 rounded-xl border border-border/50 bg-white py-3 text-[15px] font-medium text-foreground/70 hover:bg-slate-50 transition-colors duration-150 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-[2] bg-[#0f1a2e] hover:bg-[#1a2d4d] disabled:opacity-50 text-white rounded-xl py-3 text-[15px] font-semibold transition-colors duration-150 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
