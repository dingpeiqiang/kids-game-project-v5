import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      // CDN 模式下，外部化 phaser
      external: ['phaser']
    }
  },
  server: {
    port: 5173,
    open: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // CDN 模式下不需要预编译 phaser
  optimizeDeps: {
    exclude: ['phaser']
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.mp3', '**/*.ogg', '**/*.xml'],
  plugins: [
    {
      name: 'xml-loader',
      transform(code, id) {
        if (id.endsWith('.xml')) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null
          };
        }
      },
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.xml')) {
          server.ws.send({
            type: 'full-reload',
            path: '*'
          });
          return [];
        }
      }
    }
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.platform': JSON.stringify('browser'),
    'process.version': JSON.stringify(''),
    'process.versions': JSON.stringify({})
  }
});