'use client'

/**
 * useVoiceDictation
 *
 * Browser-native voice dictation via the Web Speech API.
 * No external dependencies — uses SpeechRecognition / webkitSpeechRecognition.
 *
 * Behaviour:
 * - Runs in continuous + interimResults mode so the user never has to re-click.
 * - Chrome stops the session after ~60 s of silence; the `onend` handler
 *   auto-restarts when `isListening` is still true.
 * - Fatal errors (`not-allowed`, `no-speech`) surface via `error` state and
 *   automatically stop listening.
 * - Recognition instance is created once per hook mount and torn down on unmount.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from '@/types/speech-recognition'

interface UseVoiceDictationOptions {
  /** Called with the committed (final) transcript text each time a phrase is finalised. */
  onResult: (text: string) => void
  /** BCP 47 language tag. Defaults to `en-US`. */
  lang?: string
}

interface UseVoiceDictationReturn {
  /** Whether the microphone is currently active and listening. */
  isListening: boolean
  /** Whether the browser supports the Web Speech API. */
  isSupported: boolean
  /**
   * Interim (not-yet-finalised) transcript from the current utterance.
   * Useful for showing a live preview beneath the editor.
   */
  interimTranscript: string
  /** The last error message, if any. Cleared on next `startListening` call. */
  error: string | null
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
}

// Errors severe enough to stop listening automatically
const FATAL_ERRORS: ReadonlySet<string> = new Set(['not-allowed', 'service-not-allowed'])

export function useVoiceDictation({
  onResult,
  lang = 'en-US',
}: UseVoiceDictationOptions): UseVoiceDictationReturn {
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Keep a stable ref to onResult so event handlers never go stale
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  // Whether the browser exposes SpeechRecognition (checked once on mount)
  const isSupported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined)

  // Recognition instance — created once and reused across start/stop cycles
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Tracks the *intent* to be listening so the auto-restart logic in `onend`
  // can distinguish between the user manually stopping and Chrome timing out
  const shouldBeListeningRef = useRef(false)

  // ─── Initialise the recognition instance ──────────────────────────────────
  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognitionImpl =
      window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (!SpeechRecognitionImpl) return

    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    // ── result ────────────────────────────────────────────────────────────
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          finalText += transcript
        } else {
          interim += transcript
        }
      }

      if (finalText) {
        onResultRef.current(finalText)
        // Clear interim once the result is committed
        setInterimTranscript('')
      } else {
        setInterimTranscript(interim)
      }
    }

    // ── error ─────────────────────────────────────────────────────────────
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msg = event.message || event.error
      setError(msg)
      console.warn('[useVoiceDictation] error:', event.error, msg)

      if (FATAL_ERRORS.has(event.error)) {
        // Stop completely — the user needs to grant permission or fix the issue
        shouldBeListeningRef.current = false
        setIsListening(false)
        setInterimTranscript('')
      }
    }

    // ── end ───────────────────────────────────────────────────────────────
    // Chrome fires `end` after ~60 s of silence or when `stop()` is called.
    // If the user hasn't intentionally stopped, restart to maintain continuity.
    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        try {
          recognition.start()
        } catch {
          // start() throws if the session is already active; safe to ignore
        }
      } else {
        setIsListening(false)
        setInterimTranscript('')
      }
    }

    recognitionRef.current = recognition

    // Cleanup on unmount — abort silently
    return () => {
      shouldBeListeningRef.current = false
      try {
        recognition.abort()
      } catch {
        // Ignore abort errors on unmount
      }
      recognitionRef.current = null
    }
  // lang is intentionally included so a new instance is created if it changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, lang])

  // ─── Public API ───────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return

    setError(null)
    setInterimTranscript('')
    shouldBeListeningRef.current = true
    setIsListening(true)

    try {
      recognitionRef.current.start()
    } catch {
      // Recognition may already be running (e.g. rapid double-click) — safe to ignore
    }
  }, [])

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false
    setIsListening(false)
    setInterimTranscript('')

    try {
      recognitionRef.current?.stop()
    } catch {
      // Ignore stop errors
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (shouldBeListeningRef.current) {
      stopListening()
    } else {
      startListening()
    }
  }, [startListening, stopListening])

  return {
    isListening,
    isSupported,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
  }
}
