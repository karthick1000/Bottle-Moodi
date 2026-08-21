import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f4ecdc",
        dark: "#1a1713",
        red: {
          DEFAULT: "#e8452c",
          dark: "#a82d19",
        },
        muted: {
          DEFAULT: "#6e6455",
          light: "#8d8371",
          dark: "#453d33",
        },
        border: {
          DEFAULT: "#d9cfb8",
          dark: "#3a332a",
        },
        gold: "#e9b44c",
        highlight: "#c4b79c",
      },
      fontFamily: {
        bakbak: ["var(--font-bakbak)", "sans-serif"],
        kaushan: ["var(--font-kaushan)", "cursive"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        anek: ["var(--font-anek)", "sans-serif"],
        mono: ["ui-monospace", "Menlo", "monospace"],
      },
      animation: {
        "bm-marq": "bm-marq 18s linear infinite",
        "bm-fill": "bm-fill 2.3s ease-in-out forwards",
        "bm-pop": "bm-pop 2.3s cubic-bezier(.3,-.4,.3,1.6) forwards",
        "bm-fade": "bm-fade 2.3s ease forwards",
        "bm-loop": "bm-loop 1.1s ease-in-out infinite",
        "bm-toast": "bm-toast 1.9s ease forwards",
        "bm-stamp": "bm-stamp .95s cubic-bezier(.3,1.5,.4,1) both",
        "bm-thud": "bm-thud 1.1s ease-out both",
        "bm-spin": "bm-spin 7s linear infinite",
        "bm-spin-delay": "bm-spin 7s linear infinite 0.95s",
      },
      keyframes: {
        "bm-marq": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "bm-fill": {
          "0%": { height: "0%" },
          "70%": { height: "100%" },
          "100%": { height: "100%" },
        },
        "bm-pop": {
          "0%, 58%": { transform: "translate(-50%,0) rotate(0deg)" },
          "72%": { transform: "translate(-50%,-46px) rotate(-18deg)" },
          "100%": { transform: "translate(-50%,-120px) rotate(-52deg)", opacity: "0" },
        },
        "bm-fade": {
          "0%, 72%": { opacity: "1", visibility: "visible" },
          "100%": { opacity: "0", visibility: "hidden" },
        },
        "bm-loop": {
          "0%": { height: "8%" },
          "50%": { height: "100%" },
          "100%": { height: "8%" },
        },
        "bm-toast": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "12%, 80%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-8px)" },
        },
        "bm-stamp": {
          "0%": { transform: "scale(2.6) rotate(24deg)", opacity: "0" },
          "45%": { opacity: "1" },
          "62%": { transform: "scale(.94) rotate(-11deg)" },
          "74%": { transform: "scale(1.06) rotate(-9deg)" },
          "86%": { transform: "scale(.99) rotate(-12deg)" },
          "100%": { transform: "scale(1) rotate(-11deg)", opacity: "1" },
        },
        "bm-thud": {
          "0%, 55%": { transform: "scale(.3)", opacity: "0" },
          "70%": { transform: "scale(1.5)", opacity: ".35" },
          "100%": { transform: "scale(2.1)", opacity: "0" },
        },
        "bm-spin": {
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
