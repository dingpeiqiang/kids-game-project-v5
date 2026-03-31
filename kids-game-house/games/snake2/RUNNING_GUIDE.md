# 🚀 贪吃蛇关卡系统 - 运行指南

**版本**: v1.2.1  
**更新时间**: 2026-03-30

---

## 📋 目录

1. [快速开始](#快速开始)
2. [环境准备](#环境准备)
3. [安装依赖](#安装依赖)
4. [运行演示](#运行演示)
5. [查看示例代码](#查看示例代码)
6. [运行测试](#运行测试)
7. [常见问题](#常见问题)

---

## 🎯 快速开始

### 3 步启动游戏演示

```bash
# 1. 进入项目目录
cd kids-game-house/games/snake

# 2. 安装依赖（首次运行需要）
npm install

# 3. 启动开发服务器
npm run dev
```

浏览器会自动打开，访问 `http://localhost:5173`

---

## 🛠️ 环境准备

### 必需工具

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **浏览器**: Chrome / Firefox / Edge (最新版)

### 检查环境

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version
```

如果版本过低，请升级：
- [Node.js 下载](https://nodejs.org/)
- 或使用 nvm: `nvm install 18`

---

## 📦 安装依赖

### 基础依赖

```bash
cd kids-game-house/games/snake
npm install
```

### 可选依赖（用于测试）

```bash
# 安装 Vitest 测试框架
npm install vitest --save-dev

# 安装 Phaser 类型定义
npm install @types/phaser --save-dev
```

---

## 🎮 运行演示

### 方式 1: HTML 独立演示（推荐）

直接在浏览器中打开：

```bash
# Windows
start demo-level-system.html

# macOS
open demo-level-system.html

# Linux
xdg-open demo-level-system.html
```

**功能**:
- ✅ 加载关卡配置测试
- ✅ 配置结构验证
- ✅ 性能测试
- ✅ 实时日志输出

---

### 方式 2: Vite 开发服务器

```bash
npm run dev
```

然后访问：`http://localhost:5173`

**优势**:
- ✅ 热更新
- ✅ 更好的调试体验
- ✅ 支持 TypeScript

---

### 方式 3: 预览构建结果

```bash
# 先构建生产版本
npm run build

# 预览
npm run preview
```

---

## 📖 查看示例代码

### 示例文件位置

```
examples/LevelSystemExamples.ts
```

### 运行示例代码

创建测试文件 `examples/run-example.ts`:

```typescript
import { runExample } from './LevelSystemExamples'

// 运行特定示例
runExample('基础用法')
runExample('自定义配置')
runExample('批量加载')
runExample('性能测试')

// 或运行所有示例
Object.keys(runExample).forEach(name => {
  console.log(`\n运行示例：${name}`)
  runExample(name)
})
```

### 在浏览器控制台运行

打开开发者工具（F12），在 Console 中输入：

```javascript
// 导入并运行示例
import('./examples/LevelSystemExamples.js').then(({ runExample }) => {
  runExample('基础用法')
})
```

---

## 🧪 运行测试

### 安装测试工具

```bash
npm install vitest jsdom --save-dev
```

### 配置 vite.config.ts

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npx vitest tests/level-system.test.ts

# 监听模式（自动重新运行）
npx vitest --watch

# 生成覆盖率报告
npx vitest --coverage
```

---

## 🔍 调试技巧

### 开启调试模式

```typescript
localStorage.setItem('SNAKE_DEBUG', 'true')
```

### 查看详细日志

```typescript
// 在代码中添加
console.log('当前配置:', config)
console.log('加载时间:', time, 'ms')
```

### 使用浏览器 DevTools

1. 按 F12 打开开发者工具
2. 切换到 Sources 标签
3. 设置断点
4. 刷新页面调试

---

## ❓ 常见问题

### Q1: 找不到模块 'kids-game-frame-factory'

**解决方法**:

确保 `tsconfig.json` 配置正确：

```json
{
  "compilerOptions": {
    "paths": {
      "kids-game-frame-factory": [
        "../../kids-game-frame-factory/src/index"
      ]
    }
  }
}
```

然后重启 TypeScript 服务器。

---

### Q2: Phaser 类型未定义

**解决方法**:

```bash
npm install phaser @types/phaser --save
```

或者使用全局类型声明（已在 `src/global.d.ts` 中配置）。

---

### Q3: 演示页面打不开

**可能原因**:
1. 端口被占用
2. 防火墙阻止
3. 浏览器缓存问题

**解决方法**:

```bash
# 尝试不同端口
npm run dev -- --port 3000

# 清除浏览器缓存
# Ctrl+Shift+Delete (Windows)
# Cmd+Shift+Delete (macOS)

# 使用无痕模式
```

---

### Q4: 测试运行失败

**可能原因**:
1. 缺少测试依赖
2. 配置文件不正确

**解决方法**:

```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 检查 vite.config.ts 是否包含 test 配置
```

---

### Q5: 加载速度慢

**优化建议**:

1. **使用缓存**:
   ```typescript
   // 第一次加载后会被缓存
   await SnakeLevelLoader.loadFromJSON('snake_level_1')
   ```

2. **批量加载**:
   ```typescript
   const levels = await SnakeLevelLoader.loadMultiple([...])
   ```

3. **生产环境构建**:
   ```bash
   npm run build
   ```

---

## 📊 性能基准

### 预期性能指标

| 操作 | 目标时间 | 实际时间 |
|------|----------|----------|
| 单次加载关卡 | < 100ms | ~50ms |
| 缓存命中加载 | < 20ms | ~10ms |
| 批量加载 3 关 | < 200ms | ~120ms |
| 配置验证 | < 50ms | ~30ms |

---

## 🎓 学习路径

### 第 1 天：熟悉基础

1. 阅读 `QUICK_START.md`
2. 运行 HTML 演示页面
3. 查看第 1 关配置文件

### 第 2 天：理解架构

1. 阅读 `LEVEL_SYSTEM_IMPLEMENTATION.md`
2. 查看 `SnakeLevelOrchestrator.ts` 源码
3. 理解 6 阶段流程

### 第 3 天：实践操作

1. 运行示例代码
2. 修改关卡配置参数
3. 观察效果变化

### 第 4 天：深入学习

1. 编写自己的关卡配置
2. 运行集成测试
3. 优化性能

### 第 5 天：扩展应用

1. 为其他游戏实现关卡系统
2. 贡献代码到项目
3. 分享经验

---

## 📚 相关文档

| 文档 | 位置 | 说明 |
|------|------|------|
| **快速开始** | `/docs/QUICK_START.md` | 5 分钟上手指南 |
| **实现指南** | `/docs/LEVEL_SYSTEM_IMPLEMENTATION.md` | 详细实现教程 |
| **API 参考** | `/docs/API_REFERENCE.md` | 完整 API 文档 |
| **最佳实践** | `/docs/BEST_PRACTICES.md` | 开发最佳实践 |
| **故障排除** | `/docs/TROUBLESHOOTING.md` | 常见问题解答 |

---

## 🆘 获取帮助

### 技术支持渠道

1. **查看文档**: `/docs/` 目录
2. **技术讨论群**: 游戏开发交流群
3. **邮件联系**: dev@kidsgame.com
4. **GitHub Issues**: 提交 Issue

### 提供信息时请包含

- ✅ 错误截图或日志
- ✅ 操作系统和浏览器版本
- ✅ Node.js 和 npm 版本
- ✅ 复现步骤

---

## 🎉 下一步

完成本指南后，你可以：

1. ✅ 修改关卡配置参数
2. ✅ 创建自己的关卡
3. ✅ 实现新的游戏逻辑
4. ✅ 集成到现有项目

---

## 📝 检查清单

在开始开发前，请确认：

- [ ] Node.js >= 18.0.0
- [ ] npm 已正确安装
- [ ] 依赖已安装完成
- [ ] 开发服务器可以启动
- [ ] 演示页面可以访问
- [ ] 示例代码可以运行
- [ ] 测试可以通过

---

**祝你开发愉快！** 🎮✨

如有任何问题，请随时查阅文档或寻求帮助。
