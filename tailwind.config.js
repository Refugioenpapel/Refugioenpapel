/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/globals.css", // opcional, pero recomendado
  ],
  safelist: [
    'bg-red-400',
    'bg-red-200',
    'bg-blue-200',
    'bg-green-200',
    'bg-yellow-400',
    'text-gray-600',
    'text-red-800',
    'text-blue-800',
    'text-green-800',
    'text-yellow-800',
    // agregá todos los que uses dinámicamente
  ],
  theme: {
    extend: {
      colors: {
        fondo: "#FFF7E8",
        "acento-rosa": "#FADADD",
        "acento-lila": "#DCCFF9",
        "acento-verde": "#D5F5E3",
        "acento-glitter": "#D1D1D1",
        "acento-amarillo": "#FFF4B1",
      },
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
        pacifico: ["Pacifico", "cursive"],
        quicksand: ["Quicksand", "sans-serif"],
        trend: ["Trend Sans One", "sans-serif"],
        dancing: ['"Dancing Script"', 'cursive'],
      },
    },
  },
  plugins: [],
};
