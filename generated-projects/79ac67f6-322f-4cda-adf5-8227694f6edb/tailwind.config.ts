import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: "#faf6f0",
          100: "#f0e6d8",
          200: "#e0ccb0",
          300: "#d0b28a",
          400: "#c09a66",
          500: "#a97e4b",
          600: "#8a6238",
          700: "#6b4a2a",
          800: "#4d341e",
          900: "#2e1f12"
        },
        cream: "#fdf8f0",
        gold: {
          300: "#e6c88a",
          400: "#d4af37",
          500: "#b8962e"
        }
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.08)",
        card: "0 8px 30px rgba(0,0,0,0.12)"
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "float": "float 6s ease-in-out infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
