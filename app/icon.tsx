import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: -0.5,
            fontFamily: 'sans-serif',
          }}
        >
          RF
        </span>
      </div>
    ),
    { ...size }
  )
}
