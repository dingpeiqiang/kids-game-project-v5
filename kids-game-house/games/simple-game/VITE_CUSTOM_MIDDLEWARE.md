# 🔧 Vite 自定义中间件方案 - 从 src 目录提供路线文件

## 🎯 方案概述

通过 **Vite 自定义插件**，在开发服务器中添加中间件，直接从 `src/games/dragonShooter/routes/` 目录提供 JSON 文件。

**优势：**
- ✅ 路线文件保留在 `src/` 目录，便于管理和版本控制
- ✅ 无需移动到 `public/` 目录
- ✅ 支持热更新，修改后刷新即可
- ✅ 生产构建时自动处理

---

## 📋 实现原理

### 1. Vite 插件机制

Vite 允许通过 `configureServer` API 在开发服务器中添加自定义中间件：

```typescript
plugins: [
  {
    name: 'serve-route-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 自定义逻辑
      })
    }
  }
]
```

### 2. 请求拦截

当浏览器请求 `/games/dragonShooter/routes/index.json` 时：

```
浏览器请求 → Vite 中间件 → 检查路径 → 映射到 src 目录 → 读取文件 → 返回 JSON
```

### 3. 路径映射

```
URL: /games/dragonShooter/routes/levels/level_1.json
  ↓
文件系统: src/games/dragonShooter/routes/levels/level_1.json
```

---

## 🔍 代码详解

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  // ... 其他配置
  
  plugins: [
    {
      name: 'serve-route-files',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // 1. 只处理路线文件请求
          if (req.url?.startsWith('/games/dragonShooter/routes/')) {
            try {
              // 2. 将 URL 路径映射到文件系统路径
              const relativePath = req.url.replace('/games/dragonShooter/routes/', '')
              const filePath = path.join(__dirname, 'src/games/dragonShooter/routes', relativePath)
              
              // 3. 安全检查：防止路径遍历攻击
              const resolvedPath = path.resolve(filePath)
              const routesDir = path.resolve(__dirname, 'src/games/dragonShooter/routes')
              
              if (!resolvedPath.startsWith(routesDir)) {
                res.writeHead(403)
                res.end('Forbidden')
                return
              }
              
              // 4. 检查文件是否存在
              if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
                const content = fs.readFileSync(resolvedPath, 'utf8')
                res.writeHead(200, { 
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache'  // 禁用缓存
                })
                res.end(content)
                return
              }
            } catch (error) {
              console.error('[serve-route-files] Error:', error)
            }
          }
          
          // 5. 继续处理其他请求
          next()
        })
      }
    }
  ]
})
```

### 关键步骤说明

#### 步骤1：路径检测
```typescript
if (req.url?.startsWith('/games/dragonShooter/routes/'))
```
只拦截路线文件的请求，其他请求交给 Vite 默认处理。

#### 步骤2：路径映射
```typescript
const relativePath = req.url.replace('/games/dragonShooter/routes/', '')
const filePath = path.join(__dirname, 'src/games/dragonShooter/routes', relativePath)
```
将 URL 路径转换为文件系统路径。

#### 步骤3：安全检查
```typescript
const resolvedPath = path.resolve(filePath)
const routesDir = path.resolve(__dirname, 'src/games/dragonShooter/routes')

if (!resolvedPath.startsWith(routesDir)) {
  res.writeHead(403)
  res.end('Forbidden')
  return
}
```
防止路径遍历攻击（例如：`../../etc/passwd`）。

#### 步骤4：文件读取和返回
```typescript
if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
  const content = fs.readFileSync(resolvedPath, 'utf8')
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  })
  res.end(content)
  return
}
```
读取文件内容并返回，设置正确的 Content-Type 和缓存策略。

#### 步骤5：继续处理
```typescript
next()
```
如果不是路线文件请求，交给下一个中间件处理。

---

## 🚀 使用流程

### 1. 启动开发服务器

```bash
cd kids-game-house/games/simple-game
npm run dev
```

### 2. 验证路由文件加载

打开浏览器控制台，应该看到：

```
🔄 加载路线配置...
🔄 开始加载路线...
✅ 使用索引文件加载路线
✅ 已加载 4 个关卡路线
✅ 路线加载完成: 4 个关卡, 0 条自定义路线, 共 6404 个点
```

### 3. 编辑路线文件

直接编辑 `src/games/dragonShooter/routes/` 目录下的文件：

```bash
code src/games/dragonShooter/routes/levels/level_1.json
```

### 4. 刷新浏览器

修改保存后，刷新浏览器页面即可看到更新（无需重启服务器）。

---

## 📂 目录结构

```
kids-game-house/games/simple-game/
├── src/
│   └── games/
│       └── dragonShooter/
│           ├── routes/              # ✅ 路线文件目录
│           │   ├── index.json       # 索引文件
│           │   ├── levels/          # 关卡路线
│           │   │   ├── level_1.json
│           │   │   ├── level_3.json
│           │   │   ├── level_5.json
│           │   │   └── level_10.json
│           │   ├── custom/          # 自定义路线
│           │   ├── inbox/           # 待处理
│           │   └── backup/          # 备份
│           ├── routeLoader.ts       # 路线加载器
│           └── index.ts             # 主文件
├── vite.config.ts                   # ✅ Vite 配置（含自定义插件）
└── package.json
```

---

## 🛡️ 安全特性

### 1. 路径遍历防护

```typescript
const resolvedPath = path.resolve(filePath)
const routesDir = path.resolve(__dirname, 'src/games/dragonShooter/routes')

if (!resolvedPath.startsWith(routesDir)) {
  res.writeHead(403)
  res.end('Forbidden')
  return
}
```

防止恶意请求访问其他目录的文件。

### 2. 文件类型检查

```typescript
if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile())
```

只允许访问文件，不允许访问目录。

### 3. 路径白名单

```typescript
if (req.url?.startsWith('/games/dragonShooter/routes/'))
```

只处理特定路径的请求。

---

## 🔧 高级配置

### 1. 添加更多静态文件目录

如果需要提供其他目录的文件，可以扩展中间件：

```typescript
server.middlewares.use(async (req, res, next) => {
  // 路线文件
  if (req.url?.startsWith('/games/dragonShooter/routes/')) {
    // ... 现有逻辑
  }
  
  // 其他静态文件
  if (req.url?.startsWith('/assets/custom/')) {
    // ... 类似逻辑
  }
  
  next()
})
```

### 2. 添加日志

```typescript
server.middlewares.use(async (req, res, next) => {
  if (req.url?.startsWith('/games/dragonShooter/routes/')) {
    console.log(`[serve-route-files] Serving: ${req.url}`)
    // ... 现有逻辑
  }
  next()
})
```

### 3. 添加 CORS 支持

```typescript
res.writeHead(200, { 
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache',
  'Access-Control-Allow-Origin': '*',  // 允许跨域
})
```

---

## 🏗️ 生产构建

### 问题

Vite 插件只在开发服务器中生效，生产构建时需要额外处理。

### 解决方案

#### 方案1：构建时复制文件

在 `package.json` 中添加构建脚本：

```json
{
  "scripts": {
    "build": "vite build && npm run copy-routes",
    "copy-routes": "cp -r src/games/dragonShooter/routes dist/games/dragonShooter/routes"
  }
}
```

#### 方案2：使用 vite-plugin-static-copy

安装插件：

```bash
npm install vite-plugin-static-copy --save-dev
```

配置：

```typescript
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/games/dragonShooter/routes',
          dest: 'games/dragonShooter'
        }
      ]
    }),
    // ... 其他插件
  ]
})
```

#### 方案3：手动部署

部署时将 `src/games/dragonShooter/routes/` 复制到服务器的正确位置。

---

## ❓ 常见问题

### Q1: 为什么要用自定义插件而不是 public 目录？

**A:** 
- 路线文件是游戏配置的一部分，放在 `src/` 目录更合理
- 便于版本控制和团队协作
- 与 TypeScript 代码放在一起，结构更清晰

### Q2: 修改文件后需要重启服务器吗？

**A:** 
- **不需要**！中间件每次都会读取最新文件
- 只需刷新浏览器即可

### Q3: 性能如何？

**A:** 
- 开发环境：每次请求都读取文件，性能足够（本地文件系统很快）
- 生产环境：建议使用方案2（vite-plugin-static-copy），让 Nginx 直接提供静态文件

### Q4: 可以缓存文件吗？

**A:** 
- 当前配置禁用了缓存（`Cache-Control: no-cache`），确保总是读取最新文件
- 如果需要缓存，可以改为：`'Cache-Control': 'max-age=3600'`

### Q5: 如何处理大文件？

**A:** 
- 当前实现适合小文件（< 1MB）
- 对于大文件，可以考虑：
  - 使用流式读取
  - 添加压缩（Gzip）
  - 使用 CDN

---

## 🎓 技术要点

### 1. ES Module 中的 __dirname

```typescript
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
```

ES Module 中没有 `__dirname`，需要使用 `import.meta.url` 获取。

### 2. Vite 中间件顺序

```typescript
server.middlewares.use((req, res, next) => {
  // 自定义逻辑
  next()  // 必须调用 next()，否则后续中间件不会执行
})
```

### 3. 异步中间件

```typescript
server.middlewares.use(async (req, res, next) => {
  // 可以使用 await
})
```

---

## ✅ 总结

### 优势

✅ **文件管理集中**：路线文件与代码在同一目录  
✅ **版本控制友好**：所有文件都在 Git 中  
✅ **开发体验好**：修改后刷新即可，无需重启  
✅ **安全性高**：有路径遍历防护  
✅ **灵活性强**：可以轻松扩展  

### 适用场景

- ✅ 开发环境
- ✅ 小型项目
- ✅ 配置文件较少
- ⚠️ 生产环境需要额外配置（复制文件或使用插件）

### 下一步

1. **重启开发服务器**测试
2. **验证路线加载**是否正常
3. **生产构建**时选择合适的方案
4. **根据需要扩展**功能

现在请**重启开发服务器**测试吧！🚀
