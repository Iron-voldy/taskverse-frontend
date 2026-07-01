import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff3ee', 100: '#ffe4d5', 200: '#ffcaab', 300: '#ffa878',
          400: '#ff7a40', 500: '#ff4d00', 600: '#e64400', 700: '#cc3a00',
          800: '#a83000', 900: '#8a2800', 950: '#4d1600',
        },
        surface: {
          50: '#f5f5f0', 100: '#eee8de', 200: '#d8d0c0',
          800: '#1a1a18', 900: '#0d0d0b', 950: '#050505',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        shimmer: 'shimmer 2s infinite',
        float: 'float 3s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        streak: 'streakFlame 1.5s ease-in-out infinite',
        scan: 'scan 8s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100vh)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(200vh)', opacity: '0' },
        },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%,100%': { backgroundPosition: '-200% 0' }, '50%': { backgroundPosition: '200% 0' } },
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseRing: { '0%': { transform: 'scale(0.8)', opacity: '1' }, '100%': { transform: 'scale(2)', opacity: '0' } },
        streakFlame: { '0%,100%': { transform: 'scaleY(1) rotate(-2deg)' }, '50%': { transform: 'scaleY(1.1) rotate(2deg)' } },
      },
      boxShadow: {
        glow: '0 0 20px rgba(255,77,0,0.3)',
        'glow-lg': '0 0 40px rgba(255,77,0,0.4)',
        card: '0 1px 3px rgba(0,0,0,0.12),0 1px 2px rgba(0,0,0,0.24)',
        'card-hover': '0 10px 30px rgba(0,0,0,0.25)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)',
      },
    },
  },
  plugins: [],
}

export default config
