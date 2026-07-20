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
        },
        semantic: {
          success: "#059669",
          successSoft: "#ECFDF5",
          warning: "#D97706",
          warningSoft: "#FFFBEB",
          danger: "#DC2626",
          dangerSoft: "#FEF2F2",
          info: "#2563EB",
          infoSoft: "#EFF6FF",
        },
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(17, 17, 17, 0.06)",
        card: "0 12px 30px -12px rgba(17, 17, 17, 0.18)",
        glow: "0 8px 24px -6px rgba(67, 56, 202, 0.35)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        shimmer: "shimmer 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}