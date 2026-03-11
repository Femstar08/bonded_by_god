# Scriptloom — Build Plan

## How to Think About This Build

Each phase is like a floor of a building:
- **Phase 1** = the structure (walls, doors, rooms)
- **Phase 2** = the electrics and plumbing (AI, smart features)
- **Phase 3** = the interior design and finishing (polish, export, sharing)

Don't move to the next floor until the current one is stable.

---

## Phase 1 — MVP (Build the Shell)

> Goal: A working app where users can sign up, create projects, write, and store notes. No AI yet.

| Sprint | PRD | What Gets Built | Done? |
|---|---|---|---|
| 1 | `prd-01-project-foundation.md` | Next.js setup, Supabase, auth (login/signup), dashboard shell | ☐ |
| 2 | `prd-02-project-creation-flow.md` | Onboarding UI — role selection, project setup form | ☐ |
| 3 | `prd-03-writing-interface.md` | Editor screen, word count, auto-save, sidebar panel | ☐ |
| 4 | `prd-04-notes-vault.md` | Notes tab, paste/tag/search sermon notes | ☐ |

**Phase 1 is complete when:** A user can sign up → create a project → write and save content → store and find notes.

---

## Phase 2 — AI Layer (Add Intelligence)

> Goal: The app becomes a Spirit-led co-author. AI tools are wired in.

| Sprint | PRD | What Gets Built | Done? |
|---|---|---|---|
| 5 | `prd-05-ai-scripture-suggestions.md` | Auto scripture suggestions while writing | ☐ |
| 6 | `prd-06-ai-writing-tools.md` | Expand, Revise, Summarise buttons + reflection prompts | ☐ |
| 7 | `prd-07-ai-chat-panel.md` | AI co-author chat sidebar | ☐ |

**Phase 2 is complete when:** The AI suggests scriptures, helps expand writing, and the chat panel works end-to-end.

---

## Phase 3 — Polish & Share

> Goal: The app feels complete and content can leave the app.

| Sprint | PRD | What Gets Built | Done? |
|---|---|---|---|
| 8 | `prd-08-export-sharing.md` | Export to PDF, Word doc, email draft | ☐ |
| 9 | `prd-09-writing-goals.md` | Word count goals, progress tracking dashboard | ☐ |
| 10 | `prd-10-spiritual-tools.md` | Daily Scripture at login, guided prayer prompt, inspiration board | ☐ |

---

## How to Use This With Claude Code

### For each sprint:
1. Open Claude Code
2. Paste the contents of the relevant PRD file
3. Use this kickoff prompt:

```
Please implement [PRD filename]. 
Read CLAUDE.md first for project context and coding rules.
Do not build anything outside the scope of this PRD.
```

4. Review what was built, test it
5. Mark the sprint as done ✅
6. Move to the next PRD

---

## Decisions Still to Make

| Decision | Options | When Needed |
|---|---|---|
| Should display name be collected at sign-up? | Yes / No (set later) | Before Sprint 1 |
| Vercel domain name | Auto-generated / Custom | Before Sprint 1 deploy |
| Bible translation for scripture suggestions | NIV / ESV / KJV / User selects | Before Sprint 5 |
| AI tone presets | Fixed list / User customisable | Before Sprint 6 |

---

## Current Status

> 🟡 Pre-build — CLAUDE.md and PRD-01 created. Ready to start Sprint 1.
