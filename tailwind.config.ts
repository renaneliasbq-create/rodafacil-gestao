import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        sidebar: {
          bg:      '#0f172a',
          hover:   '#1e293b',
          active:  '#1e40af',
          border:  '#1e293b',
          text:    '#94a3b8',
          'text-active': '#ffffff',
        },
      },
    },
  },
  plugins: [],
}

export default config
