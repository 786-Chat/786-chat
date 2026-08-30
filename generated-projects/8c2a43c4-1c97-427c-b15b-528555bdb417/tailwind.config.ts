import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        foreground: "var(--foreground)",
        background: "var(--background)",
        accent: "var(--accent)",
        muted: "var(--muted)",
        border: "var(--border)",
      },
    },
  },
  plugins: [],
};

export default config;