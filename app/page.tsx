import SiteHeader from '@/components/SiteHeader'
import Hero from '@/components/Hero'
import SalesMethodology from '@/components/SalesMethodology'
import AskSection from '@/components/AskSection'
import ExperienceSection from '@/components/ExperienceSection'
import SystemsSection from '@/components/SystemsSection'
import ClosingHero from '@/components/ClosingHero'
import Footer from '@/components/Footer'

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-page mx-auto px-5 sm:px-10 lg:px-12 pb-4">
        <Hero />
        <SalesMethodology />
        <AskSection />
        <ExperienceSection />
        <SystemsSection />
        <ClosingHero />
        <Footer />
      </main>
    </>
  )
}
