'use client'

import { Card, CardContent } from '@/components/ui/card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WritingTeamAction =
  | 'expand'
  | 'find_scripture'
  | 'revise'
  | 'spiritual_check'
  | 'research'
  | 'guide'

export interface WritingTeamDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelectAgent: (action: WritingTeamAction) => void
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Team member definitions
// ---------------------------------------------------------------------------

interface TeamMember {
  /** Single-character or two-character label rendered inside the avatar circle */
  initial: string
  name: string
  role: string
  description: string
  action: WritingTeamAction
  /** Tailwind colour tokens for the avatar background and text */
  avatarBg: string
  avatarText: string
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    initial: 'S',
    name: 'The Scribe',
    role: 'Writing & Generation',
    description: 'Expand or generate writing. Adds depth, detail, and momentum to your words.',
    action: 'expand',
    avatarBg: 'bg-amber-100',
    avatarText: 'text-amber-800',
  },
  {
    initial: 'I',
    name: 'The Interpreter',
    role: 'Scripture & Meaning',
    description: 'Find and explain scripture. Surfaces the right passage for what you are writing.',
    action: 'find_scripture',
    avatarBg: 'bg-blue-100',
    avatarText: 'text-blue-800',
  },
  {
    initial: 'R',
    name: 'The Refiner',
    role: 'Clarity & Flow',
    description: 'Improve clarity and flow. Shapes your draft into polished, readable prose.',
    action: 'revise',
    avatarBg: 'bg-emerald-100',
    avatarText: 'text-emerald-800',
  },
  {
    initial: 'Sh',
    name: 'The Shepherd',
    role: 'Spiritual Tone',
    description: 'Spiritual tone and reflection. Keeps your writing grounded in faith and purpose.',
    action: 'spiritual_check',
    avatarBg: 'bg-violet-100',
    avatarText: 'text-violet-800',
  },
  {
    initial: 'Re',
    name: 'The Researcher',
    role: 'Theology & Context',
    description: 'Theological background and context. Deepens your writing with grounded insight.',
    action: 'research',
    avatarBg: 'bg-rose-100',
    avatarText: 'text-rose-800',
  },
  {
    initial: 'G',
    name: 'The Guide',
    role: 'Direction & Prompts',
    description: 'Writing direction and prompts. Helps you decide what to write next and how.',
    action: 'guide',
    avatarBg: 'bg-orange-100',
    avatarText: 'text-orange-800',
  },
]

// ---------------------------------------------------------------------------
// Avatar component — styled initial in a circle, no emojis
// ---------------------------------------------------------------------------

function AgentAvatar({
  initial,
  avatarBg,
  avatarText,
}: {
  initial: string
  avatarBg: string
  avatarText: string
}) {
  return (
    <div
      aria-hidden="true"
      className={[
        'flex items-center justify-center',
        'h-10 w-10 shrink-0 rounded-full',
        'text-sm font-bold tracking-wide select-none',
        avatarBg,
        avatarText,
      ].join(' ')}
    >
      {initial}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual team member card
// ---------------------------------------------------------------------------

function TeamMemberCard({
  member,
  disabled,
  onSelect,
}: {
  member: TeamMember
  disabled: boolean
  onSelect: (action: WritingTeamAction) => void
}) {
  return (
    <Card
      // Override the default Card gap and padding so we can control spacing precisely
      className={[
        'gap-0 py-0 border-border',
        'transition-all duration-150',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : [
              'cursor-pointer',
              'hover:border-amber-300 hover:shadow-md hover:shadow-amber-100/60',
              'active:scale-[0.98]',
              // Keyboard focus ring — amber to match the app accent
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2',
            ].join(' '),
      ].join(' ')}
      // Make the card keyboard-focusable and announce its role
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Activate ${member.name}: ${member.description}`}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onSelect(member.action)
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(member.action)
        }
      }}
    >
      <CardContent className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <AgentAvatar
            initial={member.initial}
            avatarBg={member.avatarBg}
            avatarText={member.avatarText}
          />

          {/* Text content */}
          <div className="flex flex-col gap-0.5 min-w-0">
            {/* Name + role label on the same row */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-serif text-sm font-semibold text-foreground leading-snug">
                {member.name}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {member.role}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed text-muted-foreground mt-0.5">
              {member.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main WritingTeamDrawer component
// ---------------------------------------------------------------------------

export function WritingTeamDrawer({
  isOpen,
  onClose,
  onSelectAgent,
  disabled = false,
}: WritingTeamDrawerProps) {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Mobile overlay backdrop — tapping it closes the drawer             */}
      {/* ------------------------------------------------------------------ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Drawer panel                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Writing Team"
        // Width is narrower than ChatPanel (320px vs 380px) as specified
        className={[
          // Position & sizing
          'fixed top-0 right-0 z-50 h-full w-full sm:w-[320px]',
          // Surface
          'bg-card border-l border-border shadow-2xl',
          // Layout
          'flex flex-col',
          // Slide animation — identical pattern to ChatPanel
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground shrink-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium tracking-widest uppercase text-primary-foreground/60">
              AI Assistants
            </span>
            <h2 className="font-serif text-base font-semibold leading-snug">
              Writing Team
            </h2>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Writing Team panel"
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-primary-foreground/10 transition-colors ml-2 shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Intro blurb                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Choose a member of your writing team. Each one brings a different
            gift to your work. Select the voice you need right now.
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Section label                                                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Your Team
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Scrollable team member list                                      */}
        {/* ---------------------------------------------------------------- */}
        <div
          className={[
            'flex-1 overflow-y-auto px-4 pb-6 space-y-2',
            // Thin scrollbar to match ChatPanel
            '[&::-webkit-scrollbar]:w-1.5',
            '[&::-webkit-scrollbar-track]:bg-transparent',
            '[&::-webkit-scrollbar-thumb]:rounded-full',
            '[&::-webkit-scrollbar-thumb]:bg-border',
            '[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40',
          ].join(' ')}
          aria-label="Writing team members"
        >
          {TEAM_MEMBERS.map((member) => (
            <TeamMemberCard
              key={member.action}
              member={member}
              disabled={disabled}
              onSelect={onSelectAgent}
            />
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer note                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="shrink-0 border-t border-border px-4 py-3 bg-card">
          <p className="text-[10px] text-center text-muted-foreground select-none leading-relaxed">
            Results apply to your current editor content
          </p>
        </div>
      </div>
    </>
  )
}
