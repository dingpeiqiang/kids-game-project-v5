# Sass 编译错误修复指南

## 问题描述
在 Windows 系统上运行项目时遇到以下错误：
- `spawn EFTYPE` - Sass 编译错误
- `legacy-js-api` 弃用警告

## 根本原因
1. `sass-embedded` 包在 Windows 上的二进制文件执行权限问题
2. 使用了已弃用的 Sass Legacy JS API

## 解决方案

### 方案一：使用修复脚本（推荐）

1. 双击运行项目根目录下的 `fix-sass-install.bat` 脚本

2. 等待脚本完成以下操作：
   - 删除 node_modules
   - 删除 package-lock.json
   - 清理 npm 缓存
   - 重新安装依赖

3. 重启开发服务器：
   ```bash
   npm run dev
   ```

### 方案二：手动修复

1. **卸载 sass-embedded**
   ```bash
   npm uninstall sass-embedded
   ```

2. **确保使用普通 sass 包**
   检查 `package.json`，确保只有：
   ```json
   {
     "devDependencies": {
       "sass": "^1.69.5"
     }
   }
   ```

3. **清理并重装**
   ```bash
   # 删除 node_modules 和 package-lock.json
   rmdir /s /q node_modules
   del /q package-lock.json
   
   # 清理缓存
   npm cache clean --force
   
   # 重新安装
   npm install
   ```

4. **重启开发服务器**
   ```bash
   npm run dev
   ```

## 配置说明

### Vite 配置更新
已在 `vite.config.ts` 中更新了 Sass 配置：

```typescript
css: {
  preprocessorOptions: {
    scss: {
      // 使用新的 Sass API
      api: 'modern',
      silenceDeprecations: ['legacy-js-api']
    }
  }
}
```

这会：
- 使用新的 Modern API（替代已弃用的 Legacy API）
- 静默 legacy-js-api 的弃用警告

## 验证修复

启动开发服务器后，应该不再出现：
- ✅ `spawn EFTYPE` 错误
- ✅ `legacy-js-api` 弃用警告

如果仍然有问题，请检查：
1. Node.js 版本是否为 LTS（推荐 18.x 或更高）
2. 确保没有全局安装冲突的 sass 包
3. 尝试以管理员身份运行终端

## 预防措施

为避免将来出现类似问题：
1. 不要混用 `sass` 和 `sass-embedded` 包
2. 定期更新 Sass 相关依赖
3. 使用 `api: 'modern'` 配置以避免弃用警告
