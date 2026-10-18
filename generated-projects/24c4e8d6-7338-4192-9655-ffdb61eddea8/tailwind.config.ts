import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: "#fdf8f5",
          100: "#f6e8df",
          200: "#e8cbb8",
          300: "#d4a88c",
          400: "#b97f5f",
          500: "#9c6242",
          600: "#7a4a32",
          700: "#5c3625",
          800: "#3e2418",
          900: "#24140d",
        },
        cream: "#f5e6d3",
        gold: "#c9a227",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
