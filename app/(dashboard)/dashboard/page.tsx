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
    <div className="container mx-auto p-6 max-w-4xl space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-serif font-bold tracking-tight">{getGreeting()}</h1>
        <p className="text-muted-foreground text-sm mt-1">What will you write today?</p>
      </div>

      {/* Section 1: Continue Writing */}
      <section aria-label="Continue writing">
        {continueChapter && continueProject ? (
          <div className="border border-border/50 rounded-xl p-8">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Continue Writing
            </p>
            <p className="text-sm text-muted-foreground">
              Project: {continueProject.title}
            </p>
            <h2 className="font-serif text-2xl font-semibold mt-1 text-foreground">
              {continueChapter.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Last edited: {getRelativeTime(continueChapter.updated_at)}
            </p>
            <Link
              href={`/editor/${continueChapter.project_id}`}
              className="inline-flex items-center mt-6 rounded-md px-5 py-2.5 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              Continue Writing &rarr;
            </Link>
          </div>
        ) : fallbackProject ? (
          <div className="border border-border/50 rounded-xl p-8">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Continue Writing
            </p>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Start your first chapter
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Open <span className="font-medium text-foreground">{fallbackProject.title}</span> and begin writing.
            </p>
            <Link
              href={`/editor/${fallbackProject.id}`}
              className="inline-flex items-center mt-6 rounded-md px-5 py-2.5 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              Start Writing &rarr;
            </Link>
          </div>
        ) : (
          <div className="border border-border/50 rounded-xl p-8 text-center">
            <p className="text-muted-foreground">
              Create a project to start writing.
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center mt-4 rounded-md px-5 py-2.5 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
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
          <h2 className="text-lg font-semibold tracking-tight mb-4">Your Projects</h2>
          <div className="divide-y divide-border/50">
            {projects.map((project) => {
              const tag = getTagStyle(project.type)
              return (
                <Link
                  key={project.id}
                  href={`/editor/${project.id}`}
                  className="flex items-center justify-between py-3.5 px-1 rounded-sm transition-colors hover:bg-accent/50 -mx-1 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-foreground font-medium truncate group-hover:text-foreground/80">
                      {project.title}
                    </span>
                    {project.type && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tag.bg} ${tag.text} shrink-0`}
                      >
                        {project.type}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0 ml-4">
                    {getRelativeTime(project.updated_at)}
                  </span>
                </Link>
              )
            })}
          </div>
          <div className="mt-4">
            <Link
              href="/projects/new"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              + New Project
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
