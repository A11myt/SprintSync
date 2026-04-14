import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:    "rgb(var(--color-primary)    / <alpha-value>)",
        secondary:  "rgb(var(--color-secondary)  / <alpha-value>)",
        accent:     "rgb(var(--color-accent)     / <alpha-value>)",
        error:      "rgb(var(--color-error)      / <alpha-value>)",
        warning:    "rgb(var(--color-warning)    / <alpha-value>)",
        success:    "rgb(var(--color-success)    / <alpha-value>)",
        info:       "rgb(var(--color-info)       / <alpha-value>)",
        orange:     "rgb(var(--color-orange)     / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface:    "rgb(var(--color-surface)    / <alpha-value>)",
        overlay:    "rgb(var(--color-overlay)    / <alpha-value>)",
        divider:    "rgb(var(--color-divider)    / <alpha-value>)",
        outline:    "rgb(var(--color-outline)    / <alpha-value>)",
        ink:        "rgb(var(--color-ink)        / <alpha-value>)",
        muted:      "rgb(var(--color-muted)      / <alpha-value>)",
        dim:        "rgb(var(--color-dim)        / <alpha-value>)",
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
