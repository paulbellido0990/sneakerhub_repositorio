/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          dark: "#111111",
          gray: "#737373",
          light: "#F5F5F5",
          whatsapp: "#25D366",
          accent: "#4338CA",
          accentSoft: "#EEF2FF",
        }
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(17, 17, 17, 0.06)",
        card: "0 12px 30px -12px rgba(17, 17, 17, 0.18)",
        glow: "0 8px 24px -6px rgba(67, 56, 202, 0.35)",
      },
    },
  },
  plugins: [],
}