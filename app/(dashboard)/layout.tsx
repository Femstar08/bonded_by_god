import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default async function DashboardLayout({
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
    <div className="flex h-screen flex-col">
      {/* Full-width header banner above sidebar and content */}
      <DashboardHeader />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar userEmail={user.email ?? ''} />

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            background: 'linear-gradient(180deg, #faf8f5 0%, #f5f2ee 50%, #faf8f5 100%)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
