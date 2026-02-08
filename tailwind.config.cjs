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
        // Current (Default - Yellow Scheme)
        primary: "#01278b",
        accent: "#FFC857",
        secondary: "#00154a",
        highlight: "#2563eb",
        teal: "#4ecca3",
        "brand-green": "#ECF8B4",
        "brand-purple": "#E0DFF8",
        "brand-pink": "#FCEAEB",

        // Variation 1: Sakura Bloom - Pink & Coral
        "accent-sakura": "#FF6B9D",
        "supporting-sakura": "#FF8FA3",
        "tertiary-sakura": "#FFB6C1",
        "brand-green-sakura": "#FFE4E9",
        "brand-purple-sakura": "#FFF0F5",
        "brand-pink-sakura": "#FFD6E0",

        // Variation 2: Neon Midnight - Electric Purple & Magenta
        "accent-neon": "#C77DFF",
        "supporting-neon": "#E0AAFF",
        "tertiary-neon": "#7B2CBF",
        "brand-green-neon": "#F3E8FF",
        "brand-purple-neon": "#EDE7F6",
        "brand-pink-neon": "#E8DAFF",

        // Variation 3: Sunset Beach - Coral & Peach
        "accent-sunset": "#FF6F61",
        "supporting-sunset": "#FFB199",
        "tertiary-sunset": "#FFA07A",
        "brand-green-sunset": "#FFE5D9",
        "brand-purple-sunset": "#FFF4ED",
        "brand-pink-sunset": "#FFD4C8",

        // Variation 4: Emerald Garden - Mint & Sage
        "accent-emerald": "#10B981",
        "supporting-emerald": "#6EE7B7",
        "tertiary-emerald": "#34D399",
        "brand-green-emerald": "#D1FAE5",
        "brand-purple-emerald": "#F0FDF4",
        "brand-pink-emerald": "#E0F2E9",

        // Variation 5: Crimson Energy - Red-Orange & Tangerine
        "accent-crimson": "#FF5722",
        "supporting-crimson": "#FF7043",
        "tertiary-crimson": "#FF8A65",
        "brand-green-crimson": "#FFE8E0",
        "brand-purple-crimson": "#FFF3E0",
        "brand-pink-crimson": "#FFCCBC"
      },
      fontFamily: {
        sans: ['"Mulish"', "sans-serif"],
        display: ['"Mulish"', "sans-serif"]
      }
    }
  },
  plugins: []
};
