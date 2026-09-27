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
          50: "#fdf8f3",
          100: "#f9ede0",
          200: "#f0d6b8",
          300: "#e4b98a",
          400: "#d69a5c",
          500: "#c97f3a",
          600: "#b0652e",
          700: "#8f4e27",
          800: "#744025",
          900: "#5f3621",
        },
        cream: "#fdf8f3",
        accent: "#d69a5c",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;