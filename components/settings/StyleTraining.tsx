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
    <div className="space-y-8">

      {/* Section header */}
      <div>
        <h3 className="text-[15px] font-medium text-foreground">
          Train Scriptloom on Your Writing Style
        </h3>
        <p className="text-[13px] text-muted-foreground/60 mt-1">
          Paste samples of your writing so the AI can match your voice, tone, and rhythm.
        </p>
      </div>

      {/* Scope selector */}
      <div className="space-y-3">
        <Label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/50">
          Apply style to
        </Label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2.5 text-[14px] text-foreground cursor-pointer">
            <input
              type="radio"
              name="scope"
              checked={scope === 'user'}
              onChange={() => setScope('user')}
              className="accent-amber-600 w-4 h-4"
            />
            My entire account
          </label>
          <label className="flex items-center gap-2.5 text-[14px] text-foreground cursor-pointer">
            <input
              type="radio"
              name="scope"
              checked={scope === 'project'}
              onChange={() => setScope('project')}
              className="accent-amber-600 w-4 h-4"
            />
            This project only
          </label>
        </div>
        {scope === 'project' && projects.length > 0 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
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
      <div className="space-y-4">
        <Label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/50">
          Writing Samples
        </Label>
        {samples.map((sample, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground/60 font-medium">
                Sample {i + 1}
              </span>
              {samples.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSample(i)}
                  className="text-[12px] text-muted-foreground/50 hover:text-destructive transition-colors font-medium"
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
              className="text-[14px] resize-y rounded-xl border-border/50 focus:ring-amber-500/30"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addSample}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
        >
          + Add another sample
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-[13px] font-medium ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-100'
              : 'bg-green-50 text-green-700 border border-green-100'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Analyze button */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={analyzing}
        className="bg-[#0f1a2e] hover:bg-[#1a2d4d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 w-full text-[15px] font-semibold transition-colors"
      >
        {analyzing ? 'Analyzing...' : 'Analyze My Writing Style'}
      </button>

      {/* Style profile preview */}
      {activeProfile && (
        <div className="rounded-2xl bg-muted/20 border border-border/40 p-6 space-y-6">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50">
            {styleData ? 'Analyzed Style Profile' : 'Current Style Profile'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <StyleRow label="Tone" value={activeProfile.tone} />
            <StyleRow label="Voice" value={activeProfile.voice} />
            <StyleRow label="Sentence Structure" value={activeProfile.sentenceStructure} />
            <StyleRow label="Pacing" value={activeProfile.pacing} />
            <StyleRow label="Emotional Intensity" value={activeProfile.emotionLevel} />
            <StyleRow label="Vocabulary" value={activeProfile.vocabularyStyle} />
            <StyleRow label="Patterns" value={activeProfile.writingPatterns} />
          </div>

          {activeProfile.styleSummary && (
            <div className="pt-5 border-t border-border/30">
              <p className="text-[13px] text-muted-foreground/70 italic leading-relaxed">
                {activeProfile.styleSummary}
              </p>
            </div>
          )}

          {/* Save button — only show if we have a new analysis */}
          {styleData && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#0f1a2e] hover:bg-[#1a2d4d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-2.5 px-6 text-[14px] font-semibold transition-colors"
            >
              {saving ? 'Saving...' : 'Save Style Profile'}
            </button>
          )}
        </div>
      )}

    </div>
  )
}

function StyleRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground/50 font-semibold">
        {label}
      </p>
      <p className="text-[15px] text-foreground">{value}</p>
    </div>
  )
}
