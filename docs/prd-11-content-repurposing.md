# PRD-11: Content Repurposing Engine

## Overview

The Content Repurposing Engine allows users to transform a completed piece of writing — a sermon, book chapter, or devotional — into multiple purpose-built output formats with a single action. The feature leverages the existing Scribe and Shepherd AI agents and respects each user's Style Profile and project role. Generated outputs can be previewed, edited, saved to the Notes Vault, or copied to the clipboard.

## Problem Statement

Ministry writers spend significant time producing a single piece of content — a sermon, a chapter, a devotional entry — and then face a separate manual effort to adapt it for social media, small group discussions, newsletters, or youth audiences. SermonAI and ChurchSocial.ai have built competitive moats specifically on this repurposing workflow, and they charge $10–15 per month for it alone. Scriptloom already holds the source material, the author's style data, and the project context; it should be able to close this gap natively. Without this feature, users must leave the app to accomplish a task that flows naturally from what they have already written inside it.

---

## User Stories

1. As a pastor, I want to convert my finished sermon into social media posts for the week, so that I can keep my congregation engaged without writing separate content.

2. As a Christian author, I want to generate a 5-day devotional series from a book chapter, so that I can use my manuscript to build an email list or small group resource.

3. As a Bible study leader, I want to auto-generate a discussion guide from my lesson notes, so that I can hand it to group participants without spending an extra hour formatting questions.

4. As a content creator, I want to produce an email newsletter draft from a devotional entry, so that I can publish consistently without duplicating effort.

5. As a preacher, I want to create a youth-simplified version of my sermon, so that it is accessible to teenagers and young adults in my congregation.

6. As a ministry leader, I want to bulk-export all repurposed formats at once, so that I can download a single package and use it across all my communication channels.

7. As any user, I want to preview and edit every generated format before saving or copying it, so that I retain full creative control over the final output.

---

## Detailed Requirements

### Functional Requirements

1. A "Repurpose" button must be accessible from two surfaces: (a) the Editor sidebar action panel when a chapter is open, and (b) the Project detail view for the project as a whole.

2. When triggered from the editor, the source content is the currently open chapter. When triggered from the project view, the source is all chapter content concatenated in order.

3. The Repurpose action opens a full-page modal (or dedicated drawer panel) titled "Repurpose This Content".

4. The modal presents a format selection screen where the user can choose one or more output formats before generation begins.

5. Supported output formats:
   - Social media post — Twitter/X (max 280 characters), Instagram caption (max 2,200 characters, includes suggested hashtags), Facebook post (max 500 words, conversational tone)
   - Discussion guide — 5–8 open-ended questions with at least one Scripture reference per question, formatted as a printable guide
   - Youth/simplified version — same core message, adjusted to a reading level appropriate for 13–18 year-olds, shorter sentences, accessible vocabulary
   - Email newsletter draft — subject line + body, suitable for Mailchimp or similar platforms, includes a clear call to action
   - Devotional extract — structured as a 3–5 day daily devotional series; each day has a title, opening Scripture, reflection paragraph, closing prayer prompt
   - Blog post adaptation — full-length web article (~600–900 words), includes an SEO-friendly introductory paragraph and subheadings

6. Each format tile on the selection screen shows: format name, brief description, and estimated generation time.

7. The user can select all formats simultaneously or pick individual ones.

8. Generation is triggered by a "Generate Selected Formats" button. Each format generates independently and in parallel where possible.

9. Each generated format is displayed in its own preview card within the modal, with the format name as the card header.

10. Each preview card includes: a read-only rendered preview pane and an editable raw text pane the user can switch between.

11. Per-card actions available after generation: Edit (switch to editable pane), Copy to Clipboard, Save to Notes Vault, Regenerate (re-run this format only).

12. A "Bulk Export" action downloads all generated formats as a single ZIP file containing one plain-text (.txt) or markdown (.md) file per format.

13. "Save to Notes Vault" creates a new Note record with a title following the pattern "[Project Title] — [Format Name] — [Date]" and assigns the tag "repurposed" automatically.

14. The Repurpose engine reads the user's active Style Profile (project-level if it exists, user-level as fallback) and injects style instructions into all prompts.

15. The project's role (author, preacher, devotionalist, etc.) adjusts the tone and framing instructions for each format. A preacher's blog post reads differently from a devotionalist's blog post.

16. A generation status indicator (spinner + format name) is shown for each format while it is being processed.

17. If a single format fails to generate, it shows an error state with a Retry button; other successfully generated formats remain unaffected.

18. Users can close the modal at any time. Any formats already generated are preserved in a session-level cache for 30 minutes so the modal can be reopened.

### Non-Functional Requirements

1. Each individual format must generate within 30 seconds under normal API conditions.
2. Bulk generation of all 6 formats must complete within 90 seconds.
3. The modal must be fully functional on viewport widths of 768px and above (tablet-first).
4. All generated content must pass a basic content length validation before being displayed (minimum 50 characters per format).
5. API calls to the Anthropic API must be authenticated server-side; no API keys may be exposed to the client.
6. The feature is only accessible to authenticated users. Unauthenticated requests return 401.
7. The feature must be available to users on the Ministry pricing tier and above. Free and Writer tier users see the button in a disabled state with a tooltip indicating the required tier.

---

## UI/UX Specification

### Trigger Points

**Editor surface:** In the editor's right sidebar action panel, below the existing writing tool buttons, a "Repurpose" button appears with a document-with-arrows icon. It is only active when the chapter contains more than 100 words.

**Project view surface:** On the project detail page (the cards grid), a "Repurpose" menu item appears in the project card's three-dot dropdown menu.

### Format Selection Screen (Modal Step 1)

The modal opens at full viewport height on desktop. The header reads "Repurpose: [Chapter Title or Project Title]". Below the header is a word count indicator showing the source content length.

Six format tiles are displayed in a 2-column grid (3-column on wide screens). Each tile contains:
- Format name in Playfair Display font
- One-line description in body text
- A checkbox in the top-right corner
- A gold accent border when selected

A "Select All" link is positioned above the grid. A "Generate Selected Formats" primary button is positioned at the bottom, disabled until at least one format is selected.

### Generation and Preview Screen (Modal Step 2)

After clicking "Generate", the modal transitions to the preview screen. The header updates to "Generating [N] formats...". Each format has a card in a single-column scrollable list. Cards generate asynchronously and appear with content as they complete.

Card anatomy (from top):
- Format name label (gold, small caps)
- Tab switcher: "Preview" / "Edit"
- Content area (read-only rendered view in Preview tab, textarea in Edit tab)
- Action row: Copy | Save to Notes | Regenerate buttons

At the bottom of the modal: "Bulk Export All" button and a "Done" button that closes the modal.

### User Flow

1. User finishes writing a chapter
2. User clicks "Repurpose" in the sidebar
3. Format selection modal opens (Step 1)
4. User selects desired formats and clicks "Generate"
5. Modal transitions to Step 2; formats generate in parallel
6. User reviews each card, edits as needed
7. User copies, saves to Notes, or bulk-exports
8. User clicks "Done" to close

---

## Data Model

No new database tables are required. The feature leverages existing tables.

### Changes to Existing Tables

None required for core functionality. Generated outputs are saved to `ltu_notes` using the existing Notes Vault schema.

### Session-Level Caching

Generated format content is held in React state during the session. No server-side persistence of intermediate results is required.

### New TypeScript Types (to be added to types/database.ts or a new types/repurposing.ts)

```typescript
export type RepurposeFormat =
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'discussion_guide'
  | 'youth_version'
  | 'email_newsletter'
  | 'devotional_extract'
  | 'blog_post'

export type RepurposeStatus = 'idle' | 'generating' | 'complete' | 'error'

export type RepurposedOutput = {
  format: RepurposeFormat
  content: string
  status: RepurposeStatus
  errorMessage?: string
}
```

---

## API Routes

### POST /api/repurpose

Accepts a request body containing the source content, the selected formats, the project context, and the user's style profile. Returns a streaming or polling-compatible response.

Request body:
```json
{
  "sourceContent": "string (the chapter or project text)",
  "formats": ["twitter", "discussion_guide"],
  "context": { "ProjectContext object" },
  "styleProfile": { "StyleData object or null" }
}
```

Response (one object per format, or streamed):
```json
{
  "results": [
    { "format": "twitter", "content": "string", "status": "complete" },
    { "format": "discussion_guide", "content": "string", "status": "complete" }
  ]
}
```

Error response:
```json
{ "error": "string", "format": "twitter" }
```

### POST /api/repurpose/single

For regenerating a single format after initial generation. Same body shape as above but `formats` contains exactly one item. Returns a single result object.

---

## AI Agent Integration

### Scribe Agent (primary for generative formats)

Used for: Twitter/X post, Instagram caption, Facebook post, youth/simplified version, email newsletter draft, blog post adaptation.

The Scribe agent's system prompt is extended with format-specific instructions injected before the generation request. The `formatContextForPrompt` output from `lib/ai/context.ts` is prepended to every prompt so the agent understands the project, role, audience, and style.

New mode additions to `runScribe`:
- `mode: 'repurpose'` with an additional `format: RepurposeFormat` parameter
- Per-format instruction blocks are defined in a `repurposeInstructions` map within the Scribe agent file

### Shepherd Agent (primary for spiritually structured formats)

Used for: Discussion guide (question generation with theological grounding), devotional extract (ensuring each day's reflection is spiritually sound and theologically consistent).

The Shepherd's `review` mode is not used here; a new `mode: 'format'` is added that generates structured spiritual content rather than reviewing existing content.

### Style Profile Injection

`formatStyleForPrompt(styleProfile)` from `lib/agents/stylist.ts` is called and the result is appended to the system prompt for all generative agents, ensuring that generated content reflects the author's voice across all formats.

### Project Role Adjustment

The `userRole` field from `ProjectContext` drives format-specific tone modifiers:
- `preacher` — discussion guide uses sermon-structure language; social posts use proclamatory tone
- `devotionalist` — devotional extract uses intimate, journalistic tone; email uses pastoral warmth
- `author` — blog post uses narrative structure; social posts use literary excerpt style
- `content_creator` — social posts use engagement-optimised language with call-to-action hooks

---

## Acceptance Criteria

- [ ] Given a chapter with more than 100 words is open in the editor, when the user clicks "Repurpose", then the format selection modal opens within 500ms.
- [ ] Given the format selection modal is open, when the user selects two formats and clicks "Generate", then both formats begin generating and show spinner indicators.
- [ ] Given generation is in progress, when one format fails due to an API error, then that card shows an error state with a Retry button while other cards continue generating normally.
- [ ] Given a format has completed generation, when the user clicks the "Edit" tab on that card, then the content becomes editable in a textarea.
- [ ] Given a format has been edited, when the user clicks "Save to Notes Vault", then a new note appears in the Notes Vault with the title "[Project Title] — [Format Name] — [Date]" and the tag "repurposed".
- [ ] Given all formats have completed generation, when the user clicks "Bulk Export All", then a ZIP file downloads containing one file per format.
- [ ] Given the user is on the Free pricing tier, when they view the editor, then the "Repurpose" button is visible but disabled, and hovering over it shows a tooltip reading "Available on Ministry plan".
- [ ] Given a Twitter format is generated, then the output content must be 280 characters or fewer.
- [ ] Given a devotional extract format is generated, then the output must contain exactly 3, 4, or 5 day sections each with a title, Scripture reference, reflection text, and prayer prompt.
- [ ] Given the user closes and reopens the modal within 30 minutes of generating, then previously generated formats are still visible in their completed state.
- [ ] Given the Repurpose action is triggered from the project view, then the source content used is all chapters concatenated in order by chapter position.
- [ ] Given a user with an active Style Profile repurposes content, then the generated text matches the stylistic characteristics of the profile (reviewable by reading tone and sentence structure).

---

## Edge Cases

1. **Source content is too short.** If the chapter or project has fewer than 100 words, the Repurpose button is disabled with a tooltip: "Add at least 100 words before repurposing." The 100-word threshold prevents meaningless generation from stub chapters.

2. **Source content is extremely long.** If the source content exceeds 8,000 words, it is automatically truncated to the most recent 8,000 words before being sent to the API. A notice is shown in the modal: "Content was trimmed to 8,000 words for generation. The full chapter has been preserved."

3. **API rate limit or timeout.** If the Anthropic API returns a rate limit error or times out, the failed format shows "Generation timed out — please retry." The user is not blocked from using other formats.

4. **No Style Profile exists.** If the user has no saved Style Profile at the user or project level, generation proceeds without style injection. A subtle notice reads: "No style profile found. Add writing samples in Settings to personalise output."

5. **User navigates away mid-generation.** If the user closes the modal while generation is in progress, a confirmation dialog appears: "Generation is still in progress. Leaving will cancel remaining formats. Continue?" Formats already completed are preserved in session cache.

6. **Regeneration changes the output significantly.** If the user has edited a format card and then clicks Regenerate, a confirmation warns: "Regenerating will overwrite your edits. Continue?" This prevents accidental loss of manual edits.

7. **Discussion guide produces fewer than 5 questions.** If the AI returns a discussion guide with fewer than 5 questions (e.g., source content is theologically thin), the system shows a warning on the card: "Only [N] questions were generated. The source content may be too brief for a full guide."

8. **Bulk export while some formats are still generating.** The "Bulk Export All" button only activates once all selected formats have either completed or errored. Errored formats are excluded from the export with a note in the ZIP's readme file.

9. **User has no active project context.** If the Repurpose action is somehow triggered without a valid project ID, the API returns a 400 error and the modal shows a generic error state prompting the user to reload and try again.

10. **Duplicate saves to Notes Vault.** If the user clicks "Save to Notes Vault" twice on the same card, the second click checks for an existing note with the same auto-generated title and prevents a duplicate, showing a toast: "Already saved to Notes Vault."

---

## Dependencies

- Phase 2 AI Layer must be fully complete: `/api/orchestrate`, Scribe agent, Shepherd agent, and style profile infrastructure must all be operational.
- The Notes Vault (PRD-04) must be complete, as "Save to Notes Vault" writes to `ltu_notes`.
- The Style Profile feature must be complete, as style injection is central to output quality.
- The `formatContextForPrompt` and `buildProjectContext` functions in `lib/ai/context.ts` must be stable.
- Pricing tier gating requires a `subscription_tier` field on `ltu_profiles` or an equivalent entitlement check mechanism.

---

## Estimated Scope

**XL**

Rationale: Six distinct AI prompt flows, each requiring format-specific system prompt engineering. A multi-step modal with real-time async generation state management. ZIP export logic. Notes Vault integration. Style Profile injection. Tier gating. The scope is large but all dependencies already exist — no new infrastructure is required, only new prompt design and UI surfaces.
