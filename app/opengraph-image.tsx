import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { professionalLabel } from '@/lib/siteContent'

export const alt = 'Matthew Afanasiev · Sales. Depth. Builder fluency.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const fontDir = join(process.cwd(), 'assets/fonts')
const [cormorantBold, cormorantSemibold, interMedium, headshot] = await Promise.all([
  readFile(join(fontDir, 'CormorantGaramond-Bold.woff')),
  readFile(join(fontDir, 'CormorantGaramond-SemiBold.woff')),
  readFile(join(fontDir, 'Inter-Medium.woff')),
  readFile(join(process.cwd(), 'assets/og/headshot.jpg'), 'base64'),
])

const headshotSrc = `data:image/jpeg;base64,${headshot}`

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#f6e7c8',
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            width: 420,
            height: 420,
            top: -180,
            left: -80,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(30, 77, 50, 0.16) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            width: 520,
            height: 520,
            bottom: -220,
            left: -140,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(212, 168, 83, 0.26) 0%, transparent 72%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: 730,
            height: '100%',
            padding: '64px 40px 64px 80px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: 'Inter',
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: 3.2,
              textTransform: 'uppercase',
              color: '#8a8478',
              marginBottom: 26,
            }}
          >
            {professionalLabel.replace(' | ', '  ·  ')}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Cormorant',
              fontWeight: 700,
              fontSize: 74,
              lineHeight: 0.92,
              letterSpacing: -2.4,
              color: '#1c1a16',
            }}
          >
            <div style={{ display: 'flex' }}>Sales.</div>
            <div style={{ display: 'flex' }}>Depth.</div>
            <div style={{ display: 'flex', color: '#1e4d32' }}>Builder fluency.</div>
          </div>

          <div
            style={{
              display: 'flex',
              width: 64,
              height: 3,
              marginTop: 32,
              borderRadius: 2,
              background: '#1e4d32',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 28,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: 'Cormorant',
                fontWeight: 600,
                fontSize: 34,
                color: '#1c1a16',
                letterSpacing: -0.6,
              }}
            >
              Matthew Afanasiev
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'Inter',
                fontWeight: 500,
                fontSize: 20,
                color: '#8a8478',
                marginTop: 8,
                letterSpacing: 0.4,
              }}
            >
              mafanasiev.me
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            display: 'flex',
            right: 0,
            top: 0,
            width: 540,
            height: 630,
            overflow: 'hidden',
          }}
        >
          <img
            src={headshotSrc}
            alt=""
            width={540}
            height={630}
            style={{
              objectFit: 'cover',
              objectPosition: 'center 10%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              left: 0,
              top: 0,
              width: 140,
              height: 630,
              background:
                'linear-gradient(to right, #f6e7c8 0%, rgba(246, 231, 200, 0.45) 36%, rgba(246, 231, 200, 0) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              left: 0,
              right: 0,
              bottom: 0,
              height: 72,
              background: 'linear-gradient(to top, rgba(246, 231, 200, 0.28) 0%, rgba(246, 231, 200, 0) 100%)',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Cormorant', data: cormorantBold, weight: 700, style: 'normal' },
        { name: 'Cormorant', data: cormorantSemibold, weight: 600, style: 'normal' },
        { name: 'Inter', data: interMedium, weight: 500, style: 'normal' },
      ],
    },
  )
}
