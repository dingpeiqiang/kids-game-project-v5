// Vite 插件：将 AI 生成的图片保存到 /public/generated/ 并返回 HTTP URL
import { writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';

// 调试：打印工作目录
console.log('[save-image] process.cwd():', process.cwd());
console.log('[save-image] GENERATED_DIR:', join(process.cwd(), 'public/generated'));

const GENERATED_DIR = join(process.cwd(), 'public/generated');
const GAME_ASSETS_DIR = join(process.cwd(), 'public/themes/pvz/assets/scene');

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

export default function saveImagePlugin() {
  return {
    name: 'save-image',
    configureServer(server) {
      server.middlewares.use('/__save-image', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { base64, filename } = JSON.parse(body);
            if (!base64 || !filename) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: '缺少 base64 或 filename' }));
              return;
            }
            const raw = base64.replace(/^data:image\/\w+;base64,/, '');
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
      });

      // 新增：应用到游戏资源目录
      server.middlewares.use('/__apply-resource', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const { base64, resourcePath } = JSON.parse(body);
            if (!base64 || !resourcePath) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: '缺少 base64 或 resourcePath' }));
              return;
            }
            const raw = base64.replace(/^data:image\/\w+;base64,/, '');
            const buf = Buffer.from(raw, 'base64');
            
            // resourcePath 如 '/themes/pvz/assets/scene/peashooter.png'
            // 转换为绝对路径：public/themes/pvz/assets/scene/peashooter.png
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
            console.log('[apply-resource] 保存成功: ' + filePath + ' (' + buf.length + ' bytes)');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, path: filePath, url: resourcePath }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
        });
      });

      console.log('[save-image] 插件已加载，图片保存到 /public/generated/，游戏资源保存到 /public/themes/');
    }
  };
}
