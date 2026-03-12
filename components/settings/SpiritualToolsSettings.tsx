'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'

interface SpiritualToolsSettingsProps {
  userId: string
  initialShowPrayerPrompt: boolean
  initialShowDailyScripture: boolean
}

export function SpiritualToolsSettings({
  userId,
  initialShowPrayerPrompt,
  initialShowDailyScripture,
}: SpiritualToolsSettingsProps) {
  const [showPrayerPrompt, setShowPrayerPrompt] = useState(initialShowPrayerPrompt)
  const [showDailyScripture, setShowDailyScripture] = useState(initialShowDailyScripture)

  const updatePreference = async (field: string, value: boolean) => {
    const supabase = createClient()
    await supabase
      .from('ltu_profiles')
      .update({ [field]: value })
      .eq('id', userId)
  }

  const togglePrayerPrompt = (checked: boolean) => {
    setShowPrayerPrompt(checked)
    updatePreference('show_prayer_prompt', checked)
  }

  const toggleDailyScripture = (checked: boolean) => {
    setShowDailyScripture(checked)
    updatePreference('show_daily_scripture', checked)
  }

  return (
    <div className="space-y-1">

      {/* Daily Scripture */}
      <div className="flex items-center justify-between hover:bg-muted/30 rounded-xl px-4 py-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-amber-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-medium text-foreground">Daily Scripture on Dashboard</p>
            <p className="text-[13px] text-muted-foreground/60 mt-0.5">
              Show an inspiring verse each day on your dashboard
            </p>
          </div>
        </div>
        <Switch checked={showDailyScripture} onCheckedChange={toggleDailyScripture} />
      </div>

      {/* Prayer Prompt */}
      <div className="flex items-center justify-between hover:bg-muted/30 rounded-xl px-4 py-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-amber-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-medium text-foreground">Prayer Prompt Before Writing</p>
            <p className="text-[13px] text-muted-foreground/60 mt-0.5">
              Offer a guided prayer when you open a project each day
            </p>
          </div>
        </div>
        <Switch checked={showPrayerPrompt} onCheckedChange={togglePrayerPrompt} />
      </div>

    </div>
  )
}
