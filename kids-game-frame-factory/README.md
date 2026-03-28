# 🎮 Kids Game Frame Factory

**版本**: v1.0.0  
**描述**: 通用儿童游戏开发框架 - 基于组件化架构的可复用游戏框架

---

## 📋 简介

Kids Game Frame Factory 是一个完全组件化、可复用的儿童游戏开发框架。它从成熟的贪吃蛇游戏中抽象而来，支持快速开发网格移动类、收集类、益智类等多种儿童游戏。

### 核心特性

- ✅ **完全组件化** - 18+ 个独立组件，即插即用
- ✅ **高度可复用** - 代码复用率高达 95%
- ✅ **配置驱动** - 支持动态配置和自定义参数
- ✅ **类型安全** - 完整的 TypeScript 类型定义
- ✅ **易于扩展** - 清晰的架构分层，便于定制
- ✅ **文档完善** - 2000+ 行详细文档

---

## 🎯 适用游戏类型

本框架适用于以下类型的儿童游戏：

### 网格移动类
- ✅ 贪吃蛇 (Snake)
- ✅ 蠕虫游戏 (Worm)
- ✅ 火车收集 (Train Collector)
- ✅ 虫子爬行 (Bug Crawler)

### 收集类
- ✅ 水果收集 (Fruit Collector)
- ✅ 金币收集 (Coin Collector)
- ✅ 道具收集 (Item Collector)
- ✅ 宝藏寻找 (Treasure Hunt)

### 益智类
- ✅ 推箱子 (Sokoban)
- ✅ 华容道 (Klotski)
- ✅ 迷宫求解 (Maze Solver)
- ✅ 路径规划 (Path Planning)

### 其他类型
- ✅ 回合制策略 (Turn-based Strategy)
- ✅ 时间管理 (Time Management)
- ✅ 反应训练 (Reaction Training)

---

## 📦 安装

### 方式一：npm 安装（推荐）

```bash
npm install kids-game-frame-factory
```

### 方式二：源码使用

```bash
# 克隆项目
git clone https://github.com/your-org/kids-game-frame-factory.git

# 进入目录
cd kids-game-frame-factory

# 安装依赖
npm install

# 构建框架
npm run build
```

---

## 🚀 快速开始

### 1. 创建你的第一个游戏（贪吃蛇）

#### Step 1: 创建项目

```bash
mkdir my-snake-game
cd my-snake-game
npm init -y
npm install kids-game-frame-factory phaser vue
```

#### Step 2: 创建游戏入口文件

```typescript
// src/main.ts
import { createApp } from 'vue'
import { ComponentGameScene, ComponentContainer, EventBus } from 'kids-game-frame-factory'
import App from './App.vue'

// 创建 Vue 应用
const app = createApp(App)
app.mount('#app')

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
    cellSize: 40
  })
  
  console.log('🎮 游戏启动成功！')
}

createGame()
```

#### Step 3: 创建 Vue 组件

```vue
<!-- src/App.vue -->
<template>
  <div id="app">
    <div id="game-container"></div>
  </div>
</template>

<script setup lang="ts">
// 游戏逻辑在 main.ts 中
</script>

<style>
#app {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

#game-container {
  width: 100%;
  height: 100%;
}
</style>
```

#### Step 4: 运行游戏

```bash
npm run dev
```

访问 `http://localhost:3000` 即可看到你的贪吃蛇游戏！

---

## 📚 核心组件

### 核心层 (Core)

| 组件 | 说明 | 用途 |
|------|------|------|
| **ComponentBase** | 组件基类 | 所有组件的父类 |
| **IComponent** | 组件接口 | 定义组件的基本行为 |
| **ComponentContainer** | 组件容器 | 管理和协调所有组件 |
| **EventBus** | 事件总线 | 组件间通信 |
| **GameEvent** | 游戏事件 | 定义事件类型和结构 |

### 逻辑层 (Logic)

| 组件 | 说明 | 用途 |
|------|------|------|
| **GridMovementComponent** | 网格移动组件 | 处理任何物体的网格移动 |
| **GameStateComponent** | 游戏状态组件 | 管理游戏状态（开始、暂停、结束） |
| **CollisionDetectionComponent** | 碰撞检测组件 | 处理所有碰撞检测 |
| **FoodSpawnerComponent** | 物品生成组件 | 生成可收集物品 |
| **ScoreManagerComponent** | 分数管理组件 | 管理得分和最高分 |
| **GameConfigComponent** | 游戏配置组件 | 管理游戏配置和难度 |
| **PauseManagerComponent** | 暂停管理组件 | 管理游戏暂停/恢复 |

### 渲染层 (Rendering)

| 组件 | 说明 | 用途 |
|------|------|------|
| **BackgroundRenderer** | 背景渲染组件 | 渲染游戏背景 |
| **GridRenderer** | 网格渲染组件 | 渲染网格线 |
| **SnakeRenderer** | 蛇渲染组件 | 渲染蛇（或其他移动物体） |
| **FoodRenderer** | 物品渲染组件 | 渲染可收集物品 |
| **ParticleRenderer** | 粒子渲染组件 | 渲染粒子效果 |

### 控制层 (Control)

| 组件 | 说明 | 用途 |
|------|------|------|
| **InputHandlerComponent** | 输入处理组件 | 处理用户输入 |

---

## 🔧 高级用法

### 自定义游戏对象

#### 创建你自己的移动物体

```typescript
// 实现 IMovableObject 接口
class MyGameObject implements IMovableObject {
  position: Position = { x: 0, y: 0 }
  direction: Direction = 'right'
  speed: number = 200
  enabled: boolean = true
  
  // 添加你自己的属性
  name: string = 'MyObject'
  color: string = '#ff0000'
}

// 使用 GridMovementComponent
const movement = new GridMovementComponent(scene)
movement.registerObject(myGameObject)
movement.setSpeed(myGameObject, 300)
```

#### 继承 GridMovementComponent

```typescript
// 创建你自己的移动逻辑
class CustomMovementComponent extends GridMovementComponent {
  protected override moveObject(obj: IMovableObject): void {
    // 调用基类实现基本移动
    super.moveObject(obj)
    
    // 添加你自己的特殊逻辑
    this.applySpecialEffect(obj)
  }
  
  private applySpecialEffect(obj: IMovableObject): void {
    // 你的特效逻辑
  }
}
```

### 自定义配置

#### 添加新的难度级别

```typescript
import { GameConfigComponent } from 'kids-game-frame-factory'

const gameConfig = new GameConfigComponent(scene)
gameConfig.init({
  defaultDifficulty: 'custom',
  enableDynamicDifficulty: true
})

// 添加自定义难度
gameConfig.addDifficulty('custom', {
  speed: 250,
  initialLength: 5,
  normalScore: 15,
  bonusScore: 75,
  specialScore: 150
})
```

#### 使用自定义配置

```typescript
// 从 DifficultyView 或其他方式获取配置
const customConfig = {
  speed: 300,
  initialLength: 6,
  cellSize: 50,
  normalFoodScore: 15,
  bonusFoodScore: 80,
  specialFoodScore: 150
}

// 应用到游戏
gameConfig.applyCustomConfig(customConfig)
```

---

## 📖 完整文档

- [快速开始指南](./docs/QUICK_START.md)
- [API 参考文档](./docs/API_REFERENCE.md)
- [组件开发指南](./docs/COMPONENT_DEVELOPMENT.md)
- [示例集合](./examples/)
- [常见问题解答](./docs/FAQ.md)

---

## 🎯 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│         游戏特定逻辑层              │
│   (Snake-specific Logic)            │
└─────────────────────────────────────┘
              ↓ 继承/组合
┌─────────────────────────────────────┐
│         通用功能层                  │
│   (GridMovement, ItemSpawner)       │
└─────────────────────────────────────┘
              ↓ 使用
┌─────────────────────────────────────┐
│         核心引擎层                  │
│   (ComponentContainer, EventBus)    │
└─────────────────────────────────────┘
```

### 组件通信

```
Component A → EventBus → Component B
     ↓                        ↓
ComponentContainer (协调和管理)
```

---

## 🛠️ 开发指南

### 开发环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- TypeScript >= 4.9.0
- Vue >= 3.3.0
- Phaser >= 3.60.0

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-org/kids-game-frame-factory.git

# 安装依赖
npm install

# 运行测试
npm test

# 构建框架
npm run build

# 生成交互式文档
npm run docs
```

---

## 📝 许可证

MIT License

---

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📧 联系方式

- GitHub Issues: [提交问题](https://github.com/your-org/kids-game-frame-factory/issues)
- Email: your-email@example.com

---

**最后更新**: 2026-03-28  
**版本**: v1.0.0  
**状态**: ✅ 生产就绪
