# PRD-17: Advanced Goal Tracking

## Overview

Advanced Goal Tracking gives Scriptloom users a structured, motivating system to build consistent writing habits. It layers a configurable daily word-count target, a streak calendar heatmap, day-off scheduling, project-level progress bars, and milestone celebrations on top of the existing `ltu_writing_sessions` data that the app already records. The feature is positioned directly against Dabble's goal tracking, which is the best-in-class example in writing software today but has no faith context and no AI integration.

## Problem Statement

The current Scriptloom dashboard shows basic writing statistics but provides no mechanism for a user to set a personal writing goal, see their consistency over time, or feel the motivational pull of a streak they do not want to break. Dabble and Scrivener users specifically cite goal tracking and streak visibility as the features that keep them writing daily. Without this, Scriptloom users who are mid-project (e.g., writing a 80,000-word book) have no feedback loop to sustain momentum. Ministry writers in particular tend to have irregular schedules — they observe Sabbath, lead midweek services, travel for ministry — so a naive streak system that punishes rest days would be actively harmful. This PRD addresses all of that.

---

## User Stories

1. As a Christian author, I want to set a daily word count target so that I have a clear, achievable writing goal each day.
2. As a writer with a busy ministry schedule, I want to mark specific days of the week as rest days so that my streak is not broken when I honour the Sabbath or observe ministry commitments.
3. As a user, I want to see a visual heatmap calendar showing my writing activity over the past 90 days so that I can appreciate the consistency I have built.
4. As a user, I want to see my current consecutive-day writing streak prominently displayed so that I feel motivated to maintain it.
5. As a project author, I want to set a total word count target for my book so that I can track my overall progress toward completing the manuscript.
6. As a user, I want to see a progress bar on each project card showing current versus target word count so that I know at a glance how far along I am.
7. As a writer, I want to receive a subtle milestone celebration message when I reach 1K, 5K, 10K, 25K, 50K, and 100K words so that major achievements feel acknowledged.
8. As a user, I want the option to receive a daily browser notification reminding me to write so that I do not forget on busy days.
9. As a user, I want to see weekly and monthly writing summaries with charts so that I can reflect on my productivity patterns.
10. As a ministry leader, I want my rest-day exceptions to be respected automatically so that the app feels like it understands my life rather than imposing a secular productivity framework on it.

---

## Detailed Requirements

### Functional Requirements

1. **Daily Goal Configuration**
   1.1. The user may set a `daily_word_target` integer on their profile (default: 500).
   1.2. The setting is accessible from the Dashboard settings panel and from the Writing Goals widget.
   1.3. Valid range: 50 to 10,000 words per day. Values outside this range are rejected with an inline validation message.

2. **Rest Day Scheduling**
   2.1. The user may designate any combination of weekdays (0 = Sunday through 6 = Saturday) as rest days, stored as a JSON integer array in `ltu_profiles.rest_days`.
   2.2. A rest day does not contribute to word count but also does not break the streak counter.
   2.3. The UI presents a row of seven day-toggle buttons (Sun Mon Tue Wed Thu Fri Sat) in the goal settings panel.
   2.4. Toggled-on days display with a gold background; toggled-off days are muted navy.

3. **Streak Calendar (Heatmap)**
   3.1. The dashboard Writing Goals widget includes a 90-day heatmap grid: 13 columns (weeks) by 7 rows (days), reading left-to-right, oldest to newest.
   3.2. Each cell is colour-coded by word count relative to the user's daily target:
       - 0 words, non-rest day: light grey (#E5E7EB)
       - 0 words, rest day: soft gold outline (#F5E6B8), cream fill
       - 1–49% of target: light blue (#BFDBFE)
       - 50–99% of target: medium blue (#3B82F6)
       - 100%+ of target: deep navy (#1E3A5F)
   3.3. Hovering a cell shows a tooltip: date, word count, and target hit/missed status.
   3.4. The calendar is rendered client-side using CSS grid; no external charting library is required.

4. **Streak Counter**
   4.1. The current streak is the number of consecutive calendar days (excluding rest days) on which the user wrote at least 1 word.
   4.2. The streak counter is displayed as a large number with a flame icon in the Writing Goals widget header.
   4.3. The longest-ever streak is displayed beneath the current streak in smaller text.
   4.4. Streak calculation runs server-side in the `/api/goals/streak` route to prevent client-side manipulation.

5. **Project-Level Goals**
   5.1. Each project may have an optional `target_word_count` integer (e.g., 80,000 for a book).
   5.2. The field is configurable from the Project Settings panel and from the new project creation flow.
   5.3. A horizontal progress bar on each project card shows `(sum of chapter word counts / target_word_count) * 100` percent.
   5.4. When no target is set, the progress bar is hidden.

6. **Milestone Celebrations**
   6.1. Milestones are triggered when the user's cumulative all-time word count crosses: 1,000 / 5,000 / 10,000 / 25,000 / 50,000 / 100,000 words.
   6.2. Celebration is a non-modal toast notification with a brief congratulatory message in Scriptloom's spiritual voice (e.g., "You've written 10,000 words — faithful in small things, faithful in much.").
   6.3. Each milestone fires exactly once. A `milestones_reached` JSON array in `ltu_profiles` tracks which have been shown.
   6.4. Milestone toast auto-dismisses after 6 seconds and is accessible (role="status", aria-live="polite").

7. **Daily Reminder Notification**
   7.1. The user may opt in to a daily browser notification at a user-specified time (default: 8:00 AM local time).
   7.2. Permission is requested via the browser Notifications API only when the user explicitly enables the reminder.
   7.3. If the user has already written their daily target by the reminder time, the notification is suppressed.
   7.4. Notification preference (enabled, time) is stored in `ltu_profiles.notification_prefs` as JSONB.

8. **Weekly and Monthly Summaries**
   8.1. The Goals page (`/dashboard/goals`) includes a "This Week" card showing: total words, days written, days missed, best day.
   8.2. A "This Month" card shows the same metrics plus a simple bar chart (one bar per day) rendered with the existing Recharts dependency (to be confirmed) or a lightweight SVG bar chart.
   8.3. Summary data is fetched from `/api/goals/summary?period=week|month`.

9. **Today's Progress Widget**
   9.1. The dashboard homepage includes a "Today's Writing" widget showing: words written today, daily target, a progress ring (circular progress indicator), and a "Write Now" button linking to the most-recently-active project.
   9.2. The widget updates in real time as the user writes (via the existing `useAutoSave` hook which records sessions).

### Non-Functional Requirements

- NFR-1: Streak calculation must complete in under 500ms for a user with 2 years of session history (730 rows).
- NFR-2: The heatmap must render without layout shift on first paint (skeleton state displayed while data loads).
- NFR-3: All interactive elements meet WCAG 2.1 AA contrast requirements (minimum 4.5:1 for normal text, 3:1 for large text).
- NFR-4: The daily reminder notification must not fire if the browser tab is active and the user is currently in the editor.
- NFR-5: Goal settings changes must persist within 1 second of user input (optimistic update + server sync).
- NFR-6: The feature must work identically on mobile and tablet viewports (responsive layout, touch-friendly toggle buttons).

---

## UI/UX Specification

### Screen 1: Dashboard Writing Goals Widget (Always Visible)

Located in the dashboard right column, below Daily Scripture.

Layout (top to bottom):
- Header row: flame icon + streak number ("14-day streak") + "Longest: 23 days" in small text
- Circular progress ring showing today's word count vs. target (e.g., 320/500 = 64% complete) with count in centre
- "Write Now" CTA button (gold, full width)
- Heatmap calendar (90 days, 13 columns x 7 rows, compact cells ~10px)
- Footer row: "Goals Settings" link (text button, right-aligned)

### Screen 2: Goals Settings Panel (Modal or Drawer)

Accessible via "Goals Settings" link from the widget or via `/dashboard/settings` under a "Writing Goals" tab.

Sections:
1. Daily Target — numeric input with stepper (+/- buttons), range hint
2. Rest Days — seven day-toggle buttons in a horizontal row
3. Daily Reminder — toggle switch; when enabled, shows a time picker (12-hour format with AM/PM)
4. Project Targets — list of all user projects with inline editable word count target fields

### Screen 3: Goals Dashboard Page (/dashboard/goals)

Full-page view accessed from the main sidebar navigation.

Layout:
- Page title: "Writing Goals"
- Top stat row (4 cards): Today's Words, Current Streak, This Week, All-Time Total
- Full-size heatmap (12 months, wider cells, month labels above columns)
- Weekly Summary card (left) and Monthly Summary card with bar chart (right)
- Milestone timeline: vertical list of all milestones, checked/unchecked, with dates earned
- Project Progress section: table of projects showing title, current words, target, progress bar, percentage

### Screen 4: Project Card (Existing, Modified)

The existing project card in `/dashboard/projects` gains:
- A thin progress bar at the bottom of the card (cream background, navy fill)
- Word count label: "12,430 / 80,000 words" in small caption text beneath the bar
- Bar is hidden when no target is set

---

## Data Model

### Modified Table: `ltu_profiles`

```sql
-- Migration: 011_goal_tracking.sql

ALTER TABLE ltu_profiles
  ADD COLUMN IF NOT EXISTS daily_word_target      INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS rest_days              JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS milestones_reached     JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS notification_prefs     JSONB NOT NULL DEFAULT '{"enabled": false, "time": "08:00"}',
  ADD COLUMN IF NOT EXISTS longest_streak         INTEGER NOT NULL DEFAULT 0;

-- daily_word_target: integer, range 50–10000
-- rest_days: array of weekday integers, e.g. [0, 6] for Sun + Sat
-- milestones_reached: array of milestone thresholds already shown, e.g. [1000, 5000]
-- notification_prefs: { "enabled": boolean, "time": "HH:MM" }
-- longest_streak: updated whenever current streak exceeds it
```

### Modified Table: `ltu_projects`

```sql
ALTER TABLE ltu_projects
  ADD COLUMN IF NOT EXISTS target_word_count  INTEGER;

-- nullable — no target set = no progress bar shown
```

### Modified Table: `ltu_writing_sessions`

No new columns required. The existing schema (`user_id`, `project_id`, `date`, `word_count`) is sufficient for all streak and summary calculations. The `UNIQUE(project_id, date)` constraint means one row per project per day; the streak logic aggregates across projects by `(user_id, date)`.

### Derived Computation (No New Table)

All-time word total: `SELECT SUM(word_count) FROM ltu_writing_sessions WHERE user_id = $1`

Streak calculation (pseudo-SQL):
```sql
-- Get all distinct dates the user wrote at least 1 word, ordered descending
SELECT DISTINCT date FROM ltu_writing_sessions
WHERE user_id = $1 AND word_count > 0
ORDER BY date DESC;
-- Walk the date list server-side, skipping rest-day gaps, counting streak
```

---

## API Routes

### GET /api/goals/streak

Returns the current streak, longest streak, and today's word count.

Request: authenticated (cookie session), no body.

Response:
```json
{
  "currentStreak": 14,
  "longestStreak": 23,
  "todayWordCount": 320,
  "dailyTarget": 500,
  "targetMet": false
}
```

Errors: 401 if unauthenticated.

### GET /api/goals/heatmap?days=90

Returns an array of daily activity records for the heatmap.

Response:
```json
{
  "days": [
    { "date": "2026-01-01", "wordCount": 620, "isRestDay": false, "targetMet": true },
    ...
  ],
  "dailyTarget": 500,
  "restDays": [0]
}
```

### GET /api/goals/summary?period=week|month

Returns aggregate statistics for the requested period.

Response (week):
```json
{
  "period": "week",
  "totalWords": 3420,
  "daysWritten": 5,
  "daysMissed": 1,
  "restDays": 1,
  "bestDay": { "date": "2026-03-08", "wordCount": 847 },
  "dailyBreakdown": [
    { "date": "2026-03-05", "wordCount": 0 },
    ...
  ]
}
```

### PATCH /api/goals/settings

Updates profile goal settings.

Request body:
```json
{
  "dailyWordTarget": 750,
  "restDays": [0, 6],
  "notificationPrefs": { "enabled": true, "time": "07:30" }
}
```

Response: `{ "success": true }` or validation error.

### PATCH /api/goals/project-target

Sets or clears a project's target word count.

Request body:
```json
{
  "projectId": "uuid",
  "targetWordCount": 80000
}
```

Response: updated project row.

### POST /api/goals/milestone-seen

Marks a milestone as acknowledged so it is not shown again.

Request body:
```json
{ "milestone": 10000 }
```

Response: `{ "success": true }`.

---

## AI Agent Integration

Goal Tracking does not invoke AI agents in the critical path. However, two optional enhancements are in scope for a future iteration:

- The **Guide agent** (`lib/agents/guide.ts`) could be called once per week to generate a brief personalized encouragement message ("You wrote 4 of 7 days this week — that is faithful stewardship of your gift") shown in the Weekly Summary card.
- The **Shepherd agent** could be used to select a contextually appropriate Scripture for the milestone toast notification (e.g., Zechariah 4:10 for the 1,000-word milestone: "Do not despise these small beginnings").

These integrations are optional and should be gated behind the user's AI features toggle to avoid unnecessary API calls.

---

## Acceptance Criteria

- [ ] Given a user with no `daily_word_target` set, when they visit the dashboard, then the Writing Goals widget shows a default target of 500 words.
- [ ] Given a user who sets Sunday as a rest day, when Sunday passes with no writing session, then their streak counter does not decrease.
- [ ] Given a user with 5 consecutive writing days (no rest days), when they view the streak counter, then it displays "5".
- [ ] Given a user whose cumulative word count crosses 10,000, when they next load the dashboard, then a milestone toast appears reading a congratulatory message referencing faithful stewardship.
- [ ] Given a user has seen the 10,000-word milestone, when they reload the page, then the toast does not appear again.
- [ ] Given a project with `target_word_count = 80000` and chapters totalling 20,000 words, when the project card renders, then the progress bar shows 25% fill and the label reads "20,000 / 80,000 words".
- [ ] Given a project with no `target_word_count`, when the project card renders, then no progress bar is visible.
- [ ] Given the user enables daily reminders at 08:00, when 08:00 arrives and the user has not yet written today, then a browser notification fires.
- [ ] Given the user has already met their daily target before 08:00, when 08:00 arrives, then no notification fires.
- [ ] Given a user views `/dashboard/goals`, when the page loads, then the full-year heatmap, weekly summary, monthly summary, milestone timeline, and project progress table all render without error.
- [ ] Given the user changes their daily target from 500 to 750, when they save the change, then the progress ring on the dashboard immediately reflects the new target.
- [ ] Given a user with no writing sessions, when they view the heatmap, then all 90 cells display in the "0 words" grey colour and the streak counter shows "0".

---

## Edge Cases

- **User writes across multiple projects on the same day:** The heatmap cell should show the sum of all project word counts for that date, not the count from a single project.
- **User deletes a project that has writing sessions:** Cascade deletes will remove session rows; streak and heatmap recalculate on next fetch. This is acceptable behaviour.
- **User's timezone changes (travel):** Session dates are recorded in UTC. The heatmap converts to the browser's local timezone for display. A date that was Monday in UTC might display as Sunday in a UTC-5 timezone. Document this as a known limitation; full timezone support is out of scope.
- **Daily target set to 0:** Blocked by validation (minimum 50). If a corrupt value reaches the DB, streak calculation treats the target as 1 for "met" purposes.
- **Milestone toast fires on initial load with no writing history:** Guard against: only fire the toast if the user has at least one writing session and their all-time word count has newly crossed the threshold since the last page load.
- **User writes more than 10,000 words in one day:** Valid. The heatmap cell shows "100%+ of target" colour. No upper bound on daily word count.
- **All 7 days marked as rest days:** The UI should warn "You've marked every day as a rest day — your streak won't grow" with a dismissable inline alert.
- **Browser notifications blocked by user:** If `Notification.permission === 'denied'`, show an inline message in settings explaining how to re-enable permissions from the browser address bar.

---

## Dependencies

- **PRD-09 (Writing Goals — Phase 3):** The `ltu_writing_sessions` table and basic word count recording must already be implemented. This PRD assumes that sessions are being written by the auto-save hook.
- **Supabase RLS:** All new columns are on `ltu_profiles` and `ltu_projects`, which already have RLS policies. New columns inherit existing policies automatically.
- **pdfkit / docx (PRD-08):** No dependency. Goal tracking is independent of export.
- **Browser Notifications API:** Supported in all modern browsers. Requires HTTPS in production (Vercel satisfies this).
- **Recharts or equivalent:** The monthly bar chart requires a charting library. Recharts is referenced in the codebase context; confirm it is installed before implementation. If not, a lightweight SVG bar chart component should be built inline.

---

## Estimated Scope

**L (Large)**

Rationale: The heatmap, streak algorithm (with rest-day exception logic), multiple API routes, profile schema changes, project-level goal UI across multiple surfaces (project card, project settings, goals page), milestone system, and notification integration each constitute non-trivial work. The feature touches the dashboard, project cards, editor page (today's word count), settings, and a new dedicated goals page.
