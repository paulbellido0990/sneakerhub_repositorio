/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#111111",
          gray: "#737373",
          light: "#F5F5F5",
          whatsapp: "#25D366"
        }
      }
    },
  },
  plugins: [],
}