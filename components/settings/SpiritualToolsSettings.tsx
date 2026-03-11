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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Daily Scripture on Dashboard</p>
          <p className="text-xs text-muted-foreground">
            Show an inspiring verse each day on your dashboard
          </p>
        </div>
        <Switch checked={showDailyScripture} onCheckedChange={toggleDailyScripture} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Prayer Prompt Before Writing</p>
          <p className="text-xs text-muted-foreground">
            Offer a guided prayer when you open a project each day
          </p>
        </div>
        <Switch checked={showPrayerPrompt} onCheckedChange={togglePrayerPrompt} />
      </div>
    </div>
  )
}
