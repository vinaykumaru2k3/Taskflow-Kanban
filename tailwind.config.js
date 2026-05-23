import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // [design-note] We remap slate to zinc so that we don't have to rewrite 
        // hundreds of class names across 30+ files, securing a completely 
        // neutral dark-mode gray. This also prevents breaking existing unit tests 
        // that query class lists containing 'slate' strings.
        slate: colors.zinc,
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
