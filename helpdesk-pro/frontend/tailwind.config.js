/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#0F172A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F8FAFC',
        },
        sidebar: '#0F172A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
