import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 900: "#050b1a", 800: "#0a1428", 700: "#0f1d3a" },
        cyan: { 400: "#22d3ee", 500: "#06b6d4" },
        online: "#22c55e",
        warn: "#f59e0b",
        alarm: "#ef4444",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)",
      },
      backgroundSize: { grid: "40px 40px" },
    },
  },
  plugins: [],
};

export default config;
