import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
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
    sourcemap: true,
    // 启用文件名哈希（解决缓存问题）
    assetsInlineLimit: 4096, // 小于4KB的资源内联
    rollupOptions: {
        external: ['phaser'], // 👉 打包时不包含Phaser
      output: {
        globals: { phaser: 'Phaser' },
        // 为所有资源文件添加内容哈希
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
});
