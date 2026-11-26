import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F7FA",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#0F766E",
          deep: "#134E4A",
          accent: "#14B8A6",
          soft: "#F0FDFA",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          subtle: "#64748B",
        },
        line: "#E2E8F0",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [forms],
};
