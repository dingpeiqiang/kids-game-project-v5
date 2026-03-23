import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  // ⚠️ 重要：当游戏通过父应用代理访问时，需要设置 base
  // 这样所有资源路径会自动添加 /snake-vue3 前缀
  // 例如: /assets/xxx.png -> /snake-vue3/assets/xxx.png
  // 这样 Vite 代理规则 /snake-vue3 就能正确转发这些请求

  // 确保 WAV 文件被正确识别为静态资源
  assetsInclude: ['**/*.wav', '**/*.mp3', '**/*.ogg'],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared')
    }
  },
  server: {
    port: 3005,
    host: true,
    // 配置 HMR
    hmr: {
      overlay: true // 显示错误遮罩
    },
    proxy: {
      '/public': {
        target: 'http://localhost:3000',
        changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/public/, ''),
      },
      // ⭐ 音频资源代理：将远程服务器资源代理到本地
      '/files': {
        target: 'http://106.54.7.205',
        changeOrigin: true,
        secure: false, // 允许 HTTPS 证书错误
        // 添加 CORS 响应头，解决跨域问题
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 设置必要的请求头
            proxyReq.setHeader('Access-Control-Allow-Origin', '*')
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 设置 CORS 响应头
            proxyRes.headers['Access-Control-Allow-Origin'] = '*'
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type'
          })
        }
      },
      // ⚠️ 注意：不要设置 COEP/COOP 响应头，会导致跨域资源被阻止
      // headers: {
      //   'Cross-Origin-Opener-Policy': 'same-origin',
      //   'Cross-Origin-Embedder-Policy': 'require-corp'
      // },
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
    }
  },
  // 优化依赖预构建 - Phaser 已通过 CDN 引入，不需要预构建
  optimizeDeps: {
    include: [], // 不再包含 phaser
    esbuildOptions: {
      target: 'es2020'
    },
    // 不强制重新预构建，使用现有缓存
    force: false
  },
  // 生产环境构建优化
  build: {
    target: 'es2020',
    rollupOptions: {
      // 将 Phaser 标记为外部依赖（CDN 引入）
      external: ['phaser'],
      output: {
        globals: {
          phaser: 'Phaser' // 映射到全局变量
        },
        manualChunks: {
          'vendor-core': ['vue', 'pinia', 'vue-router', 'axios']
        }
      }
    }
  }
})
