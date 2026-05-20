import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#FBF9F6',
          secondary: '#FFFFFF',
          dark:      '#1A1D26',
          darkCard:  '#242834',
        },
        accent: {
          sage:  '#0f2e6d',   // primary accent (IIMB Navy)
          peach: '#a82929',   // warm highlight (IIMB Red)
          mint:  '#B4C7B8',   // success / done
          sand:  '#D4C5B9',
        },
        text: {
          primary:   '#2C2A36',
          secondary: '#6B6778',
          darkPri:   '#F0EEE8',
          darkSec:   '#8A8898',
        },
        border: {
          light: '#E8E4DD',
          dark:  '#3A3F4D',
        },
        coach: {
          light: '#EEF3F5',
          dark:  '#1D2535',
        },
      },
      fonts: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config
