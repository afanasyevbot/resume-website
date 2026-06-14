import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter, Archivo, Fraunces } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Engine display face — a warm, characterful serif for headings + figures.
// Replaces the old monospace "terminal" display font.
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

// Engine "Night Desk" theme fonts — used only inside .engine-ops.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://matthew-afanasiev.vercel.app'),
  title: 'Matthew Afanasiev',
  description: 'I close deals. I build AI systems.',
  openGraph: {
    title: 'Matthew Afanasiev',
    description: 'Revenue × AI — SaaS Sales Executive & AI Systems Builder',
    url: 'https://matthew-afanasiev.vercel.app',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${archivo.variable} ${fraunces.variable} antialiased`}>
      <body>
        {/* Fixed gradient background */}
        <div
          className="fixed inset-0 pointer-events-none z-0 print:hidden"
          style={{
            background: `
              radial-gradient(ellipse 100% 65% at 50% -10%, rgba(212,178,120,0.38) 0%, rgba(180,140,80,0.12) 45%, transparent 70%),
              radial-gradient(ellipse 70% 50% at 95% 5%, rgba(200,155,80,0.20) 0%, transparent 55%),
              radial-gradient(ellipse 60% 70% at 5% 85%, rgba(170,130,60,0.14) 0%, transparent 55%),
              radial-gradient(ellipse 80% 40% at 50% 100%, rgba(140,100,40,0.10) 0%, transparent 60%),
              #1a1510
            `,
          }}
        />
        <div className="relative z-10">{children}</div>
        <Analytics />
      </body>
    </html>
  )
}
