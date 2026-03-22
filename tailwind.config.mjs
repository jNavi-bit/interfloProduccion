import { heroui } from "@heroui/theme/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,mjs,ts}",
  ],
  plugins: [
    heroui({
      defaultTheme: "dark",
      defaultExtendTheme: "dark",
      layout: {
        disabledOpacity: 0.45,
        hoverOpacity: 0.85,
      },
      themes: {
        dark: {
          colors: {
            background: "#020617",
            foreground: "#f1f5f9",
            content1: "#0f172a",
            content2: "#1e293b",
            content3: "#334155",
            divider: "rgba(56, 189, 248, 0.22)",
            focus: "#38bdf8",
            default: {
              50: "#0f172a",
              100: "#1e293b",
              200: "#334155",
              300: "#475569",
              400: "#64748b",
              500: "#94a3b8",
              600: "#cbd5e1",
              700: "#e2e8f0",
              800: "#f1f5f9",
              900: "#f8fafc",
              DEFAULT: "#334155",
              foreground: "#e2e8f0",
            },
            primary: {
              50: "#ecfeff",
              100: "#cffafe",
              200: "#a5f3fc",
              300: "#22d3ee",
              400: "#06b6d4",
              500: "#0ea5e9",
              600: "#2563eb",
              700: "#1d4ed8",
              800: "#1e40af",
              900: "#1e3a8a",
              DEFAULT: "#06b6d4",
              foreground: "#020617",
            },
            secondary: {
              50: "#faf5ff",
              100: "#f3e8ff",
              200: "#e879f9",
              300: "#d946ef",
              400: "#c026d3",
              500: "#a855f7",
              600: "#9333ea",
              700: "#7c3aed",
              800: "#6d28d9",
              900: "#5b21b6",
              DEFAULT: "#c026d3",
              foreground: "#fdf4ff",
            },
            success: {
              DEFAULT: "#22c55e",
              foreground: "#022c0d",
            },
            warning: {
              DEFAULT: "#fb923c",
              foreground: "#1c0a00",
            },
            danger: {
              DEFAULT: "#ef4444",
              foreground: "#fff1f2",
            },
          },
        },
      },
    }),
  ],
};
