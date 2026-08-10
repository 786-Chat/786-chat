import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        deepgreen: '#0f3d2e',
        cream: '#fdf6e3',
        gold: '#c9a227',
      },
    },
  },
  plugins: [],
};

export default config;