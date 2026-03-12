export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — decorative, hidden on mobile */}
      <div
        className="hidden md:flex md:w-[45%] flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f1a2e 0%, #162040 60%, #1a2a50 100%)' }}
      >
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px)',
          }}
        />

        {/* Corner ornament top-left */}
        <div className="absolute top-8 left-8 w-16 h-16 opacity-20">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0 L0 32 Q0 0 32 0 Z" fill="#c9a84c" />
            <path d="M0 0 L16 0 L0 16 Z" fill="#c9a84c" opacity="0.6" />
          </svg>
        </div>

        {/* Corner ornament bottom-right */}
        <div className="absolute bottom-8 right-8 w-16 h-16 opacity-20 rotate-180">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0 L0 32 Q0 0 32 0 Z" fill="#c9a84c" />
            <path d="M0 0 L16 0 L0 16 Z" fill="#c9a84c" opacity="0.6" />
          </svg>
        </div>

        {/* Brand content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          {/* Gold top rule */}
          <div className="flex items-center gap-3 mb-10 w-full justify-center">
            <div className="h-px flex-1 max-w-[60px]" style={{ background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-70" />
            <div className="h-px flex-1 max-w-[60px]" style={{ background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
          </div>

          {/* Brand name */}
          <h1
            className="font-serif text-white mb-5"
            style={{ fontSize: '2rem', letterSpacing: '0.3em', fontWeight: 400 }}
          >
            SCRIPTLOOM
          </h1>

          {/* Gold decorative line */}
          <div
            className="mb-7"
            style={{
              width: '80px',
              height: '1.5px',
              background: 'linear-gradient(to right, transparent, #c9a84c, transparent)',
            }}
          />

          {/* Tagline */}
          <p
            className="text-white/50 font-serif italic"
            style={{ fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '260px' }}
          >
            A Spirit-led studio for writers, preachers, and ministry leaders.
          </p>

          {/* Bottom rule */}
          <div className="flex items-center gap-3 mt-10 w-full justify-center">
            <div className="h-px flex-1 max-w-[60px]" style={{ background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-70" />
            <div className="h-px flex-1 max-w-[60px]" style={{ background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
          </div>

          {/* Scripture verse */}
          <p
            className="mt-12 text-white/30 text-xs tracking-widest uppercase"
            style={{ letterSpacing: '0.18em' }}
          >
            &ldquo;Write the vision, make it plain&rdquo;
          </p>
          <p className="text-white/20 text-xs mt-1 tracking-widest uppercase" style={{ letterSpacing: '0.18em' }}>
            Habakkuk 2:2
          </p>
        </div>
      </div>

      {/* Right panel — form content */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #f5f2ee 100%)' }}
      >
        <div className="w-full max-w-md">
          {/* Mobile-only brand header */}
          <div className="flex flex-col items-center mb-10 md:hidden">
            <span
              className="font-serif text-[#0f1a2e]"
              style={{ fontSize: '1.4rem', letterSpacing: '0.3em', fontWeight: 400 }}
            >
              SCRIPTLOOM
            </span>
            <div
              className="mt-2"
              style={{
                width: '48px',
                height: '1.5px',
                background: 'linear-gradient(to right, transparent, #c9a84c, transparent)',
              }}
            />
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
