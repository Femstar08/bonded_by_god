'use client'

import React, { useState, useTransition } from 'react'
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

  // Shared input class
  const inputClass = [
    'rounded-xl border-border/50 py-3 px-4 text-[15px]',
    'focus-visible:ring-2 focus-visible:ring-amber-400/30 focus-visible:border-amber-400',
  ].join(' ')

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Role context badge */}
      <div className="mb-8 flex items-center gap-2">
        <span className="text-[13px] font-medium text-foreground/50 uppercase tracking-wide">
          Toolkit:
        </span>
        <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-[13px] font-medium text-amber-700">
          {roleLabel}
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Server error banner */}
        {serverError && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
          >
            {serverError}
          </div>
        )}

        {/* Project Title */}
        <div>
          <Label
            htmlFor="title"
            className="block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2"
          >
            Project Title <span className="text-red-500 normal-case" aria-hidden="true">*</span>
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
              inputClass,
              titleError ? 'border-red-400 focus-visible:ring-red-400/30' : '',
            ].join(' ')}
            onChange={() => titleError && setTitleError(null)}
          />
          {titleError && (
            <p id="title-error" role="alert" className="text-red-500 text-[12px] mt-1">
              {titleError}
            </p>
          )}
        </div>

        {/* Project Type */}
        <div>
          <Label
            htmlFor="type-trigger"
            className="block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2"
          >
            Project Type <span className="text-red-500 normal-case" aria-hidden="true">*</span>
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
                inputClass,
                'w-full',
                typeError ? 'border-red-400 focus-visible:ring-red-400/30' : '',
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
            <p id="type-error" role="alert" className="text-red-500 text-[12px] mt-1">
              {typeError}
            </p>
          )}
        </div>

        {/* Audience */}
        <div>
          <Label
            htmlFor="audience"
            className="block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2"
          >
            Audience{' '}
            <span className="font-normal text-foreground/40 normal-case text-[12px]">(optional)</span>
          </Label>
          <Input
            id="audience"
            name="audience"
            type="text"
            placeholder="e.g. Young adults, My congregation"
            className={inputClass}
          />
        </div>

        {/* Tone */}
        <div>
          <Label
            htmlFor="tone-trigger"
            className="block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2"
          >
            Tone{' '}
            <span className="font-normal text-foreground/40 normal-case text-[12px]">(optional)</span>
          </Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger
              id="tone-trigger"
              className={['w-full', inputClass].join(' ')}
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
        <div>
          <Label
            htmlFor="scripture_focus"
            className="block text-[13px] font-medium text-foreground/70 uppercase tracking-wide mb-2"
          >
            Scripture Focus{' '}
            <span className="font-normal text-foreground/40 normal-case text-[12px]">(optional)</span>
          </Label>
          <Input
            id="scripture_focus"
            name="scripture_focus"
            type="text"
            placeholder="e.g. John 15, Love and covenant"
            className={inputClass}
          />
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#0f1a2e] hover:bg-[#1a2d4d] text-white rounded-xl py-3 w-full text-[15px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
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
              </>
            ) : (
              'Create Project'
            )}
          </button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onBack}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1 disabled:opacity-40"
            >
              Back
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
