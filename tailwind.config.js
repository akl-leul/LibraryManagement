/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
 
  theme: {
    extend: {
      keyframes: {
        enter: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        leave: {
          '0%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          '100%': { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
        },
      },
      animation: {
        enter: 'enter 0.2s ease-out forwards',
        leave: 'leave 0.15s ease-in forwards',
      },
    },
  },
  plugins: [],
};
