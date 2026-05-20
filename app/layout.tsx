import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

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

export const metadata: Metadata = {
  title: 'Matthew Afanasiev',
  description: 'I close deals. I ship AI systems.',
  openGraph: {
    title: 'Matthew Afanasiev',
    description: 'Revenue × AI — SaaS Sales Executive & AI Systems Builder',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} antialiased`}>
      <body>
        {/* Fixed gradient background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 55% at 50% -5%, rgba(201,169,110,0.22) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 90% 10%, rgba(180,140,80,0.10) 0%, transparent 50%),
              radial-gradient(ellipse 50% 60% at 10% 80%, rgba(160,120,60,0.06) 0%, transparent 50%),
              #111009
            `,
          }}
        />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
