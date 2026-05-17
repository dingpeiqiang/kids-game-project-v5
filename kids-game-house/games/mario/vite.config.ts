import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: './src',
  build: {
    target: 'esnext', // 使用 ESNext 以支持装饰器和类构造函数
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  esbuild: {
    target: 'esnext',
    // 确保装饰器正确工作
    keepNames: true,
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['phaser', 'tsyringe', 'reflect-metadata'],
  },
})
