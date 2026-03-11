# Scriptloom — Writing Assistant App

## What This App Is

A Spirit-led writing and speaking studio for Christian authors, preachers, devotionalists, and ministry leaders. Users create writing projects (books, sermons, devotionals, etc.), get AI-assisted writing support, and store their ministry notes — all within a theologically grounded, distraction-free environment.

The first featured project is a book called *Bonded by God* (the app itself is now called Scriptloom).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | TailwindCSS + ShadCN/UI |
| Backend / DB | Supabase (Postgres) |
| Auth | Supabase Auth (email/password) |
| AI | Anthropic Claude API (Phase 2) |
| Deployment | Vercel |

---

## Folder Structure

```
/app                  → Next.js App Router pages
  /login              → Login page
  /signup             → Sign-up page
  /dashboard          → Main dashboard (protected)
  /projects/[id]      → Writing interface per project
  /notes              → Notes Vault
/components           → Shared UI components
/lib
  /supabase
    client.ts         → Browser Supabase client
    server.ts         → Server-side Supabase client
/tasks                → PRD files for each sprint
middleware.ts         → Route protection logic
```

---

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` | One row per user — name, email, preferences |
| `projects` | Each writing project (book, sermon, etc.) |
| `chapters` | Sections/chapters within a project |
| `notes` | Notes Vault entries (sermon notes, church notes) |
| `note_tags` | Tags attached to notes |

---

## Design Guidelines

- **Colours:** Deep navy/blue backgrounds, warm gold accents, cream/off-white text areas
- **Fonts:** Playfair Display (headings), Inter or Lato (body)
- **Tone:** Calm, sacred, focused — not corporate or clinical
- **Background:** Mountain + sky imagery (as per mockups)
- **Mobile-first:** All screens must work on tablet and phone

---

## User Roles / Toolkits

Each project is assigned one of these roles, which customises the tools shown:

1. **Author / Christian Writer** — books, devotionals, articles
2. **Preacher / Pastor / Speaker** — sermons, teachings, scripts
3. **Bible Study Leader / Teacher** — study guides, group questions
4. **Devotionalist / Journal Creator** — daily reflections, print templates
5. **Evangelist / Outreach Leader** — tracts, gospel scripts
6. **Content Creator** — podcast outlines, social posts

---

## Key Features (by phase)

### Phase 1 — MVP
- [ ] Auth (sign up, login, logout)
- [ ] Project creation flow with role selection
- [ ] Basic writing interface (editor + word count + save)
- [ ] Notes Vault (paste, tag, search notes)

### Phase 2 — AI Layer
- [ ] Scripture suggestions (auto + manual lookup)
- [ ] AI writing tools: Expand, Revise, Summarise
- [ ] Reflection prompts
- [ ] AI co-author chat panel

### Phase 3 — Polish & Share
- [ ] Export to PDF, Word, email
- [ ] Writing goal tracking
- [ ] Inspiration board
- [ ] Daily Scripture focus on login

---

## AI Behaviour (Phase 2)

When calling the Anthropic API, the assistant should:
- Always respond in a spiritually grounded, encouraging tone
- Suggest Scripture contextually — not randomly
- Never contradict Christian theology
- Treat the user as a co-creator, not just a requestor
- Use the project's role + tone settings to shape responses

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=         ← Phase 2 only
```

---

## How to Run Locally

```bash
npm install
npm run dev
```

App runs at: `http://localhost:3000`

---

## PRD Files (Build Order)

All PRDs live in `/tasks`. Build them in this order:

1. `prd-01-project-foundation.md` ← Start here
2. `prd-02-project-creation-flow.md`
3. `prd-03-writing-interface.md`
4. `prd-04-notes-vault.md`
5. `prd-05-ai-scripture-suggestions.md` ← Phase 2
6. `prd-06-ai-writing-tools.md` ← Phase 2
7. `prd-07-export-and-sharing.md` ← Phase 3

---

## Notes for Claude Code

- Always use the App Router — never Pages Router
- Always use TypeScript
- Use ShadCN/UI components where possible — don't build from scratch
- Protect all `/dashboard/*` and `/projects/*` routes via `middleware.ts`
- Use server components by default; add `"use client"` only when needed
- When modifying the DB, always include the SQL migration in the PR
- Do not implement AI features until Phase 2 is explicitly started
