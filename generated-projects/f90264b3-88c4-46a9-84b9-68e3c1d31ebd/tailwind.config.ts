import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"]
      },
      colors: {
        ink: "#0b1020",
        indigo: "#4f46e5",
        violet: "#7c3aed",
        cyan: "#06b6d4",
        warm: "#f59e0b"
      },
      boxShadow: {
        panel: "0 24px 60px -24px rgba(15, 23, 42, 0.35)",
        ring: "inset 0 0 0 1px rgba(79, 70, 229, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
