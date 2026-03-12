# PRD-20: Collaborative Editing

**Status:** Planned
**Phase:** 5 - Platform Expansion
**Priority:** P10
**Estimated Scope:** XL
**Last Updated:** 2026-03-11

---

## Overview

Collaborative Editing enables ministry teams to co-author, review, and refine writing projects together in real time. Multiple contributors — co-authors, editors, and reviewers — can work on the same chapter simultaneously, leave inline comments, propose tracked changes, and view a full version history, all within Scriptloom's spiritually grounded writing environment.

---

## Problem Statement

Ministry writing is rarely a solo activity. Pastoral teams co-write sermons. Publishing editors review manuscripts. Accountability partners provide feedback on devotionals. Today, Scriptloom users must export their content to Google Docs or email drafts back and forth to collaborate, breaking the sacred, distraction-free environment the app provides and losing all AI context in the process.

Competitors such as Google Docs and Jasper Teams offer real-time co-editing, but neither provides the faith-specific tooling — Scripture suggestions, AI agents, style training — that Scriptloom users depend on. This feature closes that gap and positions Scriptloom as a complete team writing platform for ministry organisations.

---

## User Stories

1. As a lead pastor, I want to invite my associate pastor as a co-editor on my sermon project, so that we can divide writing responsibilities without sharing my login credentials.
2. As a manuscript editor, I want to suggest changes to a chapter without overwriting the author's original text, so that the author can review and accept or reject each suggestion individually.
3. As a writing team member, I want to see colored cursors showing where my colleagues are actively writing, so that I can avoid editing the same sentence simultaneously.
4. As a reviewer, I want to leave an inline comment on a specific sentence, so that I can give targeted feedback tied to the exact passage I am referencing.
5. As a project owner, I want to restore a previous version of a chapter if a collaborator accidentally deletes significant content, so that no writing is ever permanently lost.
6. As a team member, I want to receive a notification when someone replies to my comment or edits a chapter I contributed to, so that I can stay informed without constantly checking the app.
7. As a project owner, I want to remove a team member or change their role at any time, so that I maintain control over who can edit my manuscript.
8. As an author, I want to view an activity feed showing every change made to a chapter, so that I can understand how the document evolved over time.
9. As a Bible study leader, I want to share my study guide with group members as Viewers, so that they can read the draft and leave comments without being able to edit the content.
10. As a devotional co-author, I want to resolve comments that have been addressed, so that the comment thread stays clean and actionable items are easy to find.

---

## Detailed Requirements

### Functional Requirements

#### FR-01: Project Membership & Invitations
1. A project owner must be able to invite users by email address from within the project settings panel.
2. Invited users must receive an email containing a unique, time-limited invitation link (expires after 7 days).
3. If the invited email is not registered with Scriptloom, the system must prompt them to create an account before accepting the invitation.
4. The system must support four permission roles: Owner, Editor, Reviewer, and Viewer, as defined in the Roles table below.
5. A project must have exactly one Owner at all times. Ownership may be transferred to another Editor by the current Owner.
6. Project owners and Editors must be able to change any member's role, except they cannot demote the Owner.
7. Project owners must be able to remove any team member. Removed members immediately lose access to the project.
8. The project settings panel must display all current members with their role, join date, and a last-active timestamp.

**Role Permissions Matrix:**

| Permission | Owner | Editor | Reviewer | Viewer |
|---|---|---|---|---|
| Read chapter content | Yes | Yes | Yes | Yes |
| Edit chapter content | Yes | Yes | No | No |
| Leave inline comments | Yes | Yes | Yes | Yes |
| Create suggestions | Yes | Yes | Yes | No |
| Accept/reject suggestions | Yes | Yes | No | No |
| Resolve comments | Yes | Yes | No | No |
| View version history | Yes | Yes | Yes | No |
| Restore versions | Yes | No | No | No |
| Manage team members | Yes | No | No | No |
| Delete the project | Yes | No | No | No |

#### FR-02: Real-Time Co-Editing
1. Multiple users with Editor or Owner role must be able to type in the same chapter simultaneously.
2. The system must use a conflict-free replicated data type (CRDT) library (Yjs is the recommended implementation) to merge concurrent edits without data loss or conflicting states.
3. Each active collaborator's cursor position must be visible to all other users in that chapter in real time.
4. Each collaborator must be assigned a distinct cursor color (from a fixed palette of 8 colors) that persists for the duration of their session.
5. A collaborator's name label must appear adjacent to their cursor.
6. Real-time synchronization must be delivered via Supabase Realtime channels with a broadcast latency target of under 300ms for typical connections.
7. If a user loses their network connection, their local changes must be queued and synced automatically upon reconnection without data loss.
8. The editor must display a subtle connection status indicator (Connected / Reconnecting / Offline) so users are always aware of their sync state.

#### FR-03: Presence Indicators
1. A presence bar at the top of the chapter editor must display avatar thumbnails or initials for every user currently viewing or editing that chapter.
2. Hovering over an avatar must display the user's full name and their current role.
3. Presence must update within 5 seconds when a user opens or closes a chapter.
4. Users who are only viewing (not actively typing) must be indicated with a distinct visual state (e.g., a dimmed or outlined avatar) compared to actively editing users.

#### FR-04: Inline Comments
1. Any user with commenting permission must be able to select a range of text in the editor and open a comment thread anchored to that selection.
2. The selected text must be visually highlighted (using a translucent gold underline) for as long as the comment thread is open and unresolved.
3. Comments must support multi-line plain text. Rich text formatting within comments is out of scope for v1.
4. Any user must be able to reply to an existing comment, creating a threaded conversation.
5. The comment author or a project Owner/Editor must be able to mark a comment as Resolved.
6. Resolved comments must be hidden by default but accessible via a "Show resolved" toggle in the comments panel.
7. Deleting a comment must only be available to the comment author or the project Owner.
8. Comments must be displayed in a collapsible side panel that opens on the right side of the editor. Clicking a comment in the panel must scroll the editor to the anchored text selection.

#### FR-05: Suggestions Mode
1. Reviewer-role users and above must be able to toggle into Suggestions Mode from a toolbar button.
2. In Suggestions Mode, any text typed by the user is displayed as a pending insertion (shown in a distinct color, e.g., green) rather than directly modifying the document.
3. Any text deleted in Suggestions Mode must be displayed as a pending deletion (shown with strikethrough in a distinct color, e.g., red) rather than being immediately removed.
4. Project Owners and Editors must be able to accept or reject individual suggestions via Accept/Reject controls that appear on hover over the suggestion.
5. An "Accept all" and "Reject all" button must be available in the suggestions panel for bulk operations.
6. Suggestions must be attributed to the user who created them, with a timestamp.

#### FR-06: Activity Feed
1. Each chapter must have an activity feed accessible via a "History" tab in the right panel.
2. The activity feed must log the following event types: chapter edited (by whom, approximate word count change), comment added, comment resolved, suggestion created, suggestion accepted, suggestion rejected, member added, member removed, version restored.
3. Each activity entry must display: event type icon, actor name, timestamp (relative, e.g., "2 hours ago"), and a brief description.
4. The activity feed must be paginated, showing the 50 most recent events by default with a "Load more" option.
5. The activity feed must not log the granular content of edits (i.e., it is not a diff view; that is handled by Version History).

#### FR-07: Notifications
1. The system must send in-app notifications for the following triggers:
   - A team member comments on a chapter in a project the user owns or contributed to.
   - A team member replies to a comment thread the user participated in.
   - A team member accepts or rejects a suggestion the user created.
   - A team member edits a chapter that the user was the last author of.
   - The user is invited to a new project.
2. In-app notifications must appear in a notification bell in the top navigation bar with an unread count badge.
3. The system must send email notifications for the same triggers, respecting a user's notification preferences set in Settings.
4. Users must be able to configure notification preferences per project (All / Comments only / None) in the project settings panel.
5. Email notifications must be batched — no more than one digest email per hour per user to avoid inbox spam.

#### FR-08: Version History
1. The system must automatically save a named version snapshot whenever: a user stops typing for 30 seconds (autosave checkpoint), a user manually saves, or a user explicitly clicks "Save version" with an optional label.
2. Each version must store: the full chapter content at that point in time, the user who triggered the save, and the timestamp.
3. Version history must be accessible via a "Version History" panel, showing a chronological list of versions with actor name, timestamp, and optional label.
4. Clicking a version must open a read-only diff view showing what changed between that version and the one immediately prior.
5. The project Owner must be able to restore any version. Restoring creates a new version entry (it does not delete history) with the label "Restored from [original version timestamp]".
6. The system must retain a minimum of 90 days of version history. Older versions beyond 90 days or beyond 500 snapshots per chapter (whichever comes first) may be pruned, retaining at least one snapshot per calendar day.

#### FR-09: Team Management UI
1. A "Team" tab must be accessible within the Project Settings panel.
2. The Team tab must list all current members with: avatar/initials, display name, email, role badge, joined date, and action controls (Change Role, Remove).
3. An "Invite member" form must be present at the top of the Team tab: email input field, role selector (Editor / Reviewer / Viewer), and a Send Invite button.
4. Pending invitations (sent but not yet accepted) must be displayed in a separate "Pending Invites" section with a Resend and Revoke option.
5. The team tab must only be visible to the project Owner.

### Non-Functional Requirements

#### NFR-01: Performance
- Real-time edit propagation latency must be under 300ms at the 95th percentile for users in the same geographic region.
- Version history list must load within 1 second for up to 500 version entries.
- The presence bar must update within 5 seconds of a user joining or leaving a chapter.
- The editor must remain responsive (no input lag exceeding 100ms) with up to 5 simultaneous editors in a chapter.

#### NFR-02: Reliability
- CRDT merge logic must guarantee no data loss when two users concurrently edit overlapping text ranges.
- Offline-queued changes must sync correctly upon reconnection even after extended offline periods (up to 24 hours).
- Invitation links must expire securely after 7 days and be single-use.

#### NFR-03: Security
- Role permission checks must be enforced at the Supabase Row Level Security (RLS) policy layer, not solely at the UI layer.
- Collaboration session tokens must be scoped per project and per user.
- Encrypted credentials must use Supabase Vault or equivalent. No collaboration-specific credentials are stored in this feature, but the pattern applies to future integrations.

#### NFR-04: Accessibility
- All collaborative UI elements (comment panels, presence bar, suggestion controls) must meet WCAG 2.1 AA contrast requirements.
- Keyboard navigation must be fully supported for comment creation, suggestion accept/reject, and team management actions.
- Cursor color assignments must not rely on color alone — each cursor must also display the user's initials label.

#### NFR-05: Scalability
- The architecture must support up to 10 simultaneous editors per chapter without degradation.
- Supabase Realtime channel subscriptions must be scoped per chapter (not per project) to limit broadcast traffic.

---

## UI/UX Specification

### Key Screens

#### Screen 1: Editor with Collaboration Active
- **Presence bar:** A horizontal strip above the editor toolbar. Shows avatar circles for each active user. Current user is first. Clicking the "+" icon opens the Team invite panel.
- **Collaborator cursors:** Colored vertical carets with floating name labels at each collaborator's position in the TipTap editor. Labels fade after 3 seconds of cursor inactivity to reduce clutter.
- **Toolbar additions:** A "Suggesting" toggle button (pencil with checkmark icon) in the main toolbar. When active, the toolbar background subtly shifts to a light green tint as a visual mode reminder.
- **Right panel tabs:** The existing right panel gains two new tabs: "Comments" and "History". The existing AI tools tab remains.

#### Screen 2: Comments Panel
- **Layout:** Scrollable list of comment threads, sorted by position in the document (top to bottom). Each thread shows: the anchored text snippet (truncated to 60 chars), the author avatar and name, the comment body, timestamp, and a Reply field.
- **Thread state:** Open threads have a white card background. Resolved threads are shown in a muted grey when "Show resolved" is toggled on.
- **New comment flow:** Selecting text in the editor causes a small floating tooltip with a comment bubble icon to appear. Clicking it opens an inline compose box. Submitting the comment auto-opens the Comments panel if it was closed.
- **Scrolling:** Clicking a comment in the panel smoothly scrolls the editor to center the anchored text selection in the viewport.

#### Screen 3: Version History Panel
- **Layout:** A two-column panel. Left column: scrollable list of version entries with actor name, relative timestamp, and optional label. Right column: diff view of the selected version vs. the prior version — added text in green, removed text in red strikethrough, unchanged text in standard body color.
- **Restore button:** A prominent "Restore this version" button at the top of the diff view, disabled for the current/latest version.
- **Manual save:** A "Save named version" button at the top of the left column opens a small modal with a label input (e.g., "After pastor review — March 11").

#### Screen 4: Team Management (Project Settings)
- **Tabs within Settings:** General | Writing Map | Team | Notifications.
- **Team tab layout:** Invite form at top, active members list in the middle, pending invitations section at the bottom.
- **Role badge design:** Color-coded pill badges — Owner (gold), Editor (navy), Reviewer (teal), Viewer (grey) — consistent with the app's design language.

#### Screen 5: Notification Bell Dropdown
- **Location:** Top-right of the dashboard navigation bar.
- **Layout:** A popover with a "Notifications" heading, an "Mark all read" link, and a scrollable list of notification items. Each item: actor avatar, action description, project and chapter name, relative timestamp. Unread items have a gold left border accent.
- **Empty state:** "You're all caught up — no new notifications." with a small dove illustration consistent with the app's visual language.

### User Flows

#### Flow A: Inviting a Collaborator
Project Settings > Team tab > Enter email + select role > Send Invite > Recipient receives email > Recipient clicks link > Creates account (if new) or logs in > Lands on project dashboard with collaborator access confirmed.

#### Flow B: Leaving a Comment
Select text in editor > Click comment bubble tooltip > Type comment in compose box > Submit > Comment thread anchored to selection appears highlighted > Comment appears in Comments panel > Co-authors receive in-app notification.

#### Flow C: Accepting a Suggestion
Open chapter with pending suggestions > Suggestions shown as colored inline markup > Hover suggestion > "Accept" / "Reject" controls appear > Click Accept > Suggestion text is merged into document > Activity feed logs acceptance > Suggestion author notified.

---

## Data Model

### New Tables

#### `project_members`
```sql
CREATE TABLE project_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'reviewer', 'viewer')),
  invited_email TEXT,                          -- populated before user accepts
  invited_by    UUID REFERENCES auth.users(id),
  invite_token  TEXT UNIQUE,                   -- hashed token for invite link
  invite_expires_at TIMESTAMPTZ,
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at   TIMESTAMPTZ,
  UNIQUE (project_id, user_id)
);
```

#### `comments`
```sql
CREATE TABLE comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id      UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,  -- NULL = top-level thread
  content         TEXT NOT NULL,
  selection_start INTEGER,   -- character offset in chapter content
  selection_end   INTEGER,   -- character offset in chapter content
  resolved        BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by     UUID REFERENCES auth.users(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `chapter_versions`
```sql
CREATE TABLE chapter_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id  UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,              -- full TipTap JSON snapshot
  label       TEXT,                       -- optional user-provided label
  word_count  INTEGER,
  is_restore  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,  -- 'comment_added' | 'comment_reply' | 'suggestion_accepted' | 'suggestion_rejected' | 'chapter_edited' | 'project_invite'
  actor_id    UUID REFERENCES auth.users(id),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id  UUID REFERENCES chapters(id) ON DELETE CASCADE,
  comment_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `activity_feed`
```sql
CREATE TABLE activity_feed (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id  UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,  -- 'edit' | 'comment_added' | 'comment_resolved' | 'suggestion_created' | 'suggestion_accepted' | 'suggestion_rejected' | 'member_added' | 'member_removed' | 'version_restored'
  metadata    JSONB,          -- event-specific data (e.g., word_count_delta, comment_id)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Row Level Security Policies (Summary)

- `project_members`: Users may read their own membership rows. Owners may read and write all rows for their projects.
- `comments`: Users may read all comments on chapters belonging to projects they are members of. Users may insert comments on projects where their role is owner, editor, or reviewer. Delete restricted to comment author or project owner.
- `chapter_versions`: Members may read versions of chapters in their projects. Owners and Editors may insert. Only Owners may update (restore).
- `notifications`: Users may only read and update their own notification rows.
- `activity_feed`: Members may read feed entries for chapters in their projects. System inserts only (no direct user writes).

### Migration File
`supabase/migrations/011_collaboration.sql`

---

## API Routes

| Method | Route | Description | Auth Required |
|---|---|---|---|
| POST | `/api/collaboration/invite` | Send a project invitation email | Owner only |
| POST | `/api/collaboration/invite/accept` | Accept an invitation via token | Token-gated |
| DELETE | `/api/collaboration/members/[memberId]` | Remove a team member | Owner only |
| PATCH | `/api/collaboration/members/[memberId]` | Change a member's role | Owner only |
| GET | `/api/collaboration/members/[projectId]` | List all members of a project | Member |
| POST | `/api/comments` | Create a new comment or reply | Member (owner/editor/reviewer) |
| PATCH | `/api/comments/[commentId]` | Edit a comment or resolve it | Comment author / Owner / Editor |
| DELETE | `/api/comments/[commentId]` | Delete a comment | Comment author / Owner |
| GET | `/api/comments/[chapterId]` | List all comments for a chapter | Member |
| GET | `/api/versions/[chapterId]` | List version history for a chapter | Owner / Editor / Reviewer |
| POST | `/api/versions/[chapterId]` | Manually save a named version | Owner / Editor |
| POST | `/api/versions/[chapterId]/restore` | Restore a specific version | Owner only |
| GET | `/api/notifications` | Get notifications for the current user | Authenticated |
| PATCH | `/api/notifications/read` | Mark notifications as read | Authenticated |
| GET | `/api/activity/[chapterId]` | Get activity feed for a chapter | Member |

### Supabase Realtime Channels
- `chapter:{chapterId}:presence` — tracks who is currently viewing the chapter (user id, display name, cursor color).
- `chapter:{chapterId}:edits` — broadcasts CRDT document updates (Yjs binary updates).
- `chapter:{chapterId}:comments` — broadcasts new comment and resolve events.
- `project:{projectId}:notifications` — broadcasts new notification events for the current user.

---

## AI Agent Integration

Collaboration does not introduce new AI agents but must integrate cleanly with existing ones:

- **Scribe agent:** When multiple editors are present, the Scribe agent's autosave mechanism must debounce based on the CRDT document state, not any single user's keystroke events. The agent must not create duplicate version snapshots when multiple editors are simultaneously idle.
- **Guide agent (chat panel):** AI chat context must be aware of the current user's identity so that suggestions and responses are attributed correctly. When multiple users are present, the chat panel must indicate which user last sent a message.
- **Shepherd agent (prayer prompts):** Prayer prompts triggered during a collaborative session should only appear for the user who requested them, not broadcast to all collaborators.
- **Future — Refiner agent:** When the Refiner agent suggests edits, those suggestions should be injected as Suggestions Mode entries (not direct edits) when collaboration is active, so team members can review AI-generated changes through the same workflow as human suggestions.

---

## Acceptance Criteria

- [ ] Given a project owner, when they enter an email and role in the Team tab and click Send Invite, then the invited user receives an email within 2 minutes containing a working invitation link.
- [ ] Given a pending invitation, when the invite link is clicked more than 7 days after it was sent, then the system displays an "Invitation expired" message and prompts the user to request a new invitation.
- [ ] Given two Editor-role users in the same chapter, when both type simultaneously in different paragraphs, then both users see each other's changes within 300ms and no content is lost or duplicated.
- [ ] Given a Viewer-role user in an open chapter, when they attempt to type, then the editor remains read-only and no text is added to the document.
- [ ] Given a Reviewer, when they select a word and type a replacement in Suggestions Mode, then the original word appears with red strikethrough and the replacement appears in green, visible to all collaborators.
- [ ] Given an Editor, when they click Accept on a pending suggestion, then the document merges the suggestion, the markup is removed, the activity feed logs the acceptance, and the suggestion author receives a notification.
- [ ] Given a user who selects a sentence and submits a comment, when the comment is submitted, then the sentence is highlighted in the editor and the comment appears in the Comments panel linked to that selection.
- [ ] Given an Owner, when they click Restore on a version from 3 days ago, then the chapter content reverts to that version, a new version entry is created with the label "Restored from [original timestamp]", and the previous version is not deleted.
- [ ] Given a team member who adds a comment, when the project owner views the notification bell, then an unread notification appears describing who commented, on which chapter, within 30 seconds of the comment being submitted.
- [ ] Given a project Owner, when they change a member's role from Editor to Viewer, then that member immediately loses edit and suggestion access without needing to reload the page.
- [ ] Given 5 simultaneous editors in a single chapter, when all 5 are actively typing, then the editor remains responsive with no visible input lag.
- [ ] Given a user who goes offline while editing, when their connection is restored within 24 hours, then their queued changes are synced to the document without data loss.

---

## Edge Cases

1. **Simultaneous deletion:** Two editors delete the same paragraph at the same time. The CRDT library must resolve this deterministically — the paragraph must be deleted exactly once, not twice or left intact.
2. **Invitation to existing member:** If an owner invites an email address that already has a membership record (even a removed one), the system must handle gracefully — re-activating the membership rather than creating a duplicate row.
3. **Owner account deletion:** If the sole Owner deletes their Scriptloom account, the project must be automatically transferred to the oldest Editor member, or archived if no Editors exist.
4. **Comment anchor drift:** If the text a comment is anchored to is deleted by an editor, the comment must not be silently lost. It must remain as an "orphaned" comment in the panel with a note that the original selection was removed.
5. **Version size limits:** Chapters with very large word counts (e.g., 50,000+ words) produce large version snapshots. A maximum snapshot size of 500KB must be enforced; if exceeded, the system stores a compressed diff instead of a full snapshot.
6. **Conflicting role changes:** If an Owner is mid-session removing a member while that member is actively editing, the member's session must be terminated gracefully with a clear message: "Your access to this project has been changed."
7. **Concurrent suggestion acceptance:** Two Editors click Accept on the same suggestion simultaneously. The system must process only one acceptance and ignore the duplicate, returning a 409 Conflict response to the second request.
8. **Email delivery failure:** If the invitation email bounces or fails to deliver, the pending invitation must remain in the Pending Invites list and the owner must be able to resend.
9. **Large teams:** Projects with more than 10 active simultaneous editors are not supported in v1. The system must display a warning when the 11th user attempts to open the editor and prevent them from joining until a slot is available.
10. **Notification flood:** If a chapter receives rapid-fire edits (e.g., an automated import or bulk paste), the system must group edit notifications into a single digest rather than sending one notification per keystroke event.

---

## Dependencies

- **PRD-03 (Writing Interface):** TipTap editor must be in place; Yjs integration extends TipTap.
- **PRD-01 (Project Foundation):** `projects` and `chapters` tables must exist with stable schema.
- **PRD-04 (Notes Vault):** No direct dependency, but the notifications system should be designed to support future note-level notifications.
- **Supabase Realtime:** Must be enabled on the Supabase project. Confirm channel limits on the active Supabase pricing plan before implementation.
- **Yjs ecosystem:** `yjs`, `y-supabase` (or a custom Supabase persistence provider), and `y-tiptap` (TipTap Collaboration extension) must be evaluated and selected before sprint start.
- **Email provider:** A transactional email service (e.g., Resend or SendGrid) must be configured in the environment before invitation and notification emails can be sent.

---

## Out of Scope (v1)

- Video or voice calling within the writing session.
- AI agent suggestions appearing as tracked changes (planned for v2 of this feature).
- Per-paragraph permission locking (locking specific sections to a single editor).
- Mobile native app collaboration (web responsive only for v1).
- Export of the full comment/suggestion audit trail as a document.
