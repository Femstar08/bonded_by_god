'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@/components/auth/SignOutButton'

interface DashboardSidebarProps {
  userEmail: string
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/projects', label: 'My Projects', icon: ProjectsIcon },
  { href: '/notes', label: 'Notes', icon: NotesIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
]

function getInitials(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function DashboardSidebar({ userEmail }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const initials = getInitials(userEmail)

  return (
    <aside
      className={`shrink-0 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{
        background: 'linear-gradient(180deg, #0f1a2e 0%, #162040 100%)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      <div className="relative flex h-full flex-col">

        {/* Top depth overlay — subtle gradient for dimension */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 z-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar — expanded */}
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-[11px] font-semibold text-white ring-1 ring-white/20"
                >
                  {initials}
                </div>

                <div className="min-w-0">
                  <h1 className="font-serif text-base font-semibold tracking-wide text-white truncate">
                    Scriptloom
                  </h1>
                  <p className="text-[10px] text-white/30">
                    Write with clarity and insight
                  </p>
                </div>
              </div>

              {/* Collapse button — expanded */}
              <button
                onClick={() => setCollapsed(true)}
                className="ml-1 shrink-0 rounded-md p-1.5 text-white/30 transition-colors duration-150 hover:text-white/60 hover:bg-white/[0.05]"
                aria-label="Collapse sidebar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </>
          ) : (
            /* Avatar — collapsed, centered */
            <div className="mx-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-[11px] font-semibold text-white ring-1 ring-white/20">
              {initials}
            </div>
          )}
        </div>

        {/* Expand button — collapsed state only */}
        {collapsed && (
          <div className="relative z-10 flex justify-center px-2 mb-1">
            <button
              onClick={() => setCollapsed(false)}
              className="rounded-md p-1.5 text-white/30 transition-colors duration-150 hover:text-white/60 hover:bg-white/[0.05]"
              aria-label="Expand sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4 rotate-180"
              >
                <path
                  fillRule="evenodd"
                  d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="relative z-10 flex flex-1 flex-col gap-0.5 px-2 mt-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`group relative flex items-center gap-2.5 rounded-md py-2 px-3 text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/[0.05]'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                {/* Active left-border accent */}
                {isActive && !collapsed && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-amber-400/80"
                    aria-hidden="true"
                  />
                )}

                <Icon
                  className="shrink-0"
                  style={{ width: 18, height: 18 }}
                />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="relative z-10 mt-auto border-t px-4 py-4"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[9px] font-medium text-white/50">
                {initials}
              </div>
              <p className="text-[11px] text-white/40 truncate">
                {userEmail}
              </p>
            </div>
          )}
          <div
            className={`${
              collapsed ? 'flex justify-center' : ''
            }`}
          >
            <SignOutButton collapsed={collapsed} variant="sidebar" />
          </div>
        </div>
      </div>
    </aside>
  )
}

/* -- Nav Icons -- */

function DashboardIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} style={style}>
      <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
    </svg>
  )
}

function ProjectsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} style={style}>
      <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75Z" />
      <path d="M3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z" />
    </svg>
  )
}

function NotesIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} style={style}>
      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
    </svg>
  )
}

function SettingsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} style={style}>
      <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
    </svg>
  )
}
