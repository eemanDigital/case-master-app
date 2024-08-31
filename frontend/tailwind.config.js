/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class", // enable dark mode
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        secondary: {
          DEFAULT: "#e11d48", // This is the hex value for text-rose-600
        },
        deepBlue: {
          DEFAULT: "#1c4e80", // This is the hex value for text-rose-600
        },
      },
    },
  },
  plugins: [],
};
