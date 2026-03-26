# Kids Game Framework - 架构文档

## 🏗️ 框架设计理念

本框架采用**"约定优于配置"**和**"组合优于继承"**的设计原则，为儿童游戏平台提供一套可复用、可扩展的通用框架。

### 核心设计模式

1. **状态管理 Pattern** - 使用 Pinia 进行集中式状态管理
2. **组合式 API** - Vue 3 Composition API 提供更好的逻辑复用
3. **事件驱动** - 通过事件系统解耦游戏逻辑和框架
4. **依赖注入** - 通过 peerDependencies 减少包体积

## 📦 框架分层架构

```
┌─────────────────────────────────────┐
│         游戏特定层 (Game-Specific)   │
│  - 游戏特定 Store (PlaneStore)      │
│  - 游戏特定组件 (PlaneCanvas)       │
│  - 游戏逻辑 (GameLogic)             │
└─────────────────────────────────────┘
                  ↓ 组合
┌─────────────────────────────────────┐
│        框架层 (Framework Layer)     │
│  - useGameStore (通用状态)          │
│  - GameUIOverlay (通用 UI)          │
│  - platformApi (平台通信)           │
│  - initGame (初始化)                │
└─────────────────────────────────────┘
                  ↓ 依赖
┌─────────────────────────────────────┐
│      基础设施层 (Infrastructure)    │
│  - Vue 3 (视图层)                   │
│  - Pinia (状态管理)                 │
│  - Axios (HTTP 客户端)              │
└─────────────────────────────────────┘
```

## 🎯 框架模块详解

### 1. Types（类型定义层）

提供完整的 TypeScript 类型定义，确保类型安全。

```typescript
// 核心类型
- GameStatus: 游戏状态枚举
- Difficulty: 难度级别
- GameEvent: 游戏事件
- Position: 位置坐标
- GameConfig: 游戏配置
```

### 2. Stores（状态管理层）

#### useGameStore - 通用游戏状态

**状态：**
- `status`: 游戏状态 (IDLE, PLAYING, PAUSED, GAME_OVER, VICTORY)
- `score`: 当前分数
- `highScore`: 最高分
- `playCount`: 游戏次数
- `difficulty`: 难度等级
- `currentLevel`: 当前关卡
- `standaloneMode`: 独立部署模式标识

**方法：**
- `startGame()`: 开始游戏
- `pauseGame()`: 暂停游戏
- `resumeGame()`: 恢复游戏
- `endGame(isVictory)`: 结束游戏
- `addScore(points)`: 增加分数
- `levelUp()`: 升级
- `setDifficulty(diff)`: 设置难度
- `getGameDuration()`: 获取游戏时长
- `submitScoreToPlatform()`: 上报成绩到平台
- `setEventCallback(callback)`: 设置事件回调
- `emitEvent(event)`: 触发事件

### 3. Utils（工具函数层）

#### platformApi - 平台通信

```typescript
// 核心功能
- getSessionToken(): 获取会话令牌
- getGameId(): 获取游戏 ID
- verifySession(): 验证会话有效性
- reportGameResult(): 上报游戏成绩
- isStandaloneMode(): 检测是否为独立部署
```

#### initGame - 应用初始化

```typescript
// 功能
- extractAuthFromUrl(): 从 URL 提取认证信息
- initGame(rootComponent, onBeforeMount): 初始化 Vue 应用
```

### 4. Config（配置层）

提供游戏配置常量和难度配置。

```typescript
// 配置项
- GAME_CODE: 游戏代码枚举
- GAME_ID_MAP: 游戏 ID 映射
- DIFFICULTY_CONFIGS: 难度配置对象
- DEFAULT_GAME_CONFIG: 默认游戏配置
```

### 5. Components（组件层）

#### GameUIOverlay - 游戏 UI 覆盖层

**Props:**
- `showPauseMenu`: 显示暂停菜单
- `showGameOverMenu`: 显示游戏结束菜单
- `score`: 当前分数
- `highScore`: 最高分
- `duration`: 游戏时长
- `isVictory`: 是否胜利

**Events:**
- `@resume`: 继续游戏
- `@restart`: 重新开始
- `@exit`: 退出游戏

## 🔄 数据流图

```
用户操作 → 游戏逻辑 → 触发事件 → useGameStore → 平台 API
                                    ↓
                               本地存储
                                    ↓
                               UI 更新
```

## 📋 使用流程

### 典型游戏生命周期

```typescript
// 1. 初始化阶段
const app = initGame(App, (app) => {
  app.use(createPinia())
})

// 2. 游戏准备阶段
const gameStore = useGameStore()
gameStore.setDifficulty('medium')
gameStore.setEventCallback(handleEvent)

// 3. 游戏运行阶段
gameStore.startGame()
gameStore.addScore(100)
gameStore.levelUp()

// 4. 游戏结束阶段
gameStore.endGame(true) // 胜利
// 自动上报成绩（如果是独立部署模式）
```

## 🎨 扩展框架

### 添加新的游戏类型

```typescript
// stores/myGame.store.ts
import { defineStore } from 'pinia'
import { useGameStore } from '@kids-game/framework'

export const useMyGameStore = defineStore('myGame', () => {
  const gameStore = useGameStore()
  
  // 游戏特定状态
  const playerHealth = ref(100)
  const inventory = ref([])
  
  // 游戏特定方法
  const takeDamage = (amount: number) => {
    playerHealth.value -= amount
    if (playerHealth.value <= 0) {
      gameStore.endGame(false)
    }
  }
  
  const collectItem = (item: any) => {
    inventory.value.push(item)
    gameStore.emitEvent({
      type: 'item_collect',
      data: { item }
    })
  }
  
  return {
    playerHealth,
    inventory,
    takeDamage,
    collectItem
  }
})
```

### 添加新的通用组件

```vue
<!-- components/Leaderboard.vue -->
<template>
  <div class="leaderboard">
    <h3>排行榜</h3>
    <ul>
      <li v-for="record in topRecords" :key="record.id">
        {{ record.userName }}: {{ record.score }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@kids-game/framework'

const gameStore = useGameStore()

const topRecords = computed(() => {
  // 从 gameStore 或其他地方获取排行榜数据
  return []
})
</script>
```

## 🔐 安全考虑

### 1. 会话验证

```typescript
// 游戏开始前验证会话
const result = await verifySession()
if (!result.valid) {
  alert('会话已过期，请重新登录')
  return
}
```

### 2. 成绩防作弊

```typescript
// 在框架层面添加时间戳和签名
async function submitScoreWithSignature(score: number) {
  const timestamp = Date.now()
  const signature = generateSignature(score, timestamp)
  
  await reportGameResult({
    score,
    duration: getGameDuration(),
    details: {
      timestamp,
      signature
    }
  })
}
```

## 📊 性能优化

### 1. 按需导入

```typescript
// ❌ 不推荐：一次性导入所有
import * as framework from '@kids-game/framework'

// ✅ 推荐：按需导入
import { useGameStore } from '@kids-game/framework'
import { GameUIOverlay } from '@kids-game/framework/components'
```

### 2. 事件节流

```typescript
// 限制事件触发频率
const throttledEmit = throttle((event) => {
  gameStore.emitEvent(event)
}, 100)
```

## 🧪 测试策略

### 单元测试

```typescript
// __tests__/game.store.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../stores/game.store'

describe('useGameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should start game', () => {
    const gameStore = useGameStore()
    gameStore.startGame()
    expect(gameStore.isPlaying).toBe(true)
  })
})
```

## 📈 版本规划

### v1.0.0 (当前版本)
- ✅ 基础游戏状态管理
- ✅ 平台通信
- ✅ 通用 UI 组件
- ✅ 类型定义

### v1.1.0 (计划中)
- [ ] 排行榜组件
- [ ] 成就系统
- [ ] 音效管理
- [ ] 粒子效果

### v2.0.0 (未来)
- [ ] 物理引擎集成
- [ ] 多人游戏支持
- [ ] 实时对战
- [ ] AI 对手

## 📝 贡献指南

### 添加新功能

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 Vue 3 组合式 API 风格
- 所有公开 API 必须有类型定义
- 重要功能需要单元测试

## 📄 许可证

MIT License - Kids Game Platform Team
