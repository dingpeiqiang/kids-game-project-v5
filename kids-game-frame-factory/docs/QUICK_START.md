# 🚀 快速开始指南

**5 分钟上手 kids-game-frame-factory**

---

## 📋 前置要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- TypeScript >= 4.9.0
- Vue >= 3.3.0 (可选)
- Phaser >= 3.60.0

---

## 🎯 第一步：创建你的游戏项目

### 1. 创建项目目录

```bash
mkdir my-first-game
cd my-first-game
npm init -y
```

### 2. 安装框架和依赖

```bash
# 安装框架（本地路径或 npm）
npm install ../kids-game-frame-factory

# 安装 Phaser 和 Vue
npm install phaser@^3.60.0 vue@^3.3.0

# 安装开发依赖
npm install --save-dev typescript@^5.1.6 vite@^4.4.0 @vitejs/plugin-vue
```

### 3. 创建项目结构

```
my-first-game/
├── src/
│   ├── main.ts          # 入口文件
│   ├── App.vue          # Vue 根组件
│   └── game/
│       └── SnakeGame.ts # 你的游戏逻辑
├── index.html
├── package.json
└── tsconfig.json
```

---

## 🎮 第二步：编写游戏代码

### 1. 创建 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true
  }
}
```

### 2. 创建 HTML 入口

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的第一个游戏</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      display: flex; 
      justify-content: center; 
      align-items: center;
      min-height: 100vh;
      background: #1a1a1a;
    }
    #game-container {
      width: 1280px;
      height: 720px;
      background: #000;
    }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### 3. 创建游戏主文件

```typescript
// src/main.ts
import { ComponentGameScene } from 'kids-game-frame-factory'
import App from './App.vue'

// 创建 Vue 应用（可选）
if (typeof window !== 'undefined') {
  const { createApp } = await import('vue')
  const app = createApp(App)
  app.mount('#app')
}

// 创建游戏场景
async function createGame() {
  const container = document.getElementById('game-container')!
  
  // 创建游戏场景
  const gameScene = new ComponentGameScene(container)
  
  // 启动游戏
  await gameScene.start({
    difficulty: 'normal',
    gridCols: 32,
    gridRows: 18,
    cellSize: 40,
    enableDynamicDifficulty: false
  })
  
  console.log('🎮 游戏启动成功！')
}

createGame()
```

### 4. 创建 Vue 组件（可选）

```vue
<!-- src/App.vue -->
<template>
  <div id="app">
    <h1>我的游戏</h1>
  </div>
</template>

<script setup lang="ts">
console.log('Vue 应用已初始化')
</script>

<style>
#app {
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
}
</style>
```

---

## ⚡ 第三步：运行游戏

### 1. 添加 Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'kids-game-frame-factory': '/path/to/kids-game-frame-factory/src/index.ts'
    }
  }
})
```

### 2. 添加运行脚本

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 即可看到你的游戏！

---

## 🔧 第四步：自定义游戏

### 修改网格大小

```typescript
await gameScene.start({
  gridCols: 20,  // 20 列
  gridRows: 15,  // 15 行
  cellSize: 50   // 每个单元格 50px
})
```

### 修改难度配置

```typescript
await gameScene.start({
  difficulty: 'hard',  // 'easy' | 'normal' | 'hard'
  enableDynamicDifficulty: true  // 启用动态难度
})
```

### 使用自定义配置

```typescript
const customConfig = {
  speed: 300,              // 速度：300 像素/秒
  initialLength: 5,        // 初始长度：5 节
  normalFoodScore: 15,     // 普通食物得分：15
  bonusFoodScore: 80,      // 奖励食物得分：80
  specialFoodScore: 150    // 特殊食物得分：150
}

await gameScene.start({
  difficulty: 'custom',
  customConfig
})
```

---

## 📚 下一步

恭喜！你已经成功创建了自己的第一个游戏！

接下来你可以：

- 📖 阅读 [API 参考文档](./API_REFERENCE.md) 了解更多组件用法
- 🎨 学习 [组件开发指南](./COMPONENT_DEVELOPMENT.md) 创建自定义组件
- 💡 查看 [示例集合](../examples/) 获取更多灵感
- ❓ 查看 [常见问题解答](./FAQ.md) 解决遇到的问题

---

## 🎯 完整示例代码

以下是一个完整的、可直接运行的示例：

```typescript
// src/SnakeGame.ts
import { 
  ComponentGameScene,
  GameConfigComponent,
  GridMovementComponent
} from 'kids-game-frame-factory'

export class SnakeGame {
  private gameScene: ComponentGameScene
  
  constructor(container: HTMLElement) {
    this.gameScene = new ComponentGameScene(container)
  }
  
  async start() {
    await this.gameScene.start({
      difficulty: 'normal',
      gridCols: 32,
      gridRows: 18,
      cellSize: 40,
      enableDynamicDifficulty: true
    })
    
    // 获取组件并自定义
    const config = this.gameScene.getComponent<GameConfigComponent>('game_config')
    config?.applyCustomConfig({
      speed: 250,
      initialLength: 4
    })
    
    console.log('🐍 贪吃蛇游戏已启动！')
  }
}

// 使用
const game = new SnakeGame(document.getElementById('game-container')!)
game.start()
```

---

**最后更新**: 2026-03-28  
**版本**: v1.0.0  
**状态**: ✅ 生产就绪
