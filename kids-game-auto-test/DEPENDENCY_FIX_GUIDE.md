# 🚨 依赖问题修复指南

**创建日期**: 2026-03-26  
**问题**: `Error: Cannot find module 'proxy-from-env'`  
**状态**: ✅ 已解决

---

## 📋 问题描述

运行测试时出现以下错误：

```
Error: Cannot find module 'proxy-from-env'
Require stack:
- .../node_modules/proxy-agent/dist/index.js
- .../node_modules/puppeteer-core/lib/cjs/puppeteer/puppeteer-core.js
```

**原因**: Puppeteer 的间接依赖 `proxy-from-env` 未正确安装。

---

## ✅ 解决方案

### 方案 1: 使用自动修复脚本（推荐）⭐

```bash
cd kids-game-auto-test
.\fix-dependencies.ps1
```

**脚本会自动**:
- ✅ 检查 Node.js 环境
- ✅ 清理 npm 缓存
- ✅ 删除旧的 node_modules
- ✅ 重新安装所有依赖
- ✅ 验证关键模块是否安装成功

**预计耗时**: 2-5 分钟

---

### 方案 2: 手动快速修复

```bash
# 直接安装缺失的包
npm install proxy-from-env --save
```

**预计耗时**: 10 秒

---

### 方案 3: 完整重新安装

```bash
# 1. 清理缓存
npm cache clean --force

# 2. 删除 node_modules
Remove-Item -Recurse -Force node_modules

# 3. 删除 package-lock.json（如果有）
Remove-Item -Force package-lock.json

# 4. 重新安装
npm install
```

**预计耗时**: 3-5 分钟

---

## 🔍 验证修复

运行以下命令验证：

```bash
# 检查 puppeteer 是否正常
node -e "require('puppeteer'); console.log('✓ Puppeteer OK')"

# 运行简单测试
npm run test:game -- --game=plane-shooter
```

**预期输出**:
```
========================================
  Kids Game Auto Test Platform v1.0.0
========================================
Mode: single
Game: plane-shooter
...
[INFO] Launching browser...
[INFO] ✓ Browser launched
...
```

---

## 📦 已创建的修复工具

### fix-dependencies.ps1

**功能**:
- 🔍 自动检测依赖问题
- 🛠️ 一键修复常见问题
- ✅ 验证修复结果
- 💾 备份重要文件

**使用方法**:
```bash
cd kids-game-auto-test
.\fix-dependencies.ps1
```

**执行步骤**:
1. 检查 Node.js 环境
2. 清理 npm 缓存
3. 删除并重建 node_modules
4. 批量安装所有依赖
5. 验证关键模块
6. 显示下一步操作指引

---

## 🎯 预防措施

### 日常维护

```bash
# 每周运行一次依赖检查
.\fix-dependencies.ps1

# 或者在遇到错误时立即运行
```

### 最佳实践

✅ **DO**:
- ✅ 定期运行依赖检查脚本
- ✅ 使用稳定的网络连接
- ✅ 使用官方或镜像源
- ✅ 保持 Node.js 和 npm 更新

❌ **DON'T**:
- ❌ 手动编辑 package-lock.json
- ❌ 混用不同版本的 Node.js
- ❌ 在网络不稳定时安装
- ❌ 忽略依赖警告

---

## 📊 常见依赖问题速查

| 错误信息 | 解决方案 | 预计耗时 |
|----------|----------|----------|
| `Cannot find module 'xxx'` | `.\\fix-dependencies.ps1` | 2 分钟 |
| `npm ERR! code ENOENT` | `npm cache clean --force` | 30 秒 |
| `npm ERR! network timeout` | 切换网络或镜像源 | 1 分钟 |
| `Puppeteer download failed` | 设置国内镜像源 | 2 分钟 |
| `node-gyp rebuild failed` | 安装 Windows Build Tools | 10 分钟 |

---

## 🌐 配置国内镜像源（可选）

如果遇到网络问题，可以配置国内镜像：

```bash
# 设置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 验证配置
npm config get registry
```

**Puppeteer 专用镜像**:
```bash
# Windows PowerShell
$env:PUPPETEER_DOWNLOAD_HOST="https://npmmirror.com/mirrors/chromium-browser-snapshots"

# 然后重新安装
npm install puppeteer
```

---

## 📞 获取帮助

如果以上方法都无法解决问题：

### 自助排查

1. **查看详细错误日志**:
   ```bash
   npm install --verbose
   ```

2. **检查 Node.js 版本**:
   ```bash
   node --version
   npm --version
   ```

3. **查看 npm 配置**:
   ```bash
   npm config list
   ```

### 寻求帮助

- 📘 [README.md](./README.md) - 完整故障排除章节
- 🏃 [RUN_GUIDE.md](./RUN_GUIDE.md) - 常见问题
- 📧 联系技术支持群

---

## 🎉 修复成功标志

当你看到以下输出时，说明修复成功：

```
========================================
  Installation Complete!
========================================

✓ puppeteer
✓ winston
✓ axios
✓ commander

Next Steps:
  1. Run: npm run test:game -- --game=plane-shooter
  2. Or run: npm run test:all
```

---

**最后更新**: 2026-03-26  
**维护者**: Kids Game Team  
**版本**: 1.0.0

🚀 **依赖问题已解决，继续你的测试之旅吧！**
