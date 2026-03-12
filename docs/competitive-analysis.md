# Scriptloom - Competitive Analysis & Feature Roadmap

## Date: March 2026

## Executive Summary

Scriptloom occupies a unique position as the only role-based, AI-powered writing studio built specifically for Christian ministry. While competitors exist in adjacent spaces (sermon tools, general AI writing, book authoring software), none combine role-based toolkits, a team of specialized AI agents, style training, and spiritual integration into a single platform.

This analysis identifies 12 feature gaps ranked by priority, each with a corresponding PRD for implementation.

---

## Competitive Landscape

### Sermon/Ministry Tools

| Product | Price | Key Strengths | Key Weakness |
|---------|-------|---------------|--------------|
| Logos Bible Software | $12.50-17/mo | Sermon Builder, AI assistant, 500+ book library, Greek/Hebrew tools | Heavy, academic-focused, not a writing studio |
| SermonAI | $15/mo | Sermon-to-multi-format repurposing, 12+ templates, Preaching Mode with timer | Sermon-only, no book writing, no notes vault |
| Sermonly | ~$10/mo | Snippet library, sermon archive, multi-platform | No AI agents, limited writing tools |
| ChurchSocial.ai | Varies | Sermon-to-social content pipeline, graphic templates | Social-only, not a writing environment |

### AI Writing Assistants

| Product | Price | Key Strengths | Key Weakness |
|---------|-------|---------------|--------------|
| Jasper | $39-99/mo | Brand Voice training, 50+ templates, 29 languages | Marketing-focused, no faith context |
| Sudowrite | $10-22/mo | Story Bible, proprietary creative LLM, scene-by-scene drafting | Fiction-only, no ministry tools |
| Type.ai | Varies | AI integrated into word processor, style personalization | General-purpose, no specialization |

### Book Writing Software

| Product | Price | Key Strengths | Key Weakness |
|---------|-------|---------------|--------------|
| Scrivener | $60 one-time | Cork board, binder, deep organizational tools | No AI, no cloud sync, dated UI |
| Atticus | $147 one-time | Writing + professional book formatting/typesetting | No AI, no ministry features |
| Dabble | $9-29/mo | Plot Grid, goal tracking with day-off scheduling | No AI agents, no faith context |
| Ulysses | $50/yr | Best distraction-free experience, direct publishing | Apple-only, no AI, no collaboration |

### Faith AI Companions

| Product | Price | Key Strengths | Key Weakness |
|---------|-------|---------------|--------------|
| bible.ai | Varies | Voice-first, theological voices (Spurgeon, Lewis), multi-translation | Study tool, not a writing platform |
| FaithGPT | Varies | Prayer journal AI, image/video studio | Companion, not a productivity tool |

---

## Scriptloom's Current Advantages

1. **Role-based toolkits** - No competitor customizes AI + UI per user type (author/preacher/devotionalist/etc.)
2. **7 specialized AI agents** - More depth than any competitor's single AI assistant
3. **Style Training** for ministry writing - Only product doing voice training in the faith space
4. **Spiritual integration** - Prayer prompts + Daily Scripture woven into the workflow
5. **Notes Vault** - Faith-contextualized research storage with tagging

---

## Feature Gaps - Prioritized Roadmap

### Phase 4 - Growth Features

| Priority | Feature | PRD | Competitor Reference | Impact |
|----------|---------|-----|---------------------|--------|
| P1 | Content Repurposing Engine | `prd-11-content-repurposing.md` | SermonAI, ChurchSocial.ai | Turns 1 piece of writing into 5+ formats (social, discussion guide, devotional, email, youth version) |
| P2 | Project Bible | `prd-12-project-bible.md` | Sudowrite (Story Bible), Dabble | Structured context (themes, theology, figures, Scripture refs) that all AI agents reference |
| P3 | Bible Translation Comparison | `prd-13-bible-translations.md` | Logos, SermonAI | Side-by-side NIV/ESV/KJV/NASB comparison inline in editor |
| P4 | Visual Chapter Planner | `prd-14-visual-planner.md` | Scrivener (Cork Board), Dabble (Plot Grid) | Drag-and-drop board view of chapters/sections with visual structure |
| P5 | Presentation Mode | `prd-15-presentation-mode.md` | SermonAI | Timer, teleprompter view, voice recorder for preachers |
| P6 | Voice Dictation | `prd-16-voice-dictation.md` | bible.ai | Speak-to-write with AI punctuation and formatting |

### Phase 5 - Platform Expansion

| Priority | Feature | PRD | Competitor Reference | Impact |
|----------|---------|-----|---------------------|--------|
| P7 | Advanced Goal Tracking | `prd-17-goal-tracking.md` | Dabble, Scrivener | Streak calendar, daily targets, day-off scheduling, visual progress |
| P8 | Social Media Generator | `prd-18-social-generator.md` | ChurchSocial.ai | Auto-generate branded social posts from written content |
| P9 | Book Formatting & Typesetting | `prd-19-book-formatting.md` | Atticus | Professional print-ready PDF and ebook formatting |
| P10 | Collaborative Editing | `prd-20-collaboration.md` | Google Docs, Jasper Teams | Real-time co-editing for ministry teams |
| P11 | Publishing Pipeline | `prd-21-publishing.md` | Ulysses, Atticus | Direct publish to WordPress, Medium, ebook stores |
| P12 | Sermon Calendar & Archive | `prd-22-sermon-calendar.md` | Logos, Sermonly | Calendar view for planning sermon series, searchable archive |

---

## Pricing Recommendation

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 1 project, basic editor, daily scripture |
| Writer | $12/mo | Unlimited projects, AI agents, notes vault, export |
| Ministry | $20/mo | Everything + content repurposing, presentation mode, collaboration |
| Team | $15/user/mo | Ministry + team features, shared projects, admin controls |

---

## Build Order Rationale

1. **Content Repurposing (P1)** - Highest ROI. Leverages existing AI agents. Directly competes with SermonAI's key selling point. Every pastor who writes a sermon wants social posts, discussion guides, and devotionals from it.

2. **Project Bible (P2)** - Deepest moat. Makes all 7 AI agents dramatically better by giving them structured context. No competitor in the faith space has this.

3. **Bible Translation Comparison (P3)** - Easiest win. Users already get Scripture suggestions. Adding translation toggle is high-value, low-effort.

4. **Visual Chapter Planner (P4)** - Unlocks the book-writing audience. Scrivener's cork board is beloved but Scrivener has no AI. This combines the best of both worlds.

5. **Presentation Mode (P5)** - Captures the preacher workflow end-to-end: write, rehearse, deliver. Keeps users in-app.

6. **Voice Dictation (P6)** - Natural fit for preachers who compose by speaking. Differentiating feature that no sermon tool currently offers well.

Items 7-12 are platform expansion that builds on the foundation of 1-6.
