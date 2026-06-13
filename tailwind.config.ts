import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#111111",
        border: "#222222",
        accent: "#e8ff47",
        success: "#47ffb8",
        danger: "#ff4747",
        muted: "#666666",
        text: "#ffffff",
        textDim: "#888888",
      },
      fontFamily: {
        display: ["var(--font-bebas)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "ui-monospace", "monospace"],
      },
      borderWidth: {
        DEFAULT: "0.5px",
        hair: "0.5px",
      },
      borderRadius: {
        md: "8px",
      },
      fontSize: {
        hero: ["120px", { lineHeight: "0.9", letterSpacing: "-0.02em" }],
        display: ["56px", { lineHeight: "0.95", letterSpacing: "-0.01em" }],
      },
    },
  },
  plugins: [],
};
export default config;
