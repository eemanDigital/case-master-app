/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class", //enable dark mode
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['"Poppins"', "san-serif"],
      },
    },
  },
  plugins: [],
};
