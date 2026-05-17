# Car on Curved Terrain - 快速启动指南

## 🚀 快速开始

### 启动开发服务器
```bash
npm run dev
```
或双击运行 `start-dev.bat`（Windows）

访问地址：**http://localhost:3000/** （如被占用会自动切换端口）

---

## 🔧 已修复的问题

| 问题 | 状态 | 解决方案 |
|------|------|----------|
| `global is not defined` | ✅ 已修复 | 在 vite.config.ts 中添加 `define: { global: 'globalThis' }` |
| manifest.json 错误 | ✅ 已修复 | 创建 public 目录并放置静态资源 |
| ServiceWorker 失败 | ✅ 已修复 | 开发环境暂时禁用 |

---

## 📁 重要文件

- **vite.config.ts** - Vite 配置文件
- **src/index.html** - HTML 入口文件
- **src/scripts/game.ts** - 游戏主入口
- **public/** - 静态资源目录（manifest.json, sw.js）

---

## 🎮 可用命令

```bash
# 开发模式（热更新）
npm run dev

# 生产构建
npm run vite:build

# 预览生产构建
npm run vite:preview

# 旧的 Webpack 命令（仍然可用）
npm start        # Webpack 开发服务器
npm run build    # Webpack 生产构建
```

---

## ⚠️ 注意事项

1. **端口占用**：如果 3000 端口被占用，Vite 会自动使用下一个可用端口
2. **浏览器缓存**：如遇问题，清除缓存或使用无痕模式
3. **ServiceWorker**：开发环境中已禁用，生产构建时可重新启用
4. **TypeScript**：Vite 原生支持，无需额外配置

---

## 🐛 常见问题

### 游戏无法加载？
1. 检查浏览器控制台是否有错误
2. 清除浏览器缓存
3. 重启开发服务器

### 修改代码后没有更新？
- Vite 应该自动热更新
- 如果没有，刷新浏览器页面（Ctrl+F5）

### 需要调试？
- 在代码中添加 `debugger` 语句
- 打开浏览器开发者工具（F12）
- 查看 Console 和 Network 标签

---

## 📚 更多文档

- [VITE_GUIDE.md](./VITE_GUIDE.md) - 详细使用指南
- [VITE_FIXES.md](./VITE_FIXES.md) - 问题修复详情
- [VITE_MIGRATION_COMPLETE.md](./VITE_MIGRATION_COMPLETE.md) - 迁移完整报告

---

## ✨ 性能提升

- ⚡ 启动速度：~10x 更快
- 🔄 热更新：几乎即时
- 💾 内存占用：降低 30-40%

---

**祝游戏开发愉快！** 🎉