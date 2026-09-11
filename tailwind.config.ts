import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0d1f35",
          soft: "#1e3451",
        },
        mist: "#f5f8fc",
        border: "#e4eaf2",
        emerald: {
          DEFAULT: "#10b981",
          light: "#d1fae5",
          dark: "#059669",
          xlight: "#f0fdf4",
          text: "#065f46",
          glow: "#34d399",
        },
        slate: {
          muted: "#94a3b8",
          soft: "#64748b",
          faint: "#c8d6e3",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(13,31,53,.06), 0 6px 24px rgba(13,31,53,.07)",
        btn: "0 2px 8px rgba(13,31,53,.18)",
        "btn-lg": "0 4px 16px rgba(13,31,53,.22)",
        "btn-emerald": "0 2px 10px rgba(16,185,129,.28)",
        "btn-emerald-lg": "0 4px 18px rgba(16,185,129,.34)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(1.4)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "fade-in": "fade-in .35s ease both",
        "slide-up": "slide-up .4s cubic-bezier(.22,.68,0,1.2) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
