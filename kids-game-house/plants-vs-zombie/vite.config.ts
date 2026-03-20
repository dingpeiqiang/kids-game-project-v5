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
  // 优化依赖配置
  optimizeDeps: {
    // 排除 Phaser，不进行预构建（因为通过 CDN 加载）
    exclude: ['phaser']
  },
  server: {
    port: 3004,
    host: true,
    // HMR 配置
    hmr: {
      overlay: true
    },
    // 文件监听配置
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        // 忽略游戏资源文件，避免资源变化触发 HMR
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.gif',
        '**/*.svg',
        '**/*.mp3',
        '**/*.wav',
        '**/*.ogg',
        '**/*.json',
        // 忽略 Phaser 相关文件
        '**/phaser*.js'
      ]
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['phaser'], // 将 Phaser 标记为外部依赖
      output: {
        globals: {
          phaser: 'Phaser' // 全局变量名
        }
      }
    }
  }
})
