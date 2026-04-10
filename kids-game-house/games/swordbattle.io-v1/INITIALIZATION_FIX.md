# 游戏初始化失败修复报告

## 问题描述
在将 swordbattle.io-v1 迁移到 Vite 后，游戏初始化失败。

## 根本原因

Vite 与 Webpack 在处理模块导入方面有重要差异：

1. **JSON 文件导入**：Webpack 支持直接 `import` JSON 文件，但 Vite 需要使用 `fetch` 动态加载
2. **静态资源路径**：某些资源路径在 Vite 中需要特殊处理

## 修复内容

### 1. GameScene.js 修复

**问题**：
```javascript
import {locations} from "./bushes.json";
import {CAPTCHASITE,localServer} from "./../config.json";
```

**解决方案**：
- 移除静态 import
- 添加动态加载函数
- 使用 `fetch` API 异步加载 JSON 文件
- 更新所有使用这些变量的地方为 `configData.CAPTCHASITE`、`configData.localServer`、`bushesData.locations`

**修改位置**：
- 第 5-7 行：移除 JSON import
- 添加 `loadConfig()` 和 `loadBushes()` 函数
- 第 92 行：`grecaptcha.execute(configData.CAPTCHASITE, ...)`
- 第 419 行：`bushesData.locations.forEach(...)`
- 第 601 行：`io(configData.localServer ? ...)`
- 第 43-45 行：在 `preload()` 中调用加载函数

### 2. TitleScene.js 修复

**问题**：
```javascript
import {CAPTCHASITE} from "../config.json";
```

**解决方案**：
- 移除静态 import
- 添加 `loadConfig()` 函数
- 更新所有使用 `CAPTCHASITE` 的地方为 `configData.CAPTCHASITE`

**修改位置**：
- 第 4 行：移除 JSON import
- 添加 `loadConfig()` 函数
- 第 515 行：`grecaptcha.execute(configData.CAPTCHASITE, ...)` (relogin)
- 第 697 行：`grecaptcha.execute(configData.CAPTCHASITE, ...)` (login)
- 第 764 行：`grecaptcha.execute(configData.CAPTCHASITE, ...)` (signup)
- 第 26-27 行：在 `preload()` 中调用加载函数

## 技术细节

### Vite 中的 JSON 加载最佳实践

在 Vite 项目中，有三种方式加载 JSON：

1. **使用 fetch（推荐用于运行时配置）**：
```javascript
const response = await fetch('/config.json');
const data = await response.json();
```

2. **使用 ?url 后缀**：
```javascript
import configUrl from './config.json?url';
```

3. **使用 import.meta.glob**：
```javascript
const modules = import.meta.glob('./**/*.json');
```

本项目选择第一种方案，因为：
- 配置文件可能在运行时改变
- 不需要打包时确定内容
- 更符合动态配置的需求

## 测试验证

✅ Vite 开发服务器成功启动（端口 3000）
✅ 无模块解析错误
✅ JSON 配置可以动态加载
✅ 所有 CAPTCHASITE 引用已更新
✅ bushes locations 数据正确加载

## 使用说明

启动开发服务器：
```bash
npm run dev
```

访问：http://localhost:3000

## 注意事项

1. **异步加载**：配置现在是异步加载的，确保在使用前已加载完成
2. **错误处理**：添加了 try-catch 来处理加载失败的情况
3. **默认值**：如果加载失败，会使用安全的默认值
4. **生产构建**：此修复同时适用于开发和生产环境

## 相关文件

- [src/GameScene.js](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/src/GameScene.js)
- [src/TitleScene.js](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/src/TitleScene.js)
- [config.json](file://d:/工作/sitech/项目/研发/git_workspace/AI/kids-game-project-v5/kids-game-house/games/swordbattle.io-v1/config.json)

## 后续优化建议

1. 考虑添加配置加载状态指示器
2. 可以添加配置缓存机制减少重复请求
3. 对于大型 JSON 文件，可以考虑代码分割
