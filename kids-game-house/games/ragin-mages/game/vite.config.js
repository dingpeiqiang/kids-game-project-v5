import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './src',
  publicDir: '../public',
  build: {
    outDir: '../build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
      },
    },
  },
  server: {
    port: 3006,
    open: true,
    proxy: {
      // 如果需要代理 API 请求，可以在这里配置
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'scenes': path.resolve(__dirname, 'src/js/scenes'),
      'objects': path.resolve(__dirname, 'src/js/objects'),
      'util': path.resolve(__dirname, 'src/js/util'),
      'phaser': path.resolve(__dirname, 'node_modules/phaser/dist/phaser.js')
    },
  },
  optimizeDeps: {
    include: ['socket.io-client']
  }
});