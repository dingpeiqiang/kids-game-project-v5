# 修复 Sass 环境问题 - spawn EFTYPE 错误解决方案

## 问题原因
`package-lock.json` 中错误地使用了 `sass-embedded` 而不是 `sass`，导致在当前环境中出现 `[sass] spawn EFTYPE` 错误。

## 解决方案

### 方法一：使用 PowerShell 脚本（推荐）

1. **右键点击** `fix-sass-environment.ps1` 文件
2. 选择 **"使用 PowerShell 运行"**

或者在 PowerShell 中执行：
```powershell
.\fix-sass-environment.ps1
```

### 方法二：手动执行命令

在项目根目录打开 PowerShell，依次执行以下命令：

```powershell
# 1. 删除 node_modules 目录
Remove-Item -Path "node_modules" -Recurse -Force

# 2. 删除 package-lock.json
Remove-Item -Path "package-lock.json" -Force

# 3. 清理 npm 缓存
npm cache clean --force

# 4. 重新安装依赖
npm install
```

### 方法三：使用批处理脚本

双击运行 `fix-sass-environment.bat`

## 验证修复

修复完成后，运行以下命令启动项目：
```bash
npm run dev
```

如果不再出现 `[sass] spawn EFTYPE` 错误，说明修复成功。

## 技术说明

- **已修改文件**: `package.json` - 确保只使用 `sass` (^1.69.5) 而不使用 `sass-embedded`
- **Vite 配置**: 已配置使用 modern API，避免 legacy API 弃用警告
- **兼容性**: 纯 Dart Sass (`sass` 包) 在当前环境中更稳定

## 如果仍然遇到问题

1. 检查 Node.js 版本（建议 v18+）
2. 确保网络连接正常
3. 尝试以管理员身份运行 PowerShell
4. 关闭所有占用项目的进程
