import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
          borderRadius: 38,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -3,
            fontFamily: 'sans-serif',
            lineHeight: 1,
          }}
        >
          RF
        </span>
        <span
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 4,
            fontFamily: 'sans-serif',
          }}
        >
          SC
        </span>
      </div>
    ),
    { ...size }
  )
}
