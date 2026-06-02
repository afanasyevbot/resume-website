'use client'

import { useRef } from 'react'
import Hero from '@/components/Hero'
import AISystemsSection from '@/components/AISystemsSection'
import ProBonoSection from '@/components/ProBonoSection'
import ChatSection from '@/components/ChatSection'
import BehindTheResume from '@/components/BehindTheResume'
import SkillsMatrix from '@/components/SkillsMatrix'
import FitAssessment from '@/components/FitAssessment'
import Footer from '@/components/Footer'

export default function Page() {
  const chatRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)

  function scrollTo(ref: React.RefObject<HTMLDivElement | null>, offset = 40) {
    if (!ref.current) return
    const top = ref.current.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  function scrollToChat() {
    scrollTo(chatRef)
  }

  function scrollToFit() {
    scrollTo(fitRef)
  }

  return (
    <main className="max-w-page mx-auto px-5 sm:px-12 pb-24">
      <Hero onAskAI={scrollToChat} onAnalyzeFit={scrollToFit} />
      <div ref={chatRef}>
        <ChatSection />
      </div>
      <AISystemsSection />
      <ProBonoSection />
      <BehindTheResume />
      <SkillsMatrix />
      <div ref={fitRef}>
        <FitAssessment />
      </div>
      <Footer />
    </main>
  )
}
