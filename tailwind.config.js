/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sunshine: { 50: '#FFFBE6', 300: '#FFE680', 500: '#FFD43B', 700: '#E0A800' },
        sky: { 50: '#EAF7FE', 300: '#9AD8F7', 500: '#4FB6EC', 700: '#1F8CC4' },
        ink: '#12324A',
        coral: '#FF6B6B',
        paper: '#FFFDF5',
      },
      fontFamily: { heading: ['Fredoka', 'sans-serif'], body: ['Nunito', 'sans-serif'] },
    },
  },
  plugins: [],
}