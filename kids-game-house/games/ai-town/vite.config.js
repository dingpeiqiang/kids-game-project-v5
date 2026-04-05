import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Support React Native Web
      'react-native': 'react-native-web',
      // 修复 phaser3-rex-plugins 内部的 eventemitter3 导出问题
      'phaser3-rex-plugins/node_modules/eventemitter3': path.resolve(__dirname, 'node_modules/eventemitter3/index.mjs'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    // 强制使用顶层的 eventemitter3，而不是 phaser3-rex-plugins 内部的旧版本
    dedupe: ['eventemitter3'],
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          phaser: ['phaser'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['phaser', 'grid-engine'],
    // 不要排除 phaser3-rex-plugins，让它被预优化
    // exclude: ['phaser3-rex-plugins'],
  },
  // 解决 phaser3-rex-plugins 的 eventemitter3 兼容性问题
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})