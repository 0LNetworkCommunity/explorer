/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          '50': '#fdf3f3',
          '100': '#fde3e4',
          '200': '#fbcdce',
          '300': '#f8a9ab',
          '400': '#f1787b',
          '500': '#e8595c',
          '600': '#d32f32',
          '700': '#b12427',
          '800': '#932123',
          '900': '#7a2224',
          '950': '#420d0e',
      },
      },
    },
  },
  plugins: [],
}

