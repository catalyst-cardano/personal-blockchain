const COLOR = {
  PRIMARY_BLUE: '#1677FF',
  WHITE: '#FFFFFF'
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      'primary-blue': COLOR.PRIMARY_BLUE,
      white: COLOR.WHITE
    },
    extend: {
      borderWidth: {
        1: '1px'
      }
    }
  },
  plugins: []
}
