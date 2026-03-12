# PRD-16: Voice Dictation

## Overview

Voice Dictation lets Scriptloom users speak their writing aloud and have it converted to polished, formatted text in the editor. Raw browser transcription from the Web Speech API is cleaned by the Claude API — adding punctuation, capitalisation, paragraph breaks, and Scripture reference formatting — before being inserted into the document. This feature is a natural fit for preachers and devotionalists who compose ideas verbally, and it directly addresses a gap that bible.ai occupies but no current sermon-writing tool fills well.

## Problem Statement

bible.ai's voice-first interface is one of its most distinctive features, but it is a study companion, not a writing platform. Preachers and devotionalists frequently compose ideas aloud — in the car, while praying, during walks — but the tools available to capture and format those thoughts are generic (voice memos, Google Docs dictation) and require manual cleanup. None are contextually aware of Scripture references, sermon structure, or theological language.

Scriptloom's existing editor is keyboard-first. Users who prefer to speak their content have no path to do so within the app. This creates a workflow gap that causes voice-native users (particularly preachers and devotionalists) to compose elsewhere and paste in, losing all context from the AI agents and writing memory.

Voice Dictation closes this gap and deepens Scriptloom's position as a complete ministry writing environment. It is the only faith-context-aware voice writing tool available in a cloud-based writing platform.

---

## User Stories

1. As a preacher who composes sermons by speaking, I want to dictate text directly into the editor so that I do not lose ideas while they are fresh.

2. As a preacher dictating a sermon, I want my spoken words to be automatically punctuated and capitalised so that I do not have to manually edit raw transcription text.

3. As a devotionalist, I want Scripture references I speak aloud (e.g., "John chapter 3 verse 16") to be automatically formatted as Scripture blocks so that my dictated content is structured correctly without manual reformatting.

4. As a user, I want to see a live preview of what I am saying as I speak so that I can confirm the transcription is capturing my words correctly.

5. As a user, I want to choose whether dictated text is appended to the end of my writing, inserted at my cursor position, or used to replace selected text so that dictation fits my current editing context.

6. As a user, I want to pause and resume dictation without losing the context of what I have said so that interruptions do not reset my session.

7. As a user, I want to use Ctrl+Shift+D to toggle dictation on and off so that I can start and stop quickly without reaching for the mouse.

8. As a user, I want to control whether auto-punctuation and auto-paragraph detection are applied so that I can use raw transcription if I prefer to punctuate manually.

9. As a user in a different English dialect, I want to select my language variant (English US, UK, or AU) so that the Speech Recognition engine matches my pronunciation.

10. As a user on a browser that does not support the Web Speech API, I want a clear message explaining the limitation and suggesting a compatible browser so that I am not confused by a silent failure.

---

## Detailed Requirements

### Functional Requirements

**Access and Entry**
1. A microphone button must be added to the TipTap editor toolbar. It must be positioned in the formatting toolbar, visually distinct from formatting tools — placed after the last formatting group, before the export/other action buttons.
2. Clicking the microphone button must toggle dictation on and off. When dictation is active, the button must display a pulsing red animation.
3. The keyboard shortcut Ctrl+Shift+D (Windows/Linux) and Cmd+Shift+D (macOS) must toggle dictation on and off from anywhere within the editor canvas.
4. Before starting dictation for the first time in a session, the browser will prompt for microphone permission. If the user denies permission, the app must display a toast: "Microphone access required for Voice Dictation. Enable it in your browser settings."

**Web Speech API Integration**
5. The app must use the browser's `window.SpeechRecognition` or `window.webkitSpeechRecognition` API. Feature detection must check for both.
6. Dictation must run in continuous mode (`recognition.continuous = true`) and return interim results (`recognition.interimResults = true`).
7. Interim (in-progress) results must be shown in a live preview panel below the editor toolbar (see UI Specification). Interim text must be styled differently from final text (lighter opacity, italic) to indicate it is not yet committed.
8. When the Speech Recognition API returns a final result for a phrase, that phrase is accumulated into the current dictation session buffer.
9. The session buffer is not immediately inserted into the editor. It is held until one of the following occurs: (a) the user pauses dictation (silence detected for 3 seconds), (b) the user manually stops dictation, or (c) the session buffer reaches 500 words. At that point, the buffer is sent to Claude for cleanup.

**Pause and Resume**
10. Dictation pauses automatically when silence is detected for 3 seconds (the SpeechRecognition API will fire the `onend` event). The UI must show a "Paused — tap mic or speak to resume" state rather than treating silence as a session end.
11. Resume is triggered by clicking the mic button again or by the user speaking (the app will restart the SpeechRecognition instance with the existing session buffer preserved).
12. The session context (accumulated buffer, current mode, language setting) must persist across pause/resume cycles for the duration of the active dictation session.
13. Dictation sessions end explicitly when the user clicks the mic button to stop (not just pause), presses Ctrl+Shift+D to toggle off, or navigates away from the editor.

**AI Cleanup via Claude**
14. When the session buffer is ready for processing (per requirement 9), a POST request must be sent to `/api/dictation/process`.
15. The request payload must include: the raw transcription text, the user's auto-punctuation setting, the user's auto-paragraph setting, the project type and role (for tone context), and the chapter's existing content (last 300 words, for context continuity).
16. The Claude API must be called with a system prompt that instructs it to:
    - Add proper punctuation and capitalisation (if auto-punctuation is on).
    - Insert paragraph breaks at natural topic shifts (if auto-paragraph is on).
    - Detect spoken Scripture references in common spoken forms and convert them to the canonical format used by Scriptloom's Scripture block extension (e.g., "John chapter 3 verse 16" → formatted as a scripture block marker).
    - Preserve the speaker's theological vocabulary and phrasing — do not rephrase or improve, only format.
    - Return the cleaned text only, with no commentary.
17. The Claude model used for dictation cleanup must reference the centralised AI model config at `lib/ai/config.ts` (consistent with the existing pattern established in commit `ab05448`).
18. The API route must respond within 8 seconds. If it exceeds this, the raw transcription must be inserted into the editor as a fallback, and a toast must notify the user: "AI formatting timed out. Raw text has been inserted."

**Text Insertion**
19. After receiving cleaned text from the Claude API, the text must be inserted into the TipTap editor according to the active Dictation Mode:
    - **Append mode:** Text is inserted at the end of the current chapter content.
    - **Insert mode:** Text is inserted at the current cursor position in the editor.
    - **Replace mode:** If text is selected in the editor when dictation stops, the selection is replaced with the cleaned dictation text.
20. All three modes must use TipTap's command API (`editor.chain().focus().insertContent(...).run()` or equivalent) to ensure undo history is preserved. Dictation insertion must be undoable as a single undo step.
21. Scripture block markers returned by the Claude cleanup must be converted to TipTap ScriptureBlock nodes using the existing `ScriptureBlockExtension` (at `components/editor/tiptap/ScriptureBlockExtension.ts`).

**Live Preview Panel**
22. A collapsible banner panel must appear between the toolbar and the editor canvas when dictation is active. It must not push the editor content down — it must overlay the top of the editor canvas with a semi-transparent background.
23. The panel must display:
    - A pulsing mic indicator and the label "Listening..." or "Paused"
    - The live interim transcription text as the user speaks
    - The accumulated session buffer (committed phrases not yet sent for cleanup) in a slightly dimmed style
    - The current dictation mode (Append / Insert / Replace) as a badge
    - A word count for the current session buffer
24. The panel must include a "Stop & Insert" button that immediately stops dictation, sends the buffer for cleanup, and inserts the result. This is the primary explicit stop action.
25. The panel must include a "Discard" button that stops dictation and discards all buffered text without inserting anything. A confirmation prompt ("Discard all dictated text?") must precede this action.

**Dictation Mode Selection**
26. The dictation mode (Append, Insert, Replace) must be selectable from a dropdown in the live preview panel. The default mode must be Insert if there is a cursor position in the editor, or Append if the cursor is not placed.
27. The mode can be changed mid-session. The new mode takes effect on the next insertion (it does not retroactively change already-inserted text).
28. Replace mode must only be available if text is selected in the editor at the time dictation is started. If no text is selected, Replace mode must be greyed out with a tooltip: "Select text in the editor first to use Replace mode."

**Scripture Reference Detection**
29. The Claude cleanup prompt must include a list of spoken Scripture reference patterns to detect and convert. Common patterns include:
    - "[Book name] chapter [N] verse [N]"
    - "[Book name] [N] colon [N]" (e.g., "John 3 colon 16")
    - "[Book name] chapter [N] verses [N] through [N]"
    - Abbreviations spoken phonetically (e.g., "First Corinthians", "Second Timothy")
30. Detected Scripture references must be converted to the canonical format `[Book Chapter:Verse]` in the cleaned output, which the ScriptureBlockExtension already handles via the existing scripture regex at `lib/memory/scripture-regex.ts`.
31. If no Scripture references are detected in the transcription, no scripture blocks are created. This must not cause an error.

**Dictation Settings**
32. A "Dictation Settings" popover must be accessible from the microphone toolbar button (via a small gear icon or a long-press/right-click context action). It must expose:
    - Auto-punctuation toggle (default: on)
    - Auto-paragraph detection toggle (default: on)
    - Language selector: English (United States), English (United Kingdom), English (Australia) (default: English (United States))
33. These settings must be persisted in the user's `profiles` row in Supabase. The columns are `dictation_auto_punctuation` (boolean), `dictation_auto_paragraph` (boolean), `dictation_language` (text). They are fetched with the user's profile on page load.
34. Language setting must be passed to `SpeechRecognition.lang` before starting the recognition session. Valid BCP-47 values: `en-US`, `en-GB`, `en-AU`.

**Fallback Behaviour**
35. If `SpeechRecognition` is not available in the browser, the microphone toolbar button must still be visible but must display a disabled state (greyed out, cursor: not-allowed).
36. Hovering or clicking the disabled mic button must show a tooltip or modal: "Voice Dictation requires a browser with Web Speech API support. We recommend using Chrome or Microsoft Edge."
37. If the Web Speech API is available but returns an error (e.g., `network`, `audio-capture`, `not-allowed`), the app must handle each error type with a specific user-facing message:
    - `not-allowed`: "Microphone access denied. Please allow access in browser settings."
    - `audio-capture`: "No microphone detected. Please connect a microphone and try again."
    - `network`: "Speech recognition failed due to a network error. Please check your connection."
    - All other errors: "An error occurred with Voice Dictation. Please try again."

**Privacy**
38. Raw transcription from the Web Speech API is processed client-side by the browser's built-in speech recognition engine (which may send audio to a remote service depending on the browser vendor — Chrome sends to Google's servers). This is outside Scriptloom's control and must be disclosed in the app's Privacy Policy.
39. The dictation buffer (raw text) is sent to the Scriptloom API (`/api/dictation/process`) for Claude cleanup. This text is not stored server-side beyond the duration of the API request. The API route must not log or persist the dictation content.
40. The last 300 words of chapter content sent as context to Claude for cleanup must also not be stored server-side. The API route is stateless.

### Non-Functional Requirements

41. The live preview panel must update within 200ms of the interim result being returned by the Speech Recognition API to ensure the user sees near-real-time feedback.
42. The Claude cleanup API call must include a 8-second timeout. Raw fallback insertion (requirement 18) must trigger automatically on timeout.
43. The dictation feature must not affect editor performance when not in use. The `SpeechRecognition` instance must be fully destroyed (`.stop()` and dereferenced) when dictation is stopped.
44. The feature must work on Chrome 110+, Edge 110+, and Safari 16.4+ (which added SpeechRecognition support). Firefox does not support Web Speech API; the fallback message must be shown on Firefox.
45. The dictation settings columns added to `ltu_profiles` must have appropriate default values so that existing users who have never used dictation are not affected.
46. All UI text in the dictation feature must support RTL layout for future internationalisation, even though only English languages are supported at launch.

---

## UI/UX Specification

### Toolbar Button

The mic button sits at the right end of the TipTap toolbar's second group, before the scripture lookup button and the export button. It uses a microphone SVG icon.

States:
- **Idle:** Standard icon, matches other toolbar buttons.
- **Active / Recording:** Red pulsing ring animation around the icon.
- **Paused:** Amber static icon with a pause indicator overlay.
- **Disabled (no API support):** Greyed out with a diagonal line through the icon.

### Live Preview Panel

```
+------------------------------------------------------------------+
| [Pulsing mic icon]  Listening...                [Insert mode v]  |
|                                                                   |
| "...so when we look at what Paul is saying in Romans chapter 8   |
|  verse 28, we can see that God is working all things together..." |
|                                                                   |
| [Interim: "for the good of those who love him..."]               |
|                                                                   |
| 87 words buffered                   [Stop & Insert] [Discard]    |
+------------------------------------------------------------------+
```

Panel height: auto, max 160px. Background: `rgba(10, 10, 30, 0.85)`, border-bottom: 1px gold.

Text styles:
- Committed buffer text: off-white, 14px, normal weight
- Interim (in-progress) text: off-white at 50% opacity, 14px, italic
- Word count: muted gold, 12px

### Settings Popover

```
+---------------------------+
| Dictation Settings        |
|---------------------------|
| Auto-punctuation  [ ON ]  |
| Auto-paragraphs   [ ON ]  |
| Language:                 |
| [English (US)         v]  |
+---------------------------+
```

Accessible via a gear icon that appears adjacent to the mic button only when dictation is idle (not during active recording).

### Dictation Mode Selector

```
[ v Insert ]
  Append
  Insert  (checked)
  Replace (greyed if no selection)
```

Dropdown integrated into the right side of the live preview panel header.

### Error State (in-panel)

```
+------------------------------------------------------------------+
| [Warning icon]  Microphone access denied.                        |
| Allow microphone access in your browser settings and try again.  |
|                                              [Dismiss]           |
+------------------------------------------------------------------+
```

---

## Data Model

### Migration: `013_dictation_settings.sql`

```sql
-- Add dictation preferences to profiles
ALTER TABLE ltu_profiles
  ADD COLUMN dictation_auto_punctuation BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN dictation_auto_paragraph BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN dictation_language TEXT NOT NULL DEFAULT 'en-US'
    CHECK (dictation_language IN ('en-US', 'en-GB', 'en-AU'));
```

No new tables are required. Dictation sessions are transient and not persisted. Recordings, if desired, are handled by PRD-15.

### Updated TypeScript Types

`Profile` type additions:
```typescript
dictation_auto_punctuation: boolean
dictation_auto_paragraph: boolean
dictation_language: 'en-US' | 'en-GB' | 'en-AU'
```

---

## API Routes

### `POST /api/dictation/process`

Accepts raw transcription and returns cleaned, formatted text.

Request body:
```json
{
  "raw_text": "john chapter 3 verse 16 for god so loved the world that he gave his only son",
  "auto_punctuation": true,
  "auto_paragraph": true,
  "project_type": "sermon",
  "role": "preacher",
  "context_tail": "...last 300 words of existing chapter content..."
}
```

Response:
```json
{
  "cleaned_text": "John 3:16 — \"For God so loved the world that he gave his only Son...\"",
  "scripture_refs": [
    { "ref": "John 3:16", "position": 0 }
  ],
  "word_count": 18
}
```

The `scripture_refs` array lists detected references with their character position in `cleaned_text`, allowing the editor to convert them to `ScriptureBlock` nodes at precise positions.

**Error responses:**
- `400 Bad Request`: `raw_text` is empty or missing.
- `408 Request Timeout`: Claude did not respond within 8 seconds. Client must fall back to raw insertion.
- `500 Internal Server Error`: Claude API error. Client must fall back to raw insertion.

### `GET /api/profile/dictation-settings`

Returns the user's dictation settings. Consumed when the settings popover is opened.

Response:
```json
{
  "auto_punctuation": true,
  "auto_paragraph": true,
  "language": "en-US"
}
```

### `PATCH /api/profile/dictation-settings`

Updates the user's dictation settings.

Request body:
```json
{
  "auto_punctuation": true,
  "auto_paragraph": false,
  "language": "en-GB"
}
```

Response: `{ "success": true }`

---

## AI Agent Integration

Voice Dictation uses a targeted, stateless Claude API call for text cleanup rather than routing through any of the seven named AI agents. This is intentional: the cleanup task is formatting-only, not generative, and does not benefit from the agents' system prompts (which are designed for writing assistance, not transcription formatting).

**System prompt for dictation cleanup:**

The system prompt at `lib/agents/dictation.ts` (new file) must instruct Claude to:
- Act as a transcription formatter, not a writing assistant.
- Never add, remove, or rephrase content — only add punctuation, capitalisation, and paragraph breaks.
- Detect and convert spoken Scripture references to canonical format (provide the pattern list in the prompt).
- Preserve all theological vocabulary, names, and ministry-specific language exactly as spoken.
- Return only the formatted text, with no preamble or explanation.

**Integration with Writing Memory**

The Scriptloom memory system (`lib/memory/store.ts`) captures new content written in the editor. When dictated and cleaned text is inserted via TipTap's command API, it triggers the editor's `onUpdate` handler, which feeds into the existing auto-save and memory update pipeline. No special handling is required — dictated content becomes part of the chapter's memory the same way typed content does.

**Scripture Reference Detection Synergy**

The existing scripture regex at `lib/memory/scripture-regex.ts` and the `ScriptureBlockExtension` in TipTap already handle the rendering and storage of Scripture blocks. The dictation cleanup Claude call must return references in a format compatible with what this regex already matches, ensuring no duplicate formatting logic is required.

---

## Acceptance Criteria

- [ ] Given the user opens the editor in Chrome and microphone permission is granted, the mic button is visible and enabled in the toolbar.
- [ ] Given the user clicks the mic button, the live preview panel appears below the toolbar and the mic button shows a pulsing red animation.
- [ ] Given dictation is active and the user speaks "John chapter 3 verse 16 for God so loved the world", the interim text appears in the live preview panel within 200ms.
- [ ] Given the user stops dictation by clicking "Stop & Insert", the text is sent to `/api/dictation/process` and the cleaned text is inserted into the editor.
- [ ] Given auto-punctuation is on, when the user dictates a sentence, the cleaned text returned includes proper capitalisation and a full stop at the end of the sentence.
- [ ] Given the user speaks "Romans chapter 8 verse 28", when the cleaned text is inserted into the editor, it appears as a formatted Scripture block rather than plain text.
- [ ] Given the user selects a paragraph in the editor and starts dictation in Replace mode, when dictation stops and is inserted, the selected paragraph is replaced with the dictated text.
- [ ] Given the user starts dictation in Insert mode, when text is inserted, it appears at the cursor position rather than the end of the document.
- [ ] Given the user pauses dictation by stopping speaking for 3 seconds, the live preview panel shows "Paused" and the mic animation stops; the session buffer is preserved.
- [ ] Given the user resumes dictation by speaking after a pause, dictation continues and new transcription is appended to the existing session buffer.
- [ ] Given the user presses Ctrl+Shift+D (or Cmd+Shift+D on macOS) while the editor is focused, dictation toggles on; pressing again toggles it off.
- [ ] Given the user clicks "Discard" and confirms, all buffered text is discarded and the live preview panel closes without modifying the editor content.
- [ ] Given the user opens the dictation settings and sets language to "English (UK)", the SpeechRecognition instance uses `lang: 'en-GB'` on next dictation start.
- [ ] Given auto-punctuation is turned off in settings, when the user dictates and inserts text, the cleaned text has no added punctuation beyond what the Speech Recognition API provides.
- [ ] Given the Claude API times out (simulated), the raw transcription is inserted into the editor and a toast is shown: "AI formatting timed out. Raw text has been inserted."
- [ ] Given the user opens the editor in Firefox, the mic button is disabled and hovering it shows a tooltip about browser compatibility.
- [ ] Given the user denies microphone permission, clicking the mic button shows a toast explaining the permission requirement.
- [ ] Given dictation text is inserted, pressing Ctrl+Z undoes the insertion as a single step, restoring the previous editor state.

---

## Edge Cases

1. **Speaking Scripture abbreviations:** Common spoken abbreviations like "First John", "Second Kings", "Phil" (Philippians) must be included in the Claude cleanup prompt's pattern list. The prompt must include a reference table of common abbreviations to canonical book names.

2. **Mixed language content:** A user may quote Scripture in English while speaking in an English variant. The `en-AU` Speech Recognition engine may struggle with certain American Scripture pronunciations. This is a known limitation of the Web Speech API and is out of Scriptloom's control. The fallback is that the raw text is inserted and the user manually corrects the scripture reference.

3. **Very long dictation session (500+ words before stop):** The 500-word buffer trigger (requirement 9) handles this by sending intermediate batches for processing. Each batch insertion must be appended in sequence; batches must not be inserted out of order. Use a processing queue to ensure sequential insertion.

4. **Simultaneous typing and dictation:** If the user types in the editor while dictation is active, this is allowed. However, the cursor position used for Insert mode must be captured at the moment dictation started, not at the moment of insertion — otherwise the insertion point shifts unexpectedly. A note in the live preview panel ("Cursor position locked for Insert mode") must inform the user.

5. **SpeechRecognition firing `onend` unexpectedly:** The Chrome Web Speech API is known to end the recognition session after approximately 60 seconds of continuous use. The app must listen for `onend` and distinguish between expected pauses (silence) and unexpected session terminations. If the `onend` fires without the user having explicitly stopped, the app must restart the recognition instance automatically and display a brief "Reconnecting..." state in the panel.

6. **Empty transcription result:** If the Speech Recognition API returns empty or whitespace-only results (e.g., background noise misidentified as speech), the `/api/dictation/process` call must not be made. The app must detect an empty buffer and show a toast: "No speech detected. Try again."

7. **Claude returning no content (empty response):** If the Claude API returns an empty string, the raw transcription must be inserted as a fallback. The API route must validate that `cleaned_text` is non-empty before returning a 200.

8. **Editor not focused when shortcut is pressed:** If the user presses Ctrl+Shift+D while focus is in a sidebar input or another element, dictation must not start. The shortcut must check that the editor canvas is focused before activating.

9. **User navigates to a different chapter mid-dictation:** If the user switches chapters while dictation is active, dictation must stop automatically, the buffer must be discarded, and a toast must notify: "Dictation was stopped because you navigated away."

10. **Replace mode with no selection detected:** If the user selects text, then the selection collapses before dictation stops (e.g., they clicked elsewhere), the mode must fall back gracefully to Insert mode at the last known cursor position rather than throwing an error.

---

## Dependencies

- Phase 3 (PRD-03, writing interface): The TipTap editor must be fully set up with toolbar extensibility before this feature can add a new toolbar button.
- `ScriptureBlockExtension` (`components/editor/tiptap/ScriptureBlockExtension.ts`): Must be in place and working for scripture auto-formatting.
- `lib/memory/scripture-regex.ts`: Used to validate that cleaned scripture references match the expected pattern before insertion.
- Centralised AI model config (`lib/ai/config.ts`, established in commit `ab05448`): The new `lib/agents/dictation.ts` must use this config rather than hardcoding the model name.
- `ltu_profiles` table: Must exist (migration 002) for the dictation settings columns.
- Browser compatibility: Chrome 33+, Edge 79+, Safari 16.4+. Firefox is explicitly unsupported. Testing must include mobile Chrome on Android.

---

## Estimated Scope

**M (Medium)**

Rationale: The Web Speech API integration, live preview UI, session buffer management, and Claude cleanup API route are individually straightforward but must work reliably together as a real-time system. The three insertion modes, pause/resume logic, the scripture reference pipeline reuse, and the edge case handling around reconnection and timeouts add meaningful complexity. This is approximately 2 focused sprints: one for the core dictation loop and UI, one for the Claude integration, settings, and edge cases.
