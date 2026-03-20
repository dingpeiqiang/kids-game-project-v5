/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-primary': '#4ade80',
        'game-secondary': '#fbbf24',
        'game-danger': '#f87171',
        'game-bg': '#1e293b',
        'pvz-sun': '#fbbf24',
        'pvz-pea': '#22c55e',
        'pvz-zombie': '#84cc16',
      }
    },
  },
  plugins: [],
}
