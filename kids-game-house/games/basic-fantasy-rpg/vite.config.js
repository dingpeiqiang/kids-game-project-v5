import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',  // 使用标准的 public 目录
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 10003,
    open: true,
    host: 'localhost',
    proxy: {
      '/socket.io': {
        target: 'http://localhost:8081',
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['phaser']
  }
});