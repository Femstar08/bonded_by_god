'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateChapterWordGoal } from '@/lib/actions/chapters'
import { updateDailyWordGoal } from '@/lib/actions/writing-sessions'

interface ChapterProgressProps {
  wordCount: number
  wordGoal: number
  chapterId: string
  projectId: string
  dailyWordGoal: number
}

export function ChapterProgress({
  wordCount,
  wordGoal: initialGoal,
  chapterId,
  projectId,
  dailyWordGoal: initialDailyGoal,
}: ChapterProgressProps) {
  const [wordGoal, setWordGoal] = useState(initialGoal)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(String(initialGoal))

  const [dailyGoal, setDailyGoal] = useState(initialDailyGoal)
  const [isEditingDailyGoal, setIsEditingDailyGoal] = useState(false)
  const [dailyGoalInput, setDailyGoalInput] = useState(String(initialDailyGoal))

  const percentage = Math.min(Math.round((wordCount / wordGoal) * 100), 100)

  const handleGoalSave = async () => {
    const newGoal = parseInt(goalInput, 10)
    if (isNaN(newGoal) || newGoal < 1) {
      setGoalInput(String(wordGoal))
      setIsEditingGoal(false)
      return
    }
    setWordGoal(newGoal)
    setIsEditingGoal(false)
    await updateChapterWordGoal(chapterId, newGoal)
  }

  const handleDailyGoalSave = async () => {
    const newGoal = parseInt(dailyGoalInput, 10)
    if (isNaN(newGoal) || newGoal < 1) {
      setDailyGoalInput(String(dailyGoal))
      setIsEditingDailyGoal(false)
      return
    }
    setDailyGoal(newGoal)
    setIsEditingDailyGoal(false)
    await updateDailyWordGoal(projectId, newGoal)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Chapter Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chapter word count vs goal */}
        <div className="flex justify-between text-sm">
          <span>Words: <span className="font-semibold">{wordCount.toLocaleString()}</span></span>
          <span>
            Goal:{' '}
            {isEditingGoal ? (
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onBlur={handleGoalSave}
                onKeyDown={(e) => e.key === 'Enter' && handleGoalSave()}
                className="w-20 rounded border px-1 py-0.5 text-sm"
                autoFocus
                min={1}
              />
            ) : (
              <button
                onClick={() => { setGoalInput(String(wordGoal)); setIsEditingGoal(true) }}
                className="font-semibold hover:underline cursor-pointer"
              >
                {wordGoal.toLocaleString()}
              </button>
            )}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 w-full rounded-full bg-muted">
          <div
            className="h-3 rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-center text-sm font-medium">{percentage}% Complete</p>

        {/* Divider */}
        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Daily Goal
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target words/day</span>
            <span>
              {isEditingDailyGoal ? (
                <input
                  type="number"
                  value={dailyGoalInput}
                  onChange={(e) => setDailyGoalInput(e.target.value)}
                  onBlur={handleDailyGoalSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleDailyGoalSave()}
                  className="w-20 rounded border px-1 py-0.5 text-sm"
                  autoFocus
                  min={1}
                  aria-label="Daily word goal"
                />
              ) : (
                <button
                  onClick={() => {
                    setDailyGoalInput(String(dailyGoal))
                    setIsEditingDailyGoal(true)
                  }}
                  className="font-semibold hover:underline cursor-pointer"
                  aria-label={`Daily goal: ${dailyGoal.toLocaleString()} words. Click to edit.`}
                >
                  {dailyGoal.toLocaleString()}
                </button>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
