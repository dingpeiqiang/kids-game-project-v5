import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // Phaser 使用 CDN，不打包到 bundle 中
  optimizeDeps: {
    exclude: ['phaser']
  },
  build: {
    rollupOptions: {
      external: ['phaser'],
      output: {
        globals: {
          phaser: 'Phaser'
        }
      }
    }
  },
  server: {
    port: 5174,
    host: true
  }
})
