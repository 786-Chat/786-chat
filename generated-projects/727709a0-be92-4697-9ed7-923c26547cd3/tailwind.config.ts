import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#d4af37',
        red: '#8b0000',
      },
    },
  },
  plugins: [],
} satisfies Config;
