import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 开发模式使用 index.html 作为入口
  root: '.',
  publicDir: 'public',
  base: './',
  
  // 注意：不使用 assetsInclude，因为需要用 ?raw 导入 SVG 字符串
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'catch-the-cat.js',
        format: 'iife',
        name: 'CatchTheCat'
      }
    }
  },
  
  // 开发服务器配置 - Vite 模式
  server: {
    port: 5173,           // Vite 默认端口
    host: true,           // 允许外部访问
    cors: true,           // 允许跨域
    hmr: true             // 热模块替换
  },
  
  // 预构建依赖配置
  optimizeDeps: {
    include: ['phaser']
  },
  
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  
  esbuild: {
    target: 'es2015'
  }
});
