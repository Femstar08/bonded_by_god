'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createProject } from '@/lib/actions/projects'

interface ProjectFormProps {
  role: string
  onBack: () => void
  onSubmit: (projectId: string) => void
}

const PROJECT_TYPES = [
  { value: 'book', label: 'Book' },
  { value: 'sermon', label: 'Sermon' },
  { value: 'devotional', label: 'Devotional' },
  { value: 'bible_study', label: 'Bible Study' },
  { value: 'article', label: 'Article' },
  { value: 'other', label: 'Other' },
] as const

const TONE_OPTIONS = [
  { value: 'mentor', label: 'Mentor' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'preacher', label: 'Preacher' },
  { value: 'writer', label: 'Writer' },
] as const

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  author: 'Author / Christian Writer',
  preacher: 'Preacher / Pastor / Speaker',
  bible_study_leader: 'Bible Study Leader / Teacher',
  devotionalist: 'Devotionalist / Journal Creator',
  evangelist: 'Evangelist / Outreach Leader',
  content_creator: 'Content Creator',
}

export function ProjectForm({ role, onBack, onSubmit }: ProjectFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  // Controlled select values because ShadCN Select needs explicit state
  const [projectType, setProjectType] = useState<string>('')
  const [tone, setTone] = useState<string>('')

  // Field-level validation errors
  const [titleError, setTitleError] = useState<string | null>(null)
  const [typeError, setTypeError] = useState<string | null>(null)

  const roleLabel = ROLE_DISPLAY_NAMES[role] ?? role

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Inject the controlled select values (not captured natively by FormData
    // from Radix Select triggers)
    formData.set('type', projectType)
    formData.set('tone', tone)
    formData.set('role', role)

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

    if (hasError) return

    startTransition(async () => {
      const result = await createProject(formData)
      if (result.success) {
        onSubmit(result.id)
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Card */}
      <div className="rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl border border-white/60 overflow-hidden">
        {/* Card header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">
            Step 2 of 2
          </p>
          <h2 className="text-2xl font-serif font-bold text-white">Set Up Your Project</h2>
          <p className="mt-1 text-sm text-slate-300">
            Toolkit:{' '}
            <span className="font-medium text-amber-300">{roleLabel}</span>
          </p>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} noValidate className="px-8 py-7 space-y-5">
          {/* Server error banner */}
          {serverError && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}

          {/* Project Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-slate-800 font-semibold">
              Project Title <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Walking in Grace, Sunday Sermon Series"
              aria-describedby={titleError ? 'title-error' : undefined}
              aria-invalid={!!titleError}
              className={[
                'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
                'focus-visible:border-amber-500 focus-visible:ring-amber-500/30',
                titleError ? 'border-red-400' : '',
              ].join(' ')}
              onChange={() => titleError && setTitleError(null)}
            />
            {titleError && (
              <p id="title-error" role="alert" className="text-xs text-red-600">
                {titleError}
              </p>
            )}
          </div>

          {/* Project Type */}
          <div className="space-y-1.5">
            <Label htmlFor="type-trigger" className="text-slate-800 font-semibold">
              Project Type <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Select
              value={projectType}
              onValueChange={(val) => {
                setProjectType(val)
                if (typeError) setTypeError(null)
              }}
            >
              <SelectTrigger
                id="type-trigger"
                className={[
                  'w-full bg-white border-slate-200 text-slate-900',
                  'focus-visible:border-amber-500 focus-visible:ring-amber-500/30',
                  typeError ? 'border-red-400' : '',
                ].join(' ')}
                aria-describedby={typeError ? 'type-error' : undefined}
                aria-invalid={!!typeError}
              >
                <SelectValue placeholder="Select a project type" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {typeError && (
              <p id="type-error" role="alert" className="text-xs text-red-600">
                {typeError}
              </p>
            )}
          </div>

          {/* Audience */}
          <div className="space-y-1.5">
            <Label htmlFor="audience" className="text-slate-800 font-semibold">
              Audience{' '}
              <span className="font-normal text-slate-400 text-xs">(optional)</span>
            </Label>
            <Input
              id="audience"
              name="audience"
              type="text"
              placeholder="e.g. Young adults, My congregation"
              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-500 focus-visible:ring-amber-500/30"
            />
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <Label htmlFor="tone-trigger" className="text-slate-800 font-semibold">
              Tone{' '}
              <span className="font-normal text-slate-400 text-xs">(optional)</span>
            </Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger
                id="tone-trigger"
                className="w-full bg-white border-slate-200 text-slate-900 focus-visible:border-amber-500 focus-visible:ring-amber-500/30"
              >
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scripture Focus */}
          <div className="space-y-1.5">
            <Label htmlFor="scripture_focus" className="text-slate-800 font-semibold">
              Scripture Focus{' '}
              <span className="font-normal text-slate-400 text-xs">(optional)</span>
            </Label>
            <Input
              id="scripture_focus"
              name="scripture_focus"
              type="text"
              placeholder="e.g. John 15, Love and covenant"
              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-500 focus-visible:ring-amber-500/30"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isPending}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-60"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating Project...
                </span>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
