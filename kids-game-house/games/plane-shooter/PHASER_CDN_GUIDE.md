# Phaser CDN 配置指南

## 📋 配置说明

本项目已将 Phaser 从 npm 包改为使用 CDN 引入，以优化加载性能。

---

## ✅ 已完成的修改

### 1. index.html - 添加 CDN 脚本

```html
<head>
  <meta charset="UTF-8">
  <title>飞机大战</title>
  <!-- Phaser 3 CDN -->
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
</head>
```

**CDN 选择**：jsDelivr（全球加速）
- 版本：Phaser 3.70.0
- URL：`https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js`

### 2. package.json - 移除 Phaser 依赖

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.1.0",
    "vue-router": "^4.2.0",
    "axios": "^1.6.0"
    // ❌ 移除了 "phaser": "^3.70.0"
  }
}
```

### 3. vite.config.ts - 配置外部依赖

```typescript
export default defineConfig({
  // ...其他配置
  
  // Phaser 使用 CDN，不打包到 bundle 中
  optimizeDeps: {
    exclude: ['phaser']
  },
  build: {
    rollupOptions: {
      external: ['phaser'],
      output: {
        globals: {
          phaser: 'Phaser'
        }
      }
    }
  }
})
```

### 4. global.d.ts - TypeScript 类型声明

```typescript
/// <reference types="phaser" />

declare global {
  interface Window {
    Phaser: typeof import('phaser')
  }
}

export {}
```

### 5. main.ts - 全局变量访问

```typescript
// Phaser 通过 CDN 引入，挂载到 window 上
const Phaser = (window as any).Phaser
```

---

## 🎯 优势

### 1. 减少打包体积
- ❌ 之前：~1.8MB（Phaser 库）
- ✅ 现在：0MB（使用 CDN）

### 2. 利用浏览器缓存
- 用户访问多个使用 Phaser 的游戏时，只需下载一次
- 显著提升后续游戏的加载速度

### 3. CDN 加速
- jsDelivr 全球 CDN 节点
- 自动选择最优节点
- 比自建服务器更快

### 4. 简化依赖管理
- 无需 `npm install phaser`
- 减少 `node_modules` 体积
- 降低安装时间

---

## 🔄 升级 Phaser 版本

需要升级 Phaser 版本时，只需修改两处：

### 1. 修改 index.html

```html
<!-- 修改版本号 -->
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js"></script>
```

### 2. 验证兼容性

测试游戏功能是否正常，如有问题回退到稳定版本。

---

## ⚠️ 注意事项

### 开发环境
- 确保网络连接正常（需要加载 CDN 资源）
- 本地开发时会从 CDN 下载 Phaser
- 可以使用浏览器的离线模式测试

### 生产环境
- CDN 稳定性很高，但仍建议监控加载失败率
- 可以考虑备用 CDN 方案
- 对于内网部署，建议改回本地打包

### TypeScript 支持
- 必须保留 `global.d.ts` 文件
- 确保 IDE 能识别 Phaser 类型
- 如遇类型错误，检查 TypeScript 配置

---

## 🚀 性能对比

| 指标 | npm 包 | CDN |
|------|--------|-----|
| **打包体积** | ~1.8MB | 0MB |
| **首次加载** | 较慢（需下载） | 较快（CDN 加速） |
| **二次加载** | 快（本地缓存） | 极快（共享缓存） |
| **依赖安装** | ~30 秒 | 无需安装 |

---

## 📞 参考资料

- [Phaser 官方文档](https://photonstorm.github.io/phaser3-docs/)
- [jsDelivr CDN](https://www.jsdelivr.com/)
- [Vite 外部依赖配置](https://vitejs.dev/config/build-options.html#build-rollupoptions)

---

## ✨ 总结

使用 CDN 引入 Phaser 是一个简单而有效的优化方案，特别适合：
- ✅ 多个游戏共享同一个 Phaser 版本
- ✅ 希望减少打包体积
- ✅ 面向公网用户（有 CDN 加速）

对于内网部署或特殊需求，也可以随时改回 npm 包方式。

**核心原则**：根据实际场景选择最优方案！✨
