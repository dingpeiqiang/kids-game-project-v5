/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 使用 CSS 变量支持主题切换
        'theme-primary': 'var(--theme-primary, #4ade80)',
        'theme-secondary': 'var(--theme-secondary, #22c55e)',
        'theme-background': 'var(--theme-background, #1e293b)',
        'theme-surface': 'var(--theme-surface, #334155)',
        'theme-text': 'var(--theme-text, #ffffff)',
        'theme-text-secondary': 'var(--theme-text-secondary, #94a3b8)',
        'theme-accent': 'var(--theme-accent, #fbbf24)',
        'theme-success': 'var(--theme-success, #22c55e)',
        'theme-warning': 'var(--theme-warning, #f59e0b)',
        'theme-error': 'var(--theme-error, #ef4444)'
      },
      boxShadow: {
        'theme': 'var(--theme-shadow, 0 4px 6px rgba(0,0,0,0.3))',
        'theme-glow': 'var(--theme-glow, 0 0 10px rgba(74,222,128,0.5))'
      },
      borderColor: {
        'theme': 'var(--theme-border, 2px solid #4ade80)'
      },
      borderRadius: {
        'theme': 'var(--theme-border-radius, 8px)'
      }
    },
  },
  plugins: [],
}
