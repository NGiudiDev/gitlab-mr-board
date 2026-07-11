/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        bg: '#12141A',
        surface: '#1A1D24',
        'surface-raised': '#22262F',
        border: '#2A2F3A',
        'border-soft': '#22252D',
        accent: '#45B8C9',
        'accent-soft': '#173238',
        ready: '#4FB477',
        'ready-soft': '#16261D',
        draft: '#D9A441',
        'draft-soft': '#2B2213',
        conflict: '#E5484D',
        'conflict-soft': '#301617',
        'text-primary': '#E7E9ED',
        'text-muted': '#9098A6',
        'text-faint': '#5C6270',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Consolas', 'Cascadia Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
