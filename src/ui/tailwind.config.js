const COLOR = {
  PRIMARY_BLUE: '#1677FF',
  WHITE: '#FFFFFF',
  RED_ERROR: '#FF7875',
  SECONDARY_BLUE: '#E6F4FF'
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      'primary-blue': COLOR.PRIMARY_BLUE,
      white: COLOR.WHITE,
      'red-error': COLOR.RED_ERROR,
      'secondary-blue': COLOR.SECONDARY_BLUE
    },
    extend: {
      borderWidth: {
        1: '1px'
      }
    }
  },
  plugins: []
}
