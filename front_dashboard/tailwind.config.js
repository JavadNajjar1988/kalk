/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['B-Yekan', 'Vazirmatn', 'Tahoma', 'Iranian Sans', 'بی یکان', 'تهوما', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}; 