import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditorClient } from '@/components/editor/EditorClient'
import type { Section } from '@/types/database'

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('ltu_projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/projects')

  const [{ data: chapters }, { data: profile }, { data: chapterMemories }, { data: sectionsData }] = await Promise.all([
    supabase
      .from('ltu_chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true }),
    supabase
      .from('ltu_profiles')
      .select('show_prayer_prompt')
      .eq('id', user.id)
      .single(),
    supabase
      .from('ltu_chapter_memories')
      .select('*')
      .eq('project_id', projectId),
    supabase
      .from('ltu_sections')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true }),
  ])

  // Group sections by chapter_id
  const initialSections: Record<string, Section[]> = {}
  for (const section of (sectionsData ?? []) as Section[]) {
    if (!initialSections[section.chapter_id]) {
      initialSections[section.chapter_id] = []
    }
    initialSections[section.chapter_id].push(section)
  }

  return (
    <EditorClient
      project={project}
      initialChapters={chapters || []}
      showPrayerPrompt={profile?.show_prayer_prompt ?? true}
      initialChapterMemories={chapterMemories || []}
      initialSections={initialSections}
    />
  )
}
