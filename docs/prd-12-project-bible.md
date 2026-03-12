# PRD-12: Project Bible

## Overview

The Project Bible is a structured, per-project knowledge base that gives every AI agent a permanent, curated understanding of what a project is about — its theological positions, recurring themes, key figures, core Scripture references, audience profile, and tone notes. It replaces the loosely inferred context that agents currently build from chapter content alone, making all AI outputs dramatically more coherent and project-specific. It is Scriptloom's answer to Sudowrite's Story Bible and Dabble's Plot Grid, built for the faith-writing context.

## Problem Statement

Scriptloom's AI agents currently rely on `ProjectContext` — assembled dynamically from the project record, chapter content, and style profile — to understand what a project is about. This works for individual writing sessions but has two critical weaknesses: (1) context is shallow and does not survive across sessions reliably, and (2) agents have no structured knowledge of the author's theological commitments, recurring motifs, or intended audience. When a preacher writes a 40-chapter sermon series, the AI has no memory that Reformed soteriology is a core doctrinal commitment, that "covenant faithfulness" is the recurring theme, or that the audience is working-class Black church members. The Project Bible solves this by giving the author a permanent place to record these facts, and by injecting that knowledge into every AI prompt. Sudowrite's Story Bible is cited by fiction writers as one of that product's most valuable features. No competitor in the faith-writing space offers an equivalent.

---

## User Stories

1. As a Christian author, I want to record my book's core theological positions in a structured panel, so that the AI never suggests content that contradicts my doctrinal commitments.

2. As a preacher, I want to store my sermon series' key Scripture references in a central place, so that the AI can reference them consistently across all chapters and avoid redundancy.

3. As a Bible study leader, I want to describe my audience profile in the Project Bible, so that all AI-generated discussion questions are pitched at the right level for my group.

4. As any user, I want to add custom notes to the Project Bible, so that I can store any project-specific guidance that does not fit the predefined categories.

5. As a devotionalist, I want to record the recurring themes of my devotional series, so that the AI weaves those motifs naturally throughout all generated content.

6. As an author, I want to use AI to scan my existing chapters and automatically extract candidate Project Bible entries, so that I do not have to manually re-enter what I have already written.

7. As any user, I want to search across all Project Bible entries, so that I can quickly find a specific piece of recorded context without scrolling through every category.

8. As a preacher, I want to add Scripture references to specific Project Bible entries (not just to Core Scripture References), so that each theological position or theme is grounded in a specific passage.

---

## Detailed Requirements

### Functional Requirements

1. A "Project Bible" panel is accessible via a dedicated tab in the editor's left or right sidebar. The tab label is "Bible" with a book icon. It is visible in all projects regardless of type or role.

2. The Project Bible is organised into the following fixed categories:
   - Theological Positions — key doctrines, beliefs, and stances the work will take
   - Themes — recurring motifs, metaphors, or spiritual ideas
   - Key Figures — real or composite characters, historical persons, or biblical figures referenced
   - Core Scripture References — the primary passages the project is built around
   - Audience Profile — description of who the writing is for (age, faith level, cultural context, needs)
   - Tone and Voice Notes — how this project should sound (separate from the Style Profile, which is stylistic; these are intentional tone choices, e.g. "pastorally warm, never academic")
   - Custom Notes — a free-form category for anything that does not fit above

3. Each category section is displayed as a collapsible card group. Sections are collapsible individually.

4. Within each category, entries are displayed as structured cards with: title, content description, optional Scripture references, and created/updated timestamp.

5. Full CRUD operations are available on all entries:
   - Create: an "Add Entry" button within each category opens an inline form
   - Read: entries are displayed as cards within their category section
   - Update: clicking an entry card opens an edit drawer or inline edit form
   - Delete: a Delete option within the entry's three-dot menu, with a confirmation dialog

6. The entry creation/edit form contains:
   - Title field (required, max 100 characters)
   - Description/content textarea (required, max 2,000 characters)
   - Scripture references field (optional, accepts comma-separated references in any standard format, e.g. "John 3:16, Romans 8:28")
   - Sort order is automatically assigned as the next available integer within the category; manual drag-to-reorder is out of scope for this PRD

7. A search input at the top of the Project Bible panel queries across all entry titles and content descriptions in real time (client-side filter on loaded data; no separate API call required for search).

8. An "Auto-Extract" action is available at the top of the Project Bible panel. When triggered, it calls the AI to scan all existing chapter content and return candidate entries for each category. Results are shown in a review modal where the user can accept or reject each suggestion individually before any entries are created.

9. All AI agents automatically receive a formatted Project Bible context block injected into their prompts, assembled by a new `formatProjectBibleForPrompt` utility function. This block is inserted into `formatContextForPrompt` in `lib/ai/context.ts` when Project Bible data is present.

10. The Project Bible context injected into AI prompts is capped at 1,500 tokens to prevent context window overflow. If the total Project Bible content exceeds this cap, entries are prioritised in the following order: Theological Positions, Core Scripture References, Themes, Audience Profile, Tone and Voice Notes, Key Figures, Custom Notes. Entries within each category are included in sort order until the cap is reached.

11. The entry count per category is displayed as a badge on the category header.

12. An entry with no content (empty title or empty description) cannot be saved; the form validates on submission.

13. Project Bible entries are project-scoped. They are not shared across projects.

14. All data operations require the authenticated user to own the project (enforced via RLS policies).

### Non-Functional Requirements

1. The Project Bible panel must load within 1 second for projects with up to 100 total entries.
2. The search filter must respond in under 100ms (client-side filtering).
3. Creating or updating an entry must persist within 500ms under normal network conditions.
4. The Auto-Extract AI call must complete within 45 seconds for a project with up to 50,000 words of chapter content.
5. The panel must be fully functional on viewports of 768px width and above.
6. All database operations must respect Row Level Security policies.

---

## UI/UX Specification

### Panel Location

The Project Bible panel appears as a tab in the editor's right sidebar (alongside the existing Insights, Chat, and Writing Journey tabs). The tab uses a book/scroll icon. On smaller screens, the sidebar is accessible via a toggle button.

### Panel Layout

At the top of the panel:
- Panel title: "Project Bible" in Playfair Display
- Subtitle: "[N] entries across [N] categories"
- Search input: a text field with a search icon, full panel width
- "Auto-Extract" button: secondary style, positioned to the right of the search input

Below the header, seven collapsible category sections are listed. Each section header shows:
- Category icon (unique per category)
- Category name
- Entry count badge
- Collapse/expand chevron

Within each expanded category:
- Entry cards in a vertical list
- Each card shows: title (bold), first 80 characters of description (truncated), Scripture refs as small pills (if any)
- "Add Entry" button at the bottom of each category's card list

### Entry Edit Drawer

Clicking an entry card or the "Add Entry" button opens a right-side drawer (not a full modal). The drawer contains:
- Category label at the top
- Title input
- Description textarea (auto-resizing)
- Scripture references input with validation hint
- Save and Cancel buttons at the bottom
- A Delete option in the drawer's header (for existing entries only)

### Auto-Extract Review Modal

After the AI returns candidate entries, a modal opens titled "Review Extracted Entries". Entries are grouped by category. Each candidate entry shows: suggested title, suggested description, suggested Scripture refs (if any). Each candidate has an "Accept" button (adds it to the Project Bible) and a "Dismiss" button (discards it). An "Accept All" button at the top accepts every suggestion at once. A progress indicator shows how many have been accepted.

### User Flow — Creating an Entry Manually

1. User opens the editor and clicks the "Bible" tab in the sidebar
2. User scrolls to the desired category (e.g. "Theological Positions")
3. User clicks "Add Entry"
4. Entry drawer opens; user fills in title, description, and optional Scripture refs
5. User clicks Save
6. New entry card appears in the category section; entry count badge increments

### User Flow — Auto-Extract

1. User has written several chapters and opens the Project Bible panel
2. User clicks "Auto-Extract"
3. A loading overlay appears: "Reading your chapters..."
4. AI returns candidate entries; review modal opens
5. User accepts relevant entries and dismisses irrelevant ones
6. Accepted entries are added to the Project Bible
7. Modal closes; panel updates with the new entries

---

## Data Model

### New Table: ltu_project_bible_entries

```sql
CREATE TABLE ltu_project_bible_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES ltu_projects(id) ON DELETE CASCADE,
  category        TEXT NOT NULL
                    CHECK (category IN (
                      'theological_positions',
                      'themes',
                      'key_figures',
                      'core_scriptures',
                      'audience_profile',
                      'tone_voice_notes',
                      'custom_notes'
                    )),
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  scripture_refs  TEXT[] DEFAULT '{}',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_ltu_project_bible_project_id
  ON ltu_project_bible_entries(project_id);

CREATE INDEX idx_ltu_project_bible_category
  ON ltu_project_bible_entries(project_id, category);

-- Full-text search index for future server-side search support
CREATE INDEX idx_ltu_project_bible_fts
  ON ltu_project_bible_entries
  USING GIN(to_tsvector('english', title || ' ' || content));
```

### RLS Policies

```sql
ALTER TABLE ltu_project_bible_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project bible entries"
  ON ltu_project_bible_entries FOR SELECT
  USING (project_id IN (
    SELECT id FROM ltu_projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own project bible entries"
  ON ltu_project_bible_entries FOR INSERT
  WITH CHECK (project_id IN (
    SELECT id FROM ltu_projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own project bible entries"
  ON ltu_project_bible_entries FOR UPDATE
  USING (project_id IN (
    SELECT id FROM ltu_projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own project bible entries"
  ON ltu_project_bible_entries FOR DELETE
  USING (project_id IN (
    SELECT id FROM ltu_projects WHERE user_id = auth.uid()
  ));
```

### Updated Trigger

```sql
CREATE TRIGGER set_updated_at_project_bible_entries
  BEFORE UPDATE ON ltu_project_bible_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Migration File

New file: `supabase/migrations/011_project_bible.sql`

### New TypeScript Type (types/database.ts)

```typescript
export type ProjectBibleCategory =
  | 'theological_positions'
  | 'themes'
  | 'key_figures'
  | 'core_scriptures'
  | 'audience_profile'
  | 'tone_voice_notes'
  | 'custom_notes'

export type ProjectBibleEntry = {
  id: string
  project_id: string
  category: ProjectBibleCategory
  title: string
  content: string
  scripture_refs: string[]
  sort_order: number
  created_at: string
  updated_at: string
}
```

### Changes to ProjectContext (lib/ai/context.ts)

Add an optional field:

```typescript
export type ProjectContext = {
  // ...existing fields...
  projectBible?: ProjectBibleEntry[]
}
```

---

## API Routes

### GET /api/project-bible?projectId=[id]

Returns all Project Bible entries for a given project, grouped by category.

Response:
```json
{
  "entries": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "category": "theological_positions",
      "title": "string",
      "content": "string",
      "scripture_refs": ["Romans 8:28"],
      "sort_order": 0,
      "created_at": "ISO string",
      "updated_at": "ISO string"
    }
  ]
}
```

### POST /api/project-bible

Creates a new Project Bible entry.

Request body:
```json
{
  "project_id": "uuid",
  "category": "themes",
  "title": "string",
  "content": "string",
  "scripture_refs": ["John 15:5"]
}
```

Response: the created entry object.

### PATCH /api/project-bible/[id]

Updates an existing entry. Accepts partial fields (title, content, scripture_refs, sort_order).

### DELETE /api/project-bible/[id]

Deletes an entry. Returns 204 on success.

### POST /api/project-bible/extract

Triggers the AI auto-extraction scan. Accepts the project ID. The server fetches all chapter content for that project, builds the extraction prompt, calls the AI, and returns candidate entries grouped by category.

Request body:
```json
{ "project_id": "uuid" }
```

Response:
```json
{
  "candidates": [
    {
      "category": "themes",
      "title": "Covenant Faithfulness",
      "content": "The project consistently returns to the idea that God's faithfulness is covenant-based, not conditional on human performance.",
      "scripture_refs": ["Lamentations 3:22-23", "Hebrews 10:23"]
    }
  ]
}
```

---

## AI Agent Integration

### New Utility: formatProjectBibleForPrompt

A new pure function added to `lib/ai/context.ts`:

```typescript
function formatProjectBibleForPrompt(entries: ProjectBibleEntry[]): string
```

This function groups entries by category, formats each as a labelled block, and returns a structured text section titled "PROJECT BIBLE" to be inserted into the full context prompt. The function respects the 1,500-token cap by truncating lower-priority categories.

### Context Injection into All Agents

`buildProjectContext` in `lib/ai/context.ts` accepts an optional `projectBible` parameter. When present, `formatContextForPrompt` calls `formatProjectBibleForPrompt` and inserts the result between the "BOOK CONTEXT" section and the "CHAPTER CONTEXT" section, so agents see:

1. BOOK CONTEXT
2. PROJECT BIBLE (new)
3. AUTHOR STYLE PROFILE
4. CHAPTER CONTEXT
5. BOOK MEMORY
6. RECENT WRITING CONTEXT
7. CONTINUITY RULES

This ensures all existing agents — Scribe, Interpreter, Refiner, Shepherd, Researcher, Guide — automatically benefit from Project Bible context without any individual agent changes.

### New Agent Behaviour: Auto-Extract

A new function `runProjectBibleExtractor` is added, likely as a method in a new agent file `lib/agents/extractor.ts` or as an additional mode in an existing agent. The extractor receives all chapter content and the project context, then returns candidate entries structured as JSON matching the `ProjectBibleEntry` shape (minus database-generated fields).

The extractor's system prompt instructs the AI to:
- Read the chapter content as a whole
- Identify theological positions taken or implied
- Identify recurring themes and motifs
- Identify key figures mentioned
- Identify the most frequently referenced or foundational Scripture passages
- Infer the target audience from tone and vocabulary
- Note any strong tone or voice characteristics

The AI must return ONLY a JSON array of candidate entries. The prompt enforces a maximum of 5 candidate entries per category.

---

## Acceptance Criteria

- [ ] Given a project is open in the editor, when the user clicks the "Bible" tab in the sidebar, then the Project Bible panel loads and displays all seven category sections.
- [ ] Given the Project Bible panel is open, when the user clicks "Add Entry" in the Themes category, then a drawer opens with a form containing title, description, and Scripture refs fields.
- [ ] Given the entry form is open and the user submits without a title, then the form shows a validation error and does not save.
- [ ] Given an entry is saved, when the user reloads the page, then the entry persists and is visible in the correct category.
- [ ] Given an entry exists, when the user clicks Delete on the entry and confirms, then the entry is removed from the panel and the category entry count decrements.
- [ ] Given the search input contains text, when entries are displayed, then only entries whose title or description contain the search string are shown (case-insensitive).
- [ ] Given the user clicks "Auto-Extract" on a project with at least 2 chapters of content, then within 45 seconds the review modal opens showing candidate entries grouped by category.
- [ ] Given the review modal is open, when the user clicks "Accept" on a candidate, then that entry is saved to the database and the card changes to a confirmed state.
- [ ] Given the user clicks "Accept All", then all displayed candidates are saved to the database and a success toast appears.
- [ ] Given a project has Project Bible entries, when any AI agent action is triggered (expand, continue, revise, etc.), then the AI response reflects the theological positions and themes recorded in the Project Bible (demonstrable by the AI not contradicting a recorded doctrinal position).
- [ ] Given a project has more Project Bible content than the 1,500-token cap allows, when an AI action is triggered, then Theological Positions and Core Scriptures entries are always included and lower-priority categories are truncated.
- [ ] Given a user who does not own a project attempts to call GET /api/project-bible?projectId=[id], then the response is 401 or 403.
- [ ] Given an entry's category is updated via PATCH, then the entry moves to the correct category section in the panel on next load.

---

## Edge Cases

1. **Empty project (no chapters yet).** The Auto-Extract button is disabled if the project has zero chapters or all chapters are empty (total word count less than 50). A tooltip reads: "Write at least one chapter before auto-extracting."

2. **AI extracts no candidates.** If the extractor returns an empty array, the review modal shows a message: "No entries were found automatically. Try adding a few paragraphs of substantial content and run Auto-Extract again."

3. **User attempts to add a duplicate entry.** There is no database-level uniqueness constraint on (project_id, category, title) because slight variations may be intentional. However, when saving, the API checks for an exact title match within the same category and warns: "An entry with this title already exists in this category. Save anyway?" This is a soft warning, not a hard block.

4. **Very long entry content.** The content textarea enforces a 2,000-character limit client-side. If a user attempts to paste content exceeding this, it is truncated and a character count indicator turns red.

5. **Project Bible context pushes total prompt over Claude's context window.** The 1,500-token cap on Project Bible injection is the primary mitigation. If a project also has extremely long chapter content in `recentContent`, the system prioritises Project Bible context over recent content by reducing the `recentContentLength` parameter passed to `buildProjectContext` by an amount proportional to the Project Bible token count.

6. **User deletes the last entry in a category.** The category section remains visible but shows an empty state with the "Add Entry" button, rather than hiding the section. Hiding sections would make the UI feel unstable.

7. **Auto-extract runs while the user is mid-way through a writing session.** The auto-extract result only adds new entries; it never deletes or overwrites existing entries. The user is in full control of what gets accepted.

8. **Scripture reference field receives an unrecognised format.** The scripture_refs field is stored as plain text strings. No validation or normalisation of reference format is applied in this PRD. References are injected into prompts as-is. A future PRD can add reference parsing using the Bible Translation Comparison infrastructure.

9. **Project has many entries (100+) causing panel to be slow.** The panel loads all entries for the project in a single API call on mount. For projects with more than 100 entries, entries are paginated per category (25 per page per category). The search function queries only loaded entries in the current phase; a future PRD can add server-side full-text search using the GIN index already provisioned.

---

## Dependencies

- Phase 2 AI Layer must be complete: `lib/ai/context.ts`, `buildProjectContext`, and `formatContextForPrompt` must be stable before Project Bible context injection can be wired in.
- The Anthropic API integration must be operational for Auto-Extract.
- `ltu_projects` and `ltu_chapters` tables must exist and be stable (migrations 001 and 004).
- The editor's right sidebar component must have a tab navigation system capable of hosting a new "Bible" tab.

---

## Estimated Scope

**L**

Rationale: A new database table with full CRUD and RLS. Seven-category structured UI panel with collapsible sections, an entry drawer, and a search filter. One new AI agent prompt (extractor). Integration of Project Bible context into the existing `formatContextForPrompt` pipeline. An Auto-Extract review modal. The scope is large but well-bounded — there is no complex state synchronisation (entries are saved immediately to the database) and no streaming required.
