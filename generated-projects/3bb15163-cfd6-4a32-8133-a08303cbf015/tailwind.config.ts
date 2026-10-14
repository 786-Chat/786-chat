import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      colors: {
        ink: "#000000",
        paper: "#ffffff",
        line: "#e5e5e5",
        muted: "#737373",
        soft: "#fafafa",
        status: "#0070f3"
      },
      maxWidth: {
        shell: "1120px"
      }
    }
  },
  plugins: []
};

export default config;
