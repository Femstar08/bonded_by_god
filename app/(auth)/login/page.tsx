'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="p-10 bg-white rounded-2xl shadow-sm">
      {/* Page heading */}
      <h2 className="font-serif text-3xl font-normal text-foreground mb-2">
        Welcome back
      </h2>
      <p className="text-muted-foreground/60 text-[15px] mb-10">
        Sign in to continue your writing journey.
      </p>

      <form onSubmit={handleLogin} className="space-y-6">
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
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center text-sm text-muted-foreground/70 mt-8">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-amber-600 hover:text-amber-700 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </div>
  )
}
