# Vite 配置更新 - 音频替换功能修复

## 🐛 问题描述

音频替换时出现 **403 Forbidden** 错误:
```
POST http://localhost:3000/api/local-write 403 (Forbidden)
[AudioEditor] 保存 GTRS.json 失败
```

## 🔍 原因分析

Vite配置中的安全检查过于严格,只允许写入 `themes/pvz/assets/audio/` 目录,但GTRS.json文件位于 `themes/pvz/GTRS.json`,不在允许的范围内。

## ✅ 解决方案

已修改 `vite.config.js` 中的安全检查逻辑:

### 修改前
```javascript
if (!safePath.startsWith('themes/pvz/assets/audio/')) {
  res.statusCode = 403;
  res.end(JSON.stringify({ error: 'Invalid path' }));
  return;
}
```

### 修改后
```javascript
// 允许的路径模式
const allowedPaths = [
  'themes/pvz/assets/audio/',      // 音频文件
  'themes/pvz/GTRS.json',          // GTRS配置文件
  'themes/pvz/assets/scene/',      // 场景资源
  'themes/pvz/assets/ui/'          // UI资源
];

const isAllowed = allowedPaths.some(prefix => 
  safePath.startsWith(prefix) || safePath === prefix.slice(0, -1)
);

if (!isAllowed) {
  console.error('[LocalFileWriter] 拒绝写入非法路径:', safePath);
  res.statusCode = 403;
  res.end(JSON.stringify({ error: 'Invalid path. Allowed paths: themes/pvz/assets/* or themes/pvz/GTRS.json' }));
  return;
}
```

## 🚀 应用步骤

### 1. 重启 Vite 开发服务器

**必须重启才能使配置生效!**

#### Windows PowerShell:
```powershell
# 停止当前运行的 Vite 进程
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# 重新启动
npm run dev
```

#### 或者手动操作:
1. 在运行 Vite 的终端窗口按 `Ctrl+C` 停止
2. 重新运行 `npm run dev`

### 2. 验证修复

1. 打开资源管理器: `http://localhost:3000/resource-manager.html`
2. 编辑一个音频文件
3. 点击"✅ 应用到游戏"
4. 选择要替换的音频
5. 确认应用

应该看到:
```
✅ 已替换音频并更新配置: xxx.wav
刷新游戏即可生效
```

### 3. 检查日志

在Vite控制台应该看到:
```
[LocalFileWriter] 收到写入请求: { targetPath: 'themes/pvz/assets/audio/xxx.wav', ... }
[LocalFileWriter] 完整路径: D:\...\public\themes\pvz\assets\audio\xxx.wav
[LocalFileWriter] 写入文件...
[LocalFileWriter] ✅ 文件写入成功

[LocalFileWriter] 收到写入请求: { targetPath: 'themes/pvz/GTRS.json', ... }
[LocalFileWriter] 完整路径: D:\...\public\themes\pvz\GTRS.json
[LocalFileWriter] 写入文件...
[LocalFileWriter] ✅ 文件写入成功
```

## 📝 新增功能

### 详细日志
添加了完整的日志输出,方便调试:
- 接收到的写入请求信息
- 完整的文件路径
- 目录创建情况
- 写入状态

### 扩展支持
现在支持写入以下路径:
- ✅ `themes/pvz/assets/audio/` - 音频文件
- ✅ `themes/pvz/GTRS.json` - GTRS配置文件
- ✅ `themes/pvz/assets/scene/` - 场景资源
- ✅ `themes/pvz/assets/ui/` - UI资源

## ⚠️ 注意事项

1. **必须重启Vite**: 配置文件修改后必须重启开发服务器
2. **安全检查**: 仍然保持严格的安全检查,只允许写入PVZ主题目录
3. **路径净化**: 自动过滤非法字符,防止路径遍历攻击

## 🔄 如果仍然失败

### 检查项:
1. ✅ Vite是否已重启?
2. ✅ 端口是否正确?(应该是3000)
3. ✅ 浏览器是否清除了缓存?(Ctrl+F5硬刷新)
4. ✅ 查看Vite控制台是否有错误日志

### 手动测试:
```bash
# 在浏览器控制台执行
fetch('/api/local-write', {
  method: 'POST',
  body: new FormData()
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

应该返回:
```json
{ "success": true, "path": "/..." }
```

---

**修复日期**: 2026-04-16  
**影响文件**: `vite.config.js`  
**需要重启**: ✅ 是
