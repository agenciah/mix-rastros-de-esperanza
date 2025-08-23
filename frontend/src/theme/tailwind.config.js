/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Paleta "tecno formal"
        azulPetroleo: "#12394E",
        grisCalido: "#E0E3E7",
        verdeLimaSutil: "#C2F970",
      },
    },
  },
  plugins: [],
}
