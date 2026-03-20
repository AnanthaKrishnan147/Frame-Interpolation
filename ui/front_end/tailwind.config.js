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
        'near-black': '#0f0f13',
        'slate-gray': '#1e1e24',
        'neon-purple': '#8c52ff',
        'neon-blue': '#5271ff',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      backgroundImage: {
        'gradient-purple-blue': 'linear-gradient(90deg, #8c52ff, #5271ff)',
      },
      boxShadow: {
        'neon-purple': '0 0 15px rgba(140, 82, 255, 0.4)',
        'neon-blue': '0 0 15px rgba(82, 113, 255, 0.4)',
      }
    },
  },
  plugins: [],
}
