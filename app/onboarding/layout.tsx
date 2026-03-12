import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Get Started | Scriptloom',
  description: 'Set up your Spirit-Led Writing experience',
}

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #f5f2ee 100%)' }}
    >
      {/* Slim brand header */}
      <header
        className="w-full flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, #0f1a2e 0%, #1a2d4d 50%, #0f1a2e 100%)',
        }}
      >
        <div className="mx-auto flex h-12 max-w-6xl items-center px-8">
          <span
            className="font-serif text-[15px] font-semibold tracking-[0.2em] uppercase text-white/90"
            aria-label="Scriptloom"
          >
            SCRIPTLOOM
          </span>
        </div>
        {/* Gold accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
      </header>

      {/* Page content */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
