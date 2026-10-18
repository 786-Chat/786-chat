import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        steel: "#334155",
        navy: "#0f172a",
        "process-blue": "#0ea5e9",
        "safety-amber": "#f59e0b",
        "quality-green": "#10b981",
      },
    },
  },
  plugins: [],
};

export default config;
