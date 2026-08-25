/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 宝宝商城品牌色
        primary: {
          50: '#fff1f0',
          100: '#ffccc7',
          200: '#ffa39e',
          300: '#ff7875',
          400: '#ff4d4f',
          500: '#ff1a1a',  // 淘宝红色
          600: '#d9363e',
          700: '#cf1322',
          800: '#a8071a',
          900: '#78060f'
        },
        gold: {
          50: '#fffbe6',
          100: '#fff1b8',
          500: '#faad14',
          600: '#d48806'
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)'
      }
    },
  },
  plugins: [],
}
