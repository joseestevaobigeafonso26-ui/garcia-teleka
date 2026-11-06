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
        brand: {
          navy: "#0b1d3a",
          darkBlue: "#0c2854",
          blue: "#0066ff",
          lightBlue: "#1d72f3",
          sky: "#e8f1fd",
          grayBg: "#f4f7fb",
          cardBg: "#ffffff",
          textDark: "#121e31",
          textMuted: "#5b6b82",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
      },
      keyframes: {
        "toast-in": {
          "0%": { opacity: "0", transform: "translateX(24px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        "toast-bar": {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
        "pop-in": {
          "0%": { transform: "translateY(16px) scale(0.97)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.25s ease-out",
        "toast-bar": "toast-bar 4s linear forwards",
        "pop-in": "pop-in 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
