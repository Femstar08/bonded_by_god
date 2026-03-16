/**
 * Web Speech API — SpeechRecognition type declarations.
 *
 * TypeScript's lib.dom.d.ts does not include SpeechRecognition or its
 * webkit-prefixed counterpart. These declarations add the interfaces as both
 * named exports (for use as type annotations) and as global Window properties
 * (so feature-detection via `window.SpeechRecognition` compiles cleanly).
 *
 * Spec reference: https://wicg.github.io/speech-api/
 */

export interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

export interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

export type SpeechRecognitionErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed'

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode
  readonly message: string
}

export interface SpeechRecognition extends EventTarget {
  // Configuration
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number

  // Lifecycle
  start(): void
  stop(): void
  abort(): void

  // Event handlers
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  onnomatch: ((event: SpeechRecognitionEvent) => void) | null
  onsoundstart: (() => void) | null
  onsoundend: (() => void) | null
  onspeechstart: (() => void) | null
  onspeechend: (() => void) | null
  onaudiostart: (() => void) | null
  onaudioend: (() => void) | null
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor | undefined
    webkitSpeechRecognition: SpeechRecognitionConstructor | undefined
  }
}
