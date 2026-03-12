import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SpiritualToolsSettings } from '@/components/settings/SpiritualToolsSettings'
import { StyleTraining } from '@/components/settings/StyleTraining'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase
      .from('ltu_profiles')
      .select('show_prayer_prompt, show_daily_scripture')
      .eq('id', user.id)
      .single(),
    supabase
      .from('ltu_projects')
      .select('id, title')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ])

  const emailInitial = user.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="max-w-4xl mx-auto px-10 py-12 space-y-12">

      {/* Page header */}
      <div>
        <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground/60 text-[15px] mt-3">
          Manage your account and preferences
        </p>
      </div>

      {/* Account section */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50 mb-6">
          Account
        </p>
        <div className="bg-white rounded-2xl border border-border/50 p-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#0f1a2e] flex items-center justify-center shrink-0">
              <span className="text-[15px] font-semibold text-white">{emailInitial}</span>
            </div>
            <div>
              <p className="text-[15px] font-medium text-foreground">{user.email}</p>
              <p className="text-[13px] text-muted-foreground/60 mt-0.5">Personal account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spiritual Tools section */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50 mb-6">
          Spiritual Tools
        </p>
        <div className="bg-white rounded-2xl border border-border/50 p-8">
          <SpiritualToolsSettings
            userId={user.id}
            initialShowPrayerPrompt={profile?.show_prayer_prompt ?? true}
            initialShowDailyScripture={profile?.show_daily_scripture ?? true}
          />
        </div>
      </div>

      {/* Writing Style section */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/50 mb-6">
          Writing Style
        </p>
        <div className="bg-white rounded-2xl border border-border/50 p-8">
          <StyleTraining
            userId={user.id}
            projects={(projects ?? []).map((p) => ({ id: p.id, title: p.title }))}
          />
        </div>
      </div>

    </div>
  )
}
