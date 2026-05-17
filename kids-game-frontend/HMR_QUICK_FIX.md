# 🚀 Vite 热更新快速修复指南

## ⚡ 30 秒快速解决

```bash
# 方法 1: 使用 npm 命令（推荐）
npm run clean
npm run dev

# 或直接一步到位
npm run dev:clean
```

```bash
# 方法 2: 使用清理脚本
node clean-vite-cache.js
```

```bash
# 方法 3: PowerShell 手动清理
Remove-Item -Recurse -Force node_modules/.vite; Remove-Item -Recurse -Force dist
```

---

## 🌐 浏览器端操作（必须！）

### Windows/Mac
- **硬刷新**: `Ctrl + Shift + R` 或 `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### Chrome/Edge
1. 按 `F12` 打开开发者工具
2. 进入 `Network` 标签
3. ✅ 勾选 `Disable cache`
4. 右键刷新按钮 → `清空缓存并硬性重新加载`

---

## 📋 完整排查流程

```
1. 停止服务器 (Ctrl+C)
   ↓
2. 运行：npm run clean
   ↓
3. 运行：npm run dev:clean
   ↓
4. 浏览器硬刷新：Ctrl+Shift+R
   ↓
5. 检查控制台 HMR 日志
```

---

## 🔍 验证 HMR 是否工作

在浏览器控制台应该看到类似日志：

```
[vite] connected.
[vite] hot updated: /src/components/xxx.vue
```

如果没有看到，说明 HMR 未正常工作。

---

## 💡 常用命令速查

| 命令 | 说明 | 使用场景 |
|------|------|----------|
| `npm run clean` | 清理 Vite 缓存 | 每日开发前 |
| `npm run dev:clean` | 清理并启动 | HMR 失效时 |
| `npm run dev` | 正常启动 | 日常开发 |
| `node clean-vite-cache.js` | 清理缓存脚本 | 同 clean 命令 |

---

## 🎯 核心问题定位

### 问题来源判断

**浏览器缓存问题** ✅ 
- 表现：修改代码后页面不变，但服务器显示已更新
- 解决：硬刷新、禁用缓存

**Vite 缓存问题** ✅
- 表现：服务器不检测文件变化
- 解决：清理 `node_modules/.vite`

**文件监听问题** ✅
- 表现：完全不触发 HMR
- 解决：重启服务器、检查文件权限

---

## 🛠️ 配置文件已优化

`vite.config.ts` 已包含以下优化：

```typescript
✅ protocol: 'ws'      // 明确 WebSocket 协议
✅ usePolling: false   // Windows 原生监听
✅ ignored: ['**/.vite/**'] // 忽略缓存目录
```

---

## 📞 还是不行？

查看详细文档：[VITE_HMR_SOLUTION.md](./VITE_HMR_SOLUTION.md)

或提供以下信息寻求帮助：
- Vite 版本：`npx vite --version`
- 浏览器及版本
- 错误截图

---

**最后更新**: 2026-04-04
