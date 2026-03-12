'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createProject } from '@/lib/actions/projects'
import type { ProjectType } from '@/types/database'

const PROJECT_TYPES: { value: ProjectType; label: string; template: string[] }[] = [
  {
    value: 'book',
    label: 'Book',
    template: [
      'Introduction',
      'Chapter 1',
      'Chapter 2',
      'Chapter 3',
      'Chapter 4',
      'Chapter 5',
      'Conclusion',
    ],
  },
  {
    value: 'sermon',
    label: 'Sermon',
    template: [
      'Opening / Hook',
      'Scripture Reading',
      'Context & Background',
      'Main Point 1',
      'Main Point 2',
      'Main Point 3',
      'Application',
      'Closing / Call to Action',
    ],
  },
  {
    value: 'devotional',
    label: 'Devotional',
    template: [
      'Day 1 - Opening Reflection',
      'Day 2 - Scripture Focus',
      'Day 3 - Personal Story',
      'Day 4 - Going Deeper',
      'Day 5 - Prayer & Application',
    ],
  },
  { value: 'notes', label: 'Notes', template: [] },
  {
    value: 'bible_study',
    label: 'Bible Study',
    template: [
      'Introduction & Context',
      'Scripture Passage',
      'Observation: What does the text say?',
      'Interpretation: What does it mean?',
      'Application: How does it apply?',
      'Discussion Questions',
      'Closing Prayer Focus',
    ],
  },
  {
    value: 'article',
    label: 'Article',
    template: [
      'Hook / Opening',
      'The Problem',
      'Scripture Foundation',
      'The Solution',
      'Practical Steps',
      'Conclusion',
    ],
  },
  { value: 'other', label: 'Other', template: [] },
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

const inputClass =
  'w-full rounded-xl border border-border/50 bg-white py-3 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-border/80 transition-all duration-150'

const labelClass =
  'block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2'

export default function NewProjectPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  // Controlled values
  const [projectType, setProjectType] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [tone, setTone] = useState<string>('')
  const [structure, setStructure] = useState<string>('')

  // Validation
  const [titleError, setTitleError] = useState<string | null>(null)
  const [typeError, setTypeError] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)

  // AI outline generation
  const [generatingOutline, setGeneratingOutline] = useState(false)

  function handleTypeChange(value: string) {
    setProjectType(value)
    if (typeError) setTypeError(null)

    // Auto-fill template if structure is empty
    const selected = PROJECT_TYPES.find((t) => t.value === value)
    if (selected && selected.template.length > 0 && !structure.trim()) {
      setStructure(selected.template.join('\n'))
    }
  }

  async function handleGenerateOutline(title: string) {
    if (!title.trim() || !projectType) return
    setGeneratingOutline(true)

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guide',
          text: `Project title: "${title.trim()}"\nProject type: ${projectType}\nRole: ${role || 'author'}\n\nPlease suggest a detailed chapter/section outline for this project. Return the outline as a simple numbered list of chapter or section titles, one per line. Do not include JSON formatting.`,
          context: {
            projectTitle: title.trim(),
            projectType,
            role: role || 'author',
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Extract outline from the response
        const content = data.content || data.result || ''
        if (content) {
          // Try to parse JSON if the agent returned JSON
          try {
            const parsed = JSON.parse(content)
            if (parsed.nextSteps) {
              setStructure(parsed.nextSteps.join('\n'))
            } else {
              setStructure(content)
            }
          } catch {
            // Plain text response - use as-is
            setStructure(content)
          }
        }
      }
    } catch {
      // Silently fail - the user can still type manually
    } finally {
      setGeneratingOutline(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Inject controlled select values
    formData.set('type', projectType)
    formData.set('role', role)
    formData.set('tone', tone)

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
          Set up your writing project. Choose a type to get a suggested structure, or create your own.
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

          {/* Section: Basics */}
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
              {selectedType && selectedType.template.length > 0 && (
                <p className="mt-2 text-[12px] text-amber-600/70">
                  A suggested {selectedType.label.toLowerCase()} structure has been added below. Feel free to edit it.
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Section: Role & Tone */}
          <div className="px-8 pt-6 pb-6 space-y-6">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50">
              Role & Tone
            </p>

            {/* Your Role */}
            <div>
              <Label htmlFor="role-trigger" className={labelClass}>
                Your Role <span className="text-red-500 normal-case">*</span>
              </Label>
              <Select value={role} onValueChange={(v) => { setRole(v); if (roleError) setRoleError(null) }}>
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
                  Audience <span className="font-normal text-foreground/40 normal-case text-[12px]">(optional)</span>
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
                  Tone <span className="font-normal text-foreground/40 normal-case text-[12px]">(optional)</span>
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
                Scripture Focus <span className="font-normal text-foreground/40 normal-case text-[12px]">(optional)</span>
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

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Section: Structure */}
          <div className="px-8 pt-6 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50 mb-1">
                  Structure
                </p>
                <p className="text-[12px] text-muted-foreground/50">
                  Outline your chapters or sections. Select a project type above for a suggested template.
                </p>
              </div>
              <button
                type="button"
                disabled={generatingOutline || !projectType}
                onClick={() => {
                  const titleInput = document.getElementById('title') as HTMLInputElement
                  handleGenerateOutline(titleInput?.value || '')
                }}
                className="shrink-0 ml-4 flex items-center gap-1.5 text-[12px] font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="m5 12 7-7 7 7"/></svg>
                    AI Suggest Outline
                  </>
                )}
              </button>
            </div>

            <div>
              <textarea
                id="structure"
                name="structure"
                placeholder="Enter chapter titles one per line, or paste a JSON structure"
                rows={8}
                value={structure}
                onChange={(e) => setStructure(e.target.value)}
                className={`${inputClass} resize-none leading-relaxed font-mono text-[13px]`}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Footer actions */}
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
