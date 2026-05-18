/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        band24: { DEFAULT: '#06b6d4', dark: '#0891b2', glow: 'rgba(6,182,212,0.3)' },
        band5:  { DEFAULT: '#a855f7', dark: '#9333ea', glow: 'rgba(168,85,247,0.3)' },
        band6:  { DEFAULT: '#10b981', dark: '#059669', glow: 'rgba(16,185,129,0.3)' },
        wired:  { DEFAULT: '#f59e0b', dark: '#d97706', glow: 'rgba(245,158,11,0.3)'  },
        surface: {
          900: '#030712',
          800: '#0a0f1e',
          700: '#0f172a',
          600: '#1e293b',
          500: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'neon-blue':   '0 0 20px rgba(6,182,212,0.4),   0 0 60px rgba(6,182,212,0.15)',
        'neon-purple': '0 0 20px rgba(168,85,247,0.4),  0 0 60px rgba(168,85,247,0.15)',
        'neon-green':  '0 0 20px rgba(16,185,129,0.4),  0 0 60px rgba(16,185,129,0.15)',
        'neon-amber':  '0 0 20px rgba(245,158,11,0.4),  0 0 60px rgba(245,158,11,0.15)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-6px)' },
        },
        scan: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        float:  'float 3s ease-in-out infinite',
        scan:   'scan 2s linear infinite',
      },
    },
  },
  plugins: [],
}
