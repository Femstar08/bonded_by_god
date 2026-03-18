'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Project, Chapter, ChapterMemory, Section, SectionStatus } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { buildProjectContext } from '@/lib/ai/context'
import { formatSectionMapForPrompt } from '@/lib/writingMap/writingMapEngine'
import { countWords } from '@/lib/utils/text'
import {
  assembleSectionedContent, decomposeSectionedContent,
  countWordsPerSection,
} from '@/lib/editor/sectionContent'
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
import { CitationManagerPanel } from '@/components/citations/CitationManagerPanel'
import type { Citation } from '@/components/citations/CitationManagerPanel'
import type { CitationStyleType } from '@/components/citations/CitationStyleSelector'
import { Button } from '@/components/ui/button'
import type { TiptapEditorRef } from './tiptap/TiptapEditor'
import type { EditorFont } from './tiptap/fonts'
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
  const [editorContent, setEditorContent] = useState(() => {
    const firstChapter = initialChapters[0]
    if (!firstChapter) return ''
    const sections = initialSections[firstChapter.id] ?? []
    return assembleSectionedContent(firstChapter.content ?? '', sections)
  })
  const [editorKey, setEditorKey] = useState(0)
  const [wordCount, setWordCount] = useState(() => {
    const firstChapter = initialChapters[0]
    if (!firstChapter) return 0
    const sections = initialSections[firstChapter.id] ?? []
    const assembled = assembleSectionedContent(firstChapter.content ?? '', sections)
    return countWordsPerSection(assembled).total
  })
  const [teamOpen, setTeamOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [repurposeOpen, setRepurposeOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [memoryContext, setMemoryContext] = useState<MemoryContext | null>(null)
  const [chapterMemories, setChapterMemories] = useState<ChapterMemory[]>(initialChapterMemories)
  const [sectionsByChapter, setSectionsByChapter] = useState<Record<string, Section[]>>(initialSections)
  const [activeSectionTitle, setActiveSectionTitle] = useState<string | null>(null)
  const [sectionWordCounts, setSectionWordCounts] = useState<Record<string, number>>(() => {
    const firstChapter = initialChapters[0]
    if (!firstChapter) return {}
    const sections = initialSections[firstChapter.id] ?? []
    const assembled = assembleSectionedContent(firstChapter.content ?? '', sections)
    return countWordsPerSection(assembled).sections
  })
  const [focusMode, setFocusMode] = useState(false)
  const [rightTab, setRightTab] = useState<'insights' | 'bible' | 'references'>('insights')
  const [citationStyle] = useState<CitationStyleType>('chicago')
  const [lookupVerseRef, setLookupVerseRef] = useState<string | null>(null)
  const [plannerOpen, setPlannerOpen] = useState(false)
  const [editorFont, setEditorFont] = useState<EditorFont>(
    (project.editor_font as EditorFont) || 'dm-serif'
  )
  const tiptapRef = useRef<TiptapEditorRef>(null)

  // Resizable panel widths (in px)
  const [leftWidth, setLeftWidth] = useState(224)   // w-56 default
  const [rightWidth, setRightWidth] = useState(256)  // w-64 default
  const dragRef = useRef<{ side: 'left' | 'right'; startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      e.preventDefault()
      const { side, startX, startWidth } = dragRef.current
      const delta = e.clientX - startX
      if (side === 'left') {
        setLeftWidth(Math.max(160, Math.min(400, startWidth + delta)))
      } else {
        setRightWidth(Math.max(200, Math.min(420, startWidth - delta)))
      }
    }
    const handleMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const startDrag = (side: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = {
      side,
      startX: e.clientX,
      startWidth: side === 'left' ? leftWidth : rightWidth,
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

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

  const handleFontChange = useCallback((font: EditorFont) => {
    setEditorFont(font)
    const supabase = createClient()
    supabase
      .from('ltu_projects')
      .update({ editor_font: font })
      .eq('id', project.id)
      .then(() => {})
  }, [project.id])

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

    if (chapterId === activeChapterId) {
      // Reconstruct the HTML safely merging any text the user typed in existing nodes
      setEditorContent((prev) => {
        const { intro, sections: existingParsed } = decomposeSectionedContent(prev)
        const mergedSections = sections.map((s) => ({
          ...s,
          content: existingParsed.find((ep: { id: string; content: string }) => ep.id === s.id)?.content || ''
        }))
        // Note: assembleSectionedContent comes from /lib/editor/sectionContent.ts
        const assembled = assembleSectionedContent(intro, mergedSections)
        if (assembled !== prev) {
          // Remount with new structure
          setTimeout(() => handleApplyAiResult(assembled), 0)
        }
        return prev
      })
    }
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

  const handleScrollToSection = (sectionId: string) => {
    const el = document.querySelector(`[data-section-id="${sectionId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('section-divider-highlight')
      setTimeout(() => el.classList.remove('section-divider-highlight'), 1500)
    }
  }

  const handleSectionSelect = (section: Section) => {
    setActiveSectionTitle(section.title)
    handleScrollToSection(section.id)
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
      const sections = sectionsByChapter[chapterId] ?? []
      const assembled = assembleSectionedContent(ch.content ?? '', sections)
      const counts = countWordsPerSection(assembled)
      setWordCount(counts.total)
      setSectionWordCounts(counts.sections)
      setEditorContent(assembled)
    }
  }

  const handleContentChange = (html: string) => {
    const counts = countWordsPerSection(html)
    setWordCount(counts.total)
    setSectionWordCounts(counts.sections)
    setEditorContent(html)
    handleStyleRefresh()
    setChapters((prev) =>
      prev.map((c) => (c.id === activeChapterId ? { ...c, content: html } : c))
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
          const nextSections = sectionsByChapter[next.id] ?? []
          const assembled = assembleSectionedContent(next.content ?? '', nextSections)
          const counts = countWordsPerSection(assembled)
          setEditorContent(assembled)
          setWordCount(counts.total)
          setSectionWordCounts(counts.sections)
        } else {
          setActiveChapterId('')
          setEditorContent('')
          setWordCount(0)
          setSectionWordCounts({})
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
    // If the added section belongs to the active chapter, append its divider
    // directly without a full remount.
    if (chapterId === activeChapterId) {
      const escapedTitle = section.title.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      tiptapRef.current?.insertSection(section.id, escapedTitle)
      // Scroll to the newly inserted divider after a short layout tick
      setTimeout(() => handleScrollToSection(section.id), 150)
    }
  }

  const handleSectionDeleted = (chapterId: string, sectionId: string) => {
    setSectionsByChapter((prev) => ({
      ...prev,
      [chapterId]: (prev[chapterId] ?? []).filter((s) => s.id !== sectionId),
    }))
  }

  const handleSectionIdUpdated = (chapterId: string, oldId: string, newSection: Section) => {
    setSectionsByChapter((prev) => ({
      ...prev,
      [chapterId]: (prev[chapterId] ?? []).map(s => s.id === oldId ? newSection : s)
    }))
    if (chapterId === activeChapterId) {
      tiptapRef.current?.updateSectionId(oldId, newSection.id)
    }
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

    // Update the section divider HTML to reflect the new title without destroying the whole document
    const escapedTitle = newTitle.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    setEditorContent((prev) => {
      const regex = new RegExp(`(<div[^>]+data-section-id="${sectionId}"[^>]*data-section-title=")[^"]*("[^>]*>)`, 'g')
      const newContent = prev.replace(regex, `$1${escapedTitle}$2`)
      if (newContent !== prev) {
        setChapters((chaps) =>
          chaps.map((c) => (c.id === activeChapterId ? { ...c, content: newContent } : c))
        )
      }
      return newContent
    })

    // Imperatively update the TipTap divider node to ensure sync
    tiptapRef.current?.updateSectionTitle(sectionId, newTitle)
  }

  const handleApplyAiResult = (result: string) => {
    setEditorContent(result)
    setChapters((prev) =>
      prev.map((c) => (c.id === activeChapterId ? { ...c, content: result } : c))
    )
    setWordCount(countWords(result))
    setEditorKey((k) => k + 1)
  }

  // Insert AI result after a specific paragraph in the content (non-destructive)
  const handleInsertAfterParagraph = useCallback((paragraph: string, insertion: string) => {
    if (!insertion || !paragraph) return
    // Find the paragraph in the HTML content and insert after it
    const escapedPara = paragraph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const paraRegex = new RegExp(`(<p>[^<]*${escapedPara.slice(0, 40)}[^<]*</p>)`, 'i')
    const match = editorContent.match(paraRegex)
    let newContent: string
    if (match && match.index !== undefined) {
      const insertPos = match.index + match[0].length
      newContent = editorContent.slice(0, insertPos) + `<p>${insertion}</p>` + editorContent.slice(insertPos)
    } else {
      // Fallback: append to end
      newContent = editorContent + `<p>${insertion}</p>`
    }
    handleApplyAiResult(newContent)
  }, [editorContent, handleApplyAiResult])

  // Replace only a specific text selection within the content (non-destructive)
  const handleReplaceSelection = useCallback((selectedText: string, replacement: string) => {
    if (!replacement || !selectedText) return
    const newContent = editorContent.replace(selectedText, replacement)
    if (newContent !== editorContent) {
      handleApplyAiResult(newContent)
    }
  }, [editorContent, handleApplyAiResult])

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
        // Replace only the selected text, not the entire content
        handleReplaceSelection(selectedText, data.result)
      }
    } catch {
      // Non-critical
    }
  }, [baseContext, handleReplaceSelection])

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
        className={`shrink-0 bg-muted/10 overflow-hidden ${
          focusMode || !sidebarOpen ? 'w-0' : ''
        }`}
        style={!focusMode && sidebarOpen ? { width: leftWidth } : undefined}
      >
        {sidebarOpen && (
          <WritingJourney
            chapters={chapters}
            activeChapterId={activeChapterId}
            sectionsByChapter={sectionsByChapter}
            sectionWordCounts={sectionWordCounts}
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
            onSectionIdUpdated={handleSectionIdUpdated}
            onSectionDeleted={handleSectionDeleted}
            onSectionRenamed={handleSectionRenamed}
          />
        )}
      </div>

      {/* Left resize handle */}
      {!focusMode && sidebarOpen && (
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-amber-400/40 active:bg-amber-400/60 transition-colors group relative"
          onMouseDown={(e) => startDrag('left', e)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      {/* ── Center: Writing Studio ── */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${focusMode ? 'px-10 lg:px-24 xl:px-40' : ''}`}>
        {/* Chapter header bar — unified strip with title, tools & word count */}
        {!focusMode && (
          <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/20 px-5 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                aria-label={sidebarOpen ? 'Hide chapters' : 'Show chapters'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setPlannerOpen(true)}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Visual Planner"
                title="Visual Planner"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm9-9A2.25 2.25 0 0 0 11 4.25v2.5A2.25 2.25 0 0 0 13.25 9h2.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z" clipRule="evenodd" />
                </svg>
              </button>

              <span className="mx-1 h-4 w-px bg-border/40" aria-hidden="true" />

              <h1 className="text-base font-semibold font-serif truncate max-w-[280px]">
                {activeChapter.title}
              </h1>
              {activeSectionTitle && (
                <span className="text-xs text-amber-600 truncate max-w-[180px]">
                  / {activeSectionTitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTeamOpen((prev) => !prev)}
                aria-pressed={teamOpen}
                className={`gap-1 text-xs text-muted-foreground hover:text-foreground ${
                  teamOpen ? 'bg-amber-50 text-amber-800' : ''
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                  <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
                </svg>
                Team
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRepurposeOpen(true)}
                disabled={wordCount < 100}
                title={wordCount < 100 ? 'Add at least 100 words before repurposing' : 'Repurpose this chapter'}
                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
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
                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
                Export
              </Button>

              <Button
                type="button"
                variant={focusMode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFocusMode((prev) => !prev)}
                aria-pressed={focusMode}
                aria-label="Toggle Focus Mode (Ctrl+Shift+F)"
                title="Focus Mode (Ctrl+Shift+F)"
                className={focusMode
                  ? 'gap-1 text-xs bg-primary text-primary-foreground'
                  : 'gap-1 text-xs text-muted-foreground hover:text-foreground'
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                  <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                </svg>
                Focus
              </Button>

              <span className="mx-1 h-4 w-px bg-border/40" aria-hidden="true" />

              <span className="text-[11px] text-muted-foreground/60 tabular-nums whitespace-nowrap">
                {activeChapter.word_goal
                  ? `${wordCount.toLocaleString()} / ${activeChapter.word_goal.toLocaleString()}`
                  : wordCount.toLocaleString()
                } words
              </span>
              {memoryContext?.authorStyleProfile && (
                <span className="text-[9px] text-amber-500/50 border border-amber-400/20 rounded px-1 py-0.5 ml-1" title={memoryContext.authorStyleProfile.styleSummary}>
                  Style
                </span>
              )}
            </div>
          </div>
        )}

        {/* Editor — paper sheet container */}
        <div className={`flex-1 flex flex-col ${focusMode ? '' : 'px-4 py-8 items-center'}`}>
          <div className={`w-full flex flex-col ${focusMode ? 'h-full' : 'max-w-4xl bg-[#FDFCF7] text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-t-xl border border-amber-500/10 px-8 py-12 md:px-16 md:py-20 min-h-[80vh]'}`}>
            <WritingEditor
              ref={tiptapRef}
              key={activeChapter.id}
              chapterId={activeChapter.id}
              projectId={project.id}
              initialContent={editorContent}
              onContentChange={handleContentChange}
              lastMemoryWordCount={lastMemoryWordCount}
              onMemoryTrigger={handleMemoryTrigger}
              onAiAction={handleAiAction}
              onLookupVerse={(ref) => setLookupVerseRef(ref)}
              paragraphFocus={focusMode}
              sections={activeSections.map((s) => ({ id: s.id, title: s.title, position: s.position }))}
              editorFont={editorFont}
              onFontChange={handleFontChange}
            />
          </div>

          {/* Bottom spacing */}
          <div className="pb-16" />
        </div>
      </div>

      {/* Right resize handle */}
      {!focusMode && (
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-amber-400/40 active:bg-amber-400/60 transition-colors hidden xl:block relative"
          onMouseDown={(e) => startDrag('right', e)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      {/* ── Right Panel: Tabbed sidebar ── */}
      <div
        className={`shrink-0 hidden xl:flex xl:flex-col ${focusMode ? '!hidden' : ''}`}
        style={{ width: rightWidth }}
      >
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
          <button
            type="button"
            onClick={() => setRightTab('references')}
            className={`flex-1 py-2 text-[11px] font-semibold tracking-wide transition-colors ${
              rightTab === 'references'
                ? 'text-amber-700 border-b-2 border-amber-500 bg-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            References
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {rightTab === 'insights' && (
            <>
              {/* Insight Markers — pattern detection pills */}
              <InsightMarkers
                editorContent={editorContent}
                onAction={(action, paragraphText) => {
                  if (!baseContext || !paragraphText.trim()) return
                  fetch('/api/orchestrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action,
                      userText: paragraphText,
                      context: baseContext,
                    }),
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.result && typeof data.result === 'string') {
                        // Insert AI result after the matched paragraph, don't replace everything
                        handleInsertAfterParagraph(paragraphText, data.result)
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

          {rightTab === 'references' && (
            <CitationManagerPanel
              projectId={project.id}
              citationStyle={citationStyle}
              onInsertCitation={(citation: Citation) => {
                // Count existing footnote markers in the content to determine the next number
                const existingMarkers = (editorContent.match(/class="footnote-marker"/g) ?? []).length
                const markerNumber = existingMarkers + 1
                const marker = `<sup class="footnote-marker" data-citation-id="${citation.id}">[${markerNumber}]</sup>`
                handleApplyAiResult(editorContent + marker)
              }}
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
