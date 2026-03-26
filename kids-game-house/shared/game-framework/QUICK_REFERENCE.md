# Kids Game Framework - 快速参考卡

## 🚀 5 分钟快速开始

### 1. 创建新游戏

```bash
cd kids-game-house
mkdir my-game && cd my-game
cp -r ../snake-vue3/* .
# 修改 src 目录为游戏特定逻辑
```

### 2. 使用框架

```typescript
// main.ts
import { initGame, useGameStore } from '@kids-game/framework'

const app = initGame(App)
app.mount('#app')

// App.vue
const gameStore = useGameStore()
gameStore.startGame()
```

### 3. 配置路径

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@kids-game/framework': resolve(__dirname, '../shared/game-framework/src')
  }
}
```

## 📦 核心 API

### 游戏控制

```typescript
const gameStore = useGameStore()

gameStore.startGame()          // 开始游戏
gameStore.pauseGame()          // 暂停游戏
gameStore.resumeGame()         // 恢复游戏
gameStore.endGame(true)        // 结束游戏（胜利）
gameStore.getGameDuration()    // 获取时长
```

### 分数管理

```typescript
gameStore.addScore(100)        // 增加分数
gameStore.setScore(500)        // 设置分数
gameStore.levelUp()            // 升级
gameStore.setDifficulty('hard') // 设置难度
```

### 平台通信

```typescript
import { getSessionToken, reportGameResult } from '@kids-game/framework'

const token = getSessionToken()
await reportGameResult({
  sessionToken: token,
  score: 1000,
  duration: 120,
  isWin: true
})
```

### 事件系统

```typescript
gameStore.setEventCallback((event) => {
  console.log(event.type, event.data)
})

gameStore.emitEvent({
  type: 'custom',
  data: { key: 'value' }
})
```

## 🎨 UI 组件

### GameUIOverlay

```vue
<GameUIOverlay
  :showPauseMenu="gameStore.isPaused"
  :showGameOverMenu="gameStore.isGameOver"
  :score="gameStore.score"
  :highScore="gameStore.highScore"
  :duration="gameStore.getGameDuration()"
  @resume="gameStore.resumeGame()"
  @restart="restartGame()"
  @exit="exitGame()"
/>
```

## 📝 类型定义

```typescript
import type { 
  GameStatus,      // 游戏状态
  Difficulty,      // 难度
  Position,        // 位置
  GameEvent,       // 事件
  GameConfig       // 配置
} from '@kids-game/framework'
```

## ⚡ 常用配置

### 难度配置

```typescript
import { DIFFICULTY_CONFIGS } from '@kids-game/framework'

DIFFICULTY_CONFIGS.easy.speed    // 3
DIFFICULTY_CONFIGS.medium.speed  // 5
DIFFICULTY_CONFIGS.hard.speed    // 8
```

### 游戏代码

```typescript
import { GAME_CODE } from '@kids-game/framework'

GAME_CODE.SNAKE      // 'snake'
GAME_CODE.PVZ        // 'pvz'
GAME_CODE.PLANE      // 'plane'
```

## 🔧 工具函数

```typescript
import { platformApi } from '@kids-game/framework'

// 验证会话
const result = await platformApi.verifySession()

// 获取游戏 ID
const gameId = platformApi.getGameId()

// 检查独立部署
const isStandalone = platformApi.isStandaloneMode()
```

## 🎯 完整示例

```typescript
// stores/myGame.store.ts
import { defineStore } from 'pinia'
import { useGameStore } from '@kids-game/framework'

export const useMyGameStore = defineStore('myGame', () => {
  const gameStore = useGameStore()
  
  const playerHealth = ref(100)
  
  const init = () => {
    gameStore.setEventCallback((event) => {
      if (event.type === 'enemy_hit') {
        playerHealth.value -= 10
        if (playerHealth.value <= 0) {
          gameStore.endGame(false)
        }
      }
    })
  }
  
  return { playerHealth, init }
})
```

## 📊 状态流转

```
IDLE → PLAYING → PAUSED → PLAYING → GAME_OVER/VICTORY
       ↑                    ↓
       └────────────────────┘
```

## 💡 最佳实践

✅ **推荐**
- 分离通用和游戏特定状态
- 使用事件系统通信
- 按需导入模块
- 保留游戏特定 Store

❌ **不推荐**
- 混合框架和游戏逻辑
- 直接修改框架状态
- 一次性导入所有内容
- 重复实现框架功能

## 🐛 常见问题速查

### Q: 如何添加游戏特定状态？
```typescript
const myGameStore = useMyGameStore()  // 游戏特定
const gameStore = useGameStore()      // 通用
```

### Q: 如何禁用自动上报？
```typescript
gameStore.standaloneMode = false
```

### Q: 如何处理自定义事件？
```typescript
gameStore.emitEvent({
  type: 'custom',
  data: { subType: 'ability_used' }
})
```

---

**快速参考 | Version 1.0.0**
