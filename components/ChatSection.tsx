'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_CHIPS = [
  'What were his deal sizes?',
  'What industries has he sold into?',
  'What AI systems has he built?',
  'What are his honest gaps?',
]

const QUESTION_LIMIT = 5

export default function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const limitReached = questionCount >= QUESTION_LIMIT

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading || limitReached) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setQuestionCount((c) => c + 1)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: messages }),
      })
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.reply || data.error || 'Something went wrong.' }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleChip(chip: string) {
    sendMessage(chip)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <section id="chat-section" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-2">Ask AI About Matthew</p>
      <p className="text-[15px] text-text-muted mb-8 font-light">Grounded strictly in real data. Honest about gaps. Ask anything a hiring manager would.</p>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-7 pb-6 border-b border-border-inner flex justify-between items-end">
          <div>
            <h2 className="font-display text-[32px] font-semibold text-text-bright">What do you want to know?</h2>
            <p className="text-[13px] text-text-dim mt-1">Powered by Claude · Answers drawn from Matthew&apos;s complete professional record</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] tracking-[2px] uppercase text-gold">
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            Live
          </div>
        </div>

        {/* Suggested chips — shown only before first message */}
        {messages.length === 0 && !limitReached && (
          <div className="px-8 py-4 flex flex-wrap gap-2">
            {SUGGESTED_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChip(chip)}
                disabled={loading}
                className="text-[12px] text-text-dim border border-border rounded-full px-3.5 py-1.5 bg-bg hover:border-gold/30 hover:text-text-muted transition-colors disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="px-8 py-6 flex flex-col gap-4 min-h-[180px] max-h-[420px] overflow-y-auto">
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <div key={i} className="self-end max-w-[70%]">
                  <div className="bg-[#1e1a14] border border-border rounded-[10px_10px_2px_10px] px-4 py-2.5 text-[14px] text-text-secondary italic">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="self-start max-w-[88%]">
                  <p className="text-[10px] tracking-[2px] uppercase text-text-ghost font-semibold mb-1.5">AI · Based on Matthew&apos;s record</p>
                  <div className="bg-surface-deep border border-border rounded-[2px_10px_10px_10px] px-5 py-3.5 text-[14px] text-text-secondary leading-[1.8]">
                    {msg.content}
                  </div>
                </div>
              )
            )}
            {loading && (
              <div className="self-start max-w-[88%]">
                <p className="text-[10px] tracking-[2px] uppercase text-text-ghost font-semibold mb-1.5">AI · Based on Matthew&apos;s record</p>
                <div className="bg-surface-deep border border-border rounded-[2px_10px_10px_10px] px-5 py-3.5 text-[14px] text-text-ghost">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input or limit CTA */}
        {limitReached ? (
          <div className="px-8 py-8 border-t border-border-inner text-center">
            <p className="font-display text-[22px] text-text-primary mb-5">&ldquo;That&apos;s enough — just set the call with Matthew.&rdquo;</p>
            <a
              href="https://calendly.com/mafanasiev-fidelisstrategy/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-gold border border-gold/40 bg-gold/5 px-7 py-3 rounded text-[14px] font-semibold hover:bg-gold/10 transition-colors"
            >
              Schedule 30 Minutes →
            </a>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-border-inner flex gap-2.5 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Matthew's background..."
              disabled={loading}
              className="flex-1 bg-bg border border-border rounded text-[14px] text-text-secondary placeholder:text-text-ghost placeholder:italic px-4 py-3 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="text-gold border border-gold/40 rounded px-5 py-3 text-[13px] font-semibold hover:bg-gold/5 transition-colors disabled:opacity-40"
            >
              Ask →
            </button>
          </div>
        )}

        {/* Question counter */}
        {!limitReached && questionCount > 0 && (
          <div className="px-8 pb-3 text-right">
            <span className="text-[10px] text-text-ghost">
              {QUESTION_LIMIT - questionCount} question{QUESTION_LIMIT - questionCount !== 1 ? 's' : ''} remaining
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
