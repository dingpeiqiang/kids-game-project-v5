# Vite 热更新 (HMR) 问题解决方案

## 🔍 问题诊断

Vite 热更新失效通常由以下原因导致：

### 1. **浏览器缓存**（最常见）
- 浏览器缓存了旧的 JavaScript 模块
- Service Worker 缓存
- HTTP 缓存

### 2. **Vite 依赖预构建缓存**
- 位置：`node_modules/.vite`
- Vite 会预构建和缓存依赖项

### 3. **文件系统监听问题**
- Windows 上文件监听可能失效
- 文件数量过多导致监听延迟

---

## 🛠️ 解决方案

### ✅ 方案 1：快速清理缓存（推荐）

```bash
# 在项目根目录执行
node clean-vite-cache.js
```

或手动删除：
```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules/.vite
Remove-Item -Recurse -Force dist

# 或使用清理脚本
.\clean-vite-cache.bat
```

### ✅ 方案 2：浏览器端操作

1. **硬刷新**（清除页面缓存）
   - Windows: `Ctrl + Shift + R` 或 `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **清除浏览器缓存**
   ```
   Chrome/Edge:
   - F12 打开开发者工具
   - Network 标签
   - 勾选 "Disable cache"（开发时保持勾选）
   - 右键刷新按钮 -> "清空缓存并硬性重新加载"
   ```

3. **使用无痕模式测试**
   - 排除扩展程序和缓存干扰

### ✅ 方案 3：重启开发服务器

```bash
# 完全重启
# 1. 停止当前服务器 (Ctrl+C)
# 2. 清理缓存
node clean-vite-cache.js
# 3. 重新启动
npm run dev
```

### ✅ 方案 4：优化 Vite 配置

已优化的配置项：

```typescript
server: {
  hmr: {
    overlay: true,      // 显示错误遮罩
    protocol: 'ws',     // 明确 WebSocket 协议
  },
  watch: {
    usePolling: false,  // Windows 原生监听
    interval: 100,      // 轮询间隔
    ignored: [
      '**/.vite/**',    // 忽略缓存目录
      // ...其他忽略项
    ]
  }
}
```

---

## 🚀 预防措施

### 1. **开发时禁用缓存**

在 `vite.config.ts` 中添加：

```typescript
export default defineConfig({
  // ...其他配置
  server: {
    hmr: {
      overlay: false,  // 可选：禁用错误遮罩（避免遮挡）
    }
  }
})
```

### 2. **添加缓存控制头**

如果是通过后端服务提供前端资源，确保响应头包含：

```
Cache-Control: no-cache, no-store, must-revalidate
Expires: 0
Pragma: no-cache
```

### 3. **使用版本号**

在引用资源时添加版本参数：

```html
<script src="/main.js?v=1.0.0"></script>
```

---

## 📋 排查清单

当 HMR 不工作时，按顺序检查：

- [ ] 停止开发服务器
- [ ] 运行 `node clean-vite-cache.js`
- [ ] 重新启动服务器 (`npm run dev`)
- [ ] 浏览器硬刷新 (`Ctrl+Shift+R`)
- [ ] 检查控制台是否有 HMR 连接日志
- [ ] 查看 Network 面板 WS 连接状态
- [ ] 尝试浏览器无痕模式
- [ ] 检查防火墙是否阻止 WebSocket

---

## 🔧 高级调试

### 查看详细日志

启动时添加 debug 标志：

```bash
npm run dev -- --debug
```

### 检查 WebSocket 连接

在浏览器控制台执行：

```javascript
// 检查 HMR 连接状态
console.log(window.__vite_hmr_client__);
```

### 强制重新编译

```bash
# 删除 node_modules 并重新安装（极端情况）
rm -rf node_modules
npm install
```

---

## 💡 最佳实践

1. **开发时始终保持开发者工具打开**
   - Network → Disable cache 勾选
   - Console 查看 HMR 日志

2. **定期清理缓存**
   - 每天开始工作前执行清理脚本
   - 或在 `package.json` 中添加快捷命令

3. **避免修改配置文件后继续开发**
   - 修改 `vite.config.ts` 后务必重启服务器

4. **使用最新的 Vite 版本**
   ```bash
   npm update vite @vitejs/plugin-vue
   ```

---

## 🆘 常见问题

### Q: 修改代码后页面空白？
A: 硬刷新浏览器，检查控制台是否有模块加载错误

### Q: WebSocket 连接失败？
A: 检查端口 3000 是否被占用，防火墙设置

### Q: 某些文件不触发更新？
A: 检查是否在 `watch.ignored` 列表中被忽略

### Q: 修改 CSS 不生效？
A: 清理浏览器缓存，检查 CSS 提取配置

---

## 📞 需要帮助？

如果以上方法都无效，请提供：
1. Vite 版本：`npx vite --version`
2. 浏览器及版本
3. 操作系统版本
4. 控制台完整错误信息

---

**最后更新**: 2026-04-04
**适用版本**: Vite 5.x
