'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { type ProjectContext } from '@/lib/ai/context'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  projectContext: ProjectContext
  projectTitle: string
}

// ---------------------------------------------------------------------------
// Streaming dots animation for pending AI response
// ---------------------------------------------------------------------------

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 py-1" aria-label="Co-Author is responding">
      <span
        className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-bounce"
        style={{ animationDelay: '160ms' }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-bounce"
        style={{ animationDelay: '320ms' }}
      />
    </span>
  )
}

// ---------------------------------------------------------------------------
// Individual message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <p className="text-xs text-muted-foreground bg-muted/60 rounded-full px-3 py-1 italic">
          {message.content}
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-0.5 ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Label */}
      <span className="text-[10px] font-medium tracking-wide text-muted-foreground px-1">
        {isUser ? 'You' : 'Co-Author'}
      </span>

      {/* Bubble */}
      <div
        className={[
          'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-secondary text-secondary-foreground rounded-tl-sm font-serif',
        ].join(' ')}
      >
        {message.content}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ChatPanel component
// ---------------------------------------------------------------------------

export function ChatPanel({
  isOpen,
  onClose,
  projectContext,
  projectTitle,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to let the CSS transition begin before focusing
      const id = setTimeout(() => textareaRef.current?.focus(), 150)
      return () => clearTimeout(id)
    }
  }, [isOpen])

  // Clean up any in-flight request when the panel unmounts
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const canSend = input.trim().length > 0 && !isStreaming

  // ---------------------------------------------------------------------------
  // Send message handler
  // ---------------------------------------------------------------------------

  const handleSend = async () => {
    const userText = input.trim()
    if (!userText || isStreaming) return

    const userMessage: ChatMessage = { role: 'user', content: userText }

    // Append user message immediately and clear input
    const updatedHistory: ChatMessage[] = [...messages, userMessage]
    setMessages(updatedHistory)
    setInput('')
    setIsStreaming(true)

    // Placeholder AI message that will be updated as chunks arrive
    const placeholderMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages((prev) => [...prev, placeholderMsg])

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // Only send user/assistant turns to the API — system messages are local only
      const apiMessages = updatedHistory
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map(({ role, content }) => ({ role, content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context: projectContext }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          (errData as { error?: string }).error || `Server error ${res.status}`
        )
      }

      // Stream the response
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let aiMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        aiMessage += decoder.decode(value, { stream: true })

        // Replace the placeholder with accumulated text in-place
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: aiMessage }
          return copy
        })
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return

      const errorText =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'

      // Replace placeholder with error system message
      setMessages((prev) => {
        const copy = [...prev]
        // Remove the empty placeholder
        copy.pop()
        copy.push({
          role: 'system',
          content: `Error: ${errorText}`,
        })
        return copy
      })
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard handler for the textarea
  // ---------------------------------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ---------------------------------------------------------------------------
  // Clear conversation
  // ---------------------------------------------------------------------------

  const handleClear = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort()
      setIsStreaming(false)
    }
    setMessages([])
    setInput('')
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Co-Author Chat Panel"
        className={[
          // Positioning & sizing
          'fixed top-0 right-0 z-50 h-full w-full sm:w-[380px]',
          // Background — cream-ish card surface matching the app palette
          'bg-card border-l border-border shadow-2xl',
          // Flex column to stack header / messages / input
          'flex flex-col',
          // Slide animation
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* ------------------------------------------------------------------ */}
        {/* Header                                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground shrink-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium tracking-widest uppercase text-primary-foreground/60">
              AI Co-Author
            </span>
            <h2 className="font-serif text-base font-semibold leading-snug line-clamp-1">
              {projectTitle}
            </h2>
          </div>

          <div className="flex items-center gap-3 ml-2 mt-0.5 shrink-0">
            {/* Clear conversation */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors underline underline-offset-2"
                aria-label="Clear conversation"
              >
                Clear
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Co-Author panel"
              className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-primary-foreground/10 transition-colors"
            >
              {/* X icon */}
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
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Messages area                                                       */}
        {/* ------------------------------------------------------------------ */}
        <div
          className={[
            'flex-1 overflow-y-auto px-4 py-4 space-y-4',
            // Thin styled scrollbar
            '[&::-webkit-scrollbar]:w-1.5',
            '[&::-webkit-scrollbar-track]:bg-transparent',
            '[&::-webkit-scrollbar-thumb]:rounded-full',
            '[&::-webkit-scrollbar-thumb]:bg-border',
            '[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40',
          ].join(' ')}
          aria-live="polite"
          aria-label="Chat messages"
        >
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
              {/* Cross / quill icon placeholder */}
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-50 border border-amber-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6 text-amber-600"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div>
                <p className="font-serif text-sm font-semibold text-foreground">
                  Your Co-Author is ready
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Ask for help with ideas, structure, scripture, or anything about your project.
                </p>
              </div>
              {/* Quick-start suggestions */}
              <div className="flex flex-col gap-1.5 w-full mt-1">
                {[
                  'What scripture fits this chapter?',
                  'Help me outline the next section.',
                  'How do I open with more impact?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-border bg-secondary hover:bg-accent/20 hover:border-accent transition-colors text-secondary-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, index) => {
            const isLastAndStreaming =
              isStreaming && index === messages.length - 1 && msg.role === 'assistant'

            if (isLastAndStreaming && msg.content === '') {
              // Show streaming dots while waiting for first chunk
              return (
                <div key={index} className="flex flex-col gap-0.5 items-start">
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground px-1">
                    Co-Author
                  </span>
                  <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                    <StreamingDots />
                  </div>
                </div>
              )
            }

            return <MessageBubble key={index} message={msg} />
          })}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Input area                                                          */}
        {/* ------------------------------------------------------------------ */}
        <div className="shrink-0 border-t border-border bg-card px-3 pt-3 pb-4">
          <div className="flex items-end gap-2">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your Co-Author…"
              rows={2}
              disabled={isStreaming}
              aria-label="Message input"
              className={[
                'flex-1 resize-none rounded-xl border border-input bg-background',
                'px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
                'leading-relaxed',
                // Focus ring using the gold ring token
                'outline-none focus:border-ring focus:ring-2 focus:ring-ring/30',
                'transition-colors duration-150',
                // Thin scrollbar inside textarea on overflow
                '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border',
                isStreaming ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            />

            {/* Send button */}
            <Button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              size="icon"
              aria-label="Send message"
              className="shrink-0 h-10 w-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40"
            >
              {isStreaming ? (
                /* Spinner while waiting */
                <svg
                  className="size-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                /* Paper-plane / send icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4"
                  aria-hidden="true"
                >
                  <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
                </svg>
              )}
            </Button>
          </div>

          {/* Hint text */}
          <p className="mt-2 text-[10px] text-muted-foreground text-center select-none">
            Enter to send &middot; Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  )
}
