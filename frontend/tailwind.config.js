/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        toi: {
          bg: 'rgb(var(--color-toi-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-toi-surface) / <alpha-value>)',
          card: 'rgb(var(--color-toi-card) / <alpha-value>)',
          border: 'rgb(var(--color-toi-border) / <alpha-value>)',
          accent: 'rgb(var(--color-toi-accent) / <alpha-value>)',
          'accent-hover': 'rgb(var(--color-toi-accent-hover) / <alpha-value>)',
          green: 'rgb(var(--color-toi-green) / <alpha-value>)',
          yellow: 'rgb(var(--color-toi-yellow) / <alpha-value>)',
          red: 'rgb(var(--color-toi-red) / <alpha-value>)',
          muted: 'rgb(var(--color-toi-muted) / <alpha-value>)',
          text: 'rgb(var(--color-toi-text) / <alpha-value>)',
          'text-muted': 'rgb(var(--color-toi-text-muted) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
