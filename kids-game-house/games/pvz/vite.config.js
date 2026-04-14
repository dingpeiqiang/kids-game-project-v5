import { defineConfig } from 'vite'
import { resolve } from 'path'
import saveImagePlugin from './vite-plugin-save-image.js'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    },
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/sdapi': {
        target: 'http://127.0.0.1:7860',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sdapi/, '/sdapi'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['cache-control'];
            delete proxyRes.headers['Cache-Control'];
          });
        }
      },
      '/rembg': {
        target: 'http://127.0.0.1:7860',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../../kids-game-frame-factory/src')
    }
  },
  publicDir: 'public',
  plugins: [saveImagePlugin()],
  base: '/'
})