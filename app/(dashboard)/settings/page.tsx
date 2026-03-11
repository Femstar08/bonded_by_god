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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Email: {user.email}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-4">Spiritual Tools</h2>
        <SpiritualToolsSettings
          userId={user.id}
          initialShowPrayerPrompt={profile?.show_prayer_prompt ?? true}
          initialShowDailyScripture={profile?.show_daily_scripture ?? true}
        />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-4">Writing Style</h2>
        <StyleTraining
          userId={user.id}
          projects={(projects ?? []).map((p) => ({ id: p.id, title: p.title }))}
        />
      </div>
    </div>
  )
}
