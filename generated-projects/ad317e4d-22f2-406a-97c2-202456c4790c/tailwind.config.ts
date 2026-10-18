import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        'coffee': {
          black: '#1A1A1A',
          white: '#F5F5F0',
          neutral: '#E8E4DF',
          accent: '#C4A484',
        },
      },
    },
  },
  plugins: [],
};

export default config;