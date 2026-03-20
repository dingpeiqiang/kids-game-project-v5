# 阶段1：单人模式基础架构 - 使用指南

## 📋 阶段概述

**阶段1** 实现了游戏模式架构的基础框架，包括：

- ✅ **统一模式管理器** (`UnifiedModeManager`)
- ✅ **单人模式策略**（1个游戏实例 + 1个玩家）
- ✅ **游戏实例生命周期管理**
- ✅ **数据收集和规则判定**

---

## 🎯 核心特性

### 1. 统一模式管理器

`UnifiedModeManager` 是整个架构的核心，负责：

```
┌─────────────────────────────────────────┐
│     UnifiedModeManager                 │
│  ┌─────────────────────────────────┐   │
│  │ 核心职责:                       │   │
│  │ 1. 模式类型管理                │   │
│  │ 2. 游戏实例创建                │   │
│  │ 3. 游戏实例生命周期管理        │   │
│  │ 4. 数据收集                    │   │
│  │ 5. 规则判定                    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 2. 单人模式策略

单人模式的实现策略：

| 维度 | 实现方式 |
|------|----------|
| **游戏实例数** | 1个 |
| **玩家数量** | 1个 |
| **容器** | 1个（完整容器） |
| **规则** | AI难度、时间限制、获胜分数 |

### 3. 游戏实例管理

支持完整的生命周期管理：

```typescript
创建 → 启动 → 暂停/恢复 → 重启 → 停止 → 销毁
```

### 4. 数据收集和规则判定

- **数据收集**：监听游戏事件（state_change, game_end等）
- **规则判定**：根据模式类型应用不同的规则

---

## 🚀 快速开始

### 基础用法

```typescript
import { UnifiedModeManager } from './core/manager/UnifiedModeManager';
import { GameModeType } from './core/interfaces';
import { ArithmeticGameV2 } from './arithmetic/ArithmeticGameV2';

// 1. 创建模式管理器
const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);

// 2. 设置游戏规则
modeManager.setRuleConfig({
  aiDifficulty: 'medium',
  timeLimit: 60,
  maxLives: 3,
  winScore: 100,
});

// 3. 获取容器
const container = document.getElementById('game-container');

// 4. 创建游戏实例
const gameInstances = await modeManager.createGameInstances({
  gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
  container: container,
  playerConfigs: [
    {
      playerId: 'player1',
      name: '玩家1',
      config: {
        gameType: 'arithmetic',
        difficulty: 'medium',
      },
    },
  ],
});

// 5. 启动游戏
await modeManager.startAllGames();

// 6. 监听事件
modeManager.on('game_started', (data) => {
  console.log('游戏已启动');
});

modeManager.on('score_changed', (data) => {
  console.log('分数:', data.score);
});

modeManager.on('game_ended', (data) => {
  console.log('游戏结束，得分:', data.result.score);
});

modeManager.on('player_won', (data) => {
  alert(`恭喜 ${data.playerId} 获胜！得分: ${data.score}`);
});
```

---

## 📖 API 参考

### UnifiedModeManager

#### 构造函数

```typescript
constructor(modeType: GameModeType)
```

创建模式管理器实例。

**参数：**
- `modeType`: 游戏模式类型

**示例：**
```typescript
const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
```

#### 方法

##### setRuleConfig

```typescript
setRuleConfig(config: GameRuleConfig): void
```

设置游戏规则配置。

**参数：**
- `config`: 规则配置对象

**配置选项：**
```typescript
interface GameRuleConfig {
  // 单机模式规则
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  aiResponseDelay?: number;

  // 通用规则
  timeLimit?: number;
  maxLives?: number;
  winScore?: number;
}
```

**示例：**
```typescript
modeManager.setRuleConfig({
  aiDifficulty: 'medium',
  timeLimit: 60,
  maxLives: 3,
  winScore: 100,
});
```

##### createGameInstances

```typescript
async createGameInstances(config: GameInstanceConfig): Promise<GameInstance[]>
```

根据模式类型创建游戏实例。

**参数：**
- `config`: 游戏实例配置

**配置选项：**
```typescript
interface GameInstanceConfig {
  gameCreator: (container: HTMLElement) => IGameCore;
  container: HTMLElement;
  playerConfigs: Array<{
    playerId: string;
    name: string;
    config: any;
  }>;
}
```

**返回：**
- `Promise<GameInstance[]>`: 创建的游戏实例数组

**示例：**
```typescript
const gameInstances = await modeManager.createGameInstances({
  gameCreator: (container) => new ArithmeticGameV2(container),
  container: document.getElementById('game-container'),
  playerConfigs: [
    {
      playerId: 'player1',
      name: '玩家1',
      config: { gameType: 'arithmetic' },
    },
  ],
});
```

##### startAllGames

```typescript
async startAllGames(): Promise<void>
```

启动所有游戏实例。

**示例：**
```typescript
await modeManager.startAllGames();
```

##### pauseAllGames

```typescript
async pauseAllGames(): Promise<void>
```

暂停所有游戏实例。

**示例：**
```typescript
await modeManager.pauseAllGames();
```

##### resumeAllGames

```typescript
async resumeAllGames(): Promise<void>
```

恢复所有游戏实例。

**示例：**
```typescript
await modeManager.resumeAllGames();
```

##### restartAllGames

```typescript
async restartAllGames(): Promise<void>
```

重启所有游戏实例。

**示例：**
```typescript
await modeManager.restartAllGames();
```

##### stopAllGames

```typescript
async stopAllGames(): Promise<void>
```

停止所有游戏实例。

**示例：**
```typescript
await modeManager.stopAllGames();
```

##### destroyAllGames

```typescript
async destroyAllGames(): Promise<void>
```

销毁所有游戏实例并清理资源。

**示例：**
```typescript
await modeManager.destroyAllGames();
```

##### getPlayer

```typescript
getPlayer(playerId: string): Player | undefined
```

获取指定玩家的信息。

**参数：**
- `playerId`: 玩家ID

**返回：**
- `Player | undefined`: 玩家对象

**示例：**
```typescript
const player = modeManager.getPlayer('player1');
console.log(player);
```

##### getAllPlayers

```typescript
getAllPlayers(): Player[]
```

获取所有玩家的信息。

**返回：**
- `Player[]`: 玩家数组

**示例：**
```typescript
const players = modeManager.getAllPlayers();
console.log(players);
```

##### getGameInstance

```typescript
getGameInstance(instanceId: string): GameInstance | undefined
```

获取指定的游戏实例。

**参数：**
- `instanceId`: 游戏实例ID

**返回：**
- `GameInstance | undefined`: 游戏实例对象

**示例：**
```typescript
const gameInstance = modeManager.getGameInstance('game_single');
console.log(gameInstance);
```

##### getAllGameInstances

```typescript
getAllGameInstances(): GameInstance[]
```

获取所有游戏实例。

**返回：**
- `GameInstance[]`: 游戏实例数组

**示例：**
```typescript
const gameInstances = modeManager.getAllGameInstances();
console.log(gameInstances);
```

##### getGameState

```typescript
getGameState(instanceId: string): any
```

获取指定游戏实例的状态。

**参数：**
- `instanceId`: 游戏实例ID

**返回：**
- `any`: 游戏状态对象

**示例：**
```typescript
const gameState = modeManager.getGameState('game_single');
console.log(gameState);
```

##### getAllGameStates

```typescript
getAllGameStates(): Map<string, any>
```

获取所有游戏实例的状态。

**返回：**
- `Map<string, any>`: 游戏状态映射

**示例：**
```typescript
const gameStates = modeManager.getAllGameStates();
gameStates.forEach((state, id) => {
  console.log(`${id}:`, state);
});
```

##### getStatistics

```typescript
getStatistics(): Record<string, any>
```

获取统计信息。

**返回：**
- `Record<string, any>`: 统计信息对象

**示例：**
```typescript
const stats = modeManager.getStatistics();
console.log(stats);
```

#### 事件

模式管理器支持以下事件：

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `game_started` | `{ instanceId: string }` | 游戏已启动 |
| `game_paused` | `{ instanceId: string }` | 游戏已暂停 |
| `game_resumed` | `{ instanceId: string }` | 游戏已恢复 |
| `game_ended` | `{ instanceId, result }` | 游戏已结束 |
| `game_state_changed` | `{ instanceId, state }` | 游戏状态已变化 |
| `score_changed` | `{ instanceId, playerId, score }` | 分数已变化 |
| `player_won` | `{ playerId, score }` | 玩家获胜（单人模式） |
| `battle_ended` | `{ winner, player1, player2 }` | 对战结束（对抗模式） |

**示例：**
```typescript
// 监听游戏启动
modeManager.on('game_started', (data) => {
  console.log('游戏已启动:', data);
});

// 监听分数变化
modeManager.on('score_changed', (data) => {
  console.log(`玩家 ${data.playerId} 得分: ${data.score}`);
});

// 监听游戏结束
modeManager.on('game_ended', (data) => {
  console.log('游戏结束:', data);
});

// 监听玩家获胜
modeManager.on('player_won', (data) => {
  alert(`恭喜 ${data.playerId} 获胜！得分: ${data.score}`);
});

// 取消监听
modeManager.off('score_changed', handler);
```

---

## 📊 使用场景

### 场景1：简单单人游戏

适用于基本的单人游戏场景。

```typescript
const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
modeManager.setRuleConfig({
  aiDifficulty: 'medium',
  timeLimit: 60,
});

const gameInstances = await modeManager.createGameInstances({
  gameCreator: (container) => new ArithmeticGameV2(container),
  container: document.getElementById('game-container'),
  playerConfigs: [
    { playerId: 'player1', name: '玩家1', config: { gameType: 'arithmetic' } },
  ],
});

await modeManager.startAllGames();
```

### 场景2：带难度选择的单人游戏

支持不同难度的单人游戏。

```typescript
const difficulties = {
  easy: { aiDifficulty: 'easy', maxLives: 5, timeLimit: 90 },
  medium: { aiDifficulty: 'medium', maxLives: 3, timeLimit: 60 },
  hard: { aiDifficulty: 'hard', maxLives: 1, timeLimit: 30 },
};

const selectedDifficulty = 'medium';

const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
modeManager.setRuleConfig(difficulties[selectedDifficulty]);

// ... 创建和启动游戏
```

### 场景3：实时监控游戏状态

适用于需要实时显示游戏状态的场景。

```typescript
const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
// ... 创建和启动游戏

// 定时更新UI
setInterval(() => {
  const gameState = modeManager.getGameState('game_single');
  if (gameState) {
    updateScore(gameState.score);
    updateLives(gameState.lives);
  }
}, 1000);
```

### 场景4：游戏控制

提供游戏暂停、恢复、重启等功能。

```typescript
document.getElementById('pause-btn').addEventListener('click', async () => {
  await modeManager.pauseAllGames();
});

document.getElementById('resume-btn').addEventListener('click', async () => {
  await modeManager.resumeAllGames();
});

document.getElementById('restart-btn').addEventListener('click', async () => {
  await modeManager.restartAllGames();
});
```

---

## ⚠️ 注意事项

### 1. 资源清理

游戏结束后或页面卸载时，必须清理资源：

```typescript
// 方式1：游戏结束后清理
modeManager.on('game_ended', async () => {
  await modeManager.destroyAllGames();
});

// 方式2：页面卸载时清理
window.addEventListener('beforeunload', async () => {
  await modeManager.destroyAllGames();
});
```

### 2. 异步操作

所有游戏实例操作都是异步的，需要使用 `await`：

```typescript
// ✅ 正确
await modeManager.startAllGames();
await modeManager.pauseAllGames();

// ❌ 错误
modeManager.startAllGames(); // 没有await
```

### 3. 事件监听清理

如果添加了事件监听器，记得在适当的时候清理：

```typescript
const scoreHandler = (data) => {
  console.log('分数:', data.score);
};

modeManager.on('score_changed', scoreHandler);

// 清理监听
modeManager.off('score_changed', scoreHandler);
```

### 4. 容器验证

在使用容器前，确保容器存在：

```typescript
const container = document.getElementById('game-container');
if (!container) {
  console.error('容器不存在');
  return;
}
```

---

## 🎯 阶段1验收标准

- [x] ✅ 可以成功创建单人模式
- [x] ✅ 可以正确收集游戏数据
- [x] ✅ 可以正确应用单人模式规则
- [x] ✅ 游戏可以正常启动、暂停、恢复、停止
- [ ] ⏳ 单元测试通过率 ≥ 90%
- [ ] ⏳ 集成测试通过率 ≥ 80%

---

## 🚀 下一步

完成阶段1后，可以继续实现**阶段2：本地对抗模式**。

阶段2将实现：
- 2个游戏实例 + 物理分屏
- 分屏布局管理
- 双实例数据收集和规则判定

---

## 📚 相关文件

- `UnifiedModeManager.ts` - 统一模式管理器实现
- `Phase1_Usage.ts` - 使用示例
- `IMPLEMENTATION_PLAN.md` - 总体实施计划
