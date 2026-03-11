'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { StyleData } from '@/types/database'

interface Project {
  id: string
  title: string
}

interface StyleTrainingProps {
  userId: string
  projects: Project[]
}

export function StyleTraining({ userId, projects }: StyleTrainingProps) {
  const [samples, setSamples] = useState<string[]>([''])
  const [scope, setScope] = useState<'user' | 'project'>('user')
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id ?? '')
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [styleData, setStyleData] = useState<StyleData | null>(null)
  const [existingProfile, setExistingProfile] = useState<StyleData | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch existing profile on mount and when scope/project changes
  useEffect(() => {
    const projectId = scope === 'project' ? selectedProjectId : projects[0]?.id
    if (!projectId) return

    fetch(`/api/style/profile?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profile?.style_data) {
          setExistingProfile(data.profile.style_data)
        } else {
          setExistingProfile(null)
        }
      })
      .catch(() => {})
  }, [scope, selectedProjectId, projects])

  const addSample = () => setSamples((prev) => [...prev, ''])

  const updateSample = (index: number, value: string) => {
    setSamples((prev) => prev.map((s, i) => (i === index ? value : s)))
  }

  const removeSample = (index: number) => {
    if (samples.length <= 1) return
    setSamples((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAnalyze = async () => {
    const validSamples = samples.filter((s) => s.trim().length > 50)
    if (validSamples.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one sample with 50+ characters.' })
      return
    }

    setAnalyzing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/style/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: validSamples }),
      })
      const data = await res.json()
      if (data.styleData) {
        setStyleData(data.styleData)
      } else {
        setMessage({ type: 'error', text: data.error || 'Analysis failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to analyze writing style' })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!styleData) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/style/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleData,
          samplesText: samples.filter((s) => s.trim().length > 50),
          projectId: scope === 'project' ? selectedProjectId : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Style profile saved successfully' })
        setExistingProfile(styleData)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save style profile' })
    } finally {
      setSaving(false)
    }
  }

  const activeProfile = styleData || existingProfile

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-sm">Train Scriptloom on Your Writing Style</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Paste samples of your writing so the AI can match your voice, tone, and rhythm.
        </p>
      </div>

      {/* Scope selector */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Apply style to:</Label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="scope"
              checked={scope === 'user'}
              onChange={() => setScope('user')}
              className="accent-amber-600"
            />
            My entire account
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="scope"
              checked={scope === 'project'}
              onChange={() => setScope('project')}
              className="accent-amber-600"
            />
            This project only
          </label>
        </div>
        {scope === 'project' && projects.length > 0 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Writing samples */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Writing Samples</Label>
        {samples.map((sample, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sample {i + 1}</span>
              {samples.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSample(i)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <Textarea
              value={sample}
              onChange={(e) => updateSample(i, e.target.value)}
              placeholder="Paste a sample of your writing here (at least 50 characters)..."
              rows={6}
              className="text-sm resize-y"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addSample}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          + Add another sample
        </button>
      </div>

      {/* Analyze button */}
      <Button
        onClick={handleAnalyze}
        disabled={analyzing}
        className="bg-amber-600 hover:bg-amber-700 text-white"
      >
        {analyzing ? 'Analyzing...' : 'Analyze My Writing Style'}
      </Button>

      {/* Message */}
      {message && (
        <p className={`text-xs ${message.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
          {message.text}
        </p>
      )}

      {/* Style profile preview */}
      {activeProfile && (
        <div className="rounded-md border border-border/50 bg-muted/20 p-4 space-y-3">
          <h4 className="text-sm font-medium">
            {styleData ? 'Analyzed Style Profile' : 'Current Style Profile'}
          </h4>
          <div className="grid gap-2 text-xs">
            <StyleRow label="Tone" value={activeProfile.tone} />
            <StyleRow label="Voice" value={activeProfile.voice} />
            <StyleRow label="Sentence Structure" value={activeProfile.sentenceStructure} />
            <StyleRow label="Pacing" value={activeProfile.pacing} />
            <StyleRow label="Emotional Intensity" value={activeProfile.emotionLevel} />
            <StyleRow label="Vocabulary" value={activeProfile.vocabularyStyle} />
            <StyleRow label="Patterns" value={activeProfile.writingPatterns} />
          </div>
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground italic">{activeProfile.styleSummary}</p>
          </div>

          {/* Save button — only show if we have a new analysis */}
          {styleData && (
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Style Profile'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function StyleRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="font-medium text-muted-foreground w-32 shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
