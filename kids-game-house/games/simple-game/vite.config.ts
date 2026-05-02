import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5100,
    host: true,
    proxy: {
      // 代理 API 请求到后端服务器，避免跨域问题
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
