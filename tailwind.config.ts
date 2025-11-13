import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        secondary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      fontFamily: {
        sans: [
          "Tajawal",
          "Noto Kufi Arabic",
          "Segoe UI",
          "Tahoma",
          "sans-serif",
        ],
        display: ["Noto Kufi Arabic", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 45px -20px rgba(15, 23, 42, 0.25)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at top right, rgba(249, 168, 212, 0.35), transparent 55%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.35), transparent 55%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
