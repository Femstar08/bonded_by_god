'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { CitationStyleType } from './CitationStyleSelector'

// ---------------------------------------------------------------------------
// Local Citation type (will be synced with types/database.ts later)
// ---------------------------------------------------------------------------

export type CitationType =
  | 'bible'
  | 'book'
  | 'article'
  | 'website'
  | 'dictionary'
  | 'other'

export interface Citation {
  id: string
  project_id: string
  type: CitationType
  label: string // e.g. "Smith 2023" — auto-generated but editable
  // Bible fields
  reference?: string | null        // e.g. "John 3:16"
  translation?: string | null      // e.g. "NIV"
  // Book fields
  author?: string | null
  title?: string | null
  publisher?: string | null
  year?: string | null
  city?: string | null
  edition?: string | null
  pages?: string | null
  // Article fields
  journal?: string | null
  volume?: string | null
  issue?: string | null
  doi?: string | null
  // Website fields
  site_name?: string | null
  url?: string | null
  access_date?: string | null
  // Dictionary fields
  dictionary_name?: string | null
  entry_word?: string | null
  // Other
  notes?: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CitationManagerPanelProps {
  projectId: string
  citationStyle: CitationStyleType
  onInsertCitation?: (citation: Citation) => void
}

// ---------------------------------------------------------------------------
// Citation formatters per style
// ---------------------------------------------------------------------------

function formatCitation(citation: Citation, style: CitationStyleType): string {
  switch (citation.type) {
    case 'bible': {
      const ref = citation.reference ?? ''
      const trans = citation.translation ?? 'NIV'
      if (style === 'chicago') return `${ref} (${trans}).`
      if (style === 'apa') {
        const fullNames: Record<string, string> = {
          NIV: 'New International Version',
          ESV: 'English Standard Version',
          KJV: 'King James Version',
          NKJV: 'New King James Version',
          NASB: 'New American Standard Bible',
          NLT: 'New Living Translation',
          MSG: 'The Message',
        }
        return `${ref} (${fullNames[trans] ?? trans}).`
      }
      if (style === 'mla') return `${ref}. ${trans}.`
      return `${ref} (${trans}).`
    }

    case 'book': {
      const author = citation.author ?? ''
      const title = citation.title ?? ''
      const publisher = citation.publisher ?? ''
      const year = citation.year ?? ''
      const city = citation.city ?? ''
      const pages = citation.pages ? `, ${citation.pages}` : ''
      const edition = citation.edition ? ` ${citation.edition} ed.` : ''
      if (style === 'chicago') {
        return `${author}. \u201C${title}.\u201D${edition} ${city}${city ? ':' : ''} ${publisher}${publisher ? ',' : ''} ${year}${pages}.`.replace(/\s+/g, ' ').trim()
      }
      if (style === 'apa') {
        const lastFirst = author.includes(',') ? author : author.split(' ').reverse().join(', ')
        return `${lastFirst} (${year}). ${title}${edition}. ${publisher}.`
      }
      if (style === 'mla') {
        return `${author}. ${title}.${edition} ${publisher}, ${year}${pages}.`
      }
      return `${author}. ${title}. ${publisher}, ${year}.`
    }

    case 'article': {
      const author = citation.author ?? ''
      const title = citation.title ?? ''
      const journal = citation.journal ?? ''
      const volume = citation.volume ?? ''
      const issue = citation.issue ? `(${citation.issue})` : ''
      const year = citation.year ?? ''
      const pages = citation.pages ?? ''
      const doi = citation.doi ? ` https://doi.org/${citation.doi}` : ''
      if (style === 'chicago') {
        return `${author}. \u201C${title}.\u201D ${journal} ${volume}${issue} (${year}): ${pages}.${doi}`
      }
      if (style === 'apa') {
        return `${author} (${year}). ${title}. ${journal}, ${volume}${issue}, ${pages}.${doi}`
      }
      if (style === 'mla') {
        return `${author}. \u201C${title}.\u201D ${journal}, vol. ${volume}, no. ${citation.issue ?? ''}, ${year}, pp. ${pages}.`
      }
      return `${author}. "${title}." ${journal} ${volume} (${year}): ${pages}.`
    }

    case 'website': {
      const author = citation.author ?? ''
      const title = citation.title ?? ''
      const siteName = citation.site_name ?? ''
      const url = citation.url ?? ''
      const access = citation.access_date ?? ''
      if (style === 'chicago') {
        return `${author}. \u201C${title}.\u201D ${siteName}. Accessed ${access}. ${url}.`
      }
      if (style === 'apa') {
        return `${author} (n.d.). ${title}. ${siteName}. Retrieved ${access}, from ${url}`
      }
      if (style === 'mla') {
        return `${author}. \u201C${title}.\u201D ${siteName}, ${url}. Accessed ${access}.`
      }
      return `${author}. "${title}." ${siteName}. ${url}.`
    }

    case 'dictionary': {
      const dict = citation.dictionary_name ?? ''
      const entry = citation.entry_word ?? ''
      const year = citation.year ?? ''
      if (style === 'chicago') return `\u201C${entry}.\u201D ${dict}, ${year}.`
      if (style === 'apa') return `${entry}. (${year}). In ${dict}.`
      if (style === 'mla') return `\u201C${entry}.\u201D ${dict}, ${year}.`
      return `"${entry}." ${dict}, ${year}.`
    }

    case 'other':
    default: {
      const parts = [citation.author, citation.title, citation.notes].filter(Boolean)
      return parts.join('. ') + '.'
    }
  }
}

// Auto-generate a short label from citation data
function autoLabel(citation: Omit<Citation, 'id' | 'created_at' | 'updated_at' | 'label' | 'project_id'>): string {
  if (citation.type === 'bible') {
    return citation.reference ?? 'Bible'
  }
  const author = citation.author?.split(' ').pop() ?? citation.title ?? 'Source'
  const year = citation.year ? ` ${citation.year}` : ''
  return `${author}${year}`
}

// ---------------------------------------------------------------------------
// Type tab config
// ---------------------------------------------------------------------------

const CITATION_TYPES: { value: CitationType; label: string }[] = [
  { value: 'bible', label: 'Bible' },
  { value: 'book', label: 'Book' },
  { value: 'article', label: 'Article' },
  { value: 'website', label: 'Website' },
  { value: 'dictionary', label: 'Dictionary' },
  { value: 'other', label: 'Other' },
]

const TYPE_GROUP_LABELS: Record<CitationType, string> = {
  bible: 'Bible References',
  book: 'Books',
  article: 'Articles',
  website: 'Websites',
  dictionary: 'Dictionaries',
  other: 'Other Sources',
}

const BIBLE_TRANSLATIONS = ['NIV', 'ESV', 'KJV', 'NKJV', 'NASB', 'NLT', 'MSG']

// ---------------------------------------------------------------------------
// Inline form state
// ---------------------------------------------------------------------------

type FormState = Omit<Citation, 'id' | 'created_at' | 'updated_at' | 'project_id'>

function emptyForm(type: CitationType): FormState {
  return {
    type,
    label: '',
    reference: '',
    translation: 'NIV',
    author: '',
    title: '',
    publisher: '',
    year: '',
    city: '',
    edition: '',
    pages: '',
    journal: '',
    volume: '',
    issue: '',
    doi: '',
    site_name: '',
    url: '',
    access_date: '',
    dictionary_name: '',
    entry_word: '',
    notes: '',
  }
}

// ---------------------------------------------------------------------------
// Inline citation form
// ---------------------------------------------------------------------------

interface CitationFormProps {
  initialData?: Citation | null
  projectId: string
  onSaved: (citation: Citation) => void
  onCancel: () => void
}

function CitationForm({ initialData, projectId, onSaved, onCancel }: CitationFormProps) {
  const [formType, setFormType] = useState<CitationType>(initialData?.type ?? 'bible')
  const [form, setForm] = useState<FormState>(() =>
    initialData
      ? { ...initialData }
      : emptyForm(formType)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [labelEdited, setLabelEdited] = useState(!!initialData?.label)

  const handleTypeChange = (type: CitationType) => {
    setFormType(type)
    setForm((prev) => ({ ...emptyForm(type), label: prev.label }))
    setLabelEdited(false)
  }

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value }
      // Auto-update label unless user has manually edited it
      if (!labelEdited) {
        updated.label = autoLabel(updated)
      }
      return updated
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const body = {
      ...form,
      type: formType,
      project_id: projectId,
      ...(initialData ? { id: initialData.id } : {}),
    }

    try {
      const res = await fetch('/api/citations', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to save')
      onSaved(data.citation as Citation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save citation')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'h-7 text-xs bg-background border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-300/40'

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50/40 px-3 py-3 space-y-3">
      {/* Type selector */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
          Source Type
        </p>
        <div className="flex flex-wrap gap-1">
          {CITATION_TYPES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              onClick={() => handleTypeChange(ct.value)}
              className={[
                'px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors',
                formType === ct.value
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-background text-muted-foreground border-border hover:border-amber-300 hover:text-amber-700',
              ].join(' ')}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
          Short Label
        </label>
        <Input
          value={form.label}
          onChange={(e) => {
            setLabelEdited(true)
            setForm((prev) => ({ ...prev, label: e.target.value }))
          }}
          placeholder="e.g. Smith 2023"
          className={inputClass}
        />
      </div>

      {/* Dynamic fields */}
      {formType === 'bible' && (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
              Reference
            </label>
            <Input
              value={form.reference ?? ''}
              onChange={(e) => set('reference', e.target.value)}
              placeholder="e.g. John 3:16"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
              Translation
            </label>
            <select
              value={form.translation ?? 'NIV'}
              onChange={(e) => set('translation', e.target.value)}
              className="w-full h-7 rounded-md border border-amber-200 bg-background px-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            >
              {BIBLE_TRANSLATIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {formType === 'book' && (
        <div className="space-y-2">
          {([
            ['author', 'Author', 'e.g. John Smith'],
            ['title', 'Title', 'e.g. Grace Revealed'],
            ['publisher', 'Publisher', 'e.g. Christian Press'],
            ['year', 'Year', 'e.g. 2023'],
            ['city', 'City', 'e.g. Nashville'],
            ['edition', 'Edition', 'e.g. 2nd'],
            ['pages', 'Pages', 'e.g. 45–67'],
          ] as [keyof FormState, string, string][]).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                {label}
              </label>
              <Input
                value={(form[key] as string) ?? ''}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}

      {formType === 'article' && (
        <div className="space-y-2">
          {([
            ['author', 'Author', 'e.g. John Smith'],
            ['title', 'Title', 'e.g. Faith and Works'],
            ['journal', 'Journal', 'e.g. Theological Studies'],
            ['volume', 'Volume', 'e.g. 12'],
            ['issue', 'Issue', 'e.g. 3'],
            ['year', 'Year', 'e.g. 2023'],
            ['pages', 'Pages', 'e.g. 45–67'],
            ['doi', 'DOI', 'e.g. 10.1234/ts.2023.001'],
          ] as [keyof FormState, string, string][]).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                {label}
              </label>
              <Input
                value={(form[key] as string) ?? ''}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}

      {formType === 'website' && (
        <div className="space-y-2">
          {([
            ['author', 'Author', 'e.g. John Smith'],
            ['title', 'Title', 'e.g. Understanding Grace'],
            ['site_name', 'Site Name', 'e.g. Bible Gateway'],
            ['url', 'URL', 'e.g. https://example.com'],
            ['access_date', 'Access Date', 'e.g. March 17, 2026'],
          ] as [keyof FormState, string, string][]).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                {label}
              </label>
              <Input
                value={(form[key] as string) ?? ''}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}

      {formType === 'dictionary' && (
        <div className="space-y-2">
          {([
            ['dictionary_name', 'Dictionary Name', 'e.g. Strong\u2019s Concordance'],
            ['entry_word', 'Entry Word', 'e.g. Agape'],
            ['year', 'Year', 'e.g. 2001'],
          ] as [keyof FormState, string, string][]).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                {label}
              </label>
              <Input
                value={(form[key] as string) ?? ''}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}

      {formType === 'other' && (
        <div className="space-y-2">
          {([
            ['title', 'Title', 'e.g. Conference Sermon'],
            ['author', 'Author', 'e.g. Pastor Jane Doe'],
          ] as [keyof FormState, string, string][]).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
                {label}
              </label>
              <Input
                value={(form[key] as string) ?? ''}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
              Notes
            </label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any additional details..."
              rows={2}
              className="w-full rounded-md border border-amber-200 bg-background px-2.5 py-1.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-amber-400/40 resize-none"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-2.5 py-1.5 text-[11px] text-red-700"
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !form.label.trim()}
          className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3"
        >
          {saving ? (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </span>
          ) : initialData ? (
            'Update'
          ) : (
            'Save Citation'
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-7 text-xs text-muted-foreground"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Citation card
// ---------------------------------------------------------------------------

interface CitationCardProps {
  citation: Citation
  style: CitationStyleType
  citationNumber: number
  onEdit: () => void
  onDelete: () => void
  onInsert?: (citation: Citation) => void
  isDeleting: boolean
  confirmingDelete: boolean
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

function CitationCard({
  citation,
  style,
  citationNumber,
  onEdit,
  onDelete,
  onInsert,
  isDeleting,
  confirmingDelete,
  onConfirmDelete,
  onCancelDelete,
}: CitationCardProps) {
  const formatted = formatCitation(citation, style)
  const typeLabel = CITATION_TYPES.find((t) => t.value === citation.type)?.label ?? citation.type

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5 group transition-colors hover:border-amber-200">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-bold text-amber-700 tabular-nums shrink-0">
            [{citationNumber}]
          </span>
          <span className="text-[11px] font-semibold text-foreground truncate">
            {citation.label}
          </span>
          <Badge
            variant="outline"
            className="text-[9px] px-1 py-0 h-3.5 border-amber-200 text-amber-600 bg-amber-50 leading-none shrink-0"
          >
            {typeLabel}
          </Badge>
        </div>
      </div>

      {/* Formatted reference */}
      <p className="text-[11px] text-muted-foreground font-serif leading-relaxed mb-2">
        {formatted}
      </p>

      {/* Action buttons */}
      {confirmingDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-red-600 font-medium">Delete this citation?</span>
          <button
            type="button"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="text-[11px] text-red-600 font-semibold hover:text-red-700 underline"
          >
            {isDeleting ? 'Deleting...' : 'Yes'}
          </button>
          <button
            type="button"
            onClick={onCancelDelete}
            className="text-[11px] text-muted-foreground hover:text-foreground underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {onInsert && (
            <button
              type="button"
              onClick={() => onInsert(citation)}
              className="text-[11px] px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium transition-colors"
              title="Insert footnote marker at cursor"
            >
              Insert
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:border-amber-200 hover:text-amber-700 hover:bg-amber-50 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-[11px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CitationManagerPanel — main export
// ---------------------------------------------------------------------------

export function CitationManagerPanel({
  projectId,
  citationStyle,
  onInsertCitation,
}: CitationManagerPanelProps) {
  const [citations, setCitations] = useState<Citation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state: null = hidden, 'new' = adding, string = editing by ID
  const [formState, setFormState] = useState<'new' | string | null>(null)

  // Delete confirmation tracking
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  // Fetch citations
  const fetchCitations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/citations?projectId=${projectId}`)
      const data = await res.json()
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Failed to load')
      setCitations((data as { citations: Citation[] }).citations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load citations')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchCitations()
  }, [fetchCitations])

  // Group by type
  const citationsByType = useMemo(() => {
    const map: Record<CitationType, Citation[]> = {
      bible: [],
      book: [],
      article: [],
      website: [],
      dictionary: [],
      other: [],
    }
    for (const c of citations) {
      map[c.type].push(c)
    }
    return map
  }, [citations])

  const totalCount = citations.length

  // Global citation number (order across all groups)
  const citationIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    let idx = 1
    const order: CitationType[] = ['bible', 'book', 'article', 'website', 'dictionary', 'other']
    for (const type of order) {
      for (const c of citationsByType[type]) {
        map.set(c.id, idx++)
      }
    }
    return map
  }, [citationsByType])

  const handleSaved = (saved: Citation) => {
    setCitations((prev) => {
      const exists = prev.some((c) => c.id === saved.id)
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved]
    })
    setFormState(null)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/citations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setCitations((prev) => prev.filter((c) => c.id !== id))
    } catch {
      // Silently fall back
    } finally {
      setDeletingId(null)
      setConfirmingDeleteId(null)
    }
  }

  const editingCitation = formState && formState !== 'new'
    ? citations.find((c) => c.id === formState) ?? null
    : null

  return (
    <div className="flex flex-col h-full bg-background" aria-label="Citations panel">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border bg-amber-50/30">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div>
            <h2 className="font-serif text-base font-semibold text-foreground leading-tight">
              References
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {loading ? (
                <span className="inline-block h-2.5 w-16 rounded bg-muted animate-pulse" />
              ) : (
                <>
                  {totalCount === 0
                    ? 'No citations yet'
                    : `${totalCount} ${totalCount === 1 ? 'citation' : 'citations'}`}
                  {' \u00B7 '}
                  <span className="uppercase text-[10px] font-semibold text-amber-600">
                    {citationStyle.toUpperCase()}
                  </span>
                </>
              )}
            </p>
          </div>

          {formState === null && (
            <Button
              size="sm"
              onClick={() => setFormState('new')}
              className="h-7 px-2.5 text-[11px] shrink-0 gap-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-3"
                aria-hidden="true"
              >
                <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
              </svg>
              Add Citation
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        className={[
          'flex-1 overflow-y-auto px-3 py-3 space-y-4',
          '[&::-webkit-scrollbar]:w-1.5',
          '[&::-webkit-scrollbar-track]:bg-transparent',
          '[&::-webkit-scrollbar-thumb]:rounded-full',
          '[&::-webkit-scrollbar-thumb]:bg-border',
          '[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40',
        ].join(' ')}
      >
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2 animate-pulse" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 h-16" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p className="font-medium mb-1">Could not load citations</p>
            <p className="text-xs mb-2 text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchCitations}
              className="text-xs underline underline-offset-2 hover:no-underline font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* New citation form */}
        {formState === 'new' && (
          <CitationForm
            projectId={projectId}
            onSaved={handleSaved}
            onCancel={() => setFormState(null)}
          />
        )}

        {/* Grouped citations */}
        {!loading && !error && (
          <>
            {(['bible', 'book', 'article', 'website', 'dictionary', 'other'] as CitationType[]).map(
              (type) => {
                const group = citationsByType[type]
                if (group.length === 0) return null

                return (
                  <div key={type}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      {TYPE_GROUP_LABELS[type]}
                    </p>
                    <div className="space-y-2">
                      {group.map((citation) => {
                        const isEditing = formState === citation.id

                        if (isEditing) {
                          return (
                            <CitationForm
                              key={citation.id}
                              initialData={citation}
                              projectId={projectId}
                              onSaved={handleSaved}
                              onCancel={() => setFormState(null)}
                            />
                          )
                        }

                        return (
                          <CitationCard
                            key={citation.id}
                            citation={citation}
                            style={citationStyle}
                            citationNumber={citationIndexMap.get(citation.id) ?? 0}
                            onEdit={() => setFormState(citation.id)}
                            onDelete={() => setConfirmingDeleteId(citation.id)}
                            onInsert={onInsertCitation}
                            isDeleting={deletingId === citation.id}
                            confirmingDelete={confirmingDeleteId === citation.id}
                            onConfirmDelete={() => handleDelete(citation.id)}
                            onCancelDelete={() => setConfirmingDeleteId(null)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              }
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !error && totalCount === 0 && formState !== 'new' && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3 px-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-50 border border-amber-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5 text-amber-600"
                aria-hidden="true"
              >
                <path d="M10.75 16.82A7.462 7.462 0 0 1 10 17c-.386 0-.766-.02-1.141-.06a.75.75 0 0 1-.66-.79v-.88a8.75 8.75 0 0 0-1.566.78.75.75 0 0 1-.848-1.238 10.2 10.2 0 0 1 1.674-.832l-.065-.087A.75.75 0 0 1 8.5 13.4l.065.087A8.965 8.965 0 0 1 10 13.25c.5 0 .987.044 1.46.129l-.21-.25a.75.75 0 0 1 1.15-.964l.21.25.065-.087a.75.75 0 0 1 1.21.882l-.065.087A8.75 8.75 0 0 0 15.25 14a.75.75 0 0 1 0 1.5 10.17 10.17 0 0 1-1.75-.22v.88a.75.75 0 0 1-.66.79 7.47 7.47 0 0 1-2.09.07Z" />
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2Zm-.75 4.75a.75.75 0 0 1 1.5 0v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-serif text-sm font-semibold text-foreground">
                No citations yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Add your first citation using the button above.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setFormState('new')}
              className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              Add First Citation
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
