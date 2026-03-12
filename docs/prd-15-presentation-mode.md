# PRD-15: Presentation Mode

## Overview

Presentation Mode is a dedicated full-screen delivery view for preachers, teachers, and speakers using Scriptloom. It transforms a written sermon or teaching into a clean teleprompter view with auto-scroll, a configurable timer, font size controls, a speaker notes overlay, and an audio recorder — giving ministry leaders everything they need to rehearse and deliver from within the app they already write in. This feature completes the end-to-end preacher workflow: write, rehearse, deliver.

## Problem Statement

SermonAI's "Preaching Mode" is one of its most-cited selling points, offering a timer and clean delivery view. Scriptloom's preachers currently write their sermons in the editor but must leave the app to use a teleprompter or timer, breaking the workflow.

No competitor in the faith space combines teleprompter + adjustable-speed auto-scroll + countdown timer + voice recording in one tool. Preachers who find and use Presentation Mode have a strong incentive to keep both their writing and their delivery workflow inside Scriptloom, dramatically improving retention.

Additionally, voice recordings of actual delivery provide valuable feedback material that preachers want to review alongside their manuscript — a use case no current competitor addresses.

---

## User Stories

1. As a preacher, I want to enter a clean full-screen view of my sermon so that I can rehearse without the distraction of editor menus and panels.

2. As a preacher rehearsing a sermon, I want the text to scroll automatically at an adjustable speed so that I can maintain eye contact with my notes without manually scrolling.

3. As a preacher, I want a countdown timer visible during delivery so that I know how much time remains before my sermon needs to conclude.

4. As a preacher, I want the timer to give me visual warnings at 5 minutes, 2 minutes, and 1 minute remaining so that I can pace my delivery accordingly.

5. As a preacher, I want to increase or decrease font size during presentation so that I can read comfortably from a distance if presenting from a laptop or external monitor.

6. As a preacher, I want to see visual markers when I move between sections so that I know where I am in the sermon structure.

7. As a preacher, I want to record my rehearsal audio so that I can listen back and improve before Sunday.

8. As a preacher, I want a small floating notes panel during delivery for private speaker notes that are not part of the main text so that I have cues visible without them appearing in the main script.

9. As a preacher, I want keyboard shortcuts for all core controls so that I can control the presentation without looking down at the keyboard.

10. As a preacher, I want to exit Presentation Mode and return to my exact editing position so that there is no disruption to my writing workflow.

11. As a Bible study leader, I want to access Presentation Mode for my teaching notes so that I can use the same delivery tools for small group sessions.

12. As a preacher, I want to see my past recordings linked to the chapter they were made in so that I can compare recordings across rehearsal sessions.

---

## Detailed Requirements

### Functional Requirements

**Access and Entry**
1. A "Present" button must appear in the editor toolbar. The button is visible when the active project type is `sermon`, `bible_study`, or `article` (any role where delivery is relevant). It must not appear for `book` or `devotional` project types unless the user's role is `preacher` or `bible_study_leader`.
2. Clicking "Present" must enter full-screen mode for the current chapter's content. If the browser Full Screen API is available, it must be invoked automatically. If unavailable (e.g., iOS Safari), the view must take up 100vw × 100vh and hide all other UI.
3. Presentation Mode must load only the active chapter. If the user wants to present a different chapter, they must switch chapters in the editor first and then click "Present".

**Teleprompter View**
4. The content must be displayed in a clean, high-contrast view. Default: large white text on a near-black background (`#0A0A0A`). Font must be the project's heading font (Playfair Display for headings, Inter for body paragraphs).
5. Default font size must be 28px. The user must be able to increase or decrease in steps of 4px, from a minimum of 16px to a maximum of 60px. Font size preference must be persisted in localStorage per user.
6. Content must be formatted with generous line-height (1.8) and a maximum content width of 800px centred on screen, to reduce eye travel.
7. Scripture blocks within the content must be visually distinguished: indented, in a slightly smaller font, with a gold left-border consistent with the app's scripture styling.
8. Section markers (derived from `ltu_sections` for the active chapter) must appear as a thin horizontal divider line with the section title centred in gold text, interrupting the content flow at the correct position.

**Auto-Scroll**
9. Auto-scroll must be off by default when Presentation Mode is entered. The user starts scroll by pressing Space or clicking the Play button in the control bar.
10. Scroll speed must be adjustable from 1 (very slow) to 10 (fast), defaulting to 3. Speed is adjusted by pressing the Up Arrow (faster) or Down Arrow (slower) keys, or by using a speed slider in the control bar.
11. The scroll speed must translate to a CSS `scrollBy` interval: speed 1 = 1px every 80ms, speed 10 = 1px every 8ms (smooth linear scroll). All scroll steps must use `requestAnimationFrame` for performance.
12. Scroll can be paused at any time by pressing Space again. A pause indicator (II icon) must be displayed in the control bar.
13. The user must be able to manually scroll (mouse wheel or touch swipe) at any time, whether auto-scroll is running or paused. Manual scroll does not stop auto-scroll; it adjusts the position and continues from there.

**Timer**
14. The timer control must support two modes: Count Up (0:00 → ∞) and Count Down (target duration → 0:00). The mode is selected before starting via a toggle in the control bar.
15. For Count Down mode, the user must set a target duration. The default must be 30 minutes. Duration must be configurable from 1 minute to 120 minutes in 1-minute increments.
16. The timer display must always be visible in the control bar at the bottom of the screen. Font size of the timer must be at least 32px.
17. Warning states for Count Down mode:
    - At 5 minutes remaining: timer text turns amber (`#F59E0B`).
    - At 2 minutes remaining: timer text turns orange (`#EA580C`).
    - At 1 minute remaining: timer text turns red (`#DC2626`) and the control bar background pulses (CSS animation, 1 second period, repeating).
18. When the Count Down timer reaches 0:00, it must stop and the control bar must flash red for 3 seconds, then remain steady red.
19. The timer must be started, paused, and reset from the control bar. Keyboard shortcut: T toggles start/pause.

**Font Size Controls**
20. Increase font size: keyboard shortcut `+` (plus key). Decrease font size: `-` (minus key). These must work at all times while Presentation Mode is active.
21. Font size buttons must also be visible in the control bar.

**Dark Mode / High Contrast Mode**
22. Presentation Mode must default to the dark theme described in requirement 4.
23. A "High Contrast" toggle in the control bar must switch to: pure white text on pure black background, font weight bold, increased letter spacing. This is intended for poorly lit stage environments.
24. Theme preference must be persisted in localStorage per user.

**Section Markers**
25. Section markers must be derived from the sections belonging to the active chapter, fetched via `GET /api/sections?chapterId=[id]` when Presentation Mode is entered.
26. Section markers must be injected into the rendered content at the correct position based on the section's `position` value and the approximate character position of each section's start within the chapter content.
27. If a chapter has no sections, no section markers are displayed.

**Voice Recorder**
28. A microphone icon in the control bar must start an audio recording using the browser's `MediaRecorder` API. Keyboard shortcut: R.
29. A pulsing red indicator must be visible in the control bar while recording is active.
30. Pressing R again (or clicking the stop icon) must stop the recording.
31. After stopping, the user must be shown a "Save Recording" prompt with an auto-generated name: "[Chapter Title] — [Date] [Time]". The user can edit the name before saving.
32. On save, the recording (WebM/Ogg format from MediaRecorder) must be uploaded to a Supabase Storage bucket named `recordings`. The upload must use a path: `[user_id]/[project_id]/[chapter_id]/[filename]`.
33. After upload, a record must be inserted into the `ltu_recordings` table (see Data Model).
34. If the user exits Presentation Mode without saving a completed recording, a confirmation dialog must appear: "You have an unsaved recording. Discard or save it?" The user must choose Discard or Save before exiting.
35. If `MediaRecorder` is not available in the browser, the record button must be disabled with a tooltip: "Audio recording is not supported in this browser. Please use Chrome or Firefox."

**Speaker Notes Overlay**
36. A floating panel (minimum 240px × 180px, draggable within the presentation view) must display the `speaker_notes` field for the active chapter. This panel is hidden by default.
37. The user toggles the speaker notes panel with keyboard shortcut N or via a Notes icon in the control bar.
38. The speaker notes panel must be styled with a semi-transparent dark background and readable body text. It must not interfere with the main content scroll area.
39. Speaker notes are read-only in Presentation Mode. They are edited in the editor via the slide-over panel (see Editor Integration below).

**Keyboard Shortcuts**
40. All keyboard shortcuts must be:
    - Space: pause/resume auto-scroll
    - Up Arrow: increase scroll speed by 1
    - Down Arrow: decrease scroll speed by 1
    - `+`: increase font size
    - `-`: decrease font size
    - F: toggle full-screen
    - R: start/stop recording
    - T: toggle timer start/pause
    - N: toggle speaker notes panel
    - Escape: exit Presentation Mode
41. A keyboard shortcut reference overlay must be accessible by pressing `?`. It must display all shortcuts in a modal and disappear when `?` or Escape is pressed.

**Exit**
42. Pressing Escape must exit Presentation Mode. If a recording is active, the unsaved recording confirmation (requirement 34) must be triggered first.
43. On exit, the user must return to the editor with the same chapter active and the scroll position as close as possible to where they were in the editor before entering Presentation Mode.

**Editor Integration — Speaker Notes**
44. The editor's chapter slide-over panel (or a dedicated "Speaker Notes" tab within the editor sidebar) must provide a textarea for editing the `speaker_notes` field of the active chapter. This textarea is only visible when the project type is `sermon`, `bible_study`, or `article`, or when the user's role is `preacher` or `bible_study_leader`.
45. Speaker notes must auto-save with a 600ms debounce, matching the pattern used by the synopsis field in PRD-14.

**Recordings Management**
46. A "Recordings" tab or section within the editor's chapter panel must list all saved recordings for the active chapter: name, duration, date, a play button, and a delete button.
47. Clicking play must open the audio in a minimal in-page player (HTML5 `<audio>` element styled to match the app theme).
48. Deleting a recording must prompt a confirmation dialog, then delete the record from `ltu_recordings` and the file from Supabase Storage.

### Non-Functional Requirements

49. The presentation view must render the full chapter content within 1.5 seconds of clicking "Present". Content is already loaded in the editor; this is a rendering transformation, not a fresh fetch.
50. Auto-scroll must maintain 60fps on modern hardware (tested on mid-range Android tablet). If frame rate drops below 30fps, the scroll interval must be adjusted dynamically.
51. The Supabase Storage upload for recordings must support files up to 500MB to accommodate long sermon recordings (a 60-minute recording in WebM averages approximately 60-120MB).
52. Presentation Mode must be accessible via keyboard alone (no mouse required) for all core functions.
53. The view must function correctly in Chrome 110+, Firefox 115+, Safari 16+, and Edge 110+. Full Screen API fallback must be in place for iOS Safari.
54. Recording upload must show a progress indicator if the file exceeds 10MB.

---

## UI/UX Specification

### Entry Point

In the editor toolbar (top bar of the writing canvas), a "Present" button with a play/stage icon appears to the right of the export button. It is styled in the app's gold accent colour to draw attention.

### Presentation View Layout

```
+----------------------------------------------------------+
|                                                          |
|           [Pulsing Rec. indicator if recording]          |
|                                                          |
|        Chapter Title (large, Playfair Display)           |
|                                                          |
|   Body text flows here in Playfair Display / Inter       |
|   at 28px default, centred max-width 800px.              |
|                                                          |
|   --- SECTION MARKER: "Point 1 — The Call" ---           |
|                                                          |
|   Body text continues...                                 |
|                                                          |
|       [Scripture Block — indented, gold border]          |
|                                                          |
|   Body text continues...                                 |
|                                                          |
|                                                          |
+-------------- CONTROL BAR (fixed bottom) ---------------+
| [Play/Pause]  [Speed: 3 v]  |  [Timer: 28:14]  |  [+][-] Font  |  [Rec]  [Notes]  [HC]  [?]  [X Exit] |
+----------------------------------------------------------+
```

### Control Bar Detail

The control bar is fixed to the bottom of the screen at a height of 56px. Background: `rgba(0, 0, 0, 0.85)` with a 1px top border in gold (`#D4AF37`). All icons are in off-white. Active states use gold highlight.

| Element | Description |
|---------|-------------|
| Play/Pause button | Filled triangle / double-bar icon. Label: "Scroll" |
| Speed control | Down-arrow dropdown showing 1-10, or stepper buttons |
| Timer display | Large monospace number. Mode toggle (Count Up/Down) accessible via long-press or settings |
| Timer set button | Clock icon opens a popover to set duration and mode |
| Font + / - | Two buttons, current size shown between them |
| Record button (Rec) | Mic icon; pulsing red dot overlay when active |
| Notes button | Note card icon; highlighted when panel is open |
| High Contrast toggle (HC) | Moon/contrast icon |
| Keyboard shortcuts (?) | Question mark icon |
| Exit (X) | X icon; triggers recording save check if needed |

### Speaker Notes Floating Panel

```
+--------------------------------+  ← draggable handle
| Speaker Notes            [X]  |
|--------------------------------|
| - Pause here for effect        |
| - Reference illustration #2    |
| - Ask congregation question    |
|                                |
+--------------------------------+
```

Panel is semi-transparent dark, 240×180px default size. Position is bottom-right corner by default, avoiding the control bar.

### Recordings List (in Editor Sidebar)

```
Recordings for "Chapter 3 — The Promise"
+------------------------------------------+
| Sunday Rehearsal — Mar 08 2026    32:14  |
| [Play]                         [Delete] |
+------------------------------------------+
| Saturday Run-through — Mar 07 2026  28:45 |
| [Play]                         [Delete] |
+------------------------------------------+
| [No more recordings]                     |
+------------------------------------------+
```

---

## Data Model

### Migration: `012_presentation_mode.sql`

```sql
-- Add speaker_notes to chapters
ALTER TABLE ltu_chapters
  ADD COLUMN speaker_notes TEXT DEFAULT '';

-- Recordings table
CREATE TABLE ltu_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES ltu_chapters(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES ltu_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  file_size_bytes INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ltu_recordings_chapter_id ON ltu_recordings(chapter_id);
CREATE INDEX idx_ltu_recordings_project_id ON ltu_recordings(project_id);
CREATE INDEX idx_ltu_recordings_user_id ON ltu_recordings(user_id);

-- Enable RLS
ALTER TABLE ltu_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recordings"
  ON ltu_recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings"
  ON ltu_recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings"
  ON ltu_recordings FOR DELETE
  USING (auth.uid() = user_id);
```

### Supabase Storage

- Bucket name: `recordings`
- Bucket access: private (authenticated users only, via signed URLs)
- File path convention: `{user_id}/{project_id}/{chapter_id}/{recording_name}.webm`
- Signed URL expiry: 1 hour (generated server-side on each GET request for a recording)

### Updated TypeScript Types

```typescript
export type Recording = {
  id: string
  chapter_id: string
  project_id: string
  user_id: string
  name: string
  audio_url: string          // Supabase Storage path (not the signed URL)
  duration_seconds: number
  file_size_bytes: number | null
  recorded_at: string
  created_at: string
}
```

`Chapter` type addition:
```typescript
speaker_notes: string
```

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /api/recordings?chapterId=[id]` | GET | List recordings for a chapter, returns signed URLs |
| `POST /api/recordings` | POST | Save a new recording after upload; inserts `ltu_recordings` row |
| `DELETE /api/recordings/[id]` | DELETE | Delete recording row and Storage file |
| `PATCH /api/chapters/[id]` | PATCH | Save `speaker_notes` (reuses existing chapters endpoint) |
| `GET /api/sections?chapterId=[id]` | GET | Fetch section titles and positions for section markers |

### `GET /api/recordings?chapterId=[id]`

Response:
```json
{
  "recordings": [
    {
      "id": "uuid",
      "name": "Sunday Rehearsal — Mar 08 2026",
      "duration_seconds": 1934,
      "file_size_bytes": 48234210,
      "recorded_at": "2026-03-08T14:22:00Z",
      "signed_url": "https://[supabase-storage-url]/..."
    }
  ]
}
```

### `POST /api/recordings`

Request body:
```json
{
  "chapter_id": "uuid",
  "project_id": "uuid",
  "name": "Sunday Rehearsal — Mar 08 2026",
  "audio_path": "user_id/project_id/chapter_id/filename.webm",
  "duration_seconds": 1934,
  "file_size_bytes": 48234210
}
```

Note: The client uploads directly to Supabase Storage using a signed upload URL (generated server-side via `POST /api/recordings/upload-url`). The `POST /api/recordings` route is called after a successful upload to register the metadata.

### `POST /api/recordings/upload-url`

Generates a signed upload URL for the client to PUT the audio file directly to Supabase Storage.

Request body:
```json
{
  "chapter_id": "uuid",
  "project_id": "uuid",
  "filename": "sunday-rehearsal-mar-08-2026.webm"
}
```

Response:
```json
{
  "upload_url": "https://...",
  "path": "user_id/project_id/chapter_id/sunday-rehearsal-mar-08-2026.webm"
}
```

---

## AI Agent Integration

Presentation Mode itself does not call AI agents during delivery. However, two pre-presentation and post-presentation integration points are in scope:

**1. Shepherd Agent — Pre-Presentation Prayer Prompt**

When the user clicks "Present", before entering the full-screen view, a brief interstitial (dismissible) can optionally display a contextual prayer prompt generated by the Shepherd agent based on the sermon content. This is opt-in, toggled in Settings under "Spiritual Tools". The Shepherd agent already exists at `lib/agents/shepherd.ts`.

**2. Guide Agent — Post-Recording Review Suggestion**

After a recording is saved, the app may offer: "Would you like writing suggestions based on this rehearsal?" This is a future enhancement (out of scope for this PRD) that would involve audio transcription and Guide agent analysis. It is noted here for architectural awareness so the `ltu_recordings` table schema is not prematurely closed.

---

## Acceptance Criteria

- [ ] Given a project of type `sermon`, when the user opens a chapter in the editor, a "Present" button is visible in the editor toolbar.
- [ ] Given a project of type `book`, when the user opens a chapter in the editor and their role is `author`, the "Present" button is not visible.
- [ ] Given the user clicks "Present", when the browser supports the Full Screen API, the view enters full-screen mode with all editor UI hidden.
- [ ] Given Presentation Mode is active with auto-scroll running at speed 3, when the user presses the Up Arrow key twice, the scroll speed increases to 5 and the speed control reflects the new value.
- [ ] Given Presentation Mode is active with a 30-minute countdown timer, when 25 minutes have elapsed, the timer text turns amber.
- [ ] Given the timer reaches 0:00 in countdown mode, the control bar flashes red for 3 seconds and the timer stops.
- [ ] Given the user presses R in Presentation Mode and a microphone is available, a red pulsing indicator appears and audio recording begins.
- [ ] Given the user stops a recording and clicks "Save", the audio file is uploaded to Supabase Storage and a record appears in the Recordings list for that chapter in the editor.
- [ ] Given the user exits Presentation Mode with an active recording without saving, a confirmation dialog asks "Discard or save?" before exiting.
- [ ] Given the user presses `+` three times, the font size increases from 28px to 40px.
- [ ] Given the user toggles High Contrast mode, the presentation background becomes pure black and text becomes bold white.
- [ ] Given a chapter with two sections ("Introduction" and "Main Point"), when Presentation Mode is entered, a section marker labelled "Main Point" appears at the correct position in the text flow.
- [ ] Given the user presses N, the speaker notes floating panel appears with the chapter's saved speaker notes.
- [ ] Given the user presses Escape in Presentation Mode (no active recording), the editor view is restored with the same chapter active.
- [ ] Given `MediaRecorder` is not available, the recording button is disabled and a tooltip explains the limitation.
- [ ] Given a saved recording in the editor recordings list, when the user clicks "Play", an audio player appears and the recording plays.

---

## Edge Cases

1. **Empty chapter content:** If the chapter has no text, Presentation Mode must display the chapter title and an empty content area. Auto-scroll has nothing to scroll; play/pause does nothing. This is valid and must not throw an error.

2. **Very long chapter (10,000+ words):** The full content must be rendered in the DOM at once (no pagination). For chapters exceeding 15,000 words, a performance warning must be logged in the console. Virtualization is not in scope.

3. **No microphone permission:** If the user clicks Record but has denied microphone permission, the browser will throw a `NotAllowedError`. The app must catch this and display a toast: "Microphone access was denied. Please allow microphone access in your browser settings."

4. **Recording interrupted by page navigation:** If the user navigates away (e.g., back button) while recording, the `beforeunload` event must trigger the unsaved recording confirmation dialog.

5. **File upload failure:** If the Supabase Storage upload fails (network error, storage quota exceeded), the user must see an error toast and be given the option to retry or download the recording as a local file using a Blob URL.

6. **Slow scroll at end of content:** When the user reaches the bottom of the content, auto-scroll must stop automatically and display a "End of chapter" indicator. Auto-scroll does not loop.

7. **Multiple monitors / external display:** Full-screen may open on the primary monitor. There is no multi-monitor routing in this scope. The user can use OS-level window management to move the presentation to the correct screen.

8. **Browser tab switching during presentation:** If the user switches tabs, auto-scroll must pause automatically (using the Page Visibility API) and resume when the tab is refocused.

9. **Timer started and then chapter changed:** Presentation Mode is per-chapter. If the user exits and re-enters Presentation Mode on a different chapter, the timer must reset to the configured duration. Timer state is not persisted across sessions.

10. **Speaker notes not set:** If `speaker_notes` is null or empty, the notes panel must display a placeholder: "No speaker notes for this chapter. Edit them in the editor." The panel itself must still open successfully.

---

## Dependencies

- Phase 1 (PRD-03, writing interface): Editor must exist with chapter content loaded.
- Phase 2 (PRD-05 through PRD-07): AI integration points (Shepherd prayer prompt pre-presentation) require the AI layer; the core Presentation Mode does not.
- Supabase Storage must be enabled on the project and the `recordings` bucket must be created before the recording feature can be deployed.
- Browser API requirements: `requestFullscreen`, `MediaRecorder`, `SpeechSynthesis` (not used here), `Page Visibility API`. All have fallbacks defined.
- `ltu_sections` table (migration 009) must exist for section markers.
- PRD-14 (Visual Chapter Planner) introduces the `speaker_notes` column on chapters in migration 012. If PRD-14 is built first, migration 012 must not re-add the column; the column should be added in whichever migration lands first.

---

## Estimated Scope

**L (Large)**

Rationale: Full-screen rendering transformation of rich-text content, a real-time auto-scroll engine using `requestAnimationFrame`, a dual-mode timer with visual warning states, browser `MediaRecorder` integration with Supabase Storage upload pipeline, a floating draggable speaker notes panel, keyboard shortcut system, section marker injection, and a recordings management UI in the editor. This is 2-3 focused sprints of frontend work plus 1 sprint for the storage and API layer.
