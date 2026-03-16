'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setEmailSent(true)
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setResending(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      setError(error.message)
    } else {
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    setResending(false)
  }

  if (emailSent) {
    return (
      <div className="p-10 bg-white rounded-2xl shadow-sm text-center">
        {/* Email icon */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#f5f0e8' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 4L12 13L2 4" />
          </svg>
        </div>

        <h2 className="font-serif text-2xl font-normal text-foreground mb-2">
          Check your email
        </h2>
        <p className="text-muted-foreground/60 text-[15px] mb-2">
          We&apos;ve sent a confirmation link to
        </p>
        <p className="text-foreground font-medium text-[15px] mb-6">
          {email}
        </p>
        <p className="text-muted-foreground/50 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
          Click the link in the email to verify your account and begin your writing journey.
          Be sure to check your spam folder.
        </p>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
          className="w-full rounded-xl py-3 text-[15px] font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: (resending || resendCooldown > 0) ? '#1a2d4d' : '#0f1a2e' }}
          onMouseEnter={(e) => { if (!resending && resendCooldown === 0) e.currentTarget.style.background = '#1a2d4d' }}
          onMouseLeave={(e) => { if (!resending && resendCooldown === 0) e.currentTarget.style.background = '#0f1a2e' }}
        >
          {resending
            ? 'Sending...'
            : resendCooldown > 0
              ? `Resend email (${resendCooldown}s)`
              : 'Resend confirmation email'}
        </button>

        <p className="text-center text-sm text-muted-foreground/70 mt-6">
          Wrong email?{' '}
          <button
            onClick={() => { setEmailSent(false); setError(null) }}
            className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            Go back
          </button>
        </p>

        <p className="text-center text-sm text-muted-foreground/70 mt-3">
          Already verified?{' '}
          <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="p-10 bg-white rounded-2xl shadow-sm">
      {/* Page heading */}
      <h2 className="font-serif text-3xl font-normal text-foreground mb-2">
        Create your account
      </h2>
      <p className="text-muted-foreground/60 text-[15px] mb-10">
        Begin your Spirit-led writing journey with Scriptloom.
      </p>

      <form onSubmit={handleSignup} className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Email field */}
        <div>
          <label
            htmlFor="email"
            className="block text-[13px] font-medium text-foreground/80 uppercase tracking-wide mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-border/50 py-3 px-4 text-[15px] bg-white text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50"
          />
        </div>

        {/* Password field */}
        <div>
          <label
            htmlFor="password"
            className="block text-[13px] font-medium text-foreground/80 uppercase tracking-wide mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-border/50 py-3 px-4 text-[15px] bg-white text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50"
          />
        </div>

        {/* Confirm password field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-[13px] font-medium text-foreground/80 uppercase tracking-wide mb-2"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-border/50 py-3 px-4 text-[15px] bg-white text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-[15px] font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: loading ? '#1a2d4d' : '#0f1a2e' }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#1a2d4d' }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#0f1a2e' }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center text-sm text-muted-foreground/70 mt-8">
        Already have an account?{' '}
        <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
