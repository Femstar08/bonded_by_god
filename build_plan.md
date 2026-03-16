# Scriptloom - Build Plan

## How to Think About This Build

Each phase is like a floor of a building:
- **Phase 1** = the structure (walls, doors, rooms)
- **Phase 2** = the electrics and plumbing (AI, smart features)
- **Phase 3** = the interior design and finishing (polish, export, sharing)
- **Phase 4** = the smart home upgrades (growth features, competitive advantages)
- **Phase 5** = the neighbourhood (platform expansion, integrations, collaboration)

Don't move to the next floor until the current one is stable.

---

## Phase 1 - MVP (Build the Shell)

> Goal: A working app where users can sign up, create projects, write, and store notes. No AI yet.

| Sprint | PRD | What Gets Built | Done? |
|---|---|---|---|
| 1 | `prd-01-project-foundation.md` | Next.js setup, Supabase, auth (login/signup), dashboard shell | ✅ |
| 2 | `prd-02-project-creation-flow.md` | Onboarding UI, role selection, project setup form | ✅ |
| 3 | `prd-03-writing-interface.md` | Editor screen, word count, auto-save, sidebar panel | ✅ |
| 4 | `prd-04-notes-vault.md` | Notes tab, paste/tag/search sermon notes | ✅ |

**Phase 1 is complete when:** A user can sign up, create a project, write and save content, store and find notes.

---

## Phase 2 - AI Layer (Add Intelligence)

> Goal: The app becomes a Spirit-led co-author. AI tools are wired in.

| Sprint | PRD | What Gets Built | Done? |
|---|---|---|---|
| 5 | `prd-05-ai-scripture-suggestions.md` | Auto scripture suggestions while writing | ✅ |
| 6 | `prd-06-ai-writing-tools.md` | Expand, Revise, Summarise buttons + reflection prompts | ✅ |
| 7 | `prd-07-ai-chat-panel.md` | AI co-author chat sidebar | ✅ |

**Phase 2 is complete when:** The AI suggests scriptures, helps expand writing, and the chat panel works end-to-end.

---

## Phase 3 - Polish & Share

> Goal: The app feels complete and content can leave the app.

| Sprint | PRD | What Gets Built | Done? |
|---|---|---|---|
| 8 | `prd-08-export-sharing.md` | Export to PDF, Word doc, email draft | ✅ |
| 9 | `prd-09-writing-goals.md` | Word count goals, progress tracking dashboard | ✅ |
| 10 | `prd-10-spiritual-tools.md` | Daily Scripture at login, guided prayer prompt, inspiration board | ✅ |

**Phase 3 is complete when:** Users can export their work, track progress, and engage with spiritual tools daily.

---

## Phase 4 - Growth Features (Competitive Advantages)

> Goal: Features that differentiate Scriptloom from every competitor. Based on competitive analysis against Logos, SermonAI, Sudowrite, Scrivener, Dabble, and others. See `docs/competitive-analysis.md` for full context.
>
> **Build order rationale:** Project Bible comes first because it gives all AI agents structured project-level intelligence (themes, theology, audience, Scripture anchors). Content Repurposing then leverages that deep context to produce high-quality multi-format output. Without the Project Bible, repurposed content would be generic. The existing Author Voice / Style Training system (Stylist agent, built in Phase 2-3) already captures tone, sentence rhythm, vocabulary, and narrative voice per project, so repurposed content will also match the author's voice.

| Sprint | PRD | What Gets Built | Size | Done? |
|---|---|---|---|---|
| 11 | `prd-12-project-bible.md` | Structured knowledge base per project (themes, theology, figures, Scripture refs) that all AI agents reference | L | ✅ |
| 12 | `prd-11-content-repurposing.md` | Turn any writing into social posts, discussion guides, devotionals, youth versions, email drafts | XL | ✅ |
| 13 | `prd-13-bible-translations.md` | Side-by-side NIV/ESV/KJV/NASB comparison inline in editor | M | ☐ |
| 14 | `prd-14-visual-planner.md` | Drag-and-drop board/cork board view for chapters and sections | L | ☐ |
| 15 | `prd-15-presentation-mode.md` | Teleprompter, timer, voice recorder for preachers | L | ☐ |
| 16 | `prd-16-voice-dictation.md` | Speak-to-write with AI punctuation and formatting | M | ☐ |

**Phase 4 is complete when:** Users can repurpose content, plan visually, compare Bible translations, present sermons, and dictate writing by voice.

---

## Phase 5 - Platform Expansion

> Goal: Scriptloom becomes a full platform with collaboration, publishing, and professional output.

| Sprint | PRD | What Gets Built | Size | Done? |
|---|---|---|---|---|
| 17 | `prd-17-goal-tracking.md` | Streak calendar, daily targets, day-off scheduling, milestone celebrations | L | ☐ |
| 18 | `prd-18-social-generator.md` | Auto-generate branded social posts for Twitter/X, Instagram, Facebook, LinkedIn | L | ☐ |
| 19 | `prd-19-book-formatting.md` | Professional print-ready PDF, ePub, and Kindle formatting with templates | XL | ☐ |
| 20 | `prd-20-collaboration.md` | Real-time co-editing, comments, suggestions mode, version history | XL | ☐ |
| 21 | `prd-21-publishing.md` | Direct publish to WordPress, Medium; ePub distribution prep | L | ☐ |
| 22 | `prd-22-sermon-calendar.md` | Calendar view for sermon series planning and searchable archive | M | ☐ |

**Phase 5 is complete when:** Teams can collaborate, content reaches audiences via social and publishing channels, and books can be professionally formatted for print and digital.

---

## PRD File Locations

| PRDs 01-10 | Location |
|---|---|
| Phase 1-3 PRDs | `/tasks/` (original location) |

| PRDs 11-22 | Location |
|---|---|
| Phase 4-5 PRDs | `/docs/` |
| Competitive Analysis | `/docs/competitive-analysis.md` |

---

## How to Use This With Claude Code

### For each sprint:
1. Open Claude Code
2. Reference the relevant PRD file
3. Use this kickoff prompt:

```
Please implement [PRD filename].
Read CLAUDE.md first for project context and coding rules.
Do not build anything outside the scope of this PRD.
```

4. Review what was built, test it
5. Mark the sprint as done
6. Move to the next PRD

---

## Decisions Still to Make

| Decision | Options | When Needed |
|---|---|---|
| Bible API provider | API.Bible / bible-api.com / both | Before Sprint 13 |
| Drag-and-drop library | @dnd-kit/core / react-beautiful-dnd | Before Sprint 14 |
| Audio storage limits | Per-user cap / per-project cap | Before Sprint 15 |
| CRDT library for collaboration | Yjs / Automerge | Before Sprint 20 |
| WordPress auth method | Application Passwords / OAuth | Before Sprint 21 |
| Subscription tiers and pricing | Free/Writer/Ministry/Team | Before Sprint 12 (content repurposing gating) |

---

## Already Built: Author Voice / Style Training

The Stylist agent (`lib/agents/stylist.ts`) and Style Training system were built in Phases 2-3. This system already:

- Analyzes tone, narrative voice, sentence structure, pacing, emotional intensity, vocabulary, and writing patterns
- Stores per-user and per-project style profiles (`ltu_style_profiles` table)
- Injects author style into all AI prompts via `formatStyleForPrompt`
- Supports manual training, multi-sample aggregation, and profile refresh from new writing
- Has a settings UI for managing style profiles (`components/settings/StyleTraining.tsx`)

A future enhancement (passive auto-learning as the user writes) can be added incrementally without a dedicated sprint.

---

## Current Status

> Phases 1-3 built. Premium UI redesign applied. Competitive analysis complete. Phase 4 PRDs ready. Build order revised per product architect review: Project Bible now comes before Content Repurposing to establish deep AI context first. Sprint 11 (Project Bible) complete. Sprint 12 (Content Repurposing) complete. Next: Sprint 13 (Bible Translations).
