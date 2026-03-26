# Kids Game Framework - 使用指南

## 📦 框架结构

```
shared/game-framework/
├── src/
│   ├── core/           # 核心游戏引擎（待扩展）
│   ├── stores/         # 通用状态管理
│   │   └── game.store.ts
│   ├── utils/          # 工具函数
│   │   ├── platformApi.ts
│   │   └── initGame.ts
│   ├── types/          # 类型定义
│   │   └── game.types.ts
│   ├── config/         # 配置常量
│   │   └── game.config.ts
│   └── components/     # 可复用组件
│       └── GameUIOverlay.vue
└── package.json
```

## 🚀 快速开始

### 1. 在新游戏中使用框架

假设你要创建一个新游戏 `plane-shooter`：

#### 步骤 1：复制项目结构

```bash
cd kids-game-house
cp -r snake-vue3 plane-shooter
cd plane-shooter

# 清理游戏特定代码，保留框架
rm -rf src/*
```

#### 步骤 2：创建 main.ts

```typescript
import { initGame } from '@kids-game/framework'
import App from './App.vue'
import router from './router'

// 使用框架初始化
const app = initGame(App, (app) => {
  // 游戏特定的初始化
  app.use(router)
  
  // 导入并使用游戏特定的 Store
  import('./stores/plane.store').then(({ usePlaneStore }) => {
    const pinia = app.config.globalProperties.$pinia
    const planeStore = usePlaneStore(pinia)
    planeStore.init()
  })
})

app.mount('#app')
```

#### 步骤 3：创建 App.vue

```vue
<template>
  <div id="app">
    <GameUIOverlay
      :showPauseMenu="gameStore.isPaused"
      :showGameOverMenu="gameStore.isGameOver || gameStore.isVictory"
      :score="gameStore.score"
      :highScore="gameStore.highScore"
      :duration="gameStore.getGameDuration()"
      :isVictory="gameStore.isVictory"
      @resume="gameStore.resumeGame()"
      @restart="restartGame()"
      @exit="exitGame()"
    />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@kids-game/framework'
import { GameUIOverlay } from '@kids-game/framework/components'

const gameStore = useGameStore()

const restartGame = () => {
  // 游戏特定的重启逻辑
}

const exitGame = () => {
  // 退出游戏逻辑
}
</script>
```

#### 步骤 4：创建游戏特定 Store

```typescript
// stores/plane.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGameStore } from '@kids-game/framework'

export const usePlaneStore = defineStore('plane', () => {
  const gameStore = useGameStore()
  
  // 飞机特定状态
  const planePosition = ref({ x: 0, y: 0 })
  const bullets = ref([])
  const enemies = ref([])
  
  // 初始化
  const init = () => {
    // 设置游戏事件监听
    gameStore.setEventCallback((event) => {
      console.log('游戏事件:', event)
    })
  }
  
  // 发射子弹
  const shoot = () => {
    bullets.value.push({
      x: planePosition.value.x,
      y: planePosition.value.y
    })
    gameStore.addScore(10)
  }
  
  return {
    planePosition,
    bullets,
    enemies,
    init,
    shoot
  }
})
```

## 🎯 核心功能

### 1. 游戏状态管理

```typescript
import { useGameStore } from '@kids-game/framework'

const gameStore = useGameStore()

// 游戏控制
gameStore.startGame()
gameStore.pauseGame()
gameStore.resumeGame()
gameStore.endGame(true) // true = 胜利

// 分数管理
gameStore.addScore(100)
gameStore.setScore(500)

// 等级管理
gameStore.levelUp()
gameStore.setLevel(5)

// 难度设置
gameStore.setDifficulty('hard')
```

### 2. 平台通信

```typescript
import { 
  getSessionToken, 
  reportGameResult,
  verifySession 
} from '@kids-game/framework'

// 获取会话令牌
const token = getSessionToken()

// 验证会话
const result = await verifySession()
if (result.valid) {
  console.log('会话有效:', result.sessionId)
}

// 上报成绩
await reportGameResult({
  sessionToken: token,
  score: 1000,
  duration: 120,
  level: 5,
  isWin: true,
  details: { enemyCount: 50 }
})
```

### 3. 事件系统

```typescript
import { useGameStore } from '@kids-game/framework'

const gameStore = useGameStore()

// 设置事件监听
gameStore.setEventCallback((event) => {
  switch (event.type) {
    case 'game_start':
      console.log('游戏开始')
      break
    case 'game_over':
      console.log('游戏结束，得分:', event.data.score)
      break
    case 'level_up':
      console.log('升级:', event.data.level)
      break
  }
})
```

## 📋 最佳实践

### 1. 分离游戏逻辑和框架

```typescript
// ❌ 不推荐：混合框架和游戏逻辑
const gameStore = useGameStore()
gameStore.planePosition = { x: 0, y: 0 } // 错误！

// ✅ 推荐：分离管理
const gameStore = useGameStore() // 通用状态
const planeStore = usePlaneStore() // 游戏特定状态
```

### 2. 使用事件系统

```typescript
// ✅ 推荐：通过事件通信
gameStore.setEventCallback((event) => {
  if (event.type === 'enemy_defeated') {
    planeStore.addScore(100)
  }
})

// 在游戏逻辑中触发事件
gameStore.emitEvent({
  type: 'custom',
  data: { subType: 'enemy_defeated', enemyType: 'boss' }
})
```

### 3. 独立部署模式

```typescript
// 框架会自动检测独立部署模式
const gameStore = useGameStore()

if (gameStore.standaloneMode) {
  console.log('运行在独立部署模式')
  // 游戏结束时自动上报成绩
}
```

## 🔧 配置示例

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@kids-game/framework': resolve(__dirname, '../shared/game-framework/src')
    }
  }
})
```

### TypeScript 配置

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@kids-game/framework": ["../shared/game-framework/src"]
    }
  }
}
```

## 📝 迁移指南

### 从现有游戏迁移到框架

1. **提取通用状态到框架 Store**
   ```typescript
   // 删除游戏特定的 game store
   // 改用框架的 useGameStore
   ```

2. **使用框架的平台 API**
   ```typescript
   // 替换自定义的平台调用
   import { reportGameResult } from '@kids-game/framework'
   ```

3. **使用框架的事件系统**
   ```typescript
   gameStore.setEventCallback(handleGameEvent)
   ```

4. **保留游戏特定逻辑**
   ```typescript
   // 游戏特定的 Store 仍然保留
   const planeStore = usePlaneStore()
   ```

## 🎮 完整示例

查看 `snake-vue3` 目录获取完整的使用示例。

## 🐛 常见问题

### Q: 如何继承框架的 Store？

```typescript
// ✅ 推荐：组合而非继承
const gameStore = useGameStore()
const myStore = useMyGameStore()

// 在 myStore 中使用 gameStore
myStore.doSomething()
gameStore.addScore(100)
```

### Q: 如何处理游戏特定事件？

```typescript
// ✅ 推荐：扩展事件类型
gameStore.setEventCallback((event) => {
  // 处理通用事件
  if (event.type === 'game_over') {
    // ...
  }
  
  // 处理游戏特定事件（通过 data 区分）
  if (event.type === 'custom' && event.data.subType === 'ability_used') {
    // ...
  }
})
```

### Q: 如何禁用自动成绩上报？

```typescript
// 框架会在非独立部署模式下自动禁用
// 如需手动控制：
const gameStore = useGameStore()
gameStore.standaloneMode = false // 禁用自动上报
```

## 📚 相关文档

- [框架 API 参考](./API_REFERENCE.md)
- [迁移指南](./MIGRATION_GUIDE.md)
- [示例代码](../snake-vue3/)

## 🎮 现有游戏示例

1. **贪吃蛇** (`snake-vue3`)
   - 使用框架的完整示例
   - 包含所有框架特性
   
2. **植物大战僵尸** (`plants-vs-zombie`)
   - 正在迁移到框架
   - 展示迁移过程

## 🚀 未来计划

- [ ] 添加更多可复用组件（排行榜、成就系统）
- [ ] 提供游戏模板生成器
- [ ] 增加物理引擎集成
- [ ] 添加音效管理系统
- [ ] 提供性能监控

## 📄 许可证

Copyright © 2024 Kids Game Platform
