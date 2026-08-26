/** @type {import('tailwindcss').Config} */
// 宝宝商城 · 霓虹潮流主题
// 融合 淘宝(红)/拼多多(橙红活力)/京东(深蓝商务) 三个电商特色
// 主调：深色背景 + 霓虹紫红/青蓝渐变 + 玻璃拟态
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 品牌主色：霓虹紫红（融合淘宝红 + 拼多多活力）
        primary: {
          50:  '#fff0f6',
          100: '#ffe0ee',
          200: '#ffc2dd',
          300: '#ff94c4',
          400: '#ff5ba0',
          500: '#ff2b81',  // 主色
          600: '#ed0068',
          700: '#c80058',
          800: '#a5044c',
          900: '#88093f'
        },
        // 霓虹青蓝（科技感辅助色，融合京东商务蓝）
        neon: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',  // 霓虹青
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63'
        },
        // 活力橙（拼多多元素，营销活动/秒杀用）
        flame: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c'
        },
        // 深色背景系
        ink: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#1e293b',
          800: '#0f172a',  // 主背景
          900: '#020617',  // 更深背景
          950: '#000000'
        },
        gold: {
          50:  '#fffbe6',
          100: '#fff1b8',
          500: '#faad14',
          600: '#d48806'
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'card':       '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(255, 43, 129, 0.18)',
        'neon':       '0 0 20px rgba(255, 43, 129, 0.45), 0 0 40px rgba(34, 211, 238, 0.25)',
        'neon-soft':  '0 0 12px rgba(255, 43, 129, 0.35)',
        'glass':      '0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)'
      },
      backgroundImage: {
        'neon-gradient':    'linear-gradient(135deg, #ff2b81 0%, #8b5cf6 50%, #22d3ee 100%)',
        'neon-gradient-soft':'linear-gradient(135deg, rgba(255,43,129,0.15) 0%, rgba(34,211,238,0.15) 100%)',
        'flame-gradient':   'linear-gradient(135deg, #f97316 0%, #ff2b81 100%)',
        'glass':            'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
      },
      animation: {
        'neon-pulse':  'neon-pulse 2s ease-in-out infinite',
        'float':       'float 3s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'spin-slow':   'spin 8s linear infinite'
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 43, 129, 0.45)' },
          '50%':      { boxShadow: '0 0 35px rgba(255, 43, 129, 0.75), 0 0 60px rgba(34, 211, 238, 0.4)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' }
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    },
  },
  plugins: [],
}
