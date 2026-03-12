# PRD-21: Publishing Pipeline

**Status:** Planned
**Phase:** 5 - Platform Expansion
**Priority:** P11
**Estimated Scope:** L
**Last Updated:** 2026-03-11

---

## Overview

The Publishing Pipeline gives Scriptloom users a direct path from finished writing to public distribution without leaving the app. Authors can connect their WordPress site, Medium account, or Substack newsletter, preview their formatted content, schedule publication, and track the live status of every published piece. The pipeline also packages ebook-ready ePub files for upload to Amazon KDP, Apple Books, and IngramSpark.

---

## Problem Statement

Once a Scriptloom user finishes writing a chapter or sermon, they face a manual, error-prone publishing workflow: copy text from the editor, paste into WordPress or Medium, re-apply formatting, upload images separately, add metadata, and repeat for every channel. Ulysses — Scriptloom's closest competitor for distraction-free writing — offers direct publishing to WordPress and Medium as a core differentiator, but Ulysses is Apple-only and has no AI or faith-specific features. Atticus handles professional ebook formatting but requires a separate authoring workflow entirely.

Scriptloom can win both audiences by unifying AI-assisted writing and seamless multi-channel publishing in one spiritually grounded platform, removing the copy-paste gap that currently pushes users to competitor tools at the most critical moment of their workflow.

---

## User Stories

1. As a Christian blogger, I want to connect my WordPress site to Scriptloom and publish chapters directly as blog posts, so that I do not have to reformat and re-enter content in the WordPress editor after writing it here.
2. As a devotionalist, I want to preview how my devotional will appear on Medium before publishing, so that I can catch formatting issues before they go live for my readers.
3. As a pastor, I want to schedule my Sunday sermon transcript to publish automatically on my church website at 12:00 PM on Sunday, so that I do not have to manually press publish while preparing for the service.
4. As a ministry author, I want to add SEO metadata (title, description, featured image, and slug) to each piece before publishing, so that my content ranks better in search results.
5. As a book author, I want to select multiple chapters, arrange them in order, and generate a complete ePub file ready for upload to Amazon KDP, so that I can self-publish my manuscript without hiring a separate formatter.
6. As a newsletter author, I want to publish chapters as Substack issues directly from Scriptloom, so that I can manage my entire writing workflow in one place.
7. As a ministry leader, I want to see the publish status of each chapter (Draft, Scheduled, Published) alongside links to the live content, so that I can track what has been distributed and where.
8. As a user, I want to disconnect a publishing integration at any time and have my stored credentials deleted immediately, so that I remain in control of my third-party account access.
9. As an author, I want to map my project's writing role and tone to appropriate WordPress categories and tags, so that published posts are correctly classified without manual tagging on each post.
10. As a book author, I want to enter ebook metadata (title, subtitle, author, ISBN, publisher, description, cover image) once and have it applied to all ePub exports, so that I do not re-enter it every time I generate a new draft.

---

## Detailed Requirements

### Functional Requirements

#### FR-01: Publishing Hub
1. A "Publish" tab must be accessible from the project view sidebar, appearing between the "Writing Map" and "Settings" tabs.
2. The Publishing Hub must display: connected platforms (with connected/disconnected status badges), a list of all publishing records for the current project, and quick-action buttons for each connected platform.
3. If no platforms are connected, the hub must display an empty state with a "Connect a platform" call-to-action and a brief explanation of available integrations.
4. The Publishing Hub must be accessible to all users regardless of project role, but write actions (publish, schedule, disconnect) must be restricted to the project Owner and Editors.

#### FR-02: WordPress Integration
1. Users must be able to connect a self-hosted WordPress site or WordPress.com site via the WordPress Application Passwords mechanism (username + application password), not OAuth, to ensure compatibility with self-hosted instances.
2. During connection setup, the user must enter their site URL, WordPress username, and an Application Password generated in their WordPress account. Scriptloom must validate the credentials by making a test API call before saving.
3. When publishing a chapter to WordPress, the system must:
   a. Create a new WordPress post (or page — user selects) via the WordPress REST API.
   b. Map the TipTap JSON document to WordPress Gutenberg-compatible HTML blocks.
   c. Apply SEO metadata: custom post title (defaults to chapter title), excerpt (maps to meta description), slug, and featured image (uploaded from Scriptloom if provided).
   d. Assign WordPress categories and tags as configured in the platform connection settings.
4. Users must be able to publish as "Draft" (to review in WordPress before going live) or as "Published" directly.
5. If a chapter has already been published to WordPress, a "Re-publish" option must update the existing post rather than creating a duplicate.

#### FR-03: Medium Integration
1. Users must be able to connect their Medium account via the Medium API integration token (available in Medium's account settings), as Medium's OAuth flow has been deprecated for new integrations.
2. During connection setup, the user must enter their Medium Integration Token. Scriptloom must validate it by fetching the authenticated user's Medium profile before saving.
3. When publishing to Medium, the system must:
   a. Convert TipTap JSON to Medium's accepted HTML format.
   b. Map chapter title to the Medium post title.
   c. Map the project's topic tags to Medium post tags (maximum 5 tags, as per Medium's limit).
   d. Set the publication status: Draft or Published.
4. Scripture block content (quotes from Scriptloom's ScriptureBlockExtension) must be rendered as Medium blockquotes.
5. Users must be able to select which Medium publication (if they belong to any) to post under, or publish to their personal profile.

#### FR-04: Substack Integration
1. Users must be able to connect their Substack account. Because Substack does not provide a public API for programmatic publishing, the integration must use Substack's email import method: generate a formatted email draft that the user can import via Substack's "import from email" feature, or provide a one-click open-in-Substack link with pre-populated content using Substack's supported URL schemes if available.
2. A clear disclosure must be shown to users explaining that Substack support is partial (no direct API publish) and describing the available workflow.
3. At minimum, the system must generate a fully formatted HTML email version of the chapter that the user can manually import to Substack. This is framed as "Export for Substack" rather than a direct publish integration to set accurate expectations.

#### FR-05: Blog Preview
1. Before publishing to any platform, the user must be able to click a "Preview" button to see a rendered preview of how the content will appear on that platform.
2. The preview must render in a modal or slide-over panel that simulates the target platform's reading layout: a clean article view for WordPress and Medium.
3. The preview must accurately reflect: heading hierarchy, paragraph formatting, bold and italic text, blockquotes (Scripture blocks), lists, and embedded images.
4. The preview must display the SEO metadata panel (title, description, slug, featured image) alongside the content preview.

#### FR-06: Scheduled Publishing
1. Users must be able to set a future publish date and time for any WordPress or Medium publish action.
2. Scheduling must use the user's local timezone, displayed clearly next to the datetime picker.
3. Scheduled items must appear in the Publishing Hub with a "Scheduled" status badge and the scheduled datetime.
4. The system must execute the publish action via a background job at the scheduled time (Supabase Edge Functions with a cron trigger or equivalent).
5. Users must be able to cancel a scheduled publish at any time before the scheduled datetime, reverting the item to Draft status.
6. If a scheduled publish fails (e.g., due to expired credentials), the system must send an in-app and email notification to the user with an error description and a prompt to re-publish manually.

#### FR-07: SEO Metadata
1. Each publishable chapter must have an optional SEO metadata panel accessible from the Publishing Hub.
2. The SEO panel must include:
   - Publish title (defaults to chapter title, editable independently of the chapter title in the editor)
   - Meta description (max 160 characters, with a live character counter)
   - Slug (auto-generated from publish title, editable; system enforces URL-safe characters)
   - Featured image (upload from device or select from Scriptloom inspiration board images)
3. SEO metadata must be stored per chapter per platform connection, as different platforms may require different metadata.
4. The SEO panel must provide a live preview of how the title and description will appear in a Google search result snippet.

#### FR-08: Publish Status Tracking
1. Every publish action must create a record in the `published_items` table with platform, status, external URL, and timestamps.
2. The Publishing Hub must display a status list for each chapter: showing all platforms the chapter has been published to, the status (Draft, Scheduled, Published, Failed), and a link icon that opens the live URL in a new tab.
3. Status badges must use consistent color coding: Draft (grey), Scheduled (amber), Published (green), Failed (red).
4. A "Sync status" button must allow users to re-fetch the current publish status from each connected platform's API to confirm the live state matches Scriptloom's records.

#### FR-09: ePub Export (Ebook Distribution Prep)
1. The ePub feature must be accessible from the Publishing Hub under an "Ebook" section.
2. Users must be able to select which chapters to include in the ePub and drag them into the desired reading order.
3. Before generating the ePub, users must complete an ebook metadata form:
   - Book title (defaults to project title)
   - Subtitle (optional)
   - Author name (defaults to user display name)
   - Publisher name (optional)
   - ISBN (optional, free text — Scriptloom does not validate or assign ISBNs)
   - Description / back cover copy (max 4,000 characters)
   - Cover image upload (recommended 1600x2400px, JPEG or PNG)
   - Language (defaults to English)
   - Publication date (optional)
4. The system must generate a valid ePub 3.0 file conforming to the IDPF specification.
5. The generated ePub must include: a cover image page, a table of contents generated from chapter titles, all selected chapter content with preserved heading hierarchy, and the metadata provided in step 3.
6. Scripture block content must render as styled blockquotes in the ePub interior.
7. The user must be able to download the generated ePub file directly to their device.
8. A help section must explain where to upload the ePub for each major ebook distributor (Amazon KDP, Apple Books, IngramSpark) with links to each platform's upload page. Scriptloom does not integrate directly with these distributors' APIs in v1.

#### FR-10: Platform Connection Management
1. All connected platform credentials must be stored encrypted using Supabase Vault. Plaintext credentials must never be stored in the database.
2. The Integrations section of the user's account Settings page must list all connected publishing platforms with: platform name, connected account identifier (e.g., WordPress site URL, Medium username), connection date, and a "Disconnect" button.
3. Disconnecting a platform must immediately delete the stored credentials from Supabase Vault. Existing `published_items` records must be retained (they are historical records, not live connections).
4. Users must be warned with a confirmation dialog before disconnecting, stating that scheduled posts will be cancelled and credentials will be permanently deleted.

### Non-Functional Requirements

#### NFR-01: Performance
- Blog preview must render within 2 seconds of the user clicking Preview.
- ePub generation for a project of up to 100,000 words must complete within 30 seconds.
- Publish actions must initiate within 1 second of the user clicking Publish; actual completion depends on the third-party API response time.

#### NFR-02: Security
- All third-party credentials must be encrypted at rest using Supabase Vault before storage.
- API calls to WordPress, Medium, and any other platforms must be made server-side (Next.js API routes or Supabase Edge Functions) only. Credentials must never be exposed to the browser.
- Rate limiting must be applied to the `/api/publish/*` routes: maximum 10 publish actions per user per hour to prevent abuse.

#### NFR-03: Reliability
- If a publish API call fails due to a transient error (network timeout, 5xx response from the platform), the system must retry up to 3 times with exponential backoff before marking the item as Failed.
- Scheduled publish jobs must be idempotent — running the job twice for the same scheduled item must not create duplicate posts on the target platform.

#### NFR-04: Accessibility
- All form elements in the Publishing Hub and SEO metadata panel must have proper labels and meet WCAG 2.1 AA.
- Publish status badges must not rely on color alone — each must include a text label.

#### NFR-05: Compliance
- The integration with WordPress Application Passwords must follow WordPress security best practices.
- Medium integration must comply with Medium's API terms of service.
- The ePub generator must produce files that pass epubcheck validation.

---

## UI/UX Specification

### Key Screens

#### Screen 1: Publishing Hub (Project View)
- **Layout:** Full-width panel. Top section: "Connected Platforms" row of platform cards (WordPress, Medium, Substack) showing connected/not-connected state. Clicking a disconnected platform card opens the connection setup flow. Clicking a connected card opens that platform's settings.
- **Content table:** Below the platform cards, a table or card list of all chapters in the project. Each row shows: chapter title, word count, publish status per platform (coloured pill badges), last published date, and an action button ("Publish" or "Update").
- **Ebook section:** A separate card below the chapter table with a "Build Ebook" button that opens the ePub setup flow.

#### Screen 2: Platform Connection Setup (Modal)
- **Step 1 - Credentials:** Platform logo at top. Instructions for where to find the required credentials (with a link to the platform's help docs). Input fields for the required connection details (site URL + username + app password for WordPress; integration token for Medium). "Test Connection" button. On success, a green checkmark and account details are shown. "Save Connection" button activates.
- **Step 2 - Default Settings:** Category/tag mapping for WordPress. Publication selection for Medium. Default publish status (Draft / Published). These settings can be overridden per publish action.

#### Screen 3: Publish Chapter Flow (Side Panel)
- **Triggered by:** Clicking "Publish" on a chapter row in the Publishing Hub.
- **Layout:** A slide-over panel from the right. Platform selector tabs at top (one tab per connected platform). For the selected platform:
  - SEO metadata form (title, description, slug, featured image).
  - Publish options (Draft vs. Published, schedule toggle).
  - If schedule is toggled on: date and time picker, timezone display.
  - "Preview" button (opens preview modal).
  - "Publish Now" or "Schedule" CTA button.
- **Post-publish state:** The panel shows a success message with a link to the live post. The chapter's status badge in the Hub table updates immediately.

#### Screen 4: Blog Preview Modal
- **Layout:** Full-screen modal with a simulated article reading view. A top bar shows the platform name and "Close Preview" button. Below: rendered article with the platform's approximate typography and layout. An SEO snippet preview card below the article title shows the Google-style title + description + URL preview.
- **Interaction:** Read-only. A "Back to Publish" button allows the user to return to the Publish panel without re-entering their settings.

#### Screen 5: ePub Builder
- **Step 1 - Metadata:** A form for all ebook metadata fields. Cover image upload with a drag-and-drop zone and a preview thumbnail.
- **Step 2 - Chapter Selection:** A two-column layout. Left: all chapters available (unchecked). Right: selected chapters in reading order (drag to reorder). "Add all" and "Remove all" quick-action buttons.
- **Step 3 - Generate:** A summary of the ePub details (title, chapter count, approximate word count). A "Generate ePub" button. Progress indicator during generation. On completion: a "Download ePub" button and a "Where to publish your ebook" guidance section with platform links.

### User Flow: First-Time WordPress Connection
Publish tab > Click WordPress card > Modal opens > Enter site URL, username, application password > Click Test Connection > System confirms valid credentials and displays WordPress username and site title > Click Save > Default settings form: select default category, default status > Save settings > Modal closes > WordPress card shows "Connected" badge > All chapter rows now show a WordPress publish button.

---

## Data Model

### New Tables

#### `publishing_connections`
```sql
CREATE TABLE publishing_connections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform            TEXT NOT NULL CHECK (platform IN ('wordpress', 'medium', 'substack')),
  display_name        TEXT,          -- e.g., site URL or Medium username, shown in UI
  vault_secret_id     TEXT NOT NULL, -- reference to the Supabase Vault secret holding encrypted credentials
  default_settings    JSONB,         -- platform-specific defaults (categories, tags, status, publication_id)
  connected_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at    TIMESTAMPTZ,
  UNIQUE (user_id, platform)
);
```

#### `published_items`
```sql
CREATE TABLE published_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id      UUID REFERENCES chapters(id) ON DELETE SET NULL,
  connection_id   UUID REFERENCES publishing_connections(id) ON DELETE SET NULL,
  platform        TEXT NOT NULL,
  external_id     TEXT,              -- platform's post/page ID for updates
  external_url    TEXT,              -- live URL of published content
  status          TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at    TIMESTAMPTZ,       -- populated if status = 'scheduled'
  published_at    TIMESTAMPTZ,
  error_message   TEXT,              -- populated if status = 'failed'
  seo_metadata    JSONB,             -- title, description, slug, featured_image_url
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `ebook_metadata`
```sql
CREATE TABLE ebook_metadata (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  title            TEXT NOT NULL,
  subtitle         TEXT,
  author_name      TEXT NOT NULL,
  publisher_name   TEXT,
  isbn             TEXT,
  description      TEXT,
  cover_image_url  TEXT,
  language         TEXT NOT NULL DEFAULT 'en',
  publication_date DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `scheduled_publish_jobs`
```sql
CREATE TABLE scheduled_publish_jobs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  published_item_id  UUID NOT NULL REFERENCES published_items(id) ON DELETE CASCADE,
  scheduled_at       TIMESTAMPTZ NOT NULL,
  executed_at        TIMESTAMPTZ,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  retry_count        INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Migration File
`supabase/migrations/012_publishing_pipeline.sql`

---

## API Routes

| Method | Route | Description | Auth Required |
|---|---|---|---|
| GET | `/api/publishing/connections` | List all publishing connections for the current user | Authenticated |
| POST | `/api/publishing/connections` | Create a new platform connection | Authenticated |
| PUT | `/api/publishing/connections/[id]` | Update default settings for a connection | Authenticated |
| DELETE | `/api/publishing/connections/[id]` | Disconnect a platform and delete credentials | Authenticated |
| POST | `/api/publishing/connections/[id]/test` | Test an existing connection's credentials | Authenticated |
| GET | `/api/publishing/items/[projectId]` | List all published items for a project | Authenticated |
| POST | `/api/publishing/publish` | Publish or schedule a chapter to a platform | Owner / Editor |
| PUT | `/api/publishing/items/[id]` | Update an existing published post (re-publish) | Owner / Editor |
| DELETE | `/api/publishing/items/[id]/cancel` | Cancel a scheduled publish job | Owner / Editor |
| POST | `/api/publishing/preview` | Generate a preview render of chapter content for a platform | Authenticated |
| GET | `/api/publishing/items/[id]/sync` | Sync publish status from the live platform | Authenticated |
| POST | `/api/publishing/epub` | Generate an ePub file and return a download URL | Owner / Editor |
| GET | `/api/publishing/epub/metadata/[projectId]` | Get ebook metadata for a project | Authenticated |
| PUT | `/api/publishing/epub/metadata/[projectId]` | Save ebook metadata for a project | Owner / Editor |
| POST | `/api/publishing/jobs/execute` | Internal cron endpoint for executing scheduled jobs | Service role only |

### Third-Party API Calls (Server-Side Only)
- **WordPress REST API:** `POST /wp-json/wp/v2/posts`, `PUT /wp-json/wp/v2/posts/{id}`, `GET /wp-json/wp/v2/categories`, `GET /wp-json/wp/v2/tags`.
- **Medium API:** `GET https://api.medium.com/v1/me`, `POST https://api.medium.com/v1/users/{userId}/posts`, `GET https://api.medium.com/v1/users/{userId}/publications`.

---

## AI Agent Integration

- **Scribe agent:** When a chapter is published, the Scribe agent must log the publish event in the chapter's metadata so the AI context is aware that content has been distributed. This prevents the agent from suggesting a re-draft of published material without acknowledging its published state.
- **Stylist agent:** Before publishing, the Stylist agent can optionally run a final voice consistency check against the user's style profile. This is surfaced as a "Check style before publishing" prompt in the Publish panel — the user opts in, it is not automatic.
- **Guide agent:** The Guide agent may surface a contextual publishing checklist in the chat panel when a user opens the Publish tab for the first time on a chapter: "Before you publish, have you checked: scripture references are accurate, chapter has been proofread, SEO metadata is complete?"
- **Researcher agent:** Scripture references in published content must be preserved with their full text. The Researcher agent's citation data must flow through to the ePub interior so scripture blockquotes are correctly attributed in the published ebook.

---

## Acceptance Criteria

- [ ] Given a user who enters valid WordPress credentials and clicks Test Connection, then the system displays the WordPress site title and username confirming a successful connection within 5 seconds, and stores credentials encrypted in Supabase Vault.
- [ ] Given an Editor who clicks Publish on a chapter to WordPress with status "Published", then a new WordPress post is created with the correct title, HTML content, SEO metadata, and assigned categories, and the published_items record is created with status "published" and the live external URL.
- [ ] Given a chapter that has already been published to WordPress, when the user edits the chapter and clicks "Update", then the existing WordPress post is updated rather than a new post being created.
- [ ] Given a scheduled publish set for a future datetime, when that datetime arrives, then the background job executes the publish action automatically and the published_items status updates to "published".
- [ ] Given a user who clicks Preview before publishing to Medium, then a rendered preview of the chapter content appears in a modal within 2 seconds, showing correctly formatted headings, paragraphs, blockquotes, and the SEO snippet preview.
- [ ] Given a user who enters ebook metadata, selects 5 chapters, drags them into reading order, and clicks Generate ePub, then a valid ePub 3.0 file is generated within 30 seconds and a download link is provided.
- [ ] Given an ePub file generated by Scriptloom, when the file is run through epubcheck validation, then zero critical errors are reported.
- [ ] Given a user who clicks Disconnect on a connected platform, then all stored credentials are deleted from Supabase Vault, the platform card shows "Not connected", and existing published_items records are preserved.
- [ ] Given a user who sets a meta description of 200 characters, then the system displays a validation error stating the maximum length is 160 characters and prevents submission until the description is shortened.
- [ ] Given a scheduled publish that fails due to expired WordPress credentials, then the system marks the item as "Failed", sends an in-app and email notification to the user with the error description within 5 minutes of the failure.

---

## Edge Cases

1. **WordPress site unreachable:** The WordPress site goes offline between the time the user connected and the scheduled publish time. The system must retry up to 3 times, then mark the job as Failed and notify the user.
2. **Medium API deprecation:** Medium has a history of changing API access. If the integration token becomes invalid, the system must detect a 401 response, mark the connection as invalid, display a prominent warning banner, and prompt re-connection.
3. **Substack-only users:** Some users may only have a Substack account and no WordPress or Medium presence. The "Export for Substack" workflow must be clearly discoverable even though it is a manual process, not an automated publish.
4. **Duplicate slug:** The user enters a slug that already exists on their WordPress site. The WordPress API returns a 400 error. Scriptloom must surface this error clearly with guidance to modify the slug.
5. **Chapter with no content:** A user attempts to publish an empty chapter. The system must block the publish with a validation message: "This chapter has no content to publish."
6. **Featured image upload fails:** The featured image upload to WordPress fails after the post text has already been created. The system must not leave the post in an inconsistent state — it must either complete the post without a featured image and alert the user, or roll back the post entirely.
7. **Multi-chapter ePub with a missing chapter:** A chapter that was selected for the ePub is deleted before the user clicks Generate. The system must alert the user with a list of missing chapters and require them to resolve the selection before generating.
8. **Timezone mismatch:** The user sets a scheduled publish time in a timezone that differs from the server's timezone. The system must store all scheduled times in UTC and display them converted to the user's local timezone throughout the UI.
9. **Large chapter content:** A chapter exceeding 100,000 words is published to Medium. Medium's API has a maximum post size. The system must detect this before submitting and alert the user with the specific character limit and the chapter's current size.
10. **Expired scheduled job:** A scheduled publish job is in the queue but the user's publishing connection was disconnected before execution. The system must detect the missing connection at job execution time, mark the job as Failed, and notify the user.

---

## Dependencies

- **PRD-03 (Writing Interface):** TipTap editor and the TipTap JSON document format must be stable, as the publisher converts TipTap JSON to platform-specific HTML.
- **PRD-08 (Export & Sharing):** The HTML export logic from PRD-08 should be abstracted and reused by the publishing pipeline's content converter to avoid duplication.
- **Supabase Vault:** Must be enabled and configured on the Supabase project for encrypted credential storage.
- **Supabase Edge Functions:** Required for scheduled publish cron jobs and server-side API calls.
- **epubjs or epub-gen:** A Node.js ePub generation library must be selected and evaluated before sprint start. Recommended: `epub-gen-memory` for serverless compatibility.
- **WordPress Application Passwords:** Available from WordPress 5.6+. Users on older self-hosted WordPress installations must be informed of the version requirement.
- **Medium API Access:** Medium currently provides integration tokens for individual user publishing. Confirm current API terms and rate limits before committing to the integration scope.

---

## Out of Scope (v1)

- Direct API integration with Substack (partial export support only).
- Direct upload to Amazon KDP, Apple Books, or IngramSpark APIs (ePub download + manual upload only).
- Print-ready PDF typesetting (covered by PRD-19).
- Social media post generation from published content (covered by PRD-18).
- Publishing to Ghost, Blogger, or other CMS platforms (post-v1 expansion).
- A/B testing of published content titles or descriptions.
