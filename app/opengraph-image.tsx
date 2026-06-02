import { ImageResponse } from 'next/og'

export const alt = 'Matthew Afanasiev — SaaS Sales Executive & AI Systems Builder'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '90px',
          background:
            'radial-gradient(ellipse 100% 65% at 50% -10%, rgba(212,178,120,0.38) 0%, rgba(180,140,80,0.12) 45%, transparent 70%), #1a1510',
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color: '#d4b278',
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          Revenue × AI
        </div>
        <div
          style={{
            fontSize: 92,
            color: '#f8f4ee',
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          Matthew Afanasiev
        </div>
        <div style={{ fontSize: 38, color: '#c8ae90', fontWeight: 400 }}>
          I close deals. I build AI systems.
        </div>
      </div>
    ),
    { ...size }
  )
}
