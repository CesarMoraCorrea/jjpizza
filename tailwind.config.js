/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#D92525',      // Pizza logo Tomato Red (#D92525)
          yellow: '#F5B927',   // Pizza logo Cheese Yellow (#F5B927)
          dark: '#020617',     // Main background (slate-950)
          slate: '#0f172a',    // Card background (slate-900)
          accent: '#A71D22',   // Secondary dark red
        },
        'jj-red': '#D92525',
        'jj-yellow': '#F5B927',
        pizza: {
          500: '#F5B927',
          600: '#D99B1C',
        }
      },
      boxShadow: {
        'glow-yellow': '0 0 15px -3px rgba(245, 185, 39, 0.3)',
        'glow-red': '0 0 15px -3px rgba(217, 37, 37, 0.3)',
      }
    },
  },
  plugins: [],
}

