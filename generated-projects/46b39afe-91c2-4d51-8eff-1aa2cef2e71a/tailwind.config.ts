import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#1a4d2e',
        'brand-cream': '#fdf6e3',
        'brand-gold': '#d4af37',
      },
    },
  },
  plugins: [],
};

export default config;
