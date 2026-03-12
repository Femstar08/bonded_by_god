'use client'

import { Card, CardContent } from '@/components/ui/card'

interface WritingStatsProps {
  stats: {
    wordsToday: number
    wordsThisWeek: number
    streak: number
  }
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function WritingStats({ stats }: WritingStatsProps) {
  const { wordsToday, wordsThisWeek, streak } = stats

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label="Writing progress statistics">
      {/* Words Today */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <span className="text-3xl font-bold text-amber-700" aria-label={`${wordsToday.toLocaleString()} words today`}>
            {wordsToday.toLocaleString()}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">words today</span>
        </CardContent>
      </Card>

      {/* Words This Week */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <span className="text-3xl font-bold text-amber-700" aria-label={`${wordsThisWeek.toLocaleString()} words this week`}>
            {wordsThisWeek.toLocaleString()}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">words this week</span>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <span className="flex items-center gap-1.5 text-3xl font-bold text-amber-700" aria-label={`${streak} day streak`}>
            {streak}
            <FlameIcon className="size-7 text-orange-500" />
          </span>
          <span className="mt-1 text-sm text-muted-foreground">day streak</span>
        </CardContent>
      </Card>
    </div>
  )
}
