import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0a1f",
        canvas: "#f6f5ff",
        indigo: { DEFAULT: "#4f46e5", deep: "#312e81" },
        violet: { DEFAULT: "#7c3aed" },
        cyan: { DEFAULT: "#06b6d4" },
        warm: "#f59e0b",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        panel: "1.5rem",
        pill: "999px",
      },
      boxShadow: {
        panel: "0 24px 60px -24px rgba(49,46,129,0.35)",
        ring: "inset 0 0 0 1px rgba(79,70,229,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
