/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        soil:     { 50: '#fdf8f0', 100: '#f5e6c8', 200: '#e8d0a0', 300: '#c8935a', 500: '#8B4513', 700: '#5c2d0a', 900: '#2d1505' },
        harvest:  { 50: '#fffbeb', 100: '#fef9c3', 300: '#fcd34d', 500: '#f59e0b', 700: '#b45309' },
        field:    { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 500: '#22c55e', 700: '#15803d' },
        sky:      { 100: '#dbeafe', 300: '#93c5fd', 500: '#3b82f6', 700: '#1d4ed8' },
        danger:   { 100: '#fee2e2', 300: '#fca5a5', 500: '#ef4444', 700: '#b91c1c' },
        stress:   { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#7f1d1d' },
      },
      fontFamily: {
        display: ['"Tiro Devanagari Hindi"', 'serif'],
        body:    ['"Noto Sans"', 'sans-serif'],
        number:  ['"Rajdhani"', 'sans-serif'],
      },
      animation: {
        'stress-pulse': 'stress-pulse 1s ease-in-out infinite',
        'grain-fall':   'grain-fall 2s ease-in-out infinite',
        'coin-spin':    'coin-spin 0.6s ease-in-out',
        'npc-talk':     'npc-talk 0.3s ease-in-out infinite',
        'float':        'float 3s ease-in-out infinite',
      },
      keyframes: {
        'stress-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'grain-fall': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(10px)', opacity: '0' },
        },
        'coin-spin': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        'npc-talk': {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
