import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f6e7c8',
          borderRadius: 36,
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: '#1e4d32',
            letterSpacing: '-0.04em',
            fontFamily: 'Georgia, serif',
          }}
        >
          MA
        </div>
      </div>
    ),
    { ...size },
  )
}
