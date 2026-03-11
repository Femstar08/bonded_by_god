'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PrayerPromptModalProps {
  projectId: string
  role: string
  title: string
  scriptureFocus?: string | null
  showPrayerPrompt: boolean
}

export function PrayerPromptModal({
  projectId,
  role,
  title,
  scriptureFocus,
  showPrayerPrompt,
}: PrayerPromptModalProps) {
  const [open, setOpen] = useState(false)
  const [prayer, setPrayer] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPrayer, setShowPrayer] = useState(false)

  useEffect(() => {
    if (!showPrayerPrompt) return

    const today = new Date().toISOString().split('T')[0]
    const dismissKey = `bbg_prayer_dismissed_${projectId}_${today}`

    if (localStorage.getItem(dismissKey)) return

    setOpen(true)
  }, [showPrayerPrompt, projectId])

  const dismiss = () => {
    const today = new Date().toISOString().split('T')[0]
    const dismissKey = `bbg_prayer_dismissed_${projectId}_${today}`
    localStorage.setItem(dismissKey, 'true')
    setOpen(false)
  }

  const fetchPrayer = async () => {
    setLoading(true)
    setShowPrayer(true)
    try {
      const res = await fetch('/api/prayer-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          title,
          scriptureFocus: scriptureFocus ?? undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setPrayer(data.prayer)
    } catch {
      setPrayer('Lord, guide my hands and heart as I write today. Amen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {showPrayer ? 'A Prayer for Your Writing' : 'Before You Begin'}
          </DialogTitle>
          <DialogDescription>
            {showPrayer
              ? 'Take a moment to center yourself in prayer.'
              : 'Would you like a moment of prayer before you begin?'}
          </DialogDescription>
        </DialogHeader>

        {showPrayer ? (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            ) : (
              <p className="font-serif text-base leading-relaxed text-foreground/90">
                {prayer}
              </p>
            )}
            <Button onClick={dismiss} className="w-full bg-amber-600 hover:bg-amber-700">
              Begin Writing
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={fetchPrayer}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              Yes, guide me
            </Button>
            <Button onClick={dismiss} variant="outline" className="flex-1">
              Start writing
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
