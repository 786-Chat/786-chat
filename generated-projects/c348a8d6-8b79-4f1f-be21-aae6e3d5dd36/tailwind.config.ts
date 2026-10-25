import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: '#4f46e5',
          violet: '#7c3aed',
          cyan: '#06b6d4',
          warm: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': 'radial-gradient(at 40% 20%, hsla(240,100%,70%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(270,100%,70%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(190,100%,70%,0.1) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
};

export default config;