/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#F5F7FA',
          secondary: '#ECEFF4',
          tertiary: '#E8ECF2',
          quaternary: '#DDE3EA',
        },
        surface: {
          1: '#FFFFFF',
          2: '#F5F7FA',
          3: '#ECEFF4',
          4: '#E8ECF2',
        },
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          tertiary: 'var(--accent-tertiary)',
        },
        secondaryAccent: {
          1: '#7C3AED',
          2: '#8B5CF6',
          3: '#A78BFA',
        },
        highlight: {
          cyan1: '#06B6D4',
          cyan2: '#22D3EE',
        },
        wood: {
          dark: '#271B13',
          cherry: '#3D2516',
          walnut: '#52341F',
          gold: '#C5A880',
          ivory: '#FAF6F0',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
