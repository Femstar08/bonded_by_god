'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Mic,
  Users,
  Heart,
  Globe,
  PenTool,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoleCard } from '@/components/onboarding/RoleCard'
import { ProjectForm } from '@/components/onboarding/ProjectForm'

// ---------------------------------------------------------------------------
// Role data
// ---------------------------------------------------------------------------
const ROLES = [
  {
    id: 'author',
    title: 'Author / Christian Writer',
    description:
      'Writing books, devotionals and Christian articles. Outline and expand your ideas for spiritual impact.',
    icon: <BookOpen className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: 'preacher',
    title: 'Preacher / Pastor / Speaker',
    description:
      'Preparing sermons, teachings, and messages. Choose a text or topic to receive a customizable outline, booklets and insightful prompts as needed.',
    icon: <Mic className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: 'bible_study_leader',
    title: 'Bible Study Leader / Teacher',
    description:
      'Leading small groups and studies. Create engaging discussion guides for your group.',
    icon: <Users className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: 'devotionalist',
    title: 'Devotionalist / Journal Creator',
    description:
      'Creating daily devotionals and guided journals. Inspire and encourage through daily reflections.',
    icon: <Heart className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: 'evangelist',
    title: 'Evangelist / Outreach Leader',
    description:
      'Sharing the Gospel and leading outreach. Craft clear, Spirit-led outreach and evangelism materials.',
    icon: <Globe className="h-6 w-6" aria-hidden="true" />,
  },
  {
    id: 'content_creator',
    title: 'Content Creator',
    description:
      'Creating faith-based content for blogs, social media, and digital platforms.',
    icon: <PenTool className="h-6 w-6" aria-hidden="true" />,
  },
] as const

type RoleId = (typeof ROLES)[number]['id']

// ---------------------------------------------------------------------------
// Tooltip / overlay component
// ---------------------------------------------------------------------------
const TOOLTIP_KEY = 'bbg_onboarding_tooltip_dismissed'

function RoleTooltip({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tip"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
      onClick={(e) => {
        // Dismiss when clicking the backdrop
        if (e.target === e.currentTarget) onDismiss()
      }}
    >
      <div className="relative max-w-sm w-full rounded-2xl bg-slate-900/95 border border-amber-500/30 shadow-2xl p-7 text-center">
        {/* Amber accent bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-16 rounded-b-full bg-amber-500" />

        <div className="mt-2 mb-4 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40">
            <svg
              className="h-6 w-6 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z"
              />
            </svg>
          </span>
        </div>

        <p className="text-white text-sm leading-relaxed">
          Choose a primary role to unlock a custom toolkit. You can change this later or mix
          toolkits as needed.
        </p>

        <Button
          type="button"
          onClick={onDismiss}
          className="mt-5 w-full bg-amber-500 text-white font-semibold hover:bg-amber-600"
        >
          Got it
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isComplete = stepNum < current
        return (
          <React.Fragment key={stepNum}>
            <div
              className={[
                'flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold transition-all duration-300',
                isActive
                  ? 'bg-[#0f1a2e] text-white shadow-md'
                  : isComplete
                  ? 'bg-amber-400 text-white'
                  : 'bg-border/30 text-muted-foreground/50',
              ].join(' ')}
              aria-current={isActive ? 'step' : undefined}
            >
              {isComplete ? (
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            {stepNum < total && (
              <div
                className={[
                  'h-px w-8 transition-all duration-300',
                  isComplete ? 'bg-amber-400' : 'bg-border/30',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Role selection
// ---------------------------------------------------------------------------
interface RoleStepProps {
  selectedRole: RoleId | null
  onSelectRole: (id: RoleId) => void
  onNext: () => void
  onSkip: () => void
}

function RoleSelectionStep({ selectedRole, onSelectRole, onNext, onSkip }: RoleStepProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    // Show tooltip only if not previously dismissed
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(TOOLTIP_KEY)
      if (!dismissed) {
        setShowTooltip(true)
      }
    }
  }, [])

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOOLTIP_KEY, '1')
    }
    setShowTooltip(false)
  }

  return (
    <>
      {showTooltip && <RoleTooltip onDismiss={handleDismiss} />}

      <div className="max-w-3xl mx-auto px-8 py-16 w-full">
        {/* Step indicator */}
        <div className="flex justify-center mb-10">
          <StepIndicator current={1} total={2} />
        </div>

        {/* Heading block */}
        <header className="text-center mb-12">
          <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground">
            Welcome to Your Spirit-Led Writing Assistant
          </h1>
          <p className="text-muted-foreground/60 text-[16px] mt-3">
            Select your primary role to unlock a customised toolkit
          </p>
        </header>

        {/* Role cards grid */}
        <section
          aria-label="Role selection"
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {ROLES.map((role) => (
            <RoleCard
              key={role.id}
              icon={role.icon}
              title={role.title}
              description={role.description}
              selected={selectedRole === role.id}
              onSelect={() => onSelectRole(role.id)}
            />
          ))}
        </section>

        {/* Footer hint */}
        <p className="text-[13px] text-muted-foreground/40 text-center mt-8">
          You can mix and match tools any time from your dashboard
        </p>

        {/* Navigation row */}
        <nav
          aria-label="Onboarding navigation"
          className="flex items-center justify-between mt-10"
        >
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!selectedRole}
            aria-disabled={!selectedRole}
            className={[
              'bg-[#0f1a2e] hover:bg-[#1a2d4d] text-white rounded-xl px-8 py-3 text-[15px] font-semibold transition-all duration-200',
              !selectedRole ? 'opacity-40 cursor-not-allowed' : '',
            ].join(' ')}
          >
            Continue
          </button>
        </nav>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main onboarding page
// ---------------------------------------------------------------------------
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null)

  function handleSelectRole(id: RoleId) {
    setSelectedRole(id)
  }

  function handleNext() {
    if (!selectedRole) return
    setStep(2)
  }

  function handleBack() {
    setStep(1)
  }

  function handleSkip() {
    // Navigate to dashboard without creating a project
    router.push('/dashboard')
  }

  function handleProjectCreated(projectId: string) {
    router.push(`/editor/${projectId}`)
  }

  return (
    <div
      className="flex flex-1 flex-col"
      // Ensure page is announced correctly by screen readers on step change
      aria-live="polite"
      aria-atomic="false"
    >
      {step === 1 ? (
        <RoleSelectionStep
          selectedRole={selectedRole}
          onSelectRole={handleSelectRole}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      ) : (
        <div className="max-w-3xl mx-auto px-8 py-16 w-full">
          {/* Step indicator */}
          <div className="flex justify-center mb-10">
            <StepIndicator current={2} total={2} />
          </div>

          {/* Step 2 heading */}
          <header className="text-center mb-12">
            <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground">
              Create Your First Project
            </h1>
            <p className="text-muted-foreground/60 text-[16px] mt-3">
              Tell us a little about what you&apos;re working on
            </p>
          </header>

          <ProjectForm
            role={selectedRole!}
            onBack={handleBack}
            onSubmit={handleProjectCreated}
          />
        </div>
      )}
    </div>
  )
}
