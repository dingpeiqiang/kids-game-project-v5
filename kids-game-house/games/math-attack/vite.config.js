import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  // 将项目根目录作为静态资源目录，使 assets/ 可直接访问
  publicDir: 'public',

  // Phaser 通过 CDN 加载，不打包进 bundle（与项目规范一致）
  build: {
    rollupOptions: {
      external: ['phaser'],
      output: {
        globals: {
          phaser: 'Phaser'
        }
      }
    },
    outDir: 'dist'
  },
  optimizeDeps: {
    exclude: ['phaser']
  },
  server: {
    port: 3000,
    open: true
  }
})
