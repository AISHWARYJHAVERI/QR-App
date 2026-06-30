export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        brand: {
          DEFAULT: '#e52559',
          soft: '#f7db25',
          accent: '#84f527',
        },
      },
      animation: {
        'gradient-rotate': 'hue 15s infinite linear',
      },
      keyframes: {
        hue: {
          'from': {
            filter: 'hue-rotate(0deg)',
          },
          'to': {
            filter: 'hue-rotate(-360deg)',
          },
        },
      },
    },
  },
  plugins: [],
}
