// Vite 插件：将 AI 生成的图片保存到 /public/generated/ 并返回 HTTP URL
import { writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';

// 调试：打印工作目录
console.log('[save-image] process.cwd():', process.cwd());
console.log('[save-image] GENERATED_DIR:', join(process.cwd(), 'public/generated'));

const GENERATED_DIR = join(process.cwd(), 'public/generated');
const GAME_ASSETS_DIR = join(process.cwd(), 'public/themes/space-invaders/assets/images');

// 确保目录存在
try { mkdirSync(GENERATED_DIR, { recursive: true }); } catch {}
try { mkdirSync(GAME_ASSETS_DIR, { recursive: true }); } catch {}

// 启动时清理 1 天前的旧文件
try {
  const files = readdirSync(GENERATED_DIR);
  files.forEach(f => {
    try {
      const stat = statSync(join(GENERATED_DIR, f));
      if (Date.now() - stat.mtimeMs > 86400000) {
        unlinkSync(join(GENERATED_DIR, f));
        console.log('[save-image] 清理旧文件:', f);
      }
    } catch {}
  });
} catch {}

/** 读取请求体，用 Buffer 安全拼接（避免 base64 大数据被字符串截断） */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default function saveImagePlugin() {
  return {
    name: 'save-image',
    configureServer(server) {

      // ── /__save-image ── 备份 AI 生成图片到 /public/generated/
      server.middlewares.use('/__save-image', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        try {
          const bodyStr = await readBody(req);
          const { base64, filename } = JSON.parse(bodyStr);
          if (!base64 || !filename) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: '缺少 base64 或 filename' }));
            return;
          }
          const raw = base64.startsWith('data:')
            ? base64.replace(/^data:image\/\w+;base64,/, '')
            : base64;
          const buf = Buffer.from(raw, 'base64');
          const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
          const filePath = join(GENERATED_DIR, safeName);
          writeFileSync(filePath, buf);
          const url = '/generated/' + safeName;
          console.log('[save-image] 保存成功: ' + url + ' (' + buf.length + ' bytes)');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, url }));
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });

      // ── /__apply-resource ── 将 AI 生成图片写入游戏资源目录
      server.middlewares.use('/__apply-resource', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        try {
          const bodyStr = await readBody(req);
          const { base64, resourcePath } = JSON.parse(bodyStr);
          if (!base64 || !resourcePath) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: '缺少 base64 或 resourcePath' }));
            return;
          }
          const raw = base64.startsWith('data:')
            ? base64.replace(/^data:image\/\w+;base64,/, '')
            : base64;
          const buf = Buffer.from(raw, 'base64');

          // resourcePath 如 '/themes/space-invaders/assets/images/ship.png'
          const relativePath = resourcePath.replace(/^\//, '');
          const filePath = resolve(process.cwd(), 'public', relativePath);

          // 安全检查：确保路径在 public 目录下
          const publicDir = resolve(process.cwd(), 'public');
          if (!filePath.startsWith(publicDir)) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: '路径越界，禁止访问' }));
            return;
          }

          // 确保目录存在
          const dir = dirname(filePath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }

          writeFileSync(filePath, buf);
          console.log('[apply-resource] ✅ 保存成功: ' + filePath + ' (' + buf.length + ' bytes)');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, path: filePath, url: resourcePath }));
        } catch (e) {
          console.error('[apply-resource] ❌ 失败:', e.message);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });

      console.log('[save-image] 插件已加载，图片保存到 /public/generated/，游戏资源保存到 /public/themes/space-invaders/');
    }
  };
}
