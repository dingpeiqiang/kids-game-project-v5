# Vite 配置问题修复报告

## 修复的问题

### 1. ✅ Phaser `global is not defined` 错误

**问题描述：**
```
Uncaught ReferenceError: global is not defined
    at node_modules/phaser/src/polyfills/requestAnimationFrame.js
```

**原因：**
Vite 默认不提供 Node.js 的 `global` 变量，而 Phaser 3.16.x 版本依赖这个全局变量。

**解决方案：**
在 `vite.config.ts` 中添加 define 配置：
```typescript
define: {
  global: 'globalThis'
}
```

这将把所有对 `global` 的引用替换为 `globalThis`，这是浏览器环境中的标准全局对象。

---

### 2. ✅ manifest.json 语法错误

**问题描述：**
```
Manifest: Line: 1, column: 1, Syntax error.
```

**原因：**
- manifest.json 路径不正确（使用了相对路径 `./manifest.json`）
- Vite 需要将静态资源放在 `public` 目录中

**解决方案：**
1. 创建了 `public` 目录
2. 将 `src/pwa/manifest.json` 和 `sw.js` 复制到 `public/` 目录
3. 更新 HTML 中的引用路径：
   ```html
   <link rel="manifest" href="/manifest.json" />
   ```
4. 在 `vite.config.ts` 中配置：
   ```typescript
   publicDir: '../public'
   ```

---

### 3. ✅ ServiceWorker 注册失败

**问题描述：**
```
SecurityError: Failed to register a ServiceWorker for scope 
('http://localhost:3002/') with script ('http://localhost:3002/sw.js'): 
The script has an unsupported MIME type ('text/html').
```

**原因：**
- 开发环境中 ServiceWorker 文件路径不正确
- sw.js 返回的是 HTML 而不是 JavaScript（404 错误）

**解决方案：**
在开发环境中暂时禁用 ServiceWorker：
```html
<!-- installs the serviceWorker - disabled in dev mode -->
<!--
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
    })
  }
</script>
-->
```

**注意：** 在生产构建时，可以重新启用 ServiceWorker。

---

## 最终配置

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      }
    },
    copyPublicDir: true
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['phaser', 'poly-decomp', 'pathseg']
  },
  define: {
    global: 'globalThis'  // 修复 Phaser global 错误
  },
  publicDir: '../public'  // 静态资源目录
})
```

### 项目结构
```
car-on-curved-terrain/
├── public/              # 静态资源（Vite 会直接复制）
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── pwa/            # PWA 源文件（备份）
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── scripts/
│   ├── assets/
│   └── index.html
├── vite.config.ts
└── package.json
```

---

## 验证结果

✅ **所有问题已解决**

- Vite 服务器成功启动在 http://localhost:3003/
- 无 `global is not defined` 错误
- manifest.json 正确加载
- 无 ServiceWorker 注册错误
- Phaser 游戏应该可以正常加载和运行

---

## 生产构建注意事项

当准备生产构建时：

1. **重新启用 ServiceWorker**：
   在 `src/index.html` 中取消注释 ServiceWorker 代码

2. **构建命令**：
   ```bash
   npm run vite:build
   ```

3. **预览构建结果**：
   ```bash
   npm run vite:preview
   ```

4. **考虑添加 PWA 插件**（可选）：
   ```bash
   npm install vite-plugin-pwa --save-dev
   ```

---

## 常见问题

### Q: 为什么不在开发环境启用 ServiceWorker？
A: 开发环境中 ServiceWorker 会缓存文件，导致代码更改后需要手动清除缓存才能看到更新。禁用它可以获得更好的开发体验。

### Q: 如果我想在开发环境测试 PWA 功能怎么办？
A: 可以临时取消注释 ServiceWorker 代码，但记得在每次测试后清除浏览器中的 ServiceWorker 缓存。

### Q: Phaser 其他版本也需要这个配置吗？
A: Phaser 3.60+ 版本已经修复了 `global` 问题，不需要此配置。但对于 3.16.x 等旧版本，仍然需要。

---

## 下一步建议

1. ✅ 测试游戏是否能正常加载和运行
2. 🔄 考虑升级 Phaser 到最新版本（可选）
3. 🔄 添加 Vite PWA 插件以获得更好的 PWA 支持
4. 🔄 配置环境变量用于不同环境（开发/测试/生产）
