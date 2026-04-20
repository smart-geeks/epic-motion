import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        epic: {
          black: "#0A0A0A",
          gold: "#C9A227",
          silver: "#CCCCCC",
          gray: "#2A2A2A",
          "gray-light": "#4A4A4A",
        },
        neon: {
          pink: "#FF00E5",
          cyan: "#00F0FF",
        },
      },
      fontFamily: {
        montserrat: ["var(--font-montserrat)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        "glass":     "0 8px 40px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(255,255,255,0.04)",
        "glass-sm":  "0 4px 20px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
        "liquid":    "0 8px 30px rgba(201,162,39,0.20), 0 1px 3px rgba(201,162,39,0.10)",
        "liquid-lg": "0 16px 50px rgba(201,162,39,0.25), 0 4px 12px rgba(201,162,39,0.12)",
        "neon-cyan": "0 0 20px rgba(0,240,255,0.15), 0 0 40px rgba(0,240,255,0.08)",
      },
      backdropBlur: {
        "glass": "24px",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
