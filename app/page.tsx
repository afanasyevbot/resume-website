import SiteHeader from '@/components/SiteHeader'
import SiteBackdrop from '@/components/SiteBackdrop'
import Hero from '@/components/Hero'
import SalesMethodology from '@/components/SalesMethodology'
import AskSection from '@/components/AskSection'
import ExperienceSection from '@/components/ExperienceSection'
import SPSCaseStudySection from '@/components/SPSCaseStudySection'
import SystemsSection from '@/components/SystemsSection'
import ClosingHero from '@/components/ClosingHero'
import Footer from '@/components/Footer'

export default function Page() {
  return (
    <div className="site-canvas">
      <SiteBackdrop />
      <SiteHeader />
      <main className="relative z-10 max-w-page mx-auto px-5 sm:px-10 lg:px-12 pb-6 sm:pb-4">
        <Hero />
        <SPSCaseStudySection />
        <SystemsSection />
        <ExperienceSection />
        <SalesMethodology />
        <AskSection />
        <ClosingHero />
        <Footer />
      </main>
    </div>
  )
}
