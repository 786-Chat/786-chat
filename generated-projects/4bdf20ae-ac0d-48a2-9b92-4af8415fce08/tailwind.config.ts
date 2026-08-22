import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#faf6f0",
        brown: "#4a2c2a",
        gold: "#c9a227",
      },
    },
  },
  plugins: [],
};

export default config;
