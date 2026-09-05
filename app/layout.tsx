import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter, Archivo, Fraunces } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Engine display face — a warm, characterful serif for headings + figures.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fraunces',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://mafanasiev.me'),
  title: 'Matthew Afanasiev · AE & GTM',
  description:
    'Matthew Afanasiev · B2B SaaS account executive. Prescriptive selling: find the pain, guide the buying process, teach how the solution solves it.',
  openGraph: {
    title: 'Matthew Afanasiev · AE & GTM',
    description:
      'B2B SaaS account executive. Prescriptive selling, five years closing, seven systems built.',
    url: 'https://mafanasiev.me',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${archivo.variable} ${fraunces.variable} antialiased`}>
      <body className="bg-paper text-ink">
        <div className="relative z-10">{children}</div>
        <Analytics />
      </body>
    </html>
  )
}
