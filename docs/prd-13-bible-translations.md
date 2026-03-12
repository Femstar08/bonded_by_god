# PRD-13: Bible Translation Comparison

## Overview

The Bible Translation Comparison feature allows users to view any Scripture reference in up to four translations simultaneously, directly within the editor interface. When a Scripture reference appears — whether surfaced by the Interpreter agent, inserted manually, or typed as a slash command — the user can expand an inline comparison panel showing the verse in NIV, ESV, KJV, NKJV, NASB, NLT, and The Message side by side. The user can click any translation's text to insert it directly into their writing. A preferred default translation is configurable in Settings.

## Problem Statement

Scriptloom already surfaces Scripture suggestions through the Interpreter agent, but it does not show the verse text to the user — only the reference. This means a user who receives a suggestion for "Romans 8:28" must leave the app and open Bible Gateway, Blue Letter Bible, or a separate Bible app to read the verse, choose a translation, and copy it back. This context-switching disrupts the writing flow and is one of the most common friction points identified in comparable tools. Logos Bible Software is the gold standard for translation comparison but is academic, expensive, and not a writing studio. SermonAI addresses this to a degree but is sermon-only. For Scriptloom, adding translation comparison is characterised in the competitive analysis as "the easiest win" — the verse lookup infrastructure is low-lift relative to its user value, and it reinforces the app as a self-contained writing environment. The feature also directly addresses the open decision in `build_plan.md` regarding which Bible translation to support: the answer is all major ones, user-selectable.

---

## User Stories

1. As a pastor writing a sermon, I want to see my suggested Scripture verse in multiple translations without leaving the editor, so that I can choose the version that best fits my message.

2. As a Christian author, I want to click a translation's text to insert it directly into my chapter, so that I do not have to copy and paste from external websites.

3. As a Bible study leader, I want to compare the NIV and ESV side by side for a key passage, so that I can help group members see nuances between translations.

4. As a devotionalist, I want to set the King James Version as my default translation, so that all Scripture suggestions display in KJV first.

5. As any user, I want recently looked-up verses to load instantly on second view, so that the comparison panel feels fast and responsive.

6. As a user on a mobile or tablet device, I want to view translations in a stacked layout rather than side by side, so that the text is readable on smaller screens.

7. As any user, I want to configure how many translations are shown simultaneously (2, 3, or 4), so that I can control the density of the comparison panel to match my preference.

---

## Detailed Requirements

### Functional Requirements

1. Scripture references rendered in the editor (as Scripture Block nodes from the Tiptap `ScriptureBlockExtension`) must display a "Compare Translations" expand button below the reference.

2. Scripture references suggested by the Interpreter agent in the Insight Panel must also include a "Compare" link/button next to each suggestion.

3. Clicking either entry point opens an inline Translation Comparison Panel. This panel appears below the Scripture Block in the editor, or as a drawer panel in the sidebar when triggered from the Insight Panel.

4. The Translation Comparison Panel supports the following translations:
   - NIV — New International Version
   - ESV — English Standard Version
   - KJV — King James Version
   - NKJV — New King James Version
   - NASB — New American Standard Bible
   - NLT — New Living Translation
   - MSG — The Message (Eugene Peterson)

5. The panel initially displays the user's preferred default translation plus up to two additional popular translations (default fallback order: NIV, ESV, KJV). The total number of translations shown defaults to 3.

6. The user can change which translations are displayed using a multi-select dropdown within the panel. Up to 4 translations can be active simultaneously; selecting a 5th deselects the oldest.

7. The user can toggle the layout between "Side by Side" (column grid) and "Stacked" (single column, translations listed vertically) using a layout toggle button in the panel header.

8. Each translation column or card shows: translation abbreviation badge (e.g. "NIV"), the full verse text, and an "Insert" button.

9. Clicking "Insert" on a translation replaces the current Scripture Block in the editor with a new block containing: the reference, the selected translation abbreviation, and the full verse text. If triggered from the Insight Panel suggestion, it inserts a new Scripture Block at the current cursor position.

10. The Translation Comparison Panel can be dismissed by clicking an X button in its header, pressing Escape, or clicking outside the panel.

11. Fetched verse text is cached in the browser (localStorage or in-memory) with a TTL of 7 days. On second access to the same reference + translation combination, the cached text is served immediately without a network call.

12. If a verse is not available in a requested translation from the API (e.g. The Message does not include some deuterocanonical books), that translation column shows a notice: "Not available in [Translation]" rather than an error state.

13. If all translations fail to load (e.g. the user is offline), the panel shows a full error state with a Retry button.

14. A "Copy All" button in the panel header copies all currently displayed translations to the clipboard in a formatted block (one translation per section, with translation label).

15. A "Manual Lookup" feature is accessible from a dedicated button in the editor toolbar (within the Scripture tools group). This opens a search input where the user can type any Scripture reference (e.g. "Ps 23:1" or "Philippians 4:13") and trigger the comparison panel directly without needing an existing Scripture Block.

16. The Manual Lookup input accepts standard reference formats and normalises common abbreviations (e.g. "Gen" for Genesis, "Rev" for Revelation, "Ps" for Psalms).

17. A user's preferred translation preference is stored in their profile and applies across all projects.

18. The preferred translation setting is configurable in the Settings page under a new "Scripture & Bible" section.

19. The layout preference (side-by-side vs stacked) and the number of translations to show (2, 3, or 4) are also saved in the user's profile.

### Non-Functional Requirements

1. First load of a verse (no cache) must complete within 3 seconds under normal network conditions.
2. Cached verse loads must render within 50ms.
3. The comparison panel must render correctly at viewport widths from 375px (mobile) to 1,440px (desktop). On widths below 768px, the layout defaults to "Stacked" regardless of the user's preference.
4. All API calls to the Bible API are made server-side to protect any API keys and prevent CORS issues.
5. The feature must be available to all authenticated users on all pricing tiers (it is a core writing utility, not a premium feature).
6. No Scripture text is stored permanently in Scriptloom's database. Only the cache entry metadata (reference + translation + text + fetched_at) is stored, and it expires after 7 days.

---

## UI/UX Specification

### Entry Point 1 — Scripture Block in Editor

A Scripture Block is a Tiptap node that renders with a distinctive gold-left-border card style. Existing Scripture Blocks gain a "Compare translations" link below the reference text. This link is small, styled in muted gold, and does not disrupt the reading flow of the document.

When clicked, the Translation Comparison Panel slides open directly below the Scripture Block as an inline expansion (not a modal). This keeps the panel in close visual proximity to the Scripture it relates to.

### Entry Point 2 — Insight Panel Suggestion

Each Scripture suggestion row in the Insight Panel has: reference text, relevance note, an "Insert" button (existing), and a new "Compare" button (ghost style, with a columns icon). Clicking "Compare" opens the panel in the right sidebar drawer below the suggestion row.

### Entry Point 3 — Manual Lookup (Toolbar)

A "Scripture" button in the Tiptap toolbar (or the floating toolbar) includes a sub-action "Look Up Translation". This opens a small popover containing a reference input field and a "Look Up" button. On submission, the Translation Comparison Panel opens in the sidebar as a full-height drawer.

### Translation Comparison Panel Layout

Panel header row (from left to right):
- Reference label (bold, Playfair Display): "Romans 8:28"
- Layout toggle: two icons for side-by-side vs stacked
- Translation count selector: "Showing 3" with a dropdown (options: 2, 3, 4)
- Copy All button
- Close (X) button

Translation selector row:
- Seven translation pills (NIV, ESV, KJV, NKJV, NASB, NLT, MSG), each toggleable
- Active translations are highlighted in gold; inactive are muted
- A maximum of 4 can be active; the rule enforcing the maximum is enforced in the UI by disabling non-active pills once 4 are selected

Translation content area:
- Side-by-side mode: CSS grid with equal-width columns
- Stacked mode: single column, cards vertically stacked
- Each translation card contains:
  - Translation abbreviation badge (small, gold background)
  - Verse text (body font, readable size, ~16px)
  - "Insert" button at the bottom of the card (primary style)

Loading state: each translation card shows a skeleton loader independently while its verse is being fetched. Translations with cached data appear immediately while others load.

### Settings Page — Scripture and Bible Section

In the Settings page, a new collapsible section titled "Scripture and Bible" appears below "Spiritual Tools". It contains:

- Default Translation: a select dropdown listing all 7 supported translations
- Comparison Layout: a radio group with "Side by Side" and "Stacked" options
- Translations to Show: a number input or segmented control with options 2, 3, 4
- A Save button that writes the changes to the user's profile record

### User Flow — Compare from Scripture Block

1. The Interpreter agent suggests Romans 8:28; the user inserts it as a Scripture Block
2. The block renders in the editor with a "Compare translations" link
3. The user clicks the link; the Translation Comparison Panel opens below the block
4. The panel shows NIV, ESV, and KJV loading, then rendering with verse text
5. The user clicks "NKJV" in the translation selector to add it; the panel updates to 4 translations
6. The user reads the NKJV version and clicks "Insert" on the NKJV card
7. The Scripture Block in the editor updates to display NKJV text and badge
8. The panel remains open; the user clicks X to close it

---

## Data Model

### Changes to ltu_profiles

```sql
-- Migration 012_bible_translations.sql
ALTER TABLE ltu_profiles
  ADD COLUMN IF NOT EXISTS preferred_translation TEXT
    NOT NULL DEFAULT 'NIV'
    CHECK (preferred_translation IN ('NIV', 'ESV', 'KJV', 'NKJV', 'NASB', 'NLT', 'MSG'));

ALTER TABLE ltu_profiles
  ADD COLUMN IF NOT EXISTS bible_comparison_layout TEXT
    NOT NULL DEFAULT 'side_by_side'
    CHECK (bible_comparison_layout IN ('side_by_side', 'stacked'));

ALTER TABLE ltu_profiles
  ADD COLUMN IF NOT EXISTS bible_translations_count INTEGER
    NOT NULL DEFAULT 3
    CHECK (bible_translations_count BETWEEN 2 AND 4);
```

### Client-Side Translation Cache

Cached verse data is stored in localStorage using a structured key format:

Key pattern: `scriptloom:verse:[translation]:[normalised-reference]`
Example: `scriptloom:verse:ESV:Romans-8-28`

Cache entry shape:
```typescript
type VerseCache = {
  reference: string       // normalised reference, e.g. "Romans 8:28"
  translation: string     // e.g. "ESV"
  text: string            // full verse text
  fetchedAt: number       // Unix timestamp in ms
}
```

Cache entries older than 7 days (604,800,000ms) are ignored and re-fetched. A cache cleanup function runs on app mount to remove expired entries and keep localStorage size bounded.

### No New Database Table for Cache

Given that verse texts are public domain or openly licensed (for KJV) or available via API with appropriate terms, and that users do not create or own verse data, no database-level caching table is required in this phase. localStorage provides sufficient performance for the caching requirement.

### Updated TypeScript Types (types/database.ts)

```typescript
export type BibleTranslation = 'NIV' | 'ESV' | 'KJV' | 'NKJV' | 'NASB' | 'NLT' | 'MSG'

export type BibleComparisonLayout = 'side_by_side' | 'stacked'

// Update the Profile type:
export type Profile = {
  id: string
  email: string
  display_name: string | null
  show_prayer_prompt: boolean
  show_daily_scripture: boolean
  preferred_translation: BibleTranslation      // new
  bible_comparison_layout: BibleComparisonLayout // new
  bible_translations_count: number              // new
  created_at: string
}
```

---

## API Routes

### GET /api/bible/verse?ref=[reference]&translations=[comma-separated list]

Fetches the verse text for a given reference in one or more translations.

Query parameters:
- `ref` — the Scripture reference string, e.g. "Romans 8:28" or "John 3:16"
- `translations` — comma-separated list of translation codes, e.g. "NIV,ESV,KJV"

The route performs the following:
1. Validates that the user is authenticated
2. Normalises the reference string
3. For each requested translation, checks if a valid (non-expired) cached response exists server-side in memory (optional server cache as a secondary layer; primary cache is client localStorage)
4. Fetches uncached translations from the upstream Bible API
5. Returns all results in a single response

Response:
```json
{
  "reference": "Romans 8:28",
  "results": [
    {
      "translation": "NIV",
      "text": "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
      "available": true
    },
    {
      "translation": "ESV",
      "text": "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
      "available": true
    },
    {
      "translation": "MSG",
      "text": "That's why we can be so sure that every detail in our lives of love for God is worked into something good.",
      "available": true
    }
  ]
}
```

Error response when reference cannot be parsed:
```json
{ "error": "Reference not recognised: 'Habbakuk 9:99'" }
```

### GET /api/bible/search?q=[query]&translation=[code]

Supports the Manual Lookup feature by accepting a fuzzy or partial reference string (e.g. "rom 8") and returning a list of matching references. This route performs basic normalisation and returns the top 5 candidate references for the user to select.

Response:
```json
{
  "matches": [
    { "reference": "Romans 8:1", "preview": "There is therefore now no condemnation..." },
    { "reference": "Romans 8:28", "preview": "And we know that in all things God works..." }
  ]
}
```

### PATCH /api/settings/bible

Saves the user's Bible translation preferences to their profile record.

Request body:
```json
{
  "preferred_translation": "KJV",
  "bible_comparison_layout": "stacked",
  "bible_translations_count": 2
}
```

Response: the updated profile fields.

---

## Bible API Integration

### Recommended Primary API: API.Bible (api.bible)

API.Bible (provided by American Bible Society) supports NIV, ESV, KJV, NKJV, NASB, NLT, and MSG through a single unified API. It offers a free tier with generous rate limits suitable for an MVP. The API key is stored in an environment variable (`BIBLE_API_KEY`) and is used only in server-side API routes.

Alternative fallback: `bible-api.com` — free, no key required, supports a smaller range of translations. Can be used as a fallback if API.Bible is unavailable.

### Environment Variables

```
BIBLE_API_KEY=          ← API.Bible key, required for NIV/ESV/NKJV/NASB/NLT/MSG
```

KJV is available from multiple free sources without authentication as it is in the public domain. The system should fall back to a public domain KJV endpoint (`https://bible-api.com/[reference]?translation=kjv`) if the primary API fails for that translation.

### Reference Normalisation

A utility function `normaliseScriptureReference(input: string): string` handles:
- Abbreviation expansion: "Gen" to "Genesis", "Ps" to "Psalms", "Rev" to "Revelation", etc.
- Hyphen/colon normalisation: "Romans 8 28" to "Romans 8:28"
- Multi-verse range support: "Romans 8:28-30" (passed as-is to the API)
- Case insensitivity: "romans 8:28" to "Romans 8:28"

The normalised reference is used as the cache key and as the query parameter to the upstream API.

---

## AI Agent Integration

The Bible Translation Comparison feature is primarily a data-retrieval feature rather than an AI-generation feature. However, it integrates with the existing AI agent system in two specific ways:

### Interpreter Agent Enhancement

When the Interpreter agent returns Scripture suggestions (via `runInterpreter` with `mode: 'suggest'`), the suggestion results currently return only the reference string and a relevance note. This PRD adds a `preloadTranslation` flag to the suggestion response that tells the client to proactively warm the cache for the user's preferred translation for each returned reference. This eliminates the cold-load delay when the user clicks "Compare" on an Interpreter suggestion.

No changes to the Interpreter's system prompt are required for this.

### Daily Scripture Enhancement

The Daily Scripture feature on the dashboard (`/api/daily-scripture`) currently returns a reference and text in a single hardcoded translation. This PRD enables the daily scripture display to use the user's `preferred_translation` setting. The `/api/daily-scripture` route is updated to accept a `translation` query parameter and fetch the verse accordingly.

---

## Acceptance Criteria

- [ ] Given a Scripture Block exists in the editor, when the user clicks "Compare translations", then the Translation Comparison Panel opens inline below the block within 3 seconds.
- [ ] Given the Translation Comparison Panel is open and the NIV text is displayed, when the user clicks "Insert" on the NIV card, then the Scripture Block in the editor updates to show the NIV verse text and the "NIV" translation badge.
- [ ] Given the user has set their preferred translation to KJV in Settings, when the Translation Comparison Panel opens for any reference, then KJV is the first translation shown and is pre-selected.
- [ ] Given a verse has been fetched and displayed, when the user closes and reopens the panel for the same reference within 7 days, then the verse loads instantly from cache without a network request.
- [ ] Given the user selects 4 active translations, when the user clicks a 5th translation pill, then the oldest active translation is automatically deselected and replaced with the newly selected one.
- [ ] Given the panel is in Side-by-Side mode, when the viewport width is less than 768px, then the layout automatically switches to Stacked mode.
- [ ] Given the user types "ps 23:1" into the Manual Lookup input and clicks "Look Up", then the Translation Comparison Panel opens showing the correct verse (Psalms 23:1).
- [ ] Given the user clicks "Copy All" in the panel, then the clipboard contains all currently displayed translations formatted with translation labels.
- [ ] Given a requested translation is not available for a reference, then that translation card shows "Not available in [Translation]" rather than an error or empty state.
- [ ] Given the user is offline, when the Translation Comparison Panel is opened for a reference with no cached data, then the panel shows a full error state with a Retry button.
- [ ] Given the user updates their preferred translation in Settings and clicks Save, then navigating to the editor and opening any comparison panel shows the new preferred translation first.
- [ ] Given the user has stored 200 verse cache entries in localStorage, when a cache cleanup runs on app mount, then all entries older than 7 days are removed.
- [ ] Given the API route /api/bible/verse is called without authentication, then it returns a 401 response.
- [ ] Given the Manual Lookup input receives "Philippians 4:13", then the normalised reference used in the API call is "Philippians 4:13" (properly cased, standard format).

---

## Edge Cases

1. **Reference spans multiple chapters.** References like "Romans 8:38-39" are supported. References spanning chapter boundaries (e.g. "Romans 8:39–9:1") may not be supported by all APIs. The system attempts the request and falls back to showing each verse reference separately if the API rejects the range format.

2. **The Message does not include a verse.** The Message is a paraphrase and organises some passages differently. If MSG returns no result for a specific verse, the MSG card shows "The Message presents this passage differently — try the surrounding verses" rather than a generic "Not available" message.

3. **Reference normalisation fails.** If the user types a reference that cannot be matched (e.g. "Habbakuk 9:99"), the Manual Lookup input shows a validation error: "We could not find that reference. Please check the book name and verse number." No API call is made.

4. **API.Bible rate limit hit.** If the upstream API returns a 429 (Too Many Requests), the server route waits 1 second and retries once. If the retry also fails, the client receives a 503 response and the affected translation card shows "Service temporarily unavailable — try again shortly."

5. **localStorage is full or unavailable.** Some browsers restrict localStorage in private browsing mode or apply strict storage quotas. If localStorage is unavailable, the cache silently degrades to in-memory session storage. The user experience is unaffected except that verses are re-fetched on every new session.

6. **User inserts a translation that contains smart quotes or special characters.** Bible translations use curly quotes and em-dashes. The Insert action must not strip these characters; they are inserted as-is into the Tiptap document node.

7. **Same reference opened in multiple editor panels simultaneously.** If a user has split view or two browser tabs open with the same project, cache entries are written by whichever tab fetches first. Concurrent access is handled gracefully since localStorage is synchronous and the cache is read-only after writing.

8. **The NASB is only partially available through the free API tier.** If API.Bible restricts NASB to paid accounts, the NASB translation pill is shown as disabled with a tooltip: "NASB requires a premium Bible API subscription. Contact support for more information." This is a configuration flag, not a code path that requires a full build cycle to adjust.

9. **User changes preferred translation mid-session.** If the user changes their preferred translation in Settings and returns to an open editor session, the change takes effect the next time a Translation Comparison Panel is opened. Any panels already open retain their current state until closed and reopened.

10. **Verse text is very long (multi-verse range returns 20+ verses).** For ranges returning more than 10 verses, the verse text area within each translation card is set to a max-height with overflow scroll. This prevents the panel from pushing the editor content very far down the page.

---

## Dependencies

- The `ScriptureBlockExtension` Tiptap node (`components/editor/tiptap/ScriptureBlockExtension.ts`) must be functional and capable of rendering expanded panels; this PRD extends that node.
- The Interpreter agent (`lib/agents/interpreter.ts`) must be operational for the Insight Panel entry point.
- The Settings page must have an extensible section structure capable of hosting a new "Scripture and Bible" subsection.
- `ltu_profiles` table must exist and the profile update flow must be in place (migrations 002 and 007).
- The `BIBLE_API_KEY` environment variable must be provisioned in both local development and Vercel production environments before the feature can be tested end-to-end.

---

## Estimated Scope

**M**

Rationale: No new database tables beyond three columns on `ltu_profiles`. The API integration is a fetch-and-return pattern with straightforward caching. The most complex part is the Translation Comparison Panel UI component with its async loading states, layout toggle, and Tiptap insert integration. The Manual Lookup and Settings page additions are straightforward. This is the smallest of the three Phase 4 PRDs, consistent with the competitive analysis characterisation of it as "the easiest win."
