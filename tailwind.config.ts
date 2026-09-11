import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        mist: "#f3f7fb",
        mint: "#22c55e"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(19, 45, 78, 0.09)"
      }
    }
  },
  plugins: []
} satisfies Config;
