export type Profile = {
  id: string
  email: string
  display_name: string | null
  show_prayer_prompt: boolean
  show_daily_scripture: boolean
  created_at: string
}

export type ProjectType = 'book' | 'sermon' | 'devotional' | 'notes' | 'bible_study' | 'article' | 'other'

export type RoleType =
  | 'author'
  | 'preacher'
  | 'bible_study_leader'
  | 'devotionalist'
  | 'evangelist'
  | 'content_creator'

export type ToneType = 'mentor' | 'teacher' | 'preacher' | 'writer'

export type Project = {
  id: string
  user_id: string
  title: string
  type: ProjectType
  role: string
  content: string
  structure?: Record<string, unknown> | null
  audience?: string | null
  tone?: string | null
  scripture_focus?: string | null
  daily_word_goal?: number
  inspiration_images?: string[]
  created_at: string
  updated_at: string
}

export type WritingSession = {
  id: string
  user_id: string
  project_id: string
  date: string        // ISO date string, e.g. "2026-03-10"
  word_count: number
  created_at: string
  updated_at: string
}

export type Chapter = {
  id: string
  project_id: string
  title: string
  content: string
  position: number
  word_goal: number
  created_at: string
  updated_at: string
}

export type ChapterMemory = {
  id: string
  chapter_id: string
  project_id: string
  summary: string
  key_themes: string[]
  scriptures_used: string[]
  key_ideas: string[]
  word_count_at_generation: number
  created_at: string
  updated_at: string
}

export type ProjectMemory = {
  id: string
  project_id: string
  writing_style: string
  recurring_themes: string[]
  all_scriptures_used: string[]
  updated_at: string
}

export type SectionStatus = 'empty' | 'draft' | 'review' | 'complete'

export type Section = {
  id: string
  chapter_id: string
  project_id: string
  title: string
  status: SectionStatus
  summary: string
  notes: string
  position: number
  created_at: string
  updated_at: string
}

export type Note = {
  id: string
  user_id: string
  title: string
  content: string
  event_name?: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type StyleData = {
  tone: string
  voice: string
  sentenceStructure: string
  pacing: string
  emotionLevel: string
  vocabularyStyle: string
  writingPatterns: string
  styleSummary: string
}

export type StyleProfile = {
  id: string
  user_id: string
  project_id: string | null
  style_data: StyleData
  samples_text: string[]
  word_count_at_analysis: number
  created_at: string
  updated_at: string
}

export type ProjectBibleCategory =
  | 'theological_positions'
  | 'themes'
  | 'key_figures'
  | 'core_scriptures'
  | 'audience_profile'
  | 'tone_voice_notes'
  | 'custom_notes'

export type ProjectBibleEntry = {
  id: string
  project_id: string
  category: ProjectBibleCategory
  title: string
  content: string
  scripture_refs: string[]
  sort_order: number
  created_at: string
  updated_at: string
}
