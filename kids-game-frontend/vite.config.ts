import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_SHELL': JSON.stringify('admin'),
  },
  plugins: [vue()],
  // 设置静态资源目录为 assets
  publicDir: 'public',
  css: {
    preprocessorOptions: {
      scss: {
        // 使用新的 Sass API
        api: 'modern',
        silenceDeprecations: ['legacy-js-api']
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@root': resolve(__dirname, '..'), // 指向项目根目录 kids-game-project
    },
  },
  optimizeDeps: {
    exclude: ['phaser'],
    include: ['vue', 'pinia', 'vue-router', 'axios', 'element-plus', 'echarts'],
  },
  server: {
    port: 3000,
    // 开发模式强制禁用浏览器缓存
    headers: {
      'Cache-Control': 'no-store',
    },
    hmr: {
      overlay: true // 显示错误遮罩
    },
    // 排除特定文件的热更新
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
        // 忽略构建产物
        '**/build/**',
        '**/output/**'
      ]
    },
    proxy: {
      // API 代理 -> 后端服务
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // WebSocket 代理
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
      // 静态资源代理（生产环境由 Nginx 处理）
      // 这样可以统一使用 /public 路径，避免跨域
      '/public': {
        target: 'http://localhost:3005',
        changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/public/, ''),
      },
      // 其他游戏的代理配置可以参考此格式
        // 这样可以统一使用 /public 路径，避免跨域
        '/files': {
          target: 'http://106.54.7.205',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/public/, ''),
        }
    },
    // 配置静态资源服务
    fs: {
      allow: ['..'],
    },
  },
  build: {
    outDir: 'dist',
    // 每次构建前清空输出目录（避免旧文件残留）
    emptyOutDir: true,
    // 目标浏览器
    target: 'es2020',
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生产环境关闭 sourcemap（节省体积）
    sourcemap: false,
    // 压缩方式
    minify: 'esbuild',
    // 不输出压缩体积报告（加速构建）
    reportCompressedSize: false,
    // 小于 4KB 的资源内联为 base64
    assetsInlineLimit: 4096,
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['phaser'],
      output: {
        globals: { phaser: 'Phaser' },
        // 文件名带内容哈希 → 内容变化自动更新
        entryFileNames: 'assets/[name]-[hash:10].js',
        chunkFileNames: 'assets/[name]-[hash:10].js',
        assetFileNames: 'assets/[name]-[hash:10].[ext]',
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
});
