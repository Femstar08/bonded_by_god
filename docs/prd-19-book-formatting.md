# PRD-19: Book Formatting & Typesetting

## Overview

Book Formatting & Typesetting gives Scriptloom authors the ability to transform their completed manuscript into a professionally laid-out, print-ready PDF, ePub, or Kindle file without leaving the app. The feature introduces a dedicated "Format Book" workflow in the export panel — distinct from the existing single-chapter PDF export — providing full book layout controls: trim size, typography, front matter, chapter styling, Scripture block formatting, page numbering, and a paginated preview. This directly challenges Atticus ($147 one-time), which is the best-in-class book formatting tool for indie authors but has no AI, no ministry features, and no cloud writing environment.

## Problem Statement

Scriptloom users writing book-length manuscripts currently have access only to a single-chapter PDF export (PRD-08), which produces a utilitarian document suitable for sharing drafts but not for publication. When an author finishes writing in Scriptloom and is ready to publish — whether through self-publishing (Amazon KDP, IngramSpark), print-on-demand, or distribution to a publisher — they must export their raw text and pay for Atticus or hire a typesetter. This breaks the "write to publish" workflow inside Scriptloom. Christian authors in particular have specific formatting needs that Atticus does not address: Scripture block styling (indented, set apart, with reference attribution), front matter conventions for ministry books (dedication, acknowledgments), and the ability to place an ISBN on a properly formatted copyright page. This PRD closes that gap and makes Scriptloom a complete authoring and publishing studio for the Christian book market.

---

## User Stories

1. As a Christian book author, I want to format my entire manuscript as a print-ready 6x9 PDF so that I can upload it directly to Amazon KDP or IngramSpark without hiring a typesetter.
2. As an author, I want to choose my book's trim size (6x9, 5.5x8.5, A5, or custom) so that the layout matches my intended print format.
3. As an author, I want to configure typography — font family, font size, line spacing, and margins — so that my book has a professional interior aesthetic.
4. As a ministry author, I want Scripture block quotes to be styled distinctly (indented, italicised, with reference attribution) so that biblical text is visually set apart from my commentary.
5. As an author, I want a title page, copyright page, dedication page, and auto-generated table of contents produced for me so that my book has complete, professionally structured front matter.
6. As an author, I want chapter titles styled with drop caps, ornamental dividers, and a choice of heading font so that each chapter opens with a strong visual impression.
7. As an author, I want page numbers to use Roman numerals for front matter and Arabic numerals for the body so that my book follows standard publishing conventions.
8. As an author, I want to enter my ISBN and have it placed correctly on the copyright page so that my book meets retail distribution requirements.
9. As an author, I want a live paginated preview of the formatted book so that I can review the layout before exporting.
10. As an author, I want to export to ePub for digital distribution so that my book can be sold through Apple Books, Kobo, and direct distribution channels.
11. As an author, I want to export to a Kindle-compatible format so that I can publish directly to Amazon KDP.
12. As an author, I want to upload my cover image so that the export package includes a complete cover page.
13. As an author, I want widow and orphan control applied to my paragraphs so that no paragraph begins on the last line of a page or ends on the first line of a new page.

---

## Detailed Requirements

### Functional Requirements

1. **Entry Point**
   1.1. In the editor export modal (`ExportModal.tsx`), a new "Format Book (Full Manuscript)" option is added alongside the existing PDF/DOCX chapter export.
   1.2. The "Format Book" option is only enabled when the project type is `book`, `devotional`, or `bible_study` (types that produce book-length output). For `sermon` type projects, the option is hidden.
   1.3. Clicking "Format Book" opens the Book Formatting Panel as a full-screen multi-step modal wizard.

2. **Trim Size Selection**
   2.1. Available presets: 6x9 inches (standard trade paperback), 5.5x8.5 inches (digest), A5 (5.83x8.27 inches), and Custom.
   2.2. Custom dimensions accept decimal inch values between 4.0–9.0 (width) and 6.0–12.0 (height).
   2.3. The selected trim size is shown as a visual page outline in the preview pane.
   2.4. Trim size is stored in `ltu_book_format_settings.trim_size` as a string enum with a separate `custom_width` / `custom_height` for custom dimensions.

3. **Typography Controls**
   3.1. Font family options (serif, suitable for print): Garamond, Palatino, Times New Roman, Georgia, Baskerville. Each is rendered as a sample text preview in the selection UI.
   3.2. Body font size: 9pt, 10pt, 11pt, 12pt (radio buttons; default 11pt).
   3.3. Line spacing: 1.2, 1.3, 1.4, 1.5 (radio buttons; default 1.3).
   3.4. Margins: single slider controlling symmetric margins from 0.5 to 1.5 inches, with an advanced toggle to set top/bottom/inside/outside independently (required for professional bleed-gutter layout on physical books).
   3.5. All typography settings are stored in `ltu_book_format_settings.typography` as JSONB.

4. **Front Matter Generation**
   4.1. **Title Page:** Automatically populated from `ltu_projects.title`. Optional subtitle field (stored in format settings). Author name sourced from `ltu_profiles.display_name`. Publisher name (optional text field).
   4.2. **Copyright Page:** Auto-generates current year copyright notice in the format "Copyright © [year] [Author Name]. All rights reserved." User enters their ISBN (10 or 13 digit, validated). A "Scripture quotation notes" field allows the user to input the required attribution for Bible translations used (e.g., "Scripture quotations taken from the NIV...").
   4.3. **Dedication Page:** Optional free-text field. Styled in italics, centred, with white space above and below.
   4.4. **Acknowledgments Page:** Optional free-text field. Standard paragraph layout. Only generated if text is provided.
   4.5. **Table of Contents:** Auto-generated from `ltu_chapters` ordered by `position`. Displays chapter number, chapter title, and page number. Page numbers are computed during PDF generation. TOC is placed after the copyright page.
   4.6. Front matter order is fixed: Title Page → Copyright → Dedication → Acknowledgments → Table of Contents.

5. **Chapter Styling**
   5.1. **Chapter number display:** Roman (Chapter I), Arabic (Chapter 1), None, or Written (Chapter One). Stored as enum.
   5.2. **Chapter heading font:** Playfair Display (default, matches Scriptloom brand), Cinzel, Cormorant, or same as body font.
   5.3. **Drop cap:** Toggle on/off. When enabled, the first letter of the first paragraph of each chapter is enlarged (3 lines tall) and formatted as a drop cap using PDF layout rules.
   5.4. **Ornamental divider:** A small graphic divider (cross, floral ornament, simple rule) between chapter title area and body text. User selects from 5 options; "None" is a valid option.
   5.5. **Chapter start position:** "Always start on recto (right-hand page)" (standard for print books) or "Any page" (saves pages for shorter works).

6. **Scripture Block Styling**
   6.1. The existing `ScriptureBlockExtension.ts` marks Scripture blocks in the TipTap editor content. The formatter identifies these blocks in the HTML output.
   6.2. Scripture blocks in the formatted PDF are rendered with: 0.5-inch additional indent on both sides, italic font, 1pt smaller than body font size, reference attribution right-aligned on the line below the block.
   6.3. If a chapter contains inline Scripture references (detected by `scripture-regex.ts`) rather than formal Scripture block nodes, those references are formatted as citations in the body text (not as full block quotes) unless they span more than one verse.

7. **Page Numbering**
   7.1. Front matter pages: lowercase Roman numerals (i, ii, iii...), centred in footer, starting from the copyright page (title page has no visible number).
   7.2. Body pages: Arabic numerals (1, 2, 3...), alternating inside footer position (left on verso, right on recto pages) as is standard for print.
   7.3. Running headers: optional. When enabled, verso pages show the book title; recto pages show the chapter title (standard typesetting convention).
   7.4. First page of each chapter: no page number or running header (standard convention).

8. **Widow and Orphan Control**
   8.1. A widow is the last line of a paragraph appearing alone at the top of a new page. An orphan is the first line of a paragraph appearing alone at the bottom of a page.
   8.2. The PDF generator applies a widow/orphan threshold of 2 lines: if fewer than 2 lines of a paragraph would appear on either side of a page break, the break is moved to keep at least 2 lines together.
   8.3. Implementation note: PDFKit has limited native widow/orphan support. The implementation should use `bufferPages: true` and post-process page breaks using PDFKit's multi-page capabilities. If full widow/orphan control is not achievable in the initial implementation, the feature should be documented as "best-effort" in the UI.

9. **Cover Page**
   9.1. The user uploads a cover image (JPG or PNG, recommended 2550x3300px for 6x9 at 300dpi).
   9.2. The image is stored in Supabase Storage in a `book-covers` bucket, scoped per user.
   9.3. The cover is placed as page 1 of the export. If no cover is uploaded, a plain placeholder cover is generated showing the book title and author name in a typeset layout.
   9.4. Cover image is not included in the ePub body content — it is set as the ePub cover metadata.

10. **Paginated Preview**
    10.1. The preview panel displays the book as a sequence of pages, rendered as a scrollable vertical stack of page thumbnails (2 pages per row for larger screens, 1 page on mobile).
    10.2. Clicking a page thumbnail opens a full-size view.
    10.3. Preview is generated server-side and returned as an array of page image URLs (PNG renders of each PDF page), or alternatively rendered client-side using a PDF.js-based viewer.
    10.4. Implementation decision (for development team): server-side PNG rendering is more accurate but adds latency; client-side PDF.js is faster to implement. The PDF.js approach is recommended for the initial release.
    10.5. Preview regenerates when the user changes typography settings or chapter styling options (debounced, 2-second delay after last change).

11. **Export Formats**
    11.1. **Print-ready PDF:** Includes bleed (0.125-inch) and trim marks when the user selects "Print-ready (with trim marks)" option. Standard PDF for screen/ebook when user selects "Digital PDF". Both versions are generated from the same layout pipeline.
    11.2. **ePub 3.0:** Chapters are exported as individual XHTML files within a valid ePub package. TOC is rendered as the ePub navigation document. Cover image is set as ePub cover. Scripture blocks use CSS classes for styling on e-reader.
    11.3. **Kindle (MOBI/KPF):** Generated by converting the ePub output using an intermediate conversion step. Implementation note: Amazon KDP now accepts ePub directly (KPF is generated by KDP's own tools); the recommended approach is to export ePub and document that users can upload the `.epub` to KDP. True MOBI generation requires the Kindlegen tool which is deprecated; this is called out as a known limitation.

12. **Format Settings Persistence**
    12.1. All format settings are saved automatically as the user makes changes (debounced PATCH to `/api/book-format/settings`).
    12.2. Settings are stored in `ltu_book_format_settings` linked to the project. Opening the formatter again restores the user's previous settings.
    12.3. A "Reset to Defaults" button restores the factory defaults without deleting the record.

### Non-Functional Requirements

- NFR-1: A 300-page book PDF (approximately 80,000 words) must generate within 30 seconds. Generation runs as a background job with a progress indicator.
- NFR-2: The paginated preview must display the first 10 pages within 5 seconds of the user opening the formatter; remaining pages load progressively.
- NFR-3: Cover image uploads are limited to 10MB. Images are validated for file type (JPG/PNG) and dimensions (minimum 800px on the shortest side).
- NFR-4: All generated export files are streamed directly to the browser as downloads; files are not stored on Scriptloom's servers beyond the duration of the generation request (covers excepted, which are stored in Supabase Storage).
- NFR-5: The formatter wizard is keyboard-navigable and meets WCAG 2.1 AA for all form controls.
- NFR-6: ePub output must pass EPUBCheck 5.x validation without errors (warnings acceptable).
- NFR-7: The feature is gated to the Ministry tier and above.

---

## UI/UX Specification

### Screen 1: Export Modal — Entry Point (Modified)

The existing `ExportModal.tsx` gains a new section at the bottom:
- Divider: "Full Book Export"
- Large button: "Format & Export Full Book" with a book icon
- Small caption: "Professional typesetting for print, ePub, and Kindle"
- Disabled state (greyed out with lock icon) if project type is `sermon`

### Screen 2: Book Formatter Wizard — Step 1: Layout

Full-screen modal (max-width 1200px).

Left panel (40%): Live preview pane — page outline at trim size, rendered in real time using CSS transforms. Shows sample title page, copyright page, and one body page as placeholders until actual content is loaded.

Right panel (60%): Settings panel with tab navigation:
- Tab 1: "Layout" (active)
  - Trim Size: 4 large tile buttons (6x9, 5.5x8.5, A5, Custom) with visual page outline illustrations
  - Custom dimensions: visible only when Custom is selected
  - Chapter Start: toggle (Recto / Any Page)
  - Running Headers: toggle on/off; when on, shows preview in page outline

### Screen 3: Book Formatter Wizard — Step 2: Typography

Same two-panel layout.

Right panel — Tab 2: "Typography"
- Font Family: 5 radio tiles, each showing "The quick brown fox" in the respective font
- Font Size: 4 radio buttons (9/10/11/12pt)
- Line Spacing: 4 radio buttons
- Margins: range slider (symmetric) + "Advanced" toggle revealing 4 individual margin inputs
- Preview updates as settings change (debounced)

### Screen 4: Book Formatter Wizard — Step 3: Front Matter

Right panel — Tab 3: "Front Matter"
- Title Page section: title (read-only, sourced from project), subtitle input, author name (editable, pre-filled from profile), publisher name input
- Copyright Page section: year (auto-filled, editable), ISBN input (with validation), Scripture attribution textarea
- Dedication section: textarea, character limit 500, "Leave blank to skip"
- Acknowledgments section: textarea, "Leave blank to skip"
- TOC section: read-only list of chapters with position numbers (informational only; no editing here)

### Screen 5: Book Formatter Wizard — Step 4: Chapter Style

Right panel — Tab 4: "Chapter Style"
- Chapter Number Display: 4 radio options with sample rendering
- Chapter Heading Font: 4 thumbnail tiles showing a chapter title in each font
- Drop Cap: toggle with before/after preview
- Ornamental Divider: 5 visual tiles (5 divider styles + None)
- Scripture Block Style: informational text explaining the auto-formatting; no user controls needed here

### Screen 6: Book Formatter Wizard — Step 5: Cover

Right panel — Tab 5: "Cover"
- Upload area: dashed border dropzone with "Upload Cover Image" label; shows accepted formats and recommended dimensions
- After upload: image thumbnail + "Remove" button
- No-cover option: checkbox "Generate simple text cover" — creates a placeholder cover with book title and author name

### Screen 7: Book Formatter Wizard — Final Step: Export

Right panel — Tab 6: "Export"
- Format selection: 3 large tile buttons
  - "Print PDF (with trim marks)" — for professional printers and POD services
  - "Digital PDF" — for screen reading and email distribution
  - "ePub 3.0" — for Apple Books, Kobo, and digital distribution
- Note: "For Kindle, upload your ePub to Amazon KDP — they'll convert it automatically."
- "Preview Full Book" button — loads paginated PDF preview below the tabs
- "Export Now" CTA button (gold, full width)
- Export progress: indeterminate progress bar with status text ("Generating pages 1–50...", "Building table of contents...", "Packaging ePub...")
- On completion: download begins automatically; a "Download Again" link remains visible for 60 seconds

---

## Data Model

### New Table: `ltu_book_format_settings`

```sql
-- Migration: 012_book_formatting.sql

CREATE TABLE ltu_book_format_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES ltu_projects(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Layout
  trim_size           TEXT NOT NULL DEFAULT '6x9'
                        CHECK (trim_size IN ('6x9', '5.5x8.5', 'A5', 'custom')),
  custom_width        DECIMAL(4,2),               -- inches, nullable, only used when trim_size = 'custom'
  custom_height       DECIMAL(4,2),               -- inches, nullable
  chapter_start       TEXT NOT NULL DEFAULT 'recto'
                        CHECK (chapter_start IN ('recto', 'any')),
  running_headers     BOOLEAN NOT NULL DEFAULT TRUE,

  -- Typography
  typography          JSONB NOT NULL DEFAULT '{
    "fontFamily": "Garamond",
    "fontSize": 11,
    "lineSpacing": 1.3,
    "marginSymmetric": 1.0,
    "marginTop": null,
    "marginBottom": null,
    "marginInside": null,
    "marginOutside": null
  }',

  -- Front Matter
  front_matter        JSONB NOT NULL DEFAULT '{
    "subtitle": null,
    "authorName": null,
    "publisherName": null,
    "isbn": null,
    "copyrightYear": null,
    "scriptureAttribution": null,
    "dedication": null,
    "acknowledgments": null
  }',

  -- Chapter Style
  chapter_style       JSONB NOT NULL DEFAULT '{
    "numberDisplay": "arabic",
    "headingFont": "Playfair Display",
    "dropCap": true,
    "ornamentalDivider": "simple_rule"
  }',

  -- Cover
  cover_image_url     TEXT,                        -- Supabase Storage URL or null
  use_generated_cover BOOLEAN NOT NULL DEFAULT FALSE,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (project_id)                              -- one format settings record per project
);

-- Indexes
CREATE INDEX idx_ltu_book_format_settings_project_id ON ltu_book_format_settings(project_id);
CREATE INDEX idx_ltu_book_format_settings_user_id ON ltu_book_format_settings(user_id);

-- RLS
ALTER TABLE ltu_book_format_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own book format settings"
  ON ltu_book_format_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_book_format_settings
  BEFORE UPDATE ON ltu_book_format_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Supabase Storage

A new storage bucket `book-covers` is created with:
- Max file size: 10MB
- Allowed MIME types: `image/jpeg`, `image/png`
- RLS: authenticated users can only read/write files in paths matching their own `user_id`

---

## API Routes

### GET /api/book-format/settings?projectId={uuid}

Fetches the current format settings for a project. Creates a default record if none exists.

Response:
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "trimSize": "6x9",
  "typography": { ... },
  "frontMatter": { ... },
  "chapterStyle": { ... },
  "coverImageUrl": null
}
```

### PATCH /api/book-format/settings

Updates format settings for a project. Accepts partial updates (any combination of the top-level fields).

Request body:
```json
{
  "projectId": "uuid",
  "trimSize": "5.5x8.5",
  "typography": { "fontSize": 12 }
}
```

Response: updated settings record.

### POST /api/book-format/export

Triggers full-book generation and streams the result as a file download.

Request body:
```json
{
  "projectId": "uuid",
  "format": "pdf-print" | "pdf-digital" | "epub"
}
```

Response: binary file stream with appropriate `Content-Type` and `Content-Disposition` headers.

This route is the most computationally intensive in the entire application. Considerations:
- Vercel Serverless function timeout is 60 seconds on Pro plan. A 300-page PDF may exceed this.
- Mitigation: if the estimated generation time exceeds 45 seconds, respond immediately with a `202 Accepted` and a job ID, then complete generation asynchronously. The client polls `/api/book-format/export/status?jobId={id}` until ready, then downloads from a signed Supabase Storage URL.
- For the initial implementation, synchronous generation is acceptable for manuscripts up to ~100 pages (approximately 25,000 words). Async job architecture is documented here as the required approach for larger books and should be implemented before the feature is released to all users.

### POST /api/book-format/cover-upload

Handles cover image upload to Supabase Storage.

Request: multipart form data with a `cover` file field and `projectId`.

Response:
```json
{ "coverImageUrl": "https://...supabase.../book-covers/user_id/project_id.jpg" }
```

### GET /api/book-format/preview?projectId={uuid}&pages=1-10

Returns PNG renders of the specified page range for the paginated preview.

Response:
```json
{
  "pages": [
    { "pageNumber": 1, "imageUrl": "data:image/png;base64,..." },
    ...
  ],
  "totalPages": 287
}
```

Implementation note: this route generates the full PDF, then extracts the requested page range as PNG images. The full PDF is cached in memory for 60 seconds to allow subsequent page range requests without regenerating from scratch.

---

## AI Agent Integration

Book Formatting is primarily a document generation feature; AI agents are not in the critical path. However, two optional integrations are noted:

1. **Front Matter Copy Assistance:** A "Help me write my dedication" link in the Front Matter tab invokes the Scribe agent (`mode: 'draft'`) with a minimal prompt ("Write a brief, heartfelt book dedication for a Christian author writing about [project title]"). The result is inserted into the dedication textarea for the user to edit. This is a low-stakes, high-delight enhancement.

2. **Copyright Page Scripture Attribution:** If the user's writing contains Scripture blocks from the existing `ScriptureBlockExtension`, the formatter can detect which Bible translation appears most frequently (if translation metadata is stored) and pre-fill a standard attribution notice for that translation. This requires translation tracking to be implemented (see PRD-13 Bible Translation Comparison). If PRD-13 is not yet complete, the user fills this field manually.

No Shepherd agent review is required for typesetting; the content being formatted has already been through the writing and review process.

---

## Acceptance Criteria

- [ ] Given a project of type `book`, when the user opens the export modal, then a "Format & Export Full Book" option is visible.
- [ ] Given a project of type `sermon`, when the user opens the export modal, then the "Format & Export Full Book" option is absent.
- [ ] Given the user selects the "6x9" trim size, when the preview pane renders, then the page outline displays at the correct aspect ratio.
- [ ] Given the user sets the chapter heading font to "Playfair Display" and font size to 12pt, when the preview updates, then chapter titles are visibly rendered in Playfair Display at 12pt.
- [ ] Given the user enables drop caps and the chapter content begins with the letter "T", when the preview shows the first chapter body page, then a 3-line drop cap "T" appears at the start of the first paragraph.
- [ ] Given a chapter contains a Scripture block node (from `ScriptureBlockExtension`), when the book is exported, then the Scripture block appears indented, italicised, and with the reference right-aligned on the following line.
- [ ] Given the user enters ISBN "9781234567890" in the copyright page settings, when the book is exported, then the copyright page includes the ISBN in the correct location.
- [ ] Given the user exports a 5-chapter book as Print PDF, when the download opens, then the front matter pages use Roman numerals and the body pages use Arabic numerals starting at 1.
- [ ] Given the project has 5 chapters ordered by position, when the table of contents is generated, then it lists all 5 chapter titles with their correct page numbers.
- [ ] Given the user clicks "Export Now" with the ePub format selected, when the download completes, then the `.epub` file passes EPUBCheck validation without errors.
- [ ] Given the user uploads a cover image, when they export the book as PDF, then page 1 of the PDF is the uploaded cover image.
- [ ] Given the user saves format settings and closes the formatter, when they reopen the formatter for the same project, then all previously set values are restored.
- [ ] Given a manuscript of 25,000 words (approximately 80 pages), when the user clicks Export, then the PDF download begins within 30 seconds.
- [ ] Given a free-tier or Writer-tier user opens the export modal, then the "Format & Export Full Book" button is visible but shows a locked overlay with an upgrade prompt when clicked.

---

## Edge Cases

- **Project has no chapters:** The "Format Book" button is disabled with a tooltip: "Add at least one chapter to format your book." This prevents the formatter from attempting to generate an empty PDF.
- **A chapter has no content:** Empty chapters are included in the TOC but their content page renders only the chapter title. A note at the top of the chapter page reads "[Chapter content not yet written]" in light grey text. This is visible in the preview so the user knows before exporting.
- **Chapter titles are very long:** TOC truncates chapter titles at 80 characters with an ellipsis for display. The full title is used in the chapter heading within the body.
- **User sets custom trim size to non-standard dimensions:** The PDF generates correctly at the custom dimensions. If the dimensions fall outside KDP or IngramSpark accepted ranges, a warning is displayed: "These dimensions may not be accepted by standard POD services — verify with your printer."
- **ISBN validation:** ISBNs must be exactly 10 or 13 digits (after stripping hyphens and spaces). An invalid ISBN shows an inline error "Please enter a valid 10 or 13 digit ISBN" and does not block export — the user may choose to continue without a valid ISBN.
- **Cover image fails to upload:** The formatter shows an error message and falls back to the generated text cover. Export is not blocked.
- **Generation times out on Vercel (>60s):** For manuscripts larger than approximately 25,000 words (100 pages), the async job architecture described in the `/api/book-format/export` route notes must be active. Before it is implemented, the UI should display a warning for large manuscripts: "Large manuscripts may take up to 60 seconds to generate."
- **ePub file fails EPUBCheck validation:** If the ePub library produces invalid output for edge cases (unusual Unicode characters, very long chapter titles), the export should still complete but include a note in the response: "Your ePub file was generated but may contain validation warnings. We recommend running it through EPUBCheck before distribution."
- **User edits chapter content after generating a preview:** The preview becomes stale. Display a "Content changed — regenerate preview" banner above the preview pane.
- **Project type is `devotional` with many short chapters (50+ entries):** Generation and TOC building may be slow. The async job architecture handles this. For synchronous generation, a chapter count warning is shown if `COUNT(ltu_chapters WHERE project_id = ?) > 40`.

---

## Dependencies

- **PRD-08 (Export & Sharing):** The existing PDF and DOCX export route provides the foundation. The book formatter uses the same `splitIntoParagraphs` utility from `app/api/export/route.ts` and the same PDFKit dependency but extends it significantly. The existing export route must remain unchanged; this PRD adds a separate route.
- **`ltu_chapters` table:** Must be populated with ordered chapters. The `position` column is used to sequence chapters in the formatted output. The `content` column must contain TipTap HTML.
- **`ScriptureBlockExtension.ts`:** The formatter must be able to identify Scripture block nodes in the chapter HTML. If the extension changes its output structure, the formatter's HTML parser must be updated accordingly.
- **`lib/memory/scripture-regex.ts`:** Used for inline Scripture reference detection in chapters that do not use formal Scripture blocks.
- **PDFKit:** Already a production dependency (used in PRD-08). The book formatter requires `bufferPages: true` and multi-section PDF features. Verify PDFKit version supports all required layout features; upgrade if necessary.
- **ePub generation library:** No ePub library is currently in the project. Recommended: `epub-gen-memory` or `nodepub`. A spike is required to evaluate which library produces EPUBCheck-valid output before implementation begins.
- **Supabase Storage:** The `book-covers` bucket must be created and RLS policies configured before cover upload functionality is built.
- **Vercel Pro plan:** Required for the 60-second function timeout needed for large book generation. Confirm the Vercel plan before declaring sync generation production-ready.

---

## Estimated Scope

**XL (Extra Large)**

Rationale: The scope spans a multi-step wizard UI, a complex PDF generation engine with full typesetting rules (drop caps, widow/orphan control, Roman/Arabic page numbering, running headers, per-chapter styling), a new ePub generation pipeline, Supabase Storage integration for cover images, a paginated preview system, a new database table, multiple API routes, and async job architecture for large manuscripts. Each individual component (ePub library integration, drop cap implementation in PDFKit, paginated preview) is non-trivial on its own. This is the largest individual feature in Scriptloom's roadmap and should be planned as a 2–3 sprint effort with a technical spike in the first sprint to validate the PDF and ePub generation libraries against the full requirements.
