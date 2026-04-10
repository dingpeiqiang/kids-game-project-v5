import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// 读取配置文件
let configData = {};
try {
  const configPath = resolve(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not read config.json:', e.message);
}

const CAPTCHASITE = configData.CAPTCHASITE || 'INSERT_RECAPTCHA_SITE_KEY';

// 生成 UUID 函数
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 自定义插件：处理 HTML 模板转换
function htmlTransformPlugin() {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      // 替换验证码密钥和 UUID
      return html
        .replace(/INSERT_RECAPTCHA_SITE_KEY/g, CAPTCHASITE)
        .replace(/RANDOM_UUID/g, uuidv4());
    }
  };
}

// 自定义插件：提供 src 目录中的 HTML 片段
function htmlFragmentsPlugin() {
  return {
    name: 'html-fragments',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 处理 HTML 片段请求
        const htmlFiles = [
          '/title.html',
          '/promo.html',
          '/login.html',
          '/signup.html',
          '/dropdown.html',
          '/footer.html',
          '/settings.html',
          '/featured.html',
          '/controls.html',
          '/about.html'
        ];
        
        if (htmlFiles.includes(req.url)) {
          const filePath = resolve(__dirname, 'src' + req.url);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'text/html');
            res.end(content);
            return;
          }
        }
        
        // Mock API 端点
        if (req.url.startsWith('/api/')) {
          res.setHeader('Content-Type', 'application/json');
          
          // 根据不同的 API 端点返回不同的 mock 数据
          if (req.url === '/api/getfeaturedcontent') {
            res.end(JSON.stringify([]));
          } else if (req.url === '/api/loginsecret' || req.url === '/api/login' || req.url === '/api/signup') {
            // 登录/注册 API - 返回成功但无实际功能
            res.end(JSON.stringify({ 
              success: false, 
              error: 'Backend not running in dev mode' 
            }));
          } else if (req.url.includes('/api/changename')) {
            res.end(JSON.stringify({ success: false }));
          } else if (req.url.includes('/api/serverinfo')) {
            res.end(JSON.stringify({ players: 0, maxPlayers: 100 }));
          } else {
            // 默认返回空对象
            res.end(JSON.stringify({}));
          }
          return;
        }
        
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [htmlTransformPlugin(), htmlFragmentsPlugin()],
  root: '.',
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 3000,
    open: false,
    host: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['phaser']
  }
});
