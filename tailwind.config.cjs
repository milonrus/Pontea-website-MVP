/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/views/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#01278b",
        accent: "#FFC857",
        secondary: "#00154a",
        highlight: "#2563eb",
        teal: "#4ecca3",
        "brand-green": "#ECF8B4",
        "brand-purple": "#E0DFF8",
        "brand-pink": "#FCEAEB"
      },
      fontFamily: {
        sans: ['"Mulish"', "sans-serif"],
        display: ['"Mulish"', "sans-serif"]
      }
    }
  },
  plugins: []
};
