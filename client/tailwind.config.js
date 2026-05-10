/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#07090E',
          secondary: '#0C0F17',
          elevated: '#131820',
          card: '#0F1218',
        },
        accent: {
          DEFAULT: '#22C55E',
          dim: 'rgba(34,197,94,0.12)',
          glow: 'rgba(34,197,94,0.25)',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          subtle: 'rgba(255,255,255,0.04)',
        },
        macro: {
          protein: '#60A5FA',
          carbs: '#FBBF24',
          fat: '#F87171',
          fiber: '#C084FC',
          calories: '#22C55E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'spin-slow': 'spin 1.5s linear infinite',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
