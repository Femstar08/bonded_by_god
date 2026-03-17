'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Project, Chapter, ChapterMemory, Section, SectionStatus } from '@/types/database'
import { buildProjectContext } from '@/lib/ai/context'
import { formatSectionMapForPrompt } from '@/lib/writingMap/writingMapEngine'
import { countWords } from '@/lib/utils/text'
import type { MemoryContext } from '@/lib/memory/inject'
import { WritingEditor } from './WritingEditor'
import { InsightPanel } from './InsightPanel'
import { InsightMarkers } from './InsightMarkers'
import { ProjectBiblePanel } from './ProjectBiblePanel'
import { TranslationComparisonPanel } from './TranslationComparisonPanel'
import { ExportModal } from './ExportModal'
import { RepurposeModal } from './RepurposeModal'
import { PrayerPromptModal } from './PrayerPromptModal'
import { WritingJourney } from './WritingJourney'
import { WritingTeamDrawer } from './WritingTeamDrawer'
import type { WritingTeamAction } from './WritingTeamDrawer'
import { VisualPlanner } from '@/components/planner/VisualPlanner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cleanExpiredCache } from '@/lib/hooks/useVerseCache'

interface EditorClientProps {
  project: Project
  initialChapters: Chapter[]
  showPrayerPrompt: boolean
  initialChapterMemories?: ChapterMemory[]
  initialSections?: Record<string, Section[]>
}

export function EditorClient({ project, initialChapters, showPrayerPrompt, initialChapterMemories = [], initialSections = {} }: EditorClientProps) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [activeChapterId, setActiveChapterId] = useState<string>(
    initialChapters[0]?.id || ''
  )
  const [editorContent, setEditorContent] = useState(initialChapters[0]?.content || '')
  const [editorKey, setEditorKey] = useState(0)
  const [wordCount, setWordCount] = useState(() => countWords(initialChapters[0]?.content))
  const [teamOpen, setTeamOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [repurposeOpen, setRepurposeOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [memoryContext, setMemoryContext] = useState<MemoryContext | null>(null)
  const [chapterMemories, setChapterMemories] = useState<ChapterMemory[]>(initialChapterMemories)
  const [sectionsByChapter, setSectionsByChapter] = useState<Record<string, Section[]>>(initialSections)
  const [activeSectionTitle, setActiveSectionTitle] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [rightTab, setRightTab] = useState<'insights' | 'bible'>('insights')
  const [lookupVerseRef, setLookupVerseRef] = useState<string | null>(null)
  const [plannerOpen, setPlannerOpen] = useState(false)

  // Clean expired verse cache on mount
  useEffect(() => {
    cleanExpiredCache()
  }, [])

  const activeChapter = chapters.find((c) => c.id === activeChapterId)

  // Total word count across all chapters (for Project Bible auto-extract threshold)
  const totalChapterWords = useMemo(() => {
    return chapters.reduce((sum, ch) => {
      const text = (ch.content || '').replace(/<[^>]*>/g, '')
      return sum + text.split(/\s+/).filter(Boolean).length
    }, 0)
  }, [chapters])

  const lastMemoryWordCount = chapterMemories.find(
    (m) => m.chapter_id === activeChapterId
  )?.word_count_at_generation ?? 0

  const fetchMemoryContext = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/memory/context?projectId=${project.id}&activeChapterId=${activeChapterId}`
      )
      if (res.ok) {
        const data = await res.json()
        setMemoryContext(data)
      }
    } catch {
      // Non-critical
    }
  }, [project.id, activeChapterId])

  useEffect(() => {
    fetchMemoryContext()
  }, [fetchMemoryContext])

  // Focus Mode keyboard shortcut: Cmd/Ctrl+Shift+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setFocusMode((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleMemoryTrigger = useCallback((chapterId: string, projectId: string) => {
    fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, projectId }),
    }).then(() => {
      fetchMemoryContext()
    }).catch(() => {})
  }, [fetchMemoryContext])

  // Auto-refresh style profile after 2000+ new words
  const styleRefreshTriggered = useRef(false)
  const lastStyleWordCount = useRef(0)
  const handleStyleRefresh = useCallback(() => {
    if (styleRefreshTriggered.current) return
    const currentWc = countWords(editorContent)
    if (currentWc - lastStyleWordCount.current >= 2000) {
      lastStyleWordCount.current = currentWc
      styleRefreshTriggered.current = true
      fetch('/api/style/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, newWriting: editorContent }),
      }).then(() => {
        fetchMemoryContext()
      }).catch(() => {}).finally(() => {
        styleRefreshTriggered.current = false
      })
    }
  }, [editorContent, project.id, fetchMemoryContext])

  const activeSections = sectionsByChapter[activeChapterId] ?? []

  const sectionMapString = activeSections.length > 0 && activeChapter
    ? formatSectionMapForPrompt(activeChapter.title, activeSections)
    : undefined

  const baseContext = useMemo(() => {
    if (!activeChapter) return null
    return buildProjectContext(project, {
      chapter: activeChapter,
      sectionTitle: activeSectionTitle ?? undefined,
      sectionMap: sectionMapString,
      ...memoryContext,
    })
  }, [project, activeChapter, activeSectionTitle, sectionMapString, memoryContext])

  const handleSectionsGenerated = (chapterId: string, sections: Section[]) => {
    setSectionsByChapter((prev) => ({
      ...prev,
      [chapterId]: sections,
    }))
  }

  const handleSectionStatusChange = (sectionId: string, status: SectionStatus) => {
    setSectionsByChapter((prev) => {
      const chapterSections = prev[activeChapterId] ?? []
      return {
        ...prev,
        [activeChapterId]: chapterSections.map((s) =>
          s.id === sectionId ? { ...s, status } : s
        ),
      }
    })
  }

  const handleSectionSelect = (section: Section) => {
    setActiveSectionTitle(section.title)
  }

  const handleChapterSelect = (chapterId: string) => {
    setActiveSectionTitle(null)
    const leavingChapter = chapters.find((c) => c.id === activeChapterId)
    if (leavingChapter?.content) {
      const currentWc = countWords(leavingChapter.content)
      if (currentWc - lastMemoryWordCount >= 150) {
        handleMemoryTrigger(activeChapterId, project.id)
      }
    }

    setActiveChapterId(chapterId)
    const ch = chapters.find((c) => c.id === chapterId)
    if (ch) {
      setWordCount(countWords(ch.content))
      setEditorContent(ch.content || '')
    }
  }

  const handleContentChange = (content: string) => {
    setWordCount(countWords(content))
    setEditorContent(content)
    handleStyleRefresh()
    setChapters((prev) =>
      prev.map((c) => (c.id === activeChapterId ? { ...c, content } : c))
    )
  }

  const handleChapterAdded = (chapter: Chapter) => {
    setChapters((prev) => [...prev, chapter])
  }

  const handleChapterRenamed = (chapterId: string, newTitle: string) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, title: newTitle } : c))
    )
  }

  const handleChapterDeleted = (chapterId: string) => {
    setChapters((prev) => {
      const remaining = prev.filter((c) => c.id !== chapterId)
      // If the deleted chapter was active, switch to the first remaining one
      if (chapterId === activeChapterId) {
        const next = remaining[0]
        if (next) {
          setActiveChapterId(next.id)
          setEditorContent(next.content || '')
          setWordCount(countWords(next.content))
        } else {
          setActiveChapterId('')
          setEditorContent('')
          setWordCount(0)
        }
      }
      return remaining
    })
    // Also clean up any sections belonging to the deleted chapter
    setSectionsByChapter((prev) => {
      const next = { ...prev }
      delete next[chapterId]
      return next
    })
  }

  const handleSectionAdded = (chapterId: string, section: Section) => {
    setSectionsByChapter((prev) => ({
      ...prev,
      [chapterId]: [...(prev[chapterId] ?? []), section],
    }))
  }

  const handleSectionDeleted = (chapterId: string, sectionId: string) => {
    setSectionsByChapter((prev) => ({
      ...prev,
      [chapterId]: (prev[chapterId] ?? []).filter((s) => s.id !== sectionId),
    }))
  }

  const handleSectionRenamed = (sectionId: string, newTitle: string) => {
    setSectionsByChapter((prev) => {
      const updated: Record<string, Section[]> = {}
      for (const [chId, sections] of Object.entries(prev)) {
        updated[chId] = sections.map((s) =>
          s.id === sectionId ? { ...s, title: newTitle } : s
        )
      }
      return updated
    })
  }

  const handleApplyAiResult = (result: string) => {
    setEditorContent(result)
    setChapters((prev) =>
      prev.map((c) => (c.id === activeChapterId ? { ...c, content: result } : c))
    )
    setWordCount(countWords(result))
    setEditorKey((k) => k + 1)
  }

  // Floating toolbar AI action handler — triggers orchestrator with selected text
  const handleAiAction = useCallback(async (action: string, selectedText: string) => {
    if (!baseContext || !selectedText.trim()) return

    // Map floating toolbar action names to orchestrator actions
    const actionMap: Record<string, string> = {
      'expand': 'expand',
      'deepen': 'deepen',
      'scripture': 'find_scripture',
      'rewrite': 'revise',
    }

    const agentAction = actionMap[action]
    if (!agentAction) return

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: agentAction,
          userText: selectedText,
          context: baseContext,
        }),
      })
      const data = await res.json()
      if (data.result && typeof data.result === 'string') {
        handleApplyAiResult(data.result)
      }
    } catch {
      // Non-critical
    }
  }, [baseContext, handleApplyAiResult])

  // Writing Team agent handler — triggers orchestrator and applies result
  const handleTeamAgent = (action: WritingTeamAction) => {
    if (!baseContext || !editorContent.trim()) return
    setTeamOpen(false)
    fetch('/api/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        userText: editorContent,
        context: baseContext,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Text results from Scribe/Refiner — apply directly
        if (data.result && typeof data.result === 'string') {
          handleApplyAiResult(data.result)
        }
      })
      .catch(() => {})
  }

  if (!activeChapter || !baseContext) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No chapters found for this project.</p>
      </div>
    )
  }

  return (
    <div className={`flex h-[calc(100vh-10rem)] ${focusMode ? 'focus-mode-active' : ''}`}>
      {/* ── Left Sidebar: Writing Journey ── */}
      <div
        className={`shrink-0 border-r border-border/30 bg-muted/10 transition-all duration-200 overflow-hidden ${
          focusMode ? 'w-0' : sidebarOpen ? 'w-56' : 'w-0'
        }`}
      >
        {sidebarOpen && (
          <WritingJourney
            chapters={chapters}
            activeChapterId={activeChapterId}
            sectionsByChapter={sectionsByChapter}
            projectId={project.id}
            projectTitle={project.title}
            onSelectChapter={handleChapterSelect}
            onChapterAdded={handleChapterAdded}
            onChapterRenamed={handleChapterRenamed}
            onChapterDeleted={handleChapterDeleted}
            onSectionSelect={handleSectionSelect}
            onSectionsGenerated={handleSectionsGenerated}
            onSectionStatusChange={handleSectionStatusChange}
            onSectionAdded={handleSectionAdded}
            onSectionDeleted={handleSectionDeleted}
            onSectionRenamed={handleSectionRenamed}
          />
        )}
      </div>

      {/* ── Center: Writing Studio ── */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${focusMode ? 'px-10 lg:px-24 xl:px-40' : ''}`}>
        {/* Chapter info bar — subtle strip */}
        {!focusMode && (
          <div className="flex items-center justify-between bg-[#1a2744] text-white px-5 py-1.5">
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label={sidebarOpen ? 'Hide chapters' : 'Show chapters'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setPlannerOpen(true)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Visual Planner"
                title="Visual Planner"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm9-9A2.25 2.25 0 0 0 11 4.25v2.5A2.25 2.25 0 0 0 13.25 9h2.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Export Project shortcut — opens export modal pre-scoped to project */}
              <button
                onClick={() => setExportOpen(true)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Export project"
                title="Export Project"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
              </button>
              <span className="text-amber-300 font-medium">{activeChapter.title}</span>
            </div>
            <div className="flex items-center gap-3">
              {memoryContext?.authorStyleProfile && (
                <span className="text-[10px] text-amber-400/50 border border-amber-400/20 rounded px-1.5 py-0.5" title={memoryContext.authorStyleProfile.styleSummary}>
                  Style active
                </span>
              )}
              <span className="text-[11px] text-white/40">
                {activeChapter.word_goal
                  ? `${wordCount.toLocaleString()} / ${activeChapter.word_goal.toLocaleString()} words`
                  : `${wordCount.toLocaleString()} words`
                }
              </span>
            </div>
          </div>
        )}

        {/* Header with actions — minimal */}
        <div className={`${focusMode ? 'pt-2' : 'px-8 lg:px-12 pt-5'}`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h1 className="text-2xl font-bold font-serif">
              {activeChapter.title}
            </h1>

            {/* 3 action buttons only */}
            <div className="flex items-center gap-1.5 shrink-0">
              {!focusMode && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTeamOpen((prev) => !prev)}
                    aria-pressed={teamOpen}
                    className={`gap-1.5 text-muted-foreground hover:text-foreground ${
                      teamOpen ? 'bg-amber-50 text-amber-800' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
                    </svg>
                    Writing Team
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRepurposeOpen(true)}
                    disabled={wordCount < 100}
                    title={wordCount < 100 ? 'Add at least 100 words before repurposing' : 'Repurpose this chapter'}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm-1.624-8.848a.75.75 0 0 0-1.5 0v2.033l-.312-.312A7 7 0 0 0 .164 7.436a.75.75 0 0 0 1.45.388 5.5 5.5 0 0 1 9.2-2.467l.313.312H8.694a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .75-.75V2.784Z" clipRule="evenodd" />
                    </svg>
                    Repurpose
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExportOpen(true)}
                    aria-label="Export chapter"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                    </svg>
                    Export
                  </Button>
                </>
              )}

              <Button
                type="button"
                variant={focusMode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFocusMode((prev) => !prev)}
                aria-pressed={focusMode}
                aria-label="Toggle Focus Mode (Ctrl+Shift+F)"
                title="Focus Mode (Ctrl+Shift+F)"
                className={focusMode
                  ? 'gap-1.5 bg-primary text-primary-foreground'
                  : 'gap-1.5 text-muted-foreground hover:text-foreground'
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                  <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                </svg>
                {focusMode ? 'Exit Focus' : 'Focus'}
              </Button>
            </div>
          </div>

          {activeSectionTitle && (
            <p className="text-sm text-amber-700 -mt-1 mb-2">
              {activeSectionTitle}
            </p>
          )}
        </div>

        {/* Editor */}
        <div className={focusMode ? '' : 'px-8 lg:px-12'}>
        <WritingEditor
          key={`${activeChapter.id}-${editorKey}`}
          chapterId={activeChapter.id}
          projectId={project.id}
          initialContent={editorContent}
          onContentChange={handleContentChange}
          lastMemoryWordCount={lastMemoryWordCount}
          onMemoryTrigger={handleMemoryTrigger}
          onAiAction={handleAiAction}
          onLookupVerse={(ref) => setLookupVerseRef(ref)}
          paragraphFocus={focusMode}
        />

        {/* Bottom spacing */}
        <div className="pb-8" />
        </div>
      </div>

      {/* ── Right Panel: Tabbed sidebar ── */}
      <div className={`w-72 shrink-0 border-l border-border/30 hidden xl:flex xl:flex-col ${focusMode ? '!hidden' : ''}`}>
        {/* Tab bar */}
        <div className="flex border-b border-border/30 bg-muted/10 shrink-0">
          <button
            type="button"
            onClick={() => setRightTab('insights')}
            className={`flex-1 py-2 text-[11px] font-semibold tracking-wide transition-colors ${
              rightTab === 'insights'
                ? 'text-amber-700 border-b-2 border-amber-500 bg-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Insights
          </button>
          <button
            type="button"
            onClick={() => setRightTab('bible')}
            className={`flex-1 py-2 text-[11px] font-semibold tracking-wide transition-colors ${
              rightTab === 'bible'
                ? 'text-amber-700 border-b-2 border-amber-500 bg-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Project Bible
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {rightTab === 'insights' && (
            <>
              {/* Insight Markers — pattern detection pills */}
              <InsightMarkers
                editorContent={editorContent}
                onAction={(action, text) => {
                  if (!baseContext || !text.trim()) return
                  fetch('/api/orchestrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action,
                      userText: text,
                      context: baseContext,
                    }),
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.result && typeof data.result === 'string') {
                        handleApplyAiResult(data.result)
                      }
                    })
                    .catch(() => {})
                }}
              />

              {/* Insight Panel — Suggestions + Tools + Scripture */}
              <InsightPanel
                editorContent={editorContent}
                projectContext={baseContext}
                onApplyResult={handleApplyAiResult}
              />
            </>
          )}

          {rightTab === 'bible' && (
            <ProjectBiblePanel
              projectId={project.id}
              totalChapterWords={totalChapterWords}
            />
          )}
        </div>
      </div>

      {/* Writing Team Drawer — overlay */}
      <WritingTeamDrawer
        isOpen={teamOpen}
        onClose={() => setTeamOpen(false)}
        onSelectAgent={handleTeamAgent}
        disabled={!editorContent.trim()}
      />

      {/* Prayer Prompt Modal */}
      <PrayerPromptModal
        projectId={project.id}
        role={project.role}
        title={project.title}
        scriptureFocus={project.scripture_focus}
        showPrayerPrompt={showPrayerPrompt}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        projectId={project.id}
        projectTitle={project.title}
        chapterId={activeChapter.id}
        chapterTitle={activeChapter.title}
        chapterContent={editorContent}
        chapterParentId={activeChapter.parent_id}
        projectType={project.type}
      />

      {/* Repurpose Modal */}
      <RepurposeModal
        isOpen={repurposeOpen}
        onClose={() => setRepurposeOpen(false)}
        sourceContent={editorContent}
        sourceTitle={activeChapter.title}
        projectContext={baseContext}
        projectId={project.id}
        projectTitle={project.title}
      />

      {/* Translation Comparison Dialog */}
      <Dialog open={!!lookupVerseRef} onOpenChange={(open) => !open && setLookupVerseRef(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-amber-900">
              Compare Translations
            </DialogTitle>
          </DialogHeader>
          {lookupVerseRef && (
            <TranslationComparisonPanel
              reference={lookupVerseRef}
              onInsert={(text, translation) => {
                const block = `<blockquote data-type="scripture" data-reference="${lookupVerseRef}" data-translation="${translation}" class="scripture-block"><p>${text}</p><p class="scripture-ref">— ${lookupVerseRef} (${translation})</p></blockquote>`
                handleApplyAiResult(editorContent + block)
                setLookupVerseRef(null)
              }}
              onClose={() => setLookupVerseRef(null)}
              layout="stacked"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Visual Planner Overlay */}
      {plannerOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <VisualPlanner
            projectId={project.id}
            projectTitle={project.title}
            projectType={project.type}
            hierarchyLabels={project.hierarchy_labels}
            onNavigateToChapter={(chapterId) => {
              setPlannerOpen(false)
              handleChapterSelect(chapterId)
            }}
            onClose={() => setPlannerOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
