# PRD-22: Sermon Calendar & Archive

**Status:** Planned
**Phase:** 5 - Platform Expansion
**Priority:** P12
**Estimated Scope:** M
**Last Updated:** 2026-03-11

---

## Overview

The Sermon Calendar gives Preacher/Pastor/Speaker role users a dedicated planning and archiving workspace where they can schedule upcoming sermons on a visual calendar, organize them into themed series, and search a complete archive of everything they have ever preached. It functions as both a forward-looking planning board and a backward-looking historical record, all connected to the writing projects and chapters where the sermons were authored.

---

## Problem Statement

Pastors and preachers manage a uniquely complex content calendar: recurring Sunday services, special events, seasonal preaching plans (Advent, Lent, Easter), and multi-week series all overlap in ways that generic calendar tools cannot accommodate with ministry-specific context. Tools like Logos and Sermonly offer basic sermon libraries, but neither connects the archive to an AI writing environment or provides series planning with structured theological context (theme, Scripture focus, main point per week).

Scriptloom already stores every sermon a pastor writes. The Sermon Calendar closes the gap between writing a sermon and actually planning, scheduling, and archiving it — turning Scriptloom into the single system of record for a pastor's entire preaching ministry, not just a drafting tool.

---

## User Stories

1. As a pastor, I want a monthly calendar view showing all my scheduled sermons, so that I can see my preaching commitments at a glance and spot gaps in my schedule.
2. As a preacher, I want to drag a sermon project onto a calendar date to schedule it, so that I can plan my preaching without re-entering information I have already captured in Scriptloom.
3. As a lead pastor, I want to create a named sermon series and assign individual sermons to it, so that I can plan a connected 6-week series with a unified theme and Scripture arc.
4. As a ministry leader, I want to use a series planning template that prompts me to set a topic, key Scripture, and main point for each week of the series, so that I have a structured plan before I begin writing the individual sermons.
5. As a pastor, I want to search my archive of past sermons by Scripture reference, topic tag, series name, or date range, so that I can quickly find a sermon I preached 2 years ago without scrolling through a long list.
6. As a church administrator, I want to export the preaching schedule as an iCal (.ics) file, so that I can add it to the church staff's shared calendar in Google Calendar or Outlook.
7. As a pastor, I want to see a summary of my preaching statistics (total sermons preached, sermons this year, most referenced Scripture books), so that I can reflect on patterns in my preaching over time.
8. As a preacher, I want to mark a regular preaching slot (e.g., every Sunday morning at 10:00 AM at the main campus), so that I do not have to manually recreate it every week.
9. As a pastor, I want to print a tidy sermon schedule for the current month or upcoming series, so that I can include it in church bulletins or staff planning documents.
10. As a ministry leader, I want calendar entries to link directly to the corresponding Scriptloom chapter, so that I can open the sermon draft with one click from the calendar view.

---

## Detailed Requirements

### Functional Requirements

#### FR-01: Role Restriction
1. The Sermon Calendar and all features described in this PRD must only be accessible to users who have at least one project with the role "Preacher / Pastor / Speaker" assigned.
2. The Sermon Calendar must appear as a top-level navigation item in the Dashboard sidebar only when the above condition is met.
3. Attempting to access the Sermon Calendar URL directly without a qualifying project role must redirect to the Dashboard with an informational message: "The Sermon Calendar is available for Preacher/Pastor/Speaker projects."

#### FR-02: Calendar View
1. The calendar must default to a month view upon first open.
2. Users must be able to toggle between month view and week view via tab buttons in the calendar toolbar.
3. Each scheduled sermon on the calendar must display as a colored event chip showing: sermon title (truncated to fit), time slot if specified, and a color-coded indicator for series membership (series color) or standalone sermon (default navy).
4. Clicking an event chip must open a sermon detail popover showing: sermon title, linked project/chapter, scheduled date and time, location, series name (if applicable), and quick-action links ("Open in Editor", "Edit Schedule", "Remove from Calendar").
5. The current date must be visually highlighted in the calendar grid.
6. Days with no scheduled sermons must be visually distinct from days with scheduled content, making gaps in the schedule immediately visible.
7. Navigation between months/weeks must be smooth, with previous and next arrow controls and a "Today" button to return to the current date.

#### FR-03: Scheduling Sermons (Drag and Drop)
1. A "Sermon Library" panel must be accessible from the calendar view, either as a collapsible sidebar or a slide-over drawer.
2. The Sermon Library panel must list all Scriptloom projects and chapters with the Preacher/Pastor/Speaker role that are not yet scheduled.
3. Users must be able to drag a sermon from the Library panel onto a date in the calendar grid to schedule it.
4. Dragging a sermon onto a date must open a scheduling modal to confirm or set: date (pre-filled from the drop target), time slot, location, and series assignment.
5. Alternatively, users must be able to click any calendar date to open the scheduling modal and select a sermon from a dropdown list.
6. A scheduled sermon must be movable: dragging it from one date to another on the calendar must update its `scheduled_date` in the database.
7. Right-clicking a scheduled sermon must offer a context menu with: Edit, Move to another date (opens date picker), and Remove from Calendar.

#### FR-04: Sermon Series
1. Users must be able to create a named Sermon Series from a "New Series" button in the calendar toolbar.
2. Creating a series requires: series title, description (optional), overall Scripture focus (book or passage), theme (free text), planned start date, and planned end date.
3. After a series is created, users must be able to assign individual scheduled sermons to that series from the scheduling modal or from the series detail view.
4. Each series must be assigned a color (chosen from a palette of 8 colors) that is used to color-code all its events on the calendar.
5. A dedicated Series List view must be accessible from a "Series" tab within the Sermon Calendar. It must display all series as cards showing: series title, Scripture focus, date range, number of assigned sermons vs. planned weeks, and a completion percentage.
6. Clicking a series card must open the Series Detail view.

#### FR-05: Series Planning Template
1. The Series Detail view must include a week-by-week planning grid.
2. Each row in the grid represents one week of the series (auto-generated based on start date and end date, one row per Sunday in that range by default).
3. Each row must have fields for: week number, planned date, topic/title for that week, key Scripture reference, main point (max 280 characters), and linked sermon project/chapter (optional until written).
4. Users must be able to add or remove rows from the planning grid to account for series of any length (4 to 26 weeks).
5. The planning grid must be printable as a clean single-page planning document.
6. As sermons are scheduled and linked to series rows, the row must visually update to show "Scheduled" or "Preached" status.

#### FR-06: Archive View
1. The Archive is a searchable list view accessible from a tab in the Sermon Calendar: "Calendar" tab and "Archive" tab.
2. The Archive must list all scheduled sermon entries where `scheduled_date` is in the past, sorted by date descending (most recent first).
3. Each archive entry must display: sermon title, date preached, time slot, location, series name (if applicable), Scripture reference (pulled from chapter metadata or manually entered), and topic tags.
4. A search bar must support full-text search across: sermon title, series name, Scripture reference, topic tags, and location.
5. Filter controls must allow narrowing the archive by:
   - Date range (from / to date pickers)
   - Series (multi-select from a list of all series)
   - Scripture book (dropdown of Bible books)
   - Topic tags (multi-select from all tags used)
6. Each archive entry must have a link icon that opens the associated Scriptloom chapter in the editor.
7. The archive must support pagination or infinite scroll for users with large sermon histories (50+ entries per page).

#### FR-07: Quick Stats Panel
1. A Stats widget must appear in the Sermon Calendar sidebar or at the top of the Archive view.
2. The Stats widget must display:
   - Total sermons in the archive (all time)
   - Sermons preached in the current calendar year
   - Sermons scheduled in the next 30 days
   - Most referenced Scripture book (top 3, ranked by frequency across all `sermon_schedule` entries)
   - Longest active series (by number of associated sermons)
3. Stats must be calculated dynamically from the database and refresh when the user navigates to the calendar.
4. The stats panel must be read-only (no interaction required).

#### FR-08: Recurring Preaching Slots
1. Users must be able to define a recurring preaching slot with: day of week (e.g., Sunday), time (e.g., 10:00 AM), location name (e.g., "Main Campus Sanctuary"), and frequency (Weekly / Bi-weekly / Monthly on the first Sunday of the month).
2. Recurring slots must visually appear on the calendar as a light placeholder background or repeating indicator on their scheduled days, distinct from fully scheduled sermon events.
3. Recurring slots act as a reminder scaffold, not as automatically created sermon entries. The user must still drag a sermon onto the slot to create a full schedule entry.
4. Users must be able to edit or delete recurring slot definitions at any time.

#### FR-09: iCal Export
1. A "Share Calendar" button in the calendar toolbar must offer an iCal (.ics) export.
2. Export options must include:
   - All scheduled sermons (past and future)
   - Upcoming sermons only (future scheduled dates)
   - A specific series only
3. The generated .ics file must include, for each event: summary (sermon title), description (series name + main point if available), location, start datetime, and a URL back to the Scriptloom chapter if one is linked.
4. The .ics file must conform to RFC 5545 so it can be imported into Google Calendar, Apple Calendar, and Microsoft Outlook without errors.
5. A "Copy subscription link" option must generate a URL that calendar apps can subscribe to (live feed). This URL must be user-specific and revocable from the calendar settings.

#### FR-10: Print View
1. A "Print Schedule" button must be available in the calendar toolbar.
2. The print view must offer two print modes:
   - Monthly schedule: a clean tabular view of the current month's sermons (date, title, series, Scripture).
   - Series plan: the week-by-week planning grid for a selected series.
3. The print view must be accessible via `window.print()` with a dedicated print-optimized CSS stylesheet (hiding navigation, toolbars, and sidebars).
4. The printed output must include the Scriptloom wordmark and the user's name/ministry name (pulled from their profile) in the header.
5. Print layout must fit on standard A4 or US Letter paper in portrait orientation.

### Non-Functional Requirements

#### NFR-01: Performance
- Calendar month view must render all scheduled events within 1 second for up to 200 events.
- Archive full-text search must return results within 1.5 seconds for archives of up to 500 sermon entries.
- iCal file generation must complete within 3 seconds for all-time exports of up to 1,000 entries.

#### NFR-02: Accessibility
- The calendar grid must be navigable by keyboard (Tab to move between dates, Enter to interact with events).
- All event chips must have aria-label attributes describing the sermon title and date.
- Color-coded series indicators must not rely on color alone — each must also include the series name in a tooltip or label.
- Drag-and-drop scheduling must have a keyboard-accessible fallback (clicking a date opens the scheduling modal with a sermon dropdown).

#### NFR-03: Responsiveness
- The calendar must be fully functional on tablet screens (768px and above).
- On mobile screens (below 768px), the calendar must switch to a list-style agenda view rather than a grid, as the month grid is not practical on small screens.
- The Archive and Series views must be fully functional on all screen sizes.

#### NFR-04: Data Integrity
- Deleting a Scriptloom project or chapter that is linked to a `sermon_schedule` entry must not delete the schedule entry. The entry must remain but display a "Linked chapter was deleted" warning with the original chapter title preserved in a `deleted_chapter_title` field.
- If a user changes a project's role away from Preacher/Pastor/Speaker, any sermon schedule entries linked to that project must be retained in the archive.

---

## UI/UX Specification

### Key Screens

#### Screen 1: Sermon Calendar - Month View
- **Layout:** Standard month grid (7 columns for days of the week, 4-6 rows for weeks). Each cell contains the date number in the top-right corner. Scheduled sermons appear as colored pill chips inside the cell. A maximum of 3 chips are visible per cell; additional sermons show as "+N more" which expands on click.
- **Toolbar (above the grid):** Left: "< Previous" and "Next >" month navigation, a "Today" button, and the current month/year heading. Right: "Week" / "Month" view toggle, "New Series" button, "Share Calendar" button, "Print Schedule" button.
- **Sermon Library sidebar:** A collapsible panel on the right side. Header: "Sermon Library" with a search/filter input. Body: a scrollable list of unscheduled sermons. Each item shows the project title, role badge, word count, and a drag handle icon. When the sidebar is open, the calendar grid shrinks to accommodate it.
- **Color legend:** A small legend below the grid showing series names and their assigned colors. Standalone (unseries'd) sermons appear in the default navy.

#### Screen 2: Sermon Schedule Entry Popover
- **Triggered by:** Clicking an event chip on the calendar.
- **Layout:** A floating popover card (not a full modal) anchored to the event chip. Contains:
  - Sermon title (large, bold)
  - Date and time (formatted: "Sunday, 16 March 2026 — 10:00 AM")
  - Location
  - Series name with colored dot (or "No series" in muted text)
  - Scripture reference(s)
  - Three text links: "Open in Editor" (navigates to chapter editor), "Edit Schedule" (opens scheduling modal), "Remove from Calendar" (with confirmation prompt).
- **Keyboard dismiss:** Pressing Escape or clicking outside the popover closes it.

#### Screen 3: Scheduling Modal
- **Triggered by:** Dropping a sermon onto the calendar, clicking a date, or clicking "Edit Schedule" in the popover.
- **Layout:** A centered modal. Fields:
  - Sermon (read-only if drag-dropped, dropdown if opened by clicking a date)
  - Date (date picker, pre-filled)
  - Time slot (time picker, optional)
  - Location (free text with autocomplete from previously used locations)
  - Series (dropdown of existing series + "Create new series" option)
  - Scripture references (free text tag input, e.g., "John 3:16", "Romans 8:1-11")
  - Topic tags (free text tag input)
  - Notes (optional, multi-line textarea, 500 char max)
- **Actions:** Cancel button and "Save" / "Schedule Sermon" CTA button.

#### Screen 4: Series Detail View
- **Layout:** Full-width panel with:
  - Header section: series title, color dot, date range, Scripture focus, theme. An "Edit series" pencil icon.
  - Week-by-week planning grid (described in FR-05). Presented as a styled table with alternating row colors.
  - Below the grid: "Add week" button to extend the series, "Print Series Plan" button.

#### Screen 5: Archive View
- **Layout:** Two-column layout on desktop. Left column (1/3 width): search input + filter panel (date range, series, Scripture book, topic tags). Right column (2/3 width): scrollable list of archive entries.
- **Archive entry card:** Shows sermon title (link to chapter), date preached in bold, location, series badge (colored), scripture reference(s), and topic tags as small pill badges.
- **Stats widget:** Appears as a card at the top of the left filter column.
- **Empty state:** "No sermons archived yet. Past sermons will appear here automatically after their scheduled date."

### User Flow: Planning a New Series
Sermon Calendar > "New Series" button > Series creation modal (title, Scripture focus, theme, dates) > Save > Series Detail view opens > Week-by-week grid shows auto-generated weeks > Fill in topic and Scripture for each week > Click "Schedule" on a row to assign an existing project/chapter to that week's slot > Calendar view updates showing the series events in the series color.

### User Flow: Searching the Archive
Archive tab > Type "Romans" in search bar > Results filter to all sermons with "Romans" in title, scripture references, or tags > Apply "Date range" filter: 2024-01-01 to 2025-12-31 > Results narrow to Romans sermons preached in that period > Click a result title > Chapter opens in editor.

---

## Data Model

### New Tables

#### `sermon_series`
```sql
CREATE TABLE sermon_series (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  scripture_focus  TEXT,       -- e.g., "Romans 8" or "The Sermon on the Mount"
  theme            TEXT,
  color            TEXT NOT NULL DEFAULT '#1e3a5f',  -- hex color for calendar chips
  start_date       DATE,
  end_date         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `sermon_schedule`
```sql
CREATE TABLE sermon_schedule (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  chapter_id       UUID REFERENCES chapters(id) ON DELETE SET NULL,
  series_id        UUID REFERENCES sermon_series(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,   -- denormalized sermon title for archive integrity
  scheduled_date   DATE NOT NULL,
  time_slot        TIME,
  location         TEXT,
  scripture_refs   TEXT[],          -- array of scripture reference strings
  topic_tags       TEXT[],
  notes            TEXT,
  deleted_chapter_title TEXT,       -- preserved if linked chapter is deleted
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `series_weeks`
```sql
CREATE TABLE series_weeks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id        UUID NOT NULL REFERENCES sermon_series(id) ON DELETE CASCADE,
  week_number      INTEGER NOT NULL,
  planned_date     DATE,
  topic            TEXT,
  key_scripture    TEXT,
  main_point       TEXT CHECK (char_length(main_point) <= 280),
  schedule_id      UUID REFERENCES sermon_schedule(id) ON DELETE SET NULL,  -- linked when sermon is scheduled
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (series_id, week_number)
);
```

#### `recurring_slots`
```sql
CREATE TABLE recurring_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week      INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday, 6=Saturday
  time_slot        TIME,
  location         TEXT,
  frequency        TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly_first', 'monthly_last')),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `calendar_subscriptions`
```sql
CREATE TABLE calendar_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token            TEXT NOT NULL UNIQUE,  -- used in the subscription URL, hashed for security
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at       TIMESTAMPTZ
);
```

### Indexes
```sql
CREATE INDEX idx_sermon_schedule_user_date ON sermon_schedule(user_id, scheduled_date);
CREATE INDEX idx_sermon_schedule_series ON sermon_schedule(series_id);
CREATE INDEX idx_series_weeks_series ON series_weeks(series_id, week_number);
```

### Full-Text Search Index
```sql
-- For Archive search
CREATE INDEX idx_sermon_schedule_fts ON sermon_schedule
  USING GIN (to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(location, '') || ' ' ||
    coalesce(array_to_string(scripture_refs, ' '), '') || ' ' ||
    coalesce(array_to_string(topic_tags, ' '), '')
  ));
```

### Migration File
`supabase/migrations/013_sermon_calendar.sql`

---

## API Routes

| Method | Route | Description | Auth Required |
|---|---|---|---|
| GET | `/api/sermon-calendar/schedule` | Get all scheduled sermons for the current user (supports date range query params) | Authenticated |
| POST | `/api/sermon-calendar/schedule` | Create a new sermon schedule entry | Authenticated |
| PUT | `/api/sermon-calendar/schedule/[id]` | Update a schedule entry (reschedule, edit details) | Authenticated |
| DELETE | `/api/sermon-calendar/schedule/[id]` | Remove a sermon from the calendar | Authenticated |
| GET | `/api/sermon-calendar/series` | List all sermon series for the current user | Authenticated |
| POST | `/api/sermon-calendar/series` | Create a new sermon series | Authenticated |
| PUT | `/api/sermon-calendar/series/[id]` | Update series details | Authenticated |
| DELETE | `/api/sermon-calendar/series/[id]` | Delete a series (schedule entries remain, series_id set to null) | Authenticated |
| GET | `/api/sermon-calendar/series/[id]/weeks` | Get the week-by-week plan for a series | Authenticated |
| PUT | `/api/sermon-calendar/series/[id]/weeks` | Batch update series week planning rows | Authenticated |
| GET | `/api/sermon-calendar/archive` | Search and filter past sermons (query params: search, from, to, series_id, scripture_book, tags) | Authenticated |
| GET | `/api/sermon-calendar/stats` | Get preaching statistics for the current user | Authenticated |
| GET | `/api/sermon-calendar/recurring-slots` | List recurring slot definitions | Authenticated |
| POST | `/api/sermon-calendar/recurring-slots` | Create a recurring slot | Authenticated |
| PUT | `/api/sermon-calendar/recurring-slots/[id]` | Update or deactivate a recurring slot | Authenticated |
| GET | `/api/sermon-calendar/export/ical` | Generate and return an iCal .ics file (query params: scope=all/upcoming/series, series_id) | Authenticated |
| GET | `/api/sermon-calendar/subscribe/[token]` | Live iCal subscription feed endpoint (public, token-gated) | Token only |
| POST | `/api/sermon-calendar/subscribe` | Generate a new calendar subscription token | Authenticated |
| DELETE | `/api/sermon-calendar/subscribe/[id]` | Revoke a calendar subscription | Authenticated |

---

## AI Agent Integration

- **Shepherd agent (prayer prompts):** When a user opens the Sermon Calendar and has a sermon scheduled within the next 7 days, the Shepherd agent should surface a contextual prompt: "You're preaching on [title] this Sunday — would you like a focused prayer to guide your final preparation?" This is shown as a dismissible banner above the calendar.
- **Guide agent (chat panel):** When a user is viewing a Series Detail view, the Guide agent can be invoked to assist with series planning: "Help me plan a 6-week series on the Sermon on the Mount. Suggest a theme, Scripture arc, and one-sentence main point for each week." The output should be formatted to pre-fill the series week rows.
- **Researcher agent:** When a user enters a Scripture reference in a series week row or schedule entry, the Researcher agent must validate the reference format and optionally suggest related passages that have thematic alignment with the series Scripture focus.
- **Refiner agent:** From the Archive view, a user must be able to select a past sermon entry and click "Repurpose this sermon" to invoke the Content Repurposing Engine (PRD-11). The Refiner agent acts as the bridge between the archive entry and the repurposing workflow.
- **Stats context:** The stats panel data (most referenced Scripture books, most used topic tags) should be made available as context to the Guide agent so it can flag patterns in the user's preaching: "I notice you haven't preached from the Old Testament prophets this year — would you like some suggestions for an upcoming series?"

---

## Acceptance Criteria

- [ ] Given a user with a Preacher/Pastor/Speaker project, when they navigate to the Dashboard, then a "Sermon Calendar" item appears in the sidebar navigation and the calendar page loads successfully.
- [ ] Given a user without any Preacher/Pastor/Speaker projects, when they attempt to navigate to `/sermon-calendar`, then they are redirected to the Dashboard with an informational message.
- [ ] Given a scheduled sermon on the calendar, when the user drags it from one date to another, then the `scheduled_date` in `sermon_schedule` is updated and the event chip renders on the new date without a page reload.
- [ ] Given a user who creates a series with a start date of 2026-04-06 and an end date of 2026-05-17, then the series week planning grid automatically generates 7 rows (one per Sunday in that range).
- [ ] Given a completed series week row with a main point of 285 characters, when the user attempts to save it, then a validation error is shown stating the maximum is 280 characters.
- [ ] Given a user who searches "John 3" in the Archive, then all sermon entries containing "John 3" in their scripture_refs or title field are returned and no entries without this reference are included.
- [ ] Given a user with 15 scheduled future sermons, when they click "Share Calendar" and select "Upcoming sermons only" and click Export, then a valid .ics file is downloaded containing exactly those 15 events with correct DTSTART, SUMMARY, and LOCATION fields, and the file imports into Google Calendar without errors.
- [ ] Given a chapter linked to a sermon_schedule entry is deleted by the user, then the schedule entry remains visible in the calendar and archive with a "Linked chapter was deleted" warning and the original chapter title preserved.
- [ ] Given a pastor who has preached 47 sermons with "Romans" as the most frequently used scripture_refs entry, when they view the Stats panel, then "Romans" appears as the #1 most referenced Scripture book.
- [ ] Given a recurring slot defined as "Every Sunday, 10:00 AM, Main Campus", then that time slot appears visually marked on every Sunday in the current and next month's calendar view.
- [ ] Given a user on a mobile screen (375px width), when they open the Sermon Calendar, then an agenda-style list view renders (not a grid) showing upcoming sermons with date, title, and series name.
- [ ] Given a user who prints the month view using "Print Schedule", then the print output shows only the sermon schedule table without the navigation, sidebars, or browser UI, and includes the user's ministry name in the header.

---

## Edge Cases

1. **Scheduling a sermon that has already been preached:** A user drags an old, archived chapter onto a future date. The system must allow this (re-preaching a sermon is common) and create a new `sermon_schedule` entry rather than modifying the original archived one.
2. **Overlapping sermons on the same date and time:** A user schedules two sermons at the same time on the same date. The system must display both on the calendar (no hard block) but show a visual warning indicator: "Multiple sermons scheduled at this time" on the relevant date cell.
3. **Series with no end date:** A user creates a series without specifying an end date (for an open-ended series). The series week grid must not auto-generate rows in this case and instead prompt the user to add weeks manually one at a time.
4. **Deleted series:** When a series is deleted, the `series_id` on all linked `sermon_schedule` entries must be set to null. The sermons remain on the calendar as standalone entries. The series_weeks rows must cascade delete.
5. **iCal subscription token compromise:** If a user suspects their subscription link has been shared without authorization, they must be able to revoke it from calendar settings. Revoking immediately returns 401 on the subscription URL.
6. **User with no past sermons in Archive:** The Archive view must display a clear empty state: "Your preached sermons will appear here. Sermons are archived automatically after their scheduled date passes." Stats must show all zeros without causing display errors.
7. **Chapter not yet assigned a Scripture reference:** Many entries will have empty `scripture_refs` arrays. The stats query for "most referenced Scripture book" must handle empty arrays without throwing a database error and simply exclude those entries from the count.
8. **Long sermon title overflow:** A sermon with a 200-character title must be gracefully truncated in the calendar event chip with an ellipsis. The full title must be visible in the popover detail view.
9. **Series start date in the past:** A user creates a series with a start date that has already passed (e.g., planning retroactively). The system must allow this. Past weeks in the series grid should be visually flagged as "Past due" if no sermon has been linked to them.
10. **Calendar timezone differences:** A pastor who travels internationally and schedules a sermon at a specific time must see consistent dates and times regardless of which timezone their device reports. All dates must be stored as DATE (not TIMESTAMPTZ) for `scheduled_date` and as TIME (local, no timezone) for `time_slot`, since sermon scheduling is always local to the church's location, not the device's timezone.

---

## Dependencies

- **PRD-01 (Project Foundation):** `projects` table with the `role` field must exist and be populated correctly.
- **PRD-02 (Project Creation Flow):** The Preacher/Pastor/Speaker role must be selectable at project creation. The role value stored in the database must match the check used to gate calendar access.
- **PRD-03 (Writing Interface):** `chapters` table must exist for sermon-to-chapter linking.
- **PRD-11 (Content Repurposing Engine):** The "Repurpose this sermon" action from the Archive view requires PRD-11 to be built first. The Archive link must be hidden or disabled until PRD-11 is available.
- **iCal library:** A server-side .ics generation library must be selected and evaluated (recommended: `ical-generator` for Node.js). Must be confirmed RFC 5545 compliant before implementation.
- **Drag-and-drop:** A drag-and-drop library for the calendar (e.g., `@dnd-kit/core` or integrating with a calendar component like `react-big-calendar`) must be evaluated and selected before sprint start.
- **Supabase full-text search:** The `pg_trgm` or `to_tsvector` approach for Archive search must be confirmed compatible with the active Supabase Postgres version.

---

## Out of Scope (v1)

- Shared team calendars (multiple users viewing the same pastor's calendar is not supported in v1; this follows the collaboration feature in PRD-20).
- Integration with church management systems (e.g., Planning Center, Church Community Builder).
- Automated sermon recording or podcast feed generation.
- Liturgical calendar overlays (Advent, Lent dates, lectionary references) — planned for v2.
- Notes or tasks attached to calendar events beyond the `notes` field.
- The Sermon Calendar for non-Preacher roles (e.g., a content calendar for Authors) — this is a separate feature concept.
