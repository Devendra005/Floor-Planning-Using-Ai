/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
        vastu: {
          gold: '#f59e0b',
          emerald: '#10b981',
          ruby: '#ef4444',
          sapphire: '#3b82f6',
        },
        blueprint: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          grid: '#1e293b',
          accent: '#38bdf8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
