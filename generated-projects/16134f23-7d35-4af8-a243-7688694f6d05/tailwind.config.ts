import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDF6EC',
        latte: '#F3E5D8',
        mocha: '#6F4E37',
        espresso: '#3E2723',
        gold: '#C9A227'
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(62,39,35,0.2)',
        'gold': '0 0 30px rgba(201,162,39,0.3)'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        fadeUp: 'fadeUp 0.8s ease-out both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite'
      }
    }
  },
  plugins: []
};

export default config;
