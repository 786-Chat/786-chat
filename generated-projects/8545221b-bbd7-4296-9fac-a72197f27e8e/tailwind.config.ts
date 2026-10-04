import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#1d1d1f",
        ink: "#0b0b0c",
        mist: "#f5f5f7",
        accent: "#b06a3b"
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Inter", "Helvetica Neue", "Arial", "sans-serif"]
      },
      maxWidth: {
        prose: "62ch"
      }
    }
  },
  plugins: []
};

export default config;
