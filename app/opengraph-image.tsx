import { ImageResponse } from 'next/og'

export const alt = 'Matthew Afanasiev · B2B SaaS Account Executive'
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
          background: '#f6e7c8',
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#8a8478',
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          B2B SaaS · Prescriptive selling
        </div>
        <div
          style={{
            fontSize: 84,
            color: '#1c1a16',
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          Matthew Afanasiev
        </div>
        <div style={{ fontSize: 34, color: '#3f3a32', fontWeight: 400 }}>
          I sell by guiding the buyer.
        </div>
      </div>
    ),
    { ...size },
  )
}
