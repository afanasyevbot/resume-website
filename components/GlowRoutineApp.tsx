'use client'

import { useState } from 'react'

type Tab = 'home' | 'routine' | 'advisor'

const rings = [
  { letter: 'M', pct: 100, isToday: false },
  { letter: 'T', pct: 100, isToday: false },
  { letter: 'W', pct: 100, isToday: false },
  { letter: 'T', pct: 100, isToday: false },
  { letter: 'F', pct: 100, isToday: false },
  { letter: 'S', pct: 50, isToday: false },
  { letter: 'S', pct: 50, isToday: true },
]

const overview = [
  { label: 'AM Skin', done: 2, total: 4, pct: 50 },
  { label: 'AM Vitamins', done: 2, total: 2, pct: 100 },
  { label: 'PM Vitamins', done: 0, total: 1, pct: 0 },
  { label: 'PM Skin', done: 0, total: 4, pct: 0 },
]

const routineItems = [
  { id: '1', name: 'Gentle Cleanser', emoji: '🫧', tone: 'bg-[#e6f1fb]', dose: 'Pump · 30 sec', done: true },
  { id: '2', name: 'Vitamin C Serum', emoji: '✨', tone: 'bg-[#eeedfe]', dose: '3 drops · pat in', done: true },
  { id: '3', name: 'Moisturizer', emoji: '🧴', tone: 'bg-[#faeeda]', dose: 'Pea size', done: false },
  { id: '4', name: 'SPF 50', emoji: '☀️', tone: 'bg-[#fbeaf0]', dose: 'Two finger lengths', done: false },
]

const tabs: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'routine', label: 'Routine' },
  { id: 'advisor', label: 'Advisor' },
]

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-[32px] border border-[rgba(60,60,67,0.12)] bg-[#faf8f6] shadow-[0_16px_48px_rgba(60,40,70,0.12)] min-h-[680px] flex flex-col"
      style={{
        backgroundImage:
          'radial-gradient(120% 80% at 100% 0, rgba(200,132,168,0.1) 0, rgba(200,132,168,0) 55%), radial-gradient(120% 80% at 0 0, rgba(160,102,160,0.08) 0, rgba(160,102,160,0) 50%)',
      }}
      role="region"
      aria-label="Glow Routine interactive preview"
    >
      {children}
    </div>
  )
}

export default function GlowRoutineApp() {
  const [tab, setTab] = useState<Tab>('home')
  const [items, setItems] = useState(routineItems)

  function toggle(id: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
  }

  return (
    <div className="mx-auto w-full max-w-[390px]">
      <PhoneShell>
        {tab === 'home' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="shrink-0 border-b border-[rgba(60,60,67,0.08)] bg-white/70 px-5 pb-4 pt-4 text-center backdrop-blur">
              <p className="text-[11px] font-medium tracking-wide text-[#6b6b73]">Good morning ☀️</p>
              <h3 className="mt-1 font-serif italic text-[27px] font-semibold tracking-[-0.01em] leading-none bg-gradient-to-br from-[#a066a0] to-[#d07ab0] bg-clip-text text-transparent">
                Glow Routine
              </h3>
              <p className="mt-1 text-[11px] text-[#6b6b73]">Saturday, September 5</p>
            </header>
            <div className="shrink-0 px-3.5 py-3">
              <div className="relative overflow-hidden rounded-[24px] border border-[rgba(60,60,67,0.08)] bg-gradient-to-br from-[#f7eff8] to-[#fbeef4] p-4 shadow-[0_1px_2px_rgba(60,40,70,0.04),0_4px_12px_rgba(60,40,70,0.05)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#a066a0] to-[#c97ab0]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a066a0] mb-2">✦ Morning affirmation</p>
                <p className="text-base font-medium text-[#1c1c1e] leading-relaxed">Your consistency is your superpower.</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3.5 pb-4">
              <div className="rounded-2xl border border-[rgba(60,60,67,0.08)] bg-white p-4 shadow-[0_1px_2px_rgba(60,40,70,0.04),0_4px_12px_rgba(60,40,70,0.05)] mb-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <p className="text-[13px] font-medium text-[#1c1c1e]">Today&apos;s overview</p>
                    <p className="text-[11px] font-medium text-[#a066a0] mt-0.5">View history →</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-[28px] font-semibold leading-none tabular-nums bg-gradient-to-br from-[#a066a0] to-[#d07ab0] bg-clip-text text-transparent">
                      12 🔥
                    </p>
                    <p className="text-[11px] text-[#6b6b73] mt-0.5">day streak</p>
                  </div>
                </div>
                <div className="flex justify-between gap-1.5">
                  {rings.map((day, i) => (
                    <div key={`${day.letter}-${i}`} className="flex-1 text-center">
                      <p className="text-[10px] text-[#6b6b73] mb-1">{day.letter}</p>
                      <div
                        className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[13px] ${
                          day.pct === 100
                            ? 'bg-gradient-to-br from-[#a066a0] to-[#c97ab0] text-white shadow-[0_6px_20px_rgba(160,102,160,0.3)]'
                            : day.pct > 0
                              ? 'bg-[#e0c8e0]'
                              : 'bg-[#f5eef8]'
                        } ${day.isToday ? 'ring-2 ring-[#a066a0] ring-offset-1 ring-offset-white scale-105' : ''}`}
                      >
                        {day.pct === 100 ? '✓' : day.pct > 0 ? '·' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {overview.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-[rgba(60,60,67,0.08)] bg-white p-3.5 shadow-[0_1px_2px_rgba(60,40,70,0.04),0_4px_12px_rgba(60,40,70,0.05)]"
                  >
                    <p className="text-[11px] text-[#6b6b73] mb-0.5">{card.label}</p>
                    <p className="font-serif text-[22px] font-semibold tabular-nums bg-gradient-to-br from-[#a066a0] to-[#d07ab0] bg-clip-text text-transparent">
                      {card.pct}%
                    </p>
                    <p className="text-[11px] text-[#6b6b73]">
                      {card.done} of {card.total} done
                    </p>
                    <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-[#f5eef8]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#a066a0] to-[#c97ab0]" style={{ width: `${card.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'routine' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="shrink-0 border-b border-[rgba(60,60,67,0.08)] bg-white/70 px-5 pb-3 pt-4 backdrop-blur">
              <h3 className="font-serif text-[26px] font-semibold tracking-[-0.01em] text-[#1c1c1e]">Routine</h3>
              <p className="text-xs text-[#6b6b73] mt-0.5">Your daily steps</p>
            </header>
            <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center gap-3 rounded-2xl border border-[rgba(60,60,67,0.08)] bg-white p-3.5 text-left min-h-[48px]"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${item.tone}`}>{item.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[14px] font-medium ${item.done ? 'text-[#6b6b73] line-through' : 'text-[#1c1c1e]'}`}>
                      {item.name}
                    </span>
                    <span className="block text-[11px] text-[#6b6b73]">{item.dose}</span>
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${
                      item.done ? 'bg-gradient-to-br from-[#a066a0] to-[#c97ab0] text-white' : 'border border-[rgba(60,60,67,0.2)]'
                    }`}
                  >
                    {item.done ? '✓' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'advisor' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="shrink-0 border-b border-[rgba(60,60,67,0.08)] bg-white/70 px-5 pb-3 pt-4 backdrop-blur">
              <h3 className="font-serif text-[26px] font-semibold tracking-[-0.01em] text-[#1c1c1e]">Advisor</h3>
              <p className="text-xs text-[#6b6b73] mt-0.5">Ask about your routine</p>
            </header>
            <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3">
              <div className="self-end ml-8 rounded-2xl bg-[#f5eef8] px-3.5 py-2.5 text-[13px] text-[#1c1c1e]">
                Can I use retinol and vitamin C together?
              </div>
              <div className="mr-8 rounded-2xl bg-white border border-[rgba(60,60,67,0.08)] px-3.5 py-2.5 text-[13px] text-[#3a3a40] leading-relaxed">
                Use vitamin C in your AM routine and retinol in PM, not the same application. Your current split already follows that pattern.
              </div>
            </div>
          </div>
        )}

        <nav className="shrink-0 grid grid-cols-3 border-t border-[rgba(60,60,67,0.08)] bg-white/80 backdrop-blur">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`min-h-[52px] text-[12px] font-medium ${
                tab === item.id ? 'text-[#a066a0]' : 'text-[#6b6b73]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </PhoneShell>
      <p className="text-[11px] text-[#6b6b73] mt-3 text-center">Built from the Glow Routine app. Tap Home, Routine, or Advisor.</p>
    </div>
  )
}
