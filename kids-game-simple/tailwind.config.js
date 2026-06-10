import base from '../kids-game-frontend/tailwind.config.js';

/** @type {import('tailwindcss').Config} */
export default {
  ...base,
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    '../kids-game-frontend/index.html',
    '../kids-game-frontend/src/**/*.{vue,js,ts,jsx,tsx}',
  ],
};