/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0D12',
        obsidian: '#0D0D12',
        accent: '#4DB292',
        'accent-glow': '#2ce09a',
        champagne: '#4DB292',
        ivory: '#FAF8F5',
        slate: '#2A2A35',
        bronze: { DEFAULT: '#8B6914', light: '#C4943A', dark: '#6B4F0E' },
        silver: { DEFAULT: '#8A8A8A', light: '#B8B8B8', dark: '#5C5C5C' },
        gold: { DEFAULT: '#B8860B', light: '#DAA520', dark: '#8B6914' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        drama: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'blob': 'blob 12s infinite',
        'border-flow': 'borderFlow 4s ease infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(40px, -60px) scale(1.1)' },
          '66%': { transform: 'translate(-30px, 30px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        borderFlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}
