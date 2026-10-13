/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#edf8f1',
          100: '#d5efdd',
          500: '#2f855a',
          600: '#276749',
          700: '#22543d',
        },
        ranger: {
          amber: '#c77918',
          sky: '#0f7490',
          clay: '#9a4d2f',
        },
      },
    },
  },
  plugins: [],
};
