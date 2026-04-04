import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#1c1917",
          darker: "#0f0e0d",
          border: "#2a2622",
          surface: "#232020",
          amber: "#a05c20",
          gold: "#f0d4a0",
          mid: "#c8895a",
          muted: "#57534e",
          light: "#faf9f7",
        },
      },
      fontFamily: {
        sans: ["var(--font-golos)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
