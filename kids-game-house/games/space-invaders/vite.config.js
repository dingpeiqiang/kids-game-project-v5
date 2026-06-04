import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import fs from 'fs'
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
    port: 8080,
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
      },
      '/musicgen': {
        target: 'http://127.0.0.1:7880',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/musicgen/, ''),
      },
      // 音频文件写入代理
      '/api/local-write': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        selfHandleResponse: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // 转发请求体
            if (req.body) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
              proxyReq.write(req.body);
            }
          });
        }
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
  plugins: [
    saveImagePlugin(),
    // GTRS.json 读取路由
    {
      name: 'gtrs-api',
      configureServer(server) {
        server.middlewares.use('/api/gtrs', (req, res, next) => {
          if (req.method !== 'GET') return next();
          const gtrsPath = resolve(__dirname, 'public', 'themes', 'space-invaders', 'GTRS.json');
          if (fs.existsSync(gtrsPath)) {
            res.setHeader('Content-Type', 'application/json');
            fs.createReadStream(gtrsPath).pipe(res);
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'GTRS.json not found' }));
          }
        });
      }
    },
    {
      name: 'resource-manager-router',
      configureServer(server) {
        server.middlewares.use('/resource-manager', (req, res, next) => {
          if (req.method === 'GET') {
            const filePath = resolve(__dirname, 'public', 'resource-manager.html');
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'text/html');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
          next();
        });
      }
    },
    // 本地文件写入插件
    {
      name: 'local-file-writer',
      configureServer(server) {
        server.middlewares.use('/api/local-write', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Only POST allowed' }));
            return;
          }

          try {
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const body = Buffer.concat(chunks);

            // 解析 FormData
            const boundary = req.headers['content-type']?.match(/boundary=(.+)/)?.[1];
            if (!boundary) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing boundary' }));
              return;
            }

            const parts = parseMultipartFormData(body, boundary);
            const fileData = parts.find(p => p.name === 'file');
            const targetPathPart = parts.find(p => p.name === 'path');

            if (!fileData || !targetPathPart) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing file or path' }));
              return;
            }

            // targetPath 是文本字段，没有 filename
            const targetPath = targetPathPart.filename ? null : targetPathPart.data?.toString();
            if (!targetPath) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid path' }));
              return;
            }

            console.log('[LocalFileWriter] 收到写入请求:', {
              targetPath,
              filename: fileData.filename,
              fileSize: fileData.data?.length || 0
            });

            // 安全检查：只允许写入 public/themes/space-invaders/ 目录下的文件
            const safePath = targetPath.replace(/[^a-zA-Z0-9_./-]/g, '');
            
            // 允许的路径模式
            const allowedPaths = [
              'themes/space-invaders/assets/audio/',      // 音频文件
              'themes/space-invaders/GTRS.json',          // GTRS配置文件
              'themes/space-invaders/assets/images/'       // 图片资源
            ];
            
            const isAllowed = allowedPaths.some(prefix => 
              safePath.startsWith(prefix) || safePath === prefix.slice(0, -1)
            );
            
            if (!isAllowed) {
              console.error('[LocalFileWriter] 拒绝写入非法路径:', safePath);
              res.statusCode = 403;
              res.end(JSON.stringify({ error: 'Invalid path. Allowed paths: themes/space-invaders/assets/* or themes/space-invaders/GTRS.json' }));
              return;
            }

            const fullPath = resolve(__dirname, 'public', safePath);
            console.log('[LocalFileWriter] 完整路径:', fullPath);
            
            // 确保目录存在
            const directory = dirname(fullPath);
            if (!fs.existsSync(directory)) {
              console.log('[LocalFileWriter] 创建目录:', directory);
              fs.mkdirSync(directory, { recursive: true });
            }
            
            console.log('[LocalFileWriter] 写入文件...');
            fs.writeFileSync(fullPath, fileData.data);
            console.log('[LocalFileWriter] ✅ 文件写入成功');

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, path: '/' + safePath }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      }
    }
  ],
  base: '/'
});

// 解析 multipart/form-data
function parseMultipartFormData(body, boundary) {
  const parts = [];
  const boundaryBytes = Buffer.from('--' + boundary);
  let idx = 0;

  while (idx < body.length) {
    const boundaryIdx = body.indexOf(boundaryBytes, idx);
    if (boundaryIdx === -1) break;

    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), boundaryIdx);
    if (headerEnd === -1) break;

    const headerStr = body.slice(boundaryIdx + boundaryBytes.length + 2, headerEnd).toString();
    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);

    if (nameMatch) {
      const name = nameMatch[1];
      const dataStart = headerEnd + 4;
      const nextBoundary = body.indexOf(boundaryBytes, dataStart);
      const dataEnd = nextBoundary > 0 ? nextBoundary - 2 : body.length;

      parts.push({
        name,
        filename: filenameMatch?.[1],
        data: body.slice(dataStart, dataEnd)
      });
    }

    idx = boundaryIdx + boundaryBytes.length;
  }

  return parts;
}
