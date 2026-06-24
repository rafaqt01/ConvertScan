import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        background: '#0D0D12',
        foreground: '#FAFAFA',
        card: { DEFAULT: '#14141C', foreground: '#FAFAFA' },
        popover: { DEFAULT: '#1A1A24', foreground: '#FAFAFA' },
        primary: {
          DEFAULT: '#1A1AFF',
          foreground: '#FFFFFF',
          50: '#EEEEFF',
          100: '#DCDCFF',
          200: '#B9B9FF',
          300: '#9595FF',
          400: '#7272FF',
          500: '#1A1AFF',
          600: '#1616D6',
          700: '#1212AD',
          800: '#0E0E84',
          900: '#0A0A5B',
        },
        success: { DEFAULT: '#00E5A0', foreground: '#0D0D12' },
        destructive: { DEFAULT: '#FF4D6D', foreground: '#FAFAFA' },
        warning: { DEFAULT: '#FFB800', foreground: '#0D0D12' },
        muted: { DEFAULT: '#1F1F2B', foreground: '#8A8A9E' },
        accent: { DEFAULT: '#25253A', foreground: '#FAFAFA' },
        border: '#25253A',
        input: '#25253A',
        ring: '#1A1AFF',
        chart: {
          1: '#1A1AFF',
          2: '#00E5A0',
          3: '#FFB800',
          4: '#FF4D6D',
          5: '#7B61FF',
          6: '#00C2FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(26, 26, 255, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(26, 26, 255, 0.8)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        glow: 'glow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
