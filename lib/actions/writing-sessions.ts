'use server'

import { createClient } from '@/lib/supabase/server'
import type { WritingSession } from '@/types/database'

// ---------------------------------------------------------------------------
// upsertWritingSession
// ---------------------------------------------------------------------------
// Records (or updates) the word count for the calling user's project on the
// current calendar day.  Uses ON CONFLICT so repeated saves from the editor
// overwrite the earlier count rather than inserting duplicates.
// ---------------------------------------------------------------------------
export async function upsertWritingSession(
  projectId: string,
  wordCount: number
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  const { error } = await supabase
    .from('ltu_writing_sessions')
    .upsert(
      {
        user_id: user.id,
        project_id: projectId,
        date: today,
        word_count: wordCount,
      },
      { onConflict: 'project_id,date' }
    )

  if (error) {
    console.error('upsertWritingSession error:', error)
    return { error: error.message }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// updateDailyWordGoal
// ---------------------------------------------------------------------------
// Persists the user's chosen daily word target against the project row.
// The .eq('user_id', user.id) guard prevents one user from altering another
// user's project even if they somehow obtain a project UUID.
// ---------------------------------------------------------------------------
export async function updateDailyWordGoal(
  projectId: string,
  goal: number
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('ltu_projects')
    .update({ daily_word_goal: goal })
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    console.error('updateDailyWordGoal error:', error)
    return { error: error.message }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// getWritingStats
// ---------------------------------------------------------------------------
// Returns aggregated writing statistics for the authenticated user:
//   - wordsToday       — total words written across all projects today
//   - wordsThisWeek    — rolling 7-day total
//   - streak           — consecutive days with at least one session
//   - recentSessions   — raw session rows for the past 30 days (for charts)
//
// The streak algorithm walks backwards from today.  If today has no session
// yet it still checks yesterday first so an active streak is not broken
// mid-day before the user has opened the editor.
// ---------------------------------------------------------------------------
export async function getWritingStats(userId?: string): Promise<
  | {
      wordsToday: number
      wordsThisWeek: number
      streak: number
      recentSessions: Pick<WritingSession, 'date' | 'word_count' | 'project_id'>[]
    }
  | { error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const uid = userId ?? user.id

  const today = new Date()

  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)

  const { data: sessions, error } = await supabase
    .from('ltu_writing_sessions')
    .select('date, word_count, project_id')
    .eq('user_id', uid)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })

  if (error) {
    console.error('getWritingStats error:', error)
    return { error: error.message }
  }

  const rows = sessions ?? []

  // Words written today (summed across all projects)
  const todayStr = today.toISOString().split('T')[0]
  const wordsToday = rows
    .filter((s) => s.date === todayStr)
    .reduce((sum, s) => sum + (s.word_count ?? 0), 0)

  // Words written in the rolling 7-day window
  const weekStart = sevenDaysAgo.toISOString().split('T')[0]
  const wordsThisWeek = rows
    .filter((s) => s.date >= weekStart)
    .reduce((sum, s) => sum + (s.word_count ?? 0), 0)

  // Unique days that have at least one session, sorted newest-first
  const uniqueDates = [
    ...new Set(rows.map((s) => s.date)),
  ].sort().reverse()

  // Walk backwards from today counting consecutive days with writing activity.
  // If today has no entry yet, skip it so an in-progress streak is preserved.
  let streak = 0
  const cursor = new Date(today)

  for (let i = 0; i < 30; i++) {
    const dateStr = cursor.toISOString().split('T')[0]

    if (uniqueDates.includes(dateStr)) {
      streak++
    } else if (i === 0) {
      // Today has no session yet — look back one more day before giving up
      cursor.setDate(cursor.getDate() - 1)
      continue
    } else {
      // Gap found — streak is broken
      break
    }

    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    wordsToday,
    wordsThisWeek,
    streak,
    recentSessions: rows,
  }
}
