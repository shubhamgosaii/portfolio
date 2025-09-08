module.exports = {
  content: ['./index.html','./src/**/*.{ts,tsx,js,jsx}'],
  theme: { extend: { colors: { accent:'#22d3ee', accent2:'#f472b6' } } },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enables class-based dark mode
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
