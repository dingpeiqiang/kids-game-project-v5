# 🔧 Phaser 类型错误修复指南

## 问题描述

运行游戏时出现错误：
```
GameScene.ts:7 Uncaught ReferenceError: Phaser is not defined
```

## ✅ 已完成的修复

### 1. 安装 Phaser 依赖
```bash
npm install phaser@3.90.0 --save
npm install @types/node --save-dev
```

✅ **状态**: 已完成

### 2. 修复导入语句

**GameScene.ts**:
```typescript
import Phaser from 'phaser'
```

**GameView.vue**:
```typescript
import Phaser from 'phaser'
```

✅ **状态**: 已完成

### 3. 修复 Physics 配置

在 `GameView.vue` 中：
```typescript
physics: {
  default: 'arcade',
  arcade: {
    gravity: { x: 0, y: 0 }, // ✅ 必须包含 x 和 y
    debug: false,
  },
},
```

✅ **状态**: 已完成

### 4. 修复 require() 语法错误

**问题**: `require is not defined`

**原因**: 在 ES Module 环境中使用了 CommonJS 的 `require()` 语法

**解决方案**: 将 `require()` 改为动态 `import()`

**修改前** (`GameScene.ts:49`):
```typescript
const gtrs = require('@/config/GTRS.json')
```

**修改后**:
```typescript
// 动态导入 GTRS JSON（ES Module 方式）
import('@/config/GTRS.json').then((gtrsModule) => {
  const gtrs = gtrsModule.default
  // ... 加载资源
}).catch(error => {
  console.error('加载 GTRS 配置失败:', error)
})
```

✅ **状态**: 已完成

---

## 剩余问题

TypeScript 编译器仍然报错，无法识别 Phaser.Scene 的类型。这是因为：

1. **Phaser 3.90 使用 UMD 格式**: 通过 CDN 引入，不是标准的 ES Module
2. **TypeScript 需要类型声明**: 虽然有 `@types/phaser`，但 Phaser 本身已经包含了类型定义

---

## 解决方案

### 方案 1: 使用全局 Phaser（推荐）

由于 Phaser 3.90 是通过 CDN 引入的全局变量，我们需要在 TypeScript 中声明它：

#### 步骤 1: 创建全局类型声明文件

创建 `src/global.d.ts`:
```typescript
// 声明全局 Phaser 变量
declare global {
  interface Window {
    Phaser: typeof import('phaser')
  }
}

// 导出 Phaser 类型
export type Phaser = typeof import('phaser')
```

#### 步骤 2: 修改 tsconfig.json

确保包含全局类型声明：
```json
{
  "compilerOptions": {
    "types": ["node", "phaser"]
  }
}
```

---

### 方案 2: 简化 GameScene 实现（临时方案）

如果类型问题持续存在，可以暂时不使用继承 Phaser.Scene 的方式，而是直接使用函数式组件。

---

## 快速测试

打开浏览器控制台，运行以下代码测试 Phaser 是否正确加载：

```javascript
console.log('Phaser 版本:', Phaser.VERSION);
console.log('Phaser 是否可用:', typeof Phaser !== 'undefined');
```

如果输出正确，说明 Phaser 已成功加载，只是 TypeScript 类型识别的问题。

---

## 下一步

1. ✅ Phaser 已安装
2. ✅ 导入语句已修复  
3. ⏳ 等待 TypeScript 重新编译
4. ⏳ 测试游戏是否能正常运行

---

## 验证清单

- [ ] Phaser 3.90.0 已安装
- [ ] `import Phaser from 'phaser'` 已添加到所有需要的文件
- [ ] Physics gravity 配置已修复为 `{ x: 0, y: 0 }`
- [ ] 开发服务器已重启
- [ ] 浏览器控制台无 "Phaser is not defined" 错误
- [ ] 游戏画面正常显示

---

**最后更新**: 2026-03-31  
**状态**: 修复中
