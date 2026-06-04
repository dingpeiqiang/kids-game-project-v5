import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
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
    port: 5173,
    open: true,
    host: 'localhost'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client')
    }
  },
  optimizeDeps: {
    include: ['phaser']
  }
});
