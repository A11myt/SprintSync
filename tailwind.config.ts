import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:    "#ff8000",
        secondary:  "#2a2a3a",
        accent:     "#1d1208",
        error:      "#d45a5a",
        warning:    "#d4b85a",
        success:    "#5ab88a",
        info:       "#5a8fd4",
        orange:     "#d4843a",
        background: "#0d0d0f",
        surface:    "#111115",
        overlay:    "#161619",
        divider:    "#1e1e24",
        outline:    "#252530",
        ink:        "#e2ddd6",
        muted:      "#55555f",
        dim:        "#2e2e3a",
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        sans: ["'IBM Plex Sans'", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.65rem", "1rem"],
        "xs":  ["10px", { lineHeight: "1.5" }],
        "sm":  ["11px", { lineHeight: "1.6" }],
        "base":["12px", { lineHeight: "1.5" }],
        "md":  ["13px", { lineHeight: "1.5" }],
      },
      borderRadius: {
        none: "0",
        sm:   "2px",
        DEFAULT: "2px",
        md:   "3px",
        lg:   "4px",
      },
      borderWidth: {
        DEFAULT: "1px",
        "2": "2px",
      },
      keyframes: {
        cardIn: {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        modalIn: {
          "0%":   { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "none" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "card-in":  "cardIn 0.15s ease forwards",
        "modal-in": "modalIn 0.15s ease forwards",
        "fade-up":  "fadeUp 0.2s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
