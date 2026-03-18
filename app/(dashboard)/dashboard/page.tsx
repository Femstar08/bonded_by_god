import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DailyScripture } from '@/components/dashboard/DailyScripture'
import { countWords } from '@/lib/utils/text'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const PROJECT_TYPE_TAGS: Record<string, { bg: string; text: string }> = {
  book: { bg: 'bg-amber-100', text: 'text-amber-700' },
  sermon: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  article: { bg: 'bg-green-100', text: 'text-green-700' },
  devotional: { bg: 'bg-orange-100', text: 'text-orange-700' },
  'study guide': { bg: 'bg-purple-100', text: 'text-purple-700' },
  study_guide: { bg: 'bg-purple-100', text: 'text-purple-700' },
}

const DEFAULT_TAG = { bg: 'bg-gray-100', text: 'text-gray-700' }

function getTagStyle(type: string | null): { bg: string; text: string } {
  if (!type) return DEFAULT_TAG
  return PROJECT_TYPE_TAGS[type.toLowerCase()] ?? DEFAULT_TAG
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: projects }, { data: profile }, { data: recentChapters }] = await Promise.all([
    supabase
      .from('ltu_projects')
      .select('id, title, type, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('ltu_profiles')
      .select('show_daily_scripture')
      .eq('id', user.id)
      .single(),
    supabase
      .from('ltu_chapters')
      .select('id, title, content, project_id, updated_at, ltu_projects!inner(id, title, user_id)')
      .eq('ltu_projects.user_id', user.id)
      .neq('content', '')
      .not('content', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1),
  ])

  // Find the most recently edited chapter with actual content
  const continueChapter = recentChapters?.find((c) => countWords(c.content) > 0) ?? null
  const joinedProject = continueChapter?.ltu_projects as unknown as
    | { id: string; title: string }
    | { id: string; title: string }[]
    | null
  const continueProject = continueChapter
    ? (Array.isArray(joinedProject) ? joinedProject[0] : joinedProject) ?? null
    : null

  // Fallback: if no chapter has content, link to the most recent project
  const fallbackProject = projects?.[0] ?? null

  return (
    <div className="container mx-auto px-10 py-12 max-w-4xl space-y-14">

      {/* Greeting */}
      <div>
        <h1 className="text-4xl font-serif font-normal tracking-tight text-foreground">{getGreeting()}</h1>
        <p className="text-muted-foreground/60 text-[15px] mt-3">What will you write today?</p>
      </div>

      {/* Section 1: Continue Writing */}
      <section aria-label="Continue writing">
        {continueChapter && continueProject ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1a2e] via-[#162040] to-[#1a2d4d] rounded-2xl px-10 py-10 shadow-2xl">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-amber-400/[0.04] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <p className="text-[11px] uppercase tracking-[0.25em] text-amber-300/70 font-semibold mb-6">
              Continue Writing
            </p>
            <p className="text-[14px] text-white/70 font-medium">
              {continueProject.title}
            </p>
            <h2 className="font-serif text-3xl text-white font-normal mt-2 leading-tight">
              {continueChapter.title}
            </h2>
            <p className="text-[13px] text-white/50 mt-4">
              Last edited {getRelativeTime(continueChapter.updated_at)}
            </p>
            <Link
              href={`/editor/${continueChapter.project_id}`}
              className="inline-flex items-center mt-8 bg-amber-500 hover:bg-amber-400 text-white rounded-lg px-7 py-3 text-sm font-semibold shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/30"
            >
              Continue Writing
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        ) : fallbackProject ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1a2e] via-[#162040] to-[#1a2d4d] rounded-2xl px-10 py-10 shadow-2xl">
            <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-amber-400/[0.04] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <p className="text-[11px] uppercase tracking-[0.25em] text-amber-300/70 font-semibold mb-6">
              Continue Writing
            </p>
            <h2 className="font-serif text-3xl text-white font-normal leading-tight">
              Start your first chapter
            </h2>
            <p className="text-[15px] text-white/70 mt-3">
              Open <span className="text-white font-medium">{fallbackProject.title}</span> and begin writing.
            </p>
            <Link
              href={`/editor/${fallbackProject.id}`}
              className="inline-flex items-center mt-8 bg-amber-500 hover:bg-amber-400 text-white rounded-lg px-7 py-3 text-sm font-semibold shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/30"
            >
              Start Writing
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0f1a2e] via-[#162040] to-[#1a2d4d] rounded-2xl px-10 py-10 shadow-2xl text-center">
            <p className="text-white/50 text-[15px]">
              Create a project to start writing.
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center mt-6 bg-amber-500 hover:bg-amber-400 text-white rounded-lg px-7 py-3 text-sm font-semibold shadow-lg shadow-amber-500/25 transition-all duration-200"
            >
              Create Project
            </Link>
          </div>
        )}
      </section>

      {/* Section 2: Daily Scripture */}
      <section aria-label="Daily scripture">
        <DailyScripture showDailyScripture={profile?.show_daily_scripture ?? true} />
      </section>

      {/* Section 3: Your Projects */}
      {projects && projects.length > 0 && (
        <section aria-label="Your projects">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-5">
            Your Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const tag = getTagStyle(project.type)
              return (
                <Link
                  key={project.id}
                  href={`/editor/${project.id}`}
                  className="group relative rounded-2xl border border-amber-500/15 bg-white p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-amber-500/30 hover:-translate-y-0.5 transition-all duration-250 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    {project.type && (
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${tag.bg} ${tag.text}`}
                      >
                        {project.type}
                      </span>
                    )}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-lg font-normal text-foreground leading-snug line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground/50 mt-3">
                    Edited {getRelativeTime(project.updated_at)}
                  </p>
                </Link>
              )
            })}

            {/* New Project card */}
            <Link
              href="/projects/new"
              className="group rounded-2xl border border-amber-500/10 bg-[#FDFCF7] p-6 flex flex-col items-center justify-center text-sm text-muted-foreground/60 hover:text-foreground hover:border-amber-500/30 hover:shadow-md transition-all duration-200 cursor-pointer min-h-[140px]"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-dashed border-current mb-3 group-hover:scale-110 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              </span>
              New Project
            </Link>
          </div>
        </section>
      )}

      {/* Empty state: no projects yet */}
      {(!projects || projects.length === 0) && (
        <section aria-label="Get started">
          <Link
            href="/projects/new"
            className="rounded-xl border border-dashed border-border/60 p-5 flex items-center justify-center text-sm text-muted-foreground/50 hover:text-muted-foreground hover:border-border hover:bg-accent/30 transition-all duration-200 cursor-pointer"
          >
            + New Project
          </Link>
        </section>
      )}

    </div>
  )
}
