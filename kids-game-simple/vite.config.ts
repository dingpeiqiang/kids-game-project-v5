import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

/** 与 kids-game-frontend 共用业务源码，终端包仅独立入口与路由 */
const frontendSrc = resolve(__dirname, '../kids-game-frontend/src');

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_SHELL': JSON.stringify('simple'),
  },
  plugins: [vue()],
  publicDir: resolve(__dirname, 'public'),
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  resolve: {
    alias: {
      '@': frontendSrc,
      '@simple': resolve(__dirname, 'src'),
      '@root': resolve(__dirname, '..'),
    },
  },
  optimizeDeps: {
    exclude: ['phaser'],
    include: ['vue', 'pinia', 'vue-router', 'axios'],
  },
  server: {
    port: 3001,
    headers: { 'Cache-Control': 'no-store' },
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8080', ws: true },
      '/public': { target: 'http://localhost:3005', changeOrigin: true },
      '/files': {
        target: 'http://106.54.7.205',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/public/, ''),
      },
    },
    fs: { allow: ['..'] },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      external: ['phaser', /^@babylonjs\//],
      output: {
        globals: { phaser: 'Phaser' },
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
});