# Battle of Grandia - Vite 启动指南

## 项目概述
Battle of Grandia 是一个使用 Phaser3 构建的冒险 RPG 游戏，现已迁移到 Vite 构建工具。

## 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

## 安装依赖
```bash
npm install
```

## 启动开发服务器
```bash
npm run dev
```
或者
```bash
npm start
```

开发服务器将在 http://localhost:3000 启动，并自动打开浏览器。

## 构建生产版本
```bash
npm run build
```

## 预览生产构建
```bash
npm run preview
```

## 运行测试
```bash
npm test
```

## 主要变更
- 从 Webpack 迁移到 Vite
- 更新了入口文件以支持 ES 模块
- 添加了 Vite 配置文件
- 优化了开发服务器性能

## 故障排除
如果遇到任何问题，请尝试以下步骤：

### 1. global is not defined 错误
如果看到 `ReferenceError: global is not defined` 错误：
- 已在 `vite.config.js` 中添加了 `global: 'globalThis'` 定义
- 已在 `index.html` 中添加了 polyfill
- 清除浏览器缓存并刷新页面

### 2. require is not defined 错误
如果看到 `ReferenceError: require is not defined` 错误：
- Vite 使用 ES 模块，不支持 CommonJS 的 `require` 语法
- 已将所有 `require()` 调用转换为 ES6 `import` 语句
- 浏览器原生支持 `fetch` API，无需 `node-fetch`

### 3. 其他常见问题
1. 清除 node_modules 和重新安装依赖：`rm -rf node_modules && npm install`
2. 清除 Vite 缓存：`npx vite --force`
3. 检查端口 3000 是否被占用
4. 清除浏览器缓存或使用无痕模式

## 技术栈
- Phaser3 - 游戏引擎
- Vite - 构建工具
- JavaScript - 编程语言
- CSS - 样式
