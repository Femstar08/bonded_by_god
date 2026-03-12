'use client'

export function DashboardHeader() {
  return (
    <header className="relative w-full">
      <div className="relative flex flex-col items-center justify-center bg-gradient-to-r from-[#0f1a2e] via-[#1a2d4d] to-[#0f1a2e] px-4 py-2.5">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />

        {/* Brand */}
        <h1 className="relative font-serif text-[15px] font-semibold tracking-[0.2em] uppercase text-white/90">
          Scriptloom
        </h1>

        {/* Decorative gold line */}
        <div className="relative mt-1.5 w-8 h-px bg-amber-400/30" />
      </div>

      {/* Thin gold accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
    </header>
  )
}
