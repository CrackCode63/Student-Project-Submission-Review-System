/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        secondary: '#4F46E5',
        accent: '#06B6D4',
        lightbg: '#F5F3FF',
        darkbg: '#0F172A',
        lightcard: '#FFFFFF',
        darkcard: '#1E1B4B',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Plus Jakarta Sans', 'Segoe UI', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 18px 45px -20px rgba(124, 58, 237, 0.55)',
        soft: '0 18px 60px rgba(15, 23, 42, 0.08)',
        glass: '0 28px 70px rgba(15, 23, 42, 0.22)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7C3AED, #06B6D4)',
        'hero-mesh':
          'radial-gradient(circle at top left, rgba(124, 58, 237, 0.28), transparent 35%), radial-gradient(circle at top right, rgba(6, 182, 212, 0.22), transparent 32%), radial-gradient(circle at bottom center, rgba(79, 70, 229, 0.18), transparent 40%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 5.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
