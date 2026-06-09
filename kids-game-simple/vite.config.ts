import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // 依赖预构建优化（加速冷启动）
  optimizeDeps: {
    include: ['phaser'],
    // 排除不需要预构建的包
    exclude: [],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 目标浏览器（现代浏览器即可，减小 polyfill 体积）
    target: 'es2020',
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生成 sourcemap（调试用，生产可关闭）
    sourcemap: false,
    // 小于此大小的资源内联为 base64（减少请求数）
    assetsInlineLimit: 4096,
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用 terser 压缩（生产环境）
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // 【核心】文件名带内容哈希 → 内容变化自动更新，未变化走缓存
        entryFileNames: 'assets/[name]-[hash:10].js',
        chunkFileNames: 'assets/[name]-[hash:10].js',
        assetFileNames: 'assets/[name]-[hash:10].[ext]',
        // 代码分割：将大型依赖拆分为独立 chunk
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'vendor-phaser'
          }
          if (id.includes('node_modules/three')) {
            return 'vendor-three'
          }
          if (id.includes('node_modules/@babylonjs')) {
            return 'vendor-babylon'
          }
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    port: 5100,
    host: true,
    // 强制禁用浏览器缓存（开发模式）
    headers: {
      'Cache-Control': 'no-store',
    },
    // 文件监听优化
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/*.md',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
