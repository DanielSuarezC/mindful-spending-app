/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          900: '#064e3b',
          800: '#065f46',
          700: '#047857',
        },
        slate: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
