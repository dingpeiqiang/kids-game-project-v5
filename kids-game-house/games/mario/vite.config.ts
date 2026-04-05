import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: './src',
  build: {
    target: 'es2015', // 确保与 tsconfig 一致，支持 ES6 class
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
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
    include: ['phaser'],
  },
})
