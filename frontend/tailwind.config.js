/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          500: '#4c6ef5',
          700: '#3451b2',
          900: '#1a2f6a',
        },
        teal: {
          500: '#20c997',
          600: '#12b886',
        }
      }
    },
  },
  plugins: [],
}

