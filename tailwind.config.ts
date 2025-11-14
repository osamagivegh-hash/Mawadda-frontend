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
          50: "#fef7f7",
          100: "#fdeaea",
          200: "#fbd5d5",
          300: "#f8b4b4",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        accent: {
          50: "#fef3f2",
          100: "#fee4e2",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
        muted: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
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
