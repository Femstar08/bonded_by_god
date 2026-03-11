'use client'

export function DashboardHeader() {
  return (
    <header className="relative w-full">
      <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-[#1a2744] via-[#243656] to-[#1a2744] px-4 py-3">
        {/* Subtle glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04)_0%,transparent_70%)]" />

        {/* Pen/quill icon placeholder — will be replaced with logo */}
        <svg
          className="relative h-5 w-5 text-amber-400/80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>

        {/* Brand */}
        <h1 className="relative font-serif text-lg font-bold tracking-wider text-white">
          Scriptloom
        </h1>

        {/* Tagline — right side */}
        <p className="relative text-[11px] text-white/40 hidden sm:block">
          Write with clarity and insight
        </p>
      </div>
      {/* Thin gold accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
    </header>
  )
}
