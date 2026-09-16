import { personalSignature } from '@/lib/siteContent'

export default function Footer() {
  return (
    <footer className="pb-16 sm:pb-20">
      <p className="text-[13px] text-muted text-center tracking-wide">{personalSignature}</p>
      <p className="text-[12px] text-ghost text-center mt-4">© {new Date().getFullYear()} Matthew Afanasiev</p>
    </footer>
  )
}
