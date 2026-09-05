'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { FitResult } from '@/lib/types'
import { OPEN_ASK_EVENT, calendlyUrl, publicEmail } from '@/lib/siteContent'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: number
  fitResult?: FitResult
}

const SUGGESTED_CHIPS = [
  'What were his deal sizes?',
  'What industries has he sold into?',
  'How does he sell?',
  'What is his go-to-market experience?',
]

const QUESTION_LIMIT = 5
let msgId = 0

function looksLikeJd(text: string) {
  const n = text.toLowerCase()
  return (
    ['responsibilities', 'requirements', 'years of experience', 'we are looking', 'you will', 'job description', 'about the role'].some(
      (k) => n.includes(k),
    ) || text.split('\n').length >= 4
  )
}

export default function AskSection() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const limitReached = questionCount >= QUESTION_LIMIT

  useEffect(() => {
    function onOpen() {
      inputRef.current?.focus()
    }
    window.addEventListener(OPEN_ASK_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_ASK_EVENT, onOpen)
  }, [])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading || limitReached) return

    const userMessage: Message = { role: 'user', content: trimmed, id: ++msgId }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      if (looksLikeJd(trimmed)) {
        const res = await fetch('/api/fit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription: trimmed }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Analysis failed')
        setQuestionCount((c) => c + 1)
        setMessages([...newMessages, { role: 'assistant', content: 'Role fit analysis', fitResult: data, id: ++msgId }])
        return
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map(({ role, content }) => ({ role, content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setQuestionCount((c) => c + 1)
      setMessages([...newMessages, { role: 'assistant', content: data.reply || data.error || 'Something went wrong.', id: ++msgId }])
    } catch (e) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: e instanceof Error ? e.message : 'Something went wrong. Please try again.', id: ++msgId },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <section id="tools" className="section-band">
      <div className="mb-10 sm:mb-14">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-3 text-ghost">Ask</p>
        <h2 className="font-display text-[30px] sm:text-[40px] lg:text-[44px] font-medium leading-[1.12] tracking-[-0.02em] max-w-[18ch] text-ink">
          Ask about me, or paste a JD
        </h2>
        <p className="text-[15px] sm:text-[16px] leading-[1.65] mt-4 max-w-[52ch] text-muted">
          Grounded in the real record. Hiring managers can ask a question or drop in a job description for an honest fit read.
        </p>
      </div>

      <div className="card overflow-hidden p-5 sm:p-8">
        {limitReached ? (
          <div className="text-center py-4">
            <p className="font-display text-[22px] text-ink mb-5">&ldquo;That&apos;s enough, just set the call with Matthew.&rdquo;</p>
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 rounded-[8px] text-[14px] font-semibold bg-gold text-ink border border-gold hover:opacity-90"
            >
              Schedule 20 minutes →
            </a>
          </div>
        ) : (
          <>
            <p className="text-[14px] text-muted mb-4">Ask a question, or paste a role description in the same box.</p>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {SUGGESTED_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => sendMessage(chip)}
                    disabled={loading}
                    className="min-h-[48px] text-[13px] text-muted border border-border rounded-[8px] px-4 py-2.5 bg-paper hover:border-gold/70 hover:bg-gold/15 transition-colors disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {messages.length > 0 && (
              <div ref={scrollContainerRef} className="flex flex-col gap-4 min-h-[120px] max-h-[400px] overflow-y-auto mb-4">
                {messages.map((msg) =>
                  msg.role === 'user' ? (
                    <div key={msg.id} className="self-end max-w-[85%]">
                      <div className="bg-paper border border-border rounded-[8px] px-4 py-2.5 text-[14px] text-ink whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="self-start max-w-[92%]">
                      <p className="text-[11px] text-ghost font-medium mb-1.5">{msg.fitResult ? 'Role fit' : 'Response'}</p>
                      <div className="border border-border rounded-[8px] px-4 py-3 text-[14px] text-muted leading-[1.7]">
                        {msg.fitResult ? (
                          <FitCard result={msg.fitResult} />
                        ) : (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="text-ink font-semibold">{children}</strong>,
                              ul: ({ children }) => <ul className="mt-2 mb-2 space-y-1 pl-4">{children}</ul>,
                              li: ({ children }) => <li className="list-disc">{children}</li>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ),
                )}
                {loading && (
                  <div className="self-start max-w-[92%]">
                    <p className="text-[11px] text-ghost font-medium mb-1.5">Response</p>
                    <div className="border border-border rounded-[8px] px-4 py-3 text-[14px] text-muted animate-pulse">Thinking...</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or paste a job description..."
                aria-label="Your question"
                rows={2}
                disabled={loading}
                className="flex-1 min-h-[44px] bg-paper border border-border rounded-[4px] text-[14px] text-ink placeholder:text-ghost px-4 py-3 resize-y disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="min-h-[44px] min-w-[44px] px-4 rounded-[4px] border border-border bg-paper text-[14px] font-medium text-ink hover:border-ink/30 transition-colors disabled:opacity-40"
              >
                Send
              </button>
            </div>
            {questionCount > 0 && (
              <p className="text-[10px] text-ghost mt-3 text-right">
                {QUESTION_LIMIT - questionCount} question{QUESTION_LIMIT - questionCount !== 1 ? 's' : ''} remaining
              </p>
            )}
            <p className="sr-only">{publicEmail}</p>
          </>
        )}
      </div>
    </section>
  )
}

function FitCard({ result }: { result: FitResult }) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-display text-[40px] font-semibold text-ink leading-none">
          {Math.round(Math.min(100, Math.max(0, result.score)))}%
        </span>
        <span className="text-[14px] text-muted">{result.verdict}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ghost mb-2">Strengths</p>
          <ul className="space-y-1">
            {result.strengths.map((s) => (
              <li key={s} className="text-[13px] leading-[1.6]">
                · {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ghost mb-2">Flags</p>
          <ul className="space-y-1">
            {result.flags.map((f) => (
              <li key={f} className="text-[13px] leading-[1.6]">
                · {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
