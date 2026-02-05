/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0891b2',     // cyan-600 - main brand color
        secondary: '#06b6d4',   // cyan-500 - secondary actions
        accent: '#0e7490',      // cyan-700 - accents and highlights
        dark: '#1F2937',        // gray-800 - dark elements
        light: '#F9FAFB',       // gray-50 - light backgrounds
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
