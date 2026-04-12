import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 确保资源文件被正确处理
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.mp3', '**/*.wav', '**/*.ogg', '**/*.xml', '**/*.json'],
  
  // 指定公共资源目录
  publicDir: 'assets',
  
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src'),
      '@assets': resolve(__dirname, 'assets'),
    },
  },
  
  server: {
    port: 3005,
    host: true, // 允许外部访问
    open: true, // 自动打开浏览器
    hmr: {
      overlay: true // 显示错误遮罩
    },
    // 排除特定文件的热更新，提高性能
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        // 忽略大型资源文件
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.gif',
        '**/*.svg',
        '**/*.mp3',
        '**/*.wav',
        '**/*.ogg',
        // 忽略文档文件
        '**/*.md',
        '**/docs/**',
      ]
    }
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: ['phaser'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096, // 小于 4KB 的资源会被内联为 base64
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-phaser': ['phaser'],
        }
      }
    },
    // 启用 sourcemap 用于调试
    sourcemap: false,
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true
      }
    }
  },
  
  // 预览配置
  preview: {
    port: 3006,
    open: true
  }
});
