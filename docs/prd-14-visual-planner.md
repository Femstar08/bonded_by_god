# PRD-14: Visual Chapter Planner

## Overview

The Visual Chapter Planner gives Scriptloom users a drag-and-drop board interface for planning and organising the structure of their writing projects. It provides two view modes — a Board View (Kanban-style columns per chapter) and a Cork Board View (spatial card grid) — that sit alongside the existing chapter list as an alternative planning surface. This feature directly targets the book-writing audience currently loyal to Scrivener's cork board, while adding AI-aware status tracking that Scrivener cannot offer.

## Problem Statement

Scrivener's cork board is one of the most beloved features in book-writing software: it lets authors visualise their project as a set of moveable cards rather than a linear list. However, Scrivener has no cloud sync, no AI, and a dated interface. Dabble offers a Plot Grid, but neither product serves Christian ministry writers.

Scriptloom currently has a linear chapter sidebar and a Writing Map, but no spatial, visual way to plan structure. Authors who think visually — particularly those writing multi-chapter books or structured devotionals — have no way to see the shape of their manuscript at a glance. This gap causes churn among authors who keep Scrivener open alongside Scriptloom.

The Visual Chapter Planner closes that gap and strengthens Scriptloom's position as a complete writing environment.

---

## User Stories

1. As a Christian author writing a multi-chapter book, I want to see all my chapters as cards on a board so that I can understand the shape and balance of my manuscript at a glance.

2. As an author, I want to drag chapters into a different order so that I can restructure my book without navigating file-by-file.

3. As a preacher planning a sermon series, I want to see columns per sermon with sections inside each column so that I can plan the flow of a full series on one screen.

4. As an author, I want to mark each chapter with a status (Not Started, In Progress, Draft, Revision, Complete) so that I know exactly where my manuscript stands.

5. As an author, I want to add a synopsis to each chapter card so that I can remember what each chapter is meant to accomplish without opening it.

6. As an author, I want to add a colour label to each card so that I can visually group thematically related chapters.

7. As an author, I want to click a card and jump directly to that chapter in the editor so that the planner and the writing interface are connected.

8. As an author using a tablet, I want to touch-drag cards to reorder them so that the planner is fully functional on my iPad.

9. As an author, I want to create a new chapter directly from the board without going back to the chapter list so that I can stay in planning mode.

10. As a devotionalist, I want to see a progress bar showing what percentage of chapters are in each status so that I can gauge how close the project is to completion.

11. As an author, I want to filter cards by status so that I can focus on only the chapters that need attention.

12. As an author, I want to search card titles on the board so that I can locate a specific chapter in a large project quickly.

---

## Detailed Requirements

### Functional Requirements

**View Access and Navigation**
1. The planner must be accessible from the project editor page via a view toggle control that switches between the default chapter list view and the Visual Planner view.
2. The planner state (selected view mode: Board or Cork Board) must persist for the user per project using localStorage so the user returns to the same view mode on their next visit.
3. The planner must display chapters belonging to the currently open project only.

**Board View (Kanban)**
4. Board View must render one column per chapter. Each column header displays the chapter title and total word count for that chapter.
5. Each column must contain one card per section belonging to that chapter.
6. Section cards must display: section title, status badge, synopsis (truncated to two lines), and word count.
7. Sections must be draggable within a column (reorder within chapter) and between columns (move section to a different chapter). On drop, the `position` field of affected sections must be updated in the database, and if a section moves to a new chapter, its `chapter_id` must be updated.
8. Columns (chapters) must be horizontally draggable to reorder. On drop, the `position` field of all affected chapters must be updated in the database.
9. An "Add Section" button at the bottom of each column must open an inline quick-add form accepting: section title (required) and initial status (defaults to "Not Started").
10. An "Add Chapter" button at the far right of the column row must create a new chapter with a default title and open it for inline renaming.

**Cork Board View**
11. Cork Board View must render one card per chapter in a responsive grid (minimum two columns on mobile, four columns on desktop).
12. Each chapter card must display: chapter title (editable inline on double-click), synopsis (editable inline, max 300 characters), word count badge, status badge, colour label strip along the left edge of the card.
13. Cards must be draggable to reorder. On drop, the `position` field of affected chapters must be updated in the database.
14. A colour picker accessed from a card's context menu (three-dot button) must allow the user to assign one of eight preset colour labels (none, red, orange, yellow, green, teal, blue, purple). This value must be stored in `color_label` on the chapters record.
15. An "Add Chapter" button (styled as an empty card with a plus icon) must be the last item in the grid.

**Status System**
16. Chapter status must support five values: Not Started, In Progress, Draft, Revision, Complete. This is a superset of the existing section status values and must be stored as a new `status` column on `ltu_chapters`.
17. Status must be changeable from a dropdown on any card in both view modes.
18. Status changes must be persisted to the database immediately (no save button required).
19. A progress bar strip at the top of the planner must show a segmented bar where each segment represents the proportion of chapters in each status. Each status must have a distinct colour. The word count for each status group must also be shown below the bar (e.g., "Draft: 3 chapters, 8,420 words").

**Card Detail Panel**
20. Clicking the expand icon on any chapter card must open a right-side slide-over panel containing: full editable synopsis, status selector, colour label picker, word goal field, list of sections with their statuses, and a "Go to Editor" button.
21. Changes made in the slide-over panel must auto-save with a 600ms debounce.

**Filtering and Search**
22. A status filter control (multi-select chips) must allow the user to hide cards not matching selected statuses. All statuses are shown by default.
23. A search input must filter visible cards to those whose title or synopsis contains the search string. Filtering is client-side and must update in real time.
24. When filters are active, a "Clear filters" button must appear.

**Navigation to Editor**
25. Clicking the card title or the "Go to Editor" button on any chapter card must navigate the user to the editor with that chapter pre-selected (`/editor/[projectId]?chapter=[chapterId]`).

**Touch and Tablet Support**
26. Drag-and-drop must work on touch devices using the @dnd-kit/core touch sensor. Touch drag must be activated after a 200ms press-hold to prevent conflict with scroll gestures.

### Non-Functional Requirements

27. Drag interactions must respond within 16ms (one frame at 60fps) to maintain visual continuity.
28. Saving a reordered batch of positions must complete within 2 seconds on a standard connection. Optimistic UI must be used: the board updates immediately and reverts on failure.
29. The planner must be accessible: all interactive elements must be keyboard navigable. @dnd-kit provides keyboard drag-and-drop by default; this must not be disabled.
30. The planner must render correctly on screens from 375px (mobile) to 2560px (large desktop). On screens narrower than 768px, Board View must scroll horizontally and Cork Board View must collapse to two columns.
31. All text inputs (inline title edits, synopsis edits) must be WCAG 2.1 AA compliant for colour contrast.
32. The planner must not load chapter body content — only metadata (title, synopsis, status, word count, color label, position) — to keep initial load performant on projects with 30+ chapters.

---

## UI/UX Specification

### Entry Point

The editor page (`/editor/[projectId]`) currently shows a chapter list in the left sidebar. A toggle control is added to the top of the sidebar with two icons: a list icon (current view) and a grid/board icon (Visual Planner). Clicking the grid icon expands the planner as a full-width overlay panel that slides over the editor canvas while keeping the top navigation visible.

### Planner Header

```
[ Project Title ]                         [ Board View | Cork Board ]  [ Filter by Status v ]  [ Search... ]

Progress: [Not Started 20%][In Progress 10%][Draft 40%][Revision 15%][Complete 15%]
          Chapter totals by status shown as subtitle row
```

### Board View Layout

```
| Chapter 1          | Chapter 2          | Chapter 3          | [+ Add Chapter]
| 3,240 words        | 1,800 words        | 4,100 words        |
|--------------------|--------------------|---------------------|
| [Section Card]     | [Section Card]     | [Section Card]     |
| [Section Card]     | [Section Card]     |                    |
| [+ Add Section]    | [+ Add Section]    | [+ Add Section]    |
```

Section card anatomy:
```
+---------------------------+
| [STATUS BADGE]      [...]  |
| Section Title              |
| Synopsis text truncated... |
| [word count]               |
+---------------------------+
```

### Cork Board View Layout

```
+----------+ +----------+ +----------+ +----------+
| [color]  | | [color]  | | [color]  | | [color]  |
|          | |          | |          | |          |
| Chapter  | | Chapter  | | Chapter  | | Chapter  |
| Title    | | Title    | | Title    | | Title    |
|          | |          | |          | |          |
| Synopsis | | Synopsis | | Synopsis | | Synopsis |
| text...  | | text...  | | text...  | | text...  |
|          | |          | |          | |          |
| [STATUS] | | [STATUS] | | [STATUS] | | [STATUS] |
| 2,140 w  | | 3,800 w  | | 1,200 w  | |    + New |
+----------+ +----------+ +----------+ +----------+
```

### Slide-Over Detail Panel (right side, 380px wide)

```
Chapter Title [edit inline]
Status: [Dropdown]
Colour: [8-colour swatch picker]
Word Goal: [number input]

Synopsis:
[Textarea — full editable]

Sections in this chapter:
  - Introduction [Draft]
  - Main Point 1 [Not Started]
  - Application [Not Started]

[Go to Editor ->]
```

### Colour Labels

| Label | Hex |
|-------|-----|
| None | -- |
| Red | #E57373 |
| Orange | #FFB74D |
| Yellow | #FFF176 |
| Green | #81C784 |
| Teal | #4DB6AC |
| Blue | #64B5F6 |
| Purple | #BA68C8 |

Colour is shown as a 6px left-border strip on Cork Board cards and a coloured left-border indicator on Board View column headers.

---

## Data Model

### Migration: `011_visual_planner.sql`

```sql
-- Add visual planner columns to ltu_chapters
ALTER TABLE ltu_chapters
  ADD COLUMN status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'draft', 'revision', 'complete')),
  ADD COLUMN synopsis TEXT DEFAULT '',
  ADD COLUMN color_label TEXT DEFAULT NULL
    CHECK (color_label IN ('red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple') OR color_label IS NULL);

-- Add synopsis to sections (sections already have status)
ALTER TABLE ltu_sections
  ADD COLUMN synopsis TEXT DEFAULT '';

-- Index for status-based queries on chapters
CREATE INDEX idx_ltu_chapters_status ON ltu_chapters(project_id, status);
```

### Updated TypeScript Types

`Chapter` type additions:
```typescript
status: 'not_started' | 'in_progress' | 'draft' | 'revision' | 'complete'
synopsis: string
color_label: 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | null
```

`Section` type additions:
```typescript
synopsis: string  // already has status, summary, notes — synopsis is distinct as the planning-level descriptor
```

---

## API Routes

### Existing routes that will be called by the planner

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chapters` | GET | Fetch all chapters with metadata (exclude body content — select specific columns) |
| `/api/chapters/[id]` | PATCH | Update status, synopsis, color_label, position, word_goal |
| `/api/chapters` | POST | Create new chapter |
| `/api/chapters/[id]` | DELETE | Delete chapter |
| `/api/sections` | GET | Fetch sections by chapter_id |
| `/api/sections/[id]` | PATCH | Update section status, synopsis, position, chapter_id |
| `/api/sections` | POST | Create new section |

### New Route

**`GET /api/planner/[projectId]`**

Returns a lightweight payload for the planner — chapters with their sections nested, but without body content.

Request: `GET /api/planner/[projectId]`

Response:
```json
{
  "chapters": [
    {
      "id": "uuid",
      "title": "string",
      "position": 1,
      "status": "draft",
      "synopsis": "string",
      "color_label": "blue",
      "word_count": 2140,
      "word_goal": 3000,
      "sections": [
        {
          "id": "uuid",
          "title": "string",
          "position": 1,
          "status": "draft",
          "synopsis": "string",
          "word_count": 0
        }
      ]
    }
  ]
}
```

Note: `word_count` is derived by counting words in `content` server-side at query time, not stored. Consider caching this if projects grow beyond 50 chapters.

**`POST /api/planner/reorder`**

Batch-updates position for multiple chapters or sections in a single transaction.

Request body:
```json
{
  "type": "chapter" | "section",
  "updates": [
    { "id": "uuid", "position": 1 },
    { "id": "uuid", "position": 2 }
  ],
  "sectionChapterUpdate": {
    "sectionId": "uuid",
    "newChapterId": "uuid"
  }
}
```

Response: `{ "success": true }`

This route uses a Supabase transaction to ensure all position updates are atomic. If any update fails, all are rolled back and a 500 is returned, triggering the optimistic UI revert.

---

## AI Agent Integration

The Visual Chapter Planner is a planning and navigation surface, not an AI-generation surface. However, two integration points exist:

**1. Guide Agent — "What should I write next?"**

The Guide agent (`lib/agents/guide.ts`) currently evaluates section map data to suggest what section to write next. The planner should add a "Get Writing Advice" button per chapter card that calls the Guide agent with the chapter's synopsis, current status, and section list. The Guide agent returns a `writingPrompt` which is displayed in a tooltip or popover on the card.

**2. Scribe Agent — Synopsis Generation**

If a chapter has content but no synopsis, a "Generate Synopsis" button (shown in the slide-over panel) should call the Scribe agent in `draft` mode with the chapter content and request a 2-3 sentence synopsis. The returned text is pre-filled into the synopsis field for the user to edit before saving.

Integration point: `POST /api/orchestrate` with `{ agent: 'scribe', mode: 'synopsis', chapterId: 'uuid' }`.

---

## Acceptance Criteria

- [ ] Given a project with three or more chapters, when the user toggles to the Visual Planner, the Board View loads within 2 seconds and all chapters appear as columns.
- [ ] Given Board View is displayed, when the user drags a chapter column to a new position and releases, the chapter list order is updated both in the UI immediately and in the database within 2 seconds.
- [ ] Given Board View is displayed, when the user drags a section card from one chapter column to another, the section appears in the destination column and the database reflects the updated `chapter_id` and `position`.
- [ ] Given Cork Board View is displayed, when the user double-clicks a chapter title, it becomes an editable input; when the user presses Enter or clicks away, the new title is saved.
- [ ] Given a chapter card, when the user changes the status to "Complete", the card status badge updates immediately and the progress bar re-calculates.
- [ ] Given a chapter card in Cork Board View, when the user selects "Blue" from the colour picker, a blue left-border strip appears on the card.
- [ ] Given any chapter card, when the user clicks the chapter title or "Go to Editor" button, the editor opens with that chapter active.
- [ ] Given a project with ten chapters, when the user types "grace" in the search input, only chapters whose title or synopsis contains "grace" are visible; all others are hidden.
- [ ] Given a status filter is active showing only "Draft" chapters, when the user clears the filter, all chapters reappear.
- [ ] Given the planner on a tablet with touch input, when the user press-holds a card for 200ms and then drags, the drag interaction activates without triggering a page scroll.
- [ ] Given a chapter with existing content and no synopsis, when the user clicks "Generate Synopsis", the Scribe agent returns a summary that is pre-filled into the synopsis textarea.
- [ ] Given an empty chapter card (no sections), when the user clicks "Add Section", an inline form appears; submitting it creates the section and it appears in the board without a full page reload.
- [ ] Given the planner on a screen 375px wide, the Cork Board View renders two columns and the Board View is horizontally scrollable without layout breakage.

---

## Edge Cases

1. **Empty project (no chapters):** The planner must display an empty state message — "Your project has no chapters yet. Add your first chapter to start planning." — with an "Add Chapter" button.

2. **Single-chapter project:** Board View renders as a single column. The "Add Chapter" button remains visible to the right.

3. **Chapter with no sections:** In Board View, the column body is empty with only the "Add Section" button. This is valid; the column must not collapse.

4. **Drag to same position:** If a user drags and drops a card back to its original position, no API call is made (detect no positional change before firing the PATCH).

5. **Concurrent edits:** If a user has the planner open in two tabs and moves a chapter in one tab, the other tab will be out of sync until refreshed. There is no real-time sync in scope. The UI should show a "Refresh to see latest changes" banner if a write conflict is detected (HTTP 409 from the server).

6. **Very long synopsis:** The synopsis field accepts up to 300 characters. Input beyond this limit must be prevented client-side and validated server-side. The truncated display on cards must use CSS ellipsis rather than hard-cutting the string.

7. **Deleted chapter navigated from planner:** If a chapter is deleted while the planner is open (e.g., deleted from the sidebar in another tab), clicking "Go to Editor" for that chapter ID must gracefully handle a 404 and display a toast: "This chapter no longer exists."

8. **Reorder failure (network error):** If the batch reorder API call fails, the UI must revert to the pre-drag order and show an error toast: "Reorder could not be saved. Please try again."

9. **Project type mismatch:** The planner is available for all project types. For sermon projects, column labels should read "Sermon" and "Point" rather than "Chapter" and "Section" — derive this from the project `type` field.

10. **Large project (30+ chapters in Cork Board View):** Performance must be validated with 50 chapters. Virtualization (windowing) is not required in scope but the team should be aware that DOM card counts above 80 may require it in a follow-up.

---

## Dependencies

- Phase 1 (PRD-01 through PRD-04): Projects and chapters must exist.
- Phase 2 AI layer: Required only for the optional "Generate Synopsis" and "Get Writing Advice" integration points. The planner itself must function without AI.
- Writing Map (PRD-09/sections feature): `ltu_sections` table must exist (migration 009 already applied).
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`: Must be added to `package.json`.
- The existing `position` column on `ltu_chapters` and `ltu_sections` is sufficient for ordering; no schema changes to position are needed.

---

## Estimated Scope

**L (Large)**

Rationale: Two distinct view modes, a drag-and-drop system across two entity levels (chapters and sections), a batch-update API route with optimistic UI, a progress tracking component, inline editing, a slide-over panel, touch support, and two AI integration touch points. This is approximately 3-4 sprints of focused frontend work plus 1 sprint for the API and migration layer.
