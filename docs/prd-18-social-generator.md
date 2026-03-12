# PRD-18: Social Media Content Generator

## Overview

The Social Media Content Generator allows Scriptloom users to select a passage from their writing and instantly receive AI-generated, platform-specific social media posts across Twitter/X, Instagram, Facebook, LinkedIn, and Threads. Posts are tailored to Christian ministry audiences, spiritually reviewed before delivery, and can be saved to the Notes Vault or copied to clipboard for immediate use. This feature positions Scriptloom as a direct competitor to SermonAI and ChurchSocial.ai, both of which generate social content but operate outside a writing environment and lack Scriptloom's style-matched, spiritually grounded AI layer.

## Problem Statement

Ministry writers invest significant effort crafting sermons, chapters, and devotionals inside Scriptloom. Once a piece is written, repurposing it for social media currently requires the user to leave the app, switch to a separate tool, manually reformulate the content, then return to post. SermonAI charges separately for its social repurposing feature and is sermon-only. ChurchSocial.ai is a social-only tool with no connection to the writing environment. Neither product matches the user's voice, understands their theological context, or routes content through a spiritual tone check. Scriptloom can solve all three gaps using its existing Scribe agent (for generation) and Shepherd agent (for tone review), delivering a uniquely integrated experience that no competitor in the faith writing space currently offers.

---

## User Stories

1. As a pastor who has just finished writing a sermon in Scriptloom, I want to generate Instagram and Twitter posts from it so that I can share the core message with my congregation online without re-writing anything.
2. As a Christian author, I want to choose the tone of my social posts (Inspirational, Educational, Conversational, Promotional) so that the generated content fits the platform and my audience.
3. As a content creator, I want the AI to extract key quotes and Scripture references from my writing and use them as social hooks so that the most powerful lines in my work reach a wider audience.
4. As a user, I want to see 3–5 variations per platform so that I can choose the version that best fits my voice and message.
5. As a ministry leader, I want all generated posts to pass a spiritual tone check so that I can be confident nothing theologically problematic slips through.
6. As a user, I want to copy any generated post to my clipboard with a single click so that I can paste it directly into Buffer, Hootsuite, or a social app without extra steps.
7. As a user, I want to save any generated post to my Notes Vault so that I can schedule and edit it later.
8. As a user, I want to generate posts for all platforms at once so that I do not have to run the tool five times.
9. As a user, I want to see a character count indicator on each variation so that I know immediately whether a Twitter/X post is within the 280-character limit.
10. As a Christian writer, I want the generator to suggest relevant hashtags for each post so that my content is discoverable by ministry audiences.
11. As a user, I want to see a visual preview card that approximates how my post will appear on each platform so that I can assess the presentation before posting.
12. As a user, I want to see image text overlay suggestions — headline text suitable for a graphic — so that I can create matching visuals even though Scriptloom does not generate images.

---

## Detailed Requirements

### Functional Requirements

1. **Entry Points**
   1.1. A "Share" option appears in the editor toolbar overflow menu (three-dot menu) when the user has selected text or is viewing a chapter with content.
   1.2. A "Generate Social Posts" option appears in the Content Repurposing Engine (PRD-11), accepting the full chapter or a highlighted selection as input.
   1.3. Both entry points open the Social Generator panel as a full-screen modal overlay (not a sidebar, to give room for multi-platform previews).

2. **Input Selection**
   2.1. When launched from selected text in the editor, that selection (max 4,000 characters) is pre-populated as the source content.
   2.2. When launched without a selection, the full chapter content is used (truncated to 4,000 characters with a notice).
   2.3. The user can manually edit the source content in a textarea before generating.

3. **Platform Selection**
   3.1. The user selects one or more platforms via checkboxes: Twitter/X, Instagram, Facebook, LinkedIn, Threads.
   3.2. A "Select All" toggle selects/deselects all five platforms.
   3.3. By default, all platforms are selected on first open. The selection persists for the session.

4. **Tone Selection**
   4.1. Four tone options are presented as radio buttons: Inspirational, Educational, Conversational, Promotional.
   4.2. Default is Inspirational.
   4.3. The selected tone is passed to the Scribe agent as part of the generation prompt.

5. **AI Generation**
   5.1. On clicking "Generate", a POST request is sent to `/api/social/generate`.
   5.2. The Scribe agent generates 3 variations per selected platform (configurable; default 3, max 5).
   5.3. The Shepherd agent reviews all generated content and flags any variation with theological concerns (overallTone score below threshold). Flagged variations display a yellow warning badge: "Shepherd Note: [suggestion]".
   5.4. Generation runs in parallel across platforms to minimise total latency.
   5.5. A streaming-style loading state shows per-platform spinners with labels ("Generating for Instagram...") until that platform's results arrive.

6. **Platform Character Limits and Constraints**
   6.1. Twitter/X: 280 characters maximum. Any variation exceeding this limit displays a red character count and a truncation warning.
   6.2. Instagram: No hard limit enforced; caption up to 2,200 characters. Hashtag block appended separately.
   6.3. Facebook: No hard limit enforced; target 400–600 words for engagement.
   6.4. LinkedIn: Target 150–300 words for professional long-form posts.
   6.5. Threads: 500 characters maximum.
   6.6. A real-time character counter is displayed beneath each variation's textarea.

7. **Scripture and Quote Extraction**
   7.1. Before generation, the source text is scanned using the existing `scripture-regex.ts` pattern to extract all Scripture references.
   7.2. Extracted references are passed to the Scribe agent as "hooks to potentially use" in the system prompt.
   7.3. The agent also identifies the single most quotable sentence in the source text and prioritises it as an opening hook in at least one variation per platform.

8. **Hashtag Suggestions**
   8.1. Each generated post includes a separate `hashtags` array of 5–10 relevant hashtags.
   8.2. Hashtags are tailored to Christian content: always includes at least one from a base set (#faith, #Christian, #Scripture, #ministry, #devotional, #sermon, #BibleVerse) plus contextually derived tags.
   8.3. The user can deselect individual hashtags by clicking them (toggle chips); selected hashtags are included in the final copied text.
   8.4. Instagram and Threads posts display hashtags as a separate block beneath the caption text.

9. **Image Text Overlay Suggestions**
   9.1. Each platform card includes a "Graphic Headline" field: a short (max 10 words) bold text suggestion suitable for overlaying on an image in Canva, Adobe Express, or a similar tool.
   9.2. This is text only — Scriptloom does not generate or host images.
   9.3. The graphic headline is copyable with a dedicated copy icon.

10. **Preview Cards**
    10.1. Each variation is presented inside a styled preview card that approximates the visual layout of the target platform:
        - Twitter/X: rounded card, avatar placeholder, handle placeholder, post text, character count badge
        - Instagram: square-cropped image placeholder (grey box), caption below
        - Facebook: wider card, profile placeholder, post text, reaction bar (static)
        - LinkedIn: professional card layout, company logo placeholder, headline text
        - Threads: minimal card matching Twitter/X layout with Threads icon
    10.2. Preview cards are visual approximations only; they do not connect to social accounts.

11. **Copy and Save Actions**
    11.1. Each variation has a "Copy" button that copies the post text plus selected hashtags to the clipboard and shows a brief "Copied!" confirmation.
    11.2. Each variation has a "Save to Notes" button that creates a new Note in `ltu_notes` with the post text as content and auto-tags it with the platform name and "social-post".
    11.3. A "Copy All" button at the top of each platform section copies all 3 variations separated by line breaks.

12. **Regenerate and Edit**
    12.1. Each variation has an inline editable textarea; the user can modify the generated text directly.
    12.2. A "Regenerate" button (per platform) re-runs generation for that platform only, preserving the user's tone and source content.
    12.3. A "Regenerate All" button re-runs all platforms simultaneously.

13. **Batch Generation Mode**
    13.1. The default mode generates for all selected platforms in one operation.
    13.2. Results are displayed in a tab interface: one tab per platform with a badge showing the number of variations ready.

### Non-Functional Requirements

- NFR-1: Total generation time for all 5 platforms (3 variations each = 15 total posts) must complete within 15 seconds under normal API conditions.
- NFR-2: The modal must be fully keyboard-navigable (Tab, Shift+Tab, Enter, Escape to close).
- NFR-3: Clipboard write operations must use the modern `navigator.clipboard.writeText` API with a graceful fallback for HTTP environments (local dev).
- NFR-4: Generated content and the source text are never persisted server-side unless the user explicitly saves to Notes Vault; the API route is stateless.
- NFR-5: The feature must be available only to users on the Writer tier and above (free tier users see a locked state with an upgrade prompt).
- NFR-6: All Shepherd tone review results must be processed within the same API response; no secondary round-trip for tone checking.
- NFR-7: The modal must render correctly on tablets (768px+); on mobile phones it renders as a full-screen bottom sheet, one platform at a time.

---

## UI/UX Specification

### Screen 1: Generator Modal — Configuration Step

Triggered when user clicks "Share" > "Generate Social Posts" in the editor.

Layout:
- Modal header: "Generate Social Posts" title + X close button
- Source content panel (left, 40% width): labelled "Source Content", shows editable textarea pre-filled with selected or chapter text; word count shown below
- Configuration panel (right, 60% width):
  - "Platforms" section: 5 platform checkboxes with platform icons, "Select All" toggle
  - "Tone" section: 4 radio button tiles (Inspirational / Educational / Conversational / Promotional) with brief descriptor text beneath each
  - "Variations" stepper: 3 (default), range 1–5
- Footer: "Generate Posts" CTA button (gold, full width), disabled until at least one platform is selected

### Screen 2: Generator Modal — Results Step

Shown after generation completes.

Layout:
- Modal header: "Generated Posts" + Back arrow (returns to configuration) + Regenerate All button
- Platform tab row: Twitter/X | Instagram | Facebook | LinkedIn | Threads, each with a green checkmark when results are ready
- Active platform panel:
  - Platform label + character limit badge
  - 3 variation cards stacked vertically, each containing:
    - Editable textarea with generated post text
    - Character counter (green if within limit, red if over)
    - Hashtag chip row (chips are toggleable)
    - "Graphic Headline" row with copy icon
    - Preview card thumbnail (expandable on click)
    - Footer row: "Copy" button (left) + "Save to Notes" button (right)
  - "Copy All Variations" text button at bottom of platform panel
- Shepherd Warning banner (if any variation flagged): amber banner above affected card: "The Shepherd flagged this variation: [suggestion]"

### Screen 3: Notes Vault — Saved Post

When a user saves a post to Notes Vault, it appears in the Notes list with:
- Tag chips: [platform name], [social-post]
- Content preview showing the first 100 characters of the post
- Title auto-generated as: "[Project Title] — [Platform] Post — [Date]"

---

## Data Model

No new database tables are required. All generation is stateless at the API layer. Saved posts use the existing `ltu_notes` table.

### Modified: `ltu_notes` (no schema change)

When saving a social post, the route writes:
```json
{
  "user_id": "uuid",
  "content": "[post text]\n\n#hashtag1 #hashtag2 ...",
  "tags": ["instagram", "social-post", "project-title-slug"]
}
```

The `title` column does not exist in the current schema (notes use content for display); the first line of content serves as the display title in the Notes Vault UI. If a `title` column is added in a future migration, this route should be updated accordingly.

### Optional: `ltu_social_generation_log` (Future / Out of Scope for this PRD)

A future analytics table could log generation events (timestamp, platform, tone, word count of source, user_id) for product analytics. This is explicitly out of scope for the initial implementation.

---

## API Routes

### POST /api/social/generate

Generates social media posts from a source text.

Request body:
```json
{
  "sourceText": "string (max 4000 chars)",
  "platforms": ["twitter", "instagram", "facebook", "linkedin", "threads"],
  "tone": "inspirational | educational | conversational | promotional",
  "variationsPerPlatform": 3,
  "projectId": "uuid (optional, for context injection)"
}
```

Response:
```json
{
  "results": {
    "twitter": {
      "variations": [
        {
          "id": "var_001",
          "text": "Generated post text...",
          "characterCount": 247,
          "withinLimit": true,
          "hashtags": ["#faith", "#Scripture", "#devotional"],
          "graphicHeadline": "God's grace never runs out",
          "shepherdReview": {
            "flagged": false,
            "note": null
          }
        }
      ],
      "characterLimit": 280
    },
    "instagram": { ... },
    ...
  },
  "extractedScriptures": ["Romans 8:28", "Psalm 23:1"],
  "extractedQuote": "The sentence identified as most quotable"
}
```

Errors:
- 400: Missing required fields or sourceText exceeds 4,000 characters
- 401: Unauthenticated
- 403: Free-tier user (feature gated)
- 429: Claude API rate limit hit (return after-retry header)
- 500: Unexpected generation failure

### POST /api/social/save-to-notes

Saves a generated post variation to the Notes Vault.

Request body:
```json
{
  "text": "Post text including hashtags",
  "platform": "instagram",
  "projectId": "uuid"
}
```

Response:
```json
{ "noteId": "uuid", "success": true }
```

---

## AI Agent Integration

### Scribe Agent (`lib/agents/scribe.ts`)

The Scribe agent is extended with a new `mode: 'social'` to handle social post generation. The system prompt for this mode instructs the agent to:
- Write in the author's voice (injected via their style profile from `ltu_style_profiles` if available)
- Match the requested tone (inspirational / educational / conversational / promotional)
- Respect platform constraints (character limits, audience expectations)
- Use extracted Scripture references and key quotes as anchors
- Produce exactly N variations as a JSON array to allow structured parsing

The API route calls `runScribe({ mode: 'social', userText: sourceText, context, tone, platform, variationsCount })`.

### Shepherd Agent (`lib/agents/shepherd.ts`)

The Shepherd agent's existing `mode: 'review'` is called for each generated variation. The `overallTone` and `theologicalNotes` fields from the Shepherd's JSON response are surfaced to the user:
- If `theologicalNotes` is non-null, the variation is flagged with an amber warning badge
- The `suggestions` array is displayed in the warning banner beneath the affected card

The Shepherd call runs in parallel with, not after, generation. The API route fires both Scribe and Shepherd calls concurrently using `Promise.all` for each platform batch.

### Style Profile Injection

If the user has a `ltu_style_profiles` record, the `formatStyleForPrompt` utility from `lib/agents/stylist.ts` is called and the result is injected into the Scribe system prompt as a style guide block. This ensures generated posts sound like the author, not generic AI content.

---

## Acceptance Criteria

- [ ] Given the user selects text in the editor and clicks "Share" > "Generate Social Posts", then the modal opens with the selected text pre-filled in the source content textarea.
- [ ] Given the user selects only Twitter/X and Instagram before clicking Generate, then results are shown only for those two platforms; Facebook, LinkedIn, and Threads tabs are hidden.
- [ ] Given a Twitter/X variation exceeds 280 characters, then the character counter displays in red and a warning reads "Over limit — shorten before posting".
- [ ] Given a free-tier user opens the "Share" menu, then the "Generate Social Posts" option is visible but clicking it shows a locked overlay with an upgrade prompt instead of the generator modal.
- [ ] Given the user selects the "Conversational" tone, then the generated posts use informal, approachable language rather than elevated or formal ministry vocabulary.
- [ ] Given the source text contains "Romans 8:28", then at least one generated variation references or quotes this Scripture.
- [ ] Given the Shepherd agent flags a variation as having a theological concern, then that variation displays an amber "Shepherd Note" banner with the suggestion text.
- [ ] Given the user clicks "Copy" on any variation, then the clipboard receives the post text plus all currently-selected hashtags, and a "Copied!" confirmation briefly appears on the button.
- [ ] Given the user clicks "Save to Notes" on a variation, then a new note appears in the Notes Vault tagged with the platform name and "social-post".
- [ ] Given the user clicks "Regenerate" for Instagram only, then only the Instagram variations are replaced; Twitter/X, Facebook, LinkedIn, and Threads results are preserved.
- [ ] Given the user edits the source content textarea and clicks "Regenerate All", then all platforms regenerate using the updated source text.
- [ ] Given the user sets variations to 5, then each platform section shows exactly 5 variation cards.
- [ ] Given the user closes the modal without saving, then no data is persisted to the database.
- [ ] Given the API returns a 429 rate-limit error, then the modal displays "Generation temporarily unavailable — please try again in a moment" rather than an empty or broken state.

---

## Edge Cases

- **Source text is only a Scripture reference with no surrounding commentary:** The Scribe agent must still produce valid variations. The system prompt should handle sparse input gracefully and expand meaningfully from the reference rather than returning minimal output.
- **All 5 platform checkboxes deselected before clicking Generate:** The Generate button is disabled; clicking it while disabled does nothing (belt-and-suspenders: server also validates that at least one platform is provided).
- **User's style profile is empty or very short (fewer than 200 words of training data):** Skip style injection rather than injecting a low-confidence profile. The prompt notes "No style profile available — use a neutral Christian ministry voice."
- **Source text is in a language other than English:** The Scribe agent should generate in the same language as the source text. The Shepherd agent's theological review applies regardless of language. This is a stretch goal; initial implementation targets English only.
- **The user rapidly clicks Generate multiple times:** Debounce the Generate button for 2 seconds and disable it while a request is in flight to prevent duplicate API calls.
- **Generated text contains a Scripture misquotation:** The Shepherd agent review should catch this. If it does not, this is an AI limitation; the UI copy should remind users to verify all Scripture quotations before posting.
- **Modal opened from Content Repurposing Engine vs. from editor:** Both entry points use the same modal component. The only difference is the source text pre-fill. No special-casing beyond the prop passed to the modal.
- **User writes in a language that uses right-to-left script:** Character count logic remains correct (Unicode-aware character counting). Layout for RTL is out of scope for initial implementation.
- **Clipboard API unavailable (HTTP in local dev):** Fall back to creating a temporary `<textarea>` element, using `document.execCommand('copy')`, and silently catching the deprecation warning in dev mode only.

---

## Dependencies

- **PRD-06 (AI Writing Tools):** The Scribe and Shepherd agents must be fully implemented before this PRD can be built. The new `mode: 'social'` extends an existing agent; it does not replace it.
- **PRD-11 (Content Repurposing Engine):** The social generator is listed as one output of the repurposing engine. PRD-11 does not need to be complete for PRD-18 to function; the generator can also be launched directly from the editor. However, the two features share the same `/api/social/generate` route to avoid duplication.
- **`lib/memory/scripture-regex.ts`:** Already implemented; used here for Scripture extraction from source text.
- **`lib/agents/stylist.ts` / `ltu_style_profiles`:** Style injection is a best-effort enhancement, not a hard dependency. The feature degrades gracefully if no style profile exists.
- **`ltu_notes` table (PRD-04):** Required for the Save to Notes Vault action.
- **Tier gating:** A `subscription_tier` column on `ltu_profiles` must exist, or the API route must check tier via a Supabase flag. If this column does not yet exist, the feature should be un-gated for all users during initial rollout and gating added when the billing system is implemented.

---

## Estimated Scope

**L (Large)**

Rationale: The modal UI is complex (multi-platform tabs, preview cards, hashtag chips, editable textareas, per-platform character counters, Shepherd warning banners). The API route must handle parallel generation across 5 platforms with concurrent Shepherd reviews. Style profile injection, Scripture extraction, and the Save to Notes integration each add meaningful work. The feature is self-contained (no real-time collaboration, no new DB tables) which prevents it from reaching XL, but the surface area across editor, repurposing engine, and notes vault is broad.
