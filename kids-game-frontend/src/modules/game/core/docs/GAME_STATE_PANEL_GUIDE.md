# 游戏状态面板 - 使用指南

## 📋 概述

`GameStatePanel` 是一个**共享的游戏状态面板**，支持显示不同模式（单人、多人、对战）下的游戏状态。

---

## 🎯 核心特性

### 1. 多模式支持

| 模式 | 支持状态 |
|------|----------|
| 单人模式 | 玩家信息、分数、生命值、时间 |
| 多人模式 | 所有玩家信息、分数、生命值、时间 |
| 本地对抗 | 两个玩家信息、分数、生命值、时间、**对战对比** |
| 网络对抗 | 两个玩家信息、分数、生命值、时间、**对战对比** |

### 2. 实时更新

- 自动监听游戏事件
- 定时刷新（可配置间隔）
- 状态变化即时更新

### 3. 自定义显示

- 可选择显示/隐藏各个区域
- 可配置刷新间隔
- 支持显示/隐藏面板

### 4. 对抗模式对比

- 实时对比两个玩家的得分和生命值
- 显示领先玩家
- 显示分数差和生命差

---

## 🚀 快速开始

### 基础用法

```typescript
import { GameStatePanel } from './core/components/GameStatePanel';
import { UnifiedModeManager } from './core/manager/UnifiedModeManager';
import { GameModeType } from './core/interfaces';
import { ArithmeticGameV2 } from './arithmetic/ArithmeticGameV2';

// 1. 创建模式管理器
const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
modeManager.setRuleConfig({
  aiDifficulty: 'medium',
  timeLimit: 60,
  maxLives: 3,
});

// 2. 创建状态面板
const statePanel = new GameStatePanel({
  container: document.getElementById('game-container'),
  modeType: GameModeType.SINGLE_PLAYER,
  showPlayerInfo: true,
  showScore: true,
  showLives: true,
  showTime: true,
  showComparison: false, // 单人模式不需要对比
  refreshInterval: 1000,
});

// 3. 绑定模式管理器
statePanel.bindModeManager(modeManager);

// 4. 创建并启动游戏
await modeManager.createGameInstances({
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

await modeManager.startAllGames();

// 5. 游戏结束后清理
modeManager.on('game_ended', () => {
  setTimeout(() => statePanel.destroy(), 3000);
});
```

---

## 📖 API 参考

### 构造函数

```typescript
constructor(config: GameStatePanelConfig)
```

创建游戏状态面板实例。

**参数：**
```typescript
interface GameStatePanelConfig {
  container: HTMLElement;           // 父容器
  modeType: GameModeType;          // 游戏模式类型
  showPlayerInfo?: boolean;         // 是否显示玩家信息（默认：true）
  showScore?: boolean;             // 是否显示分数（默认：true）
  showLives?: boolean;            // 是否显示生命值（默认：true）
  showTime?: boolean;             // 是否显示时间（默认：true）
  showComparison?: boolean;        // 是否显示对战对比（默认：true，仅对抗模式有效）
  refreshInterval?: number;        // 刷新间隔（毫秒，默认：1000）
}
```

**示例：**
```typescript
const statePanel = new GameStatePanel({
  container: document.getElementById('game-container'),
  modeType: GameModeType.LOCAL_BATTLE,
  showComparison: true,  // 对抗模式显示对比
  refreshInterval: 500,  // 0.5秒刷新一次
});
```

### 方法

#### bindModeManager

```typescript
bindModeManager(modeManager: UnifiedModeManager): void
```

绑定模式管理器，自动监听游戏事件。

**参数：**
- `modeManager`: 模式管理器实例

**示例：**
```typescript
statePanel.bindModeManager(modeManager);
```

#### show

```typescript
show(): void
```

显示面板。

**示例：**
```typescript
statePanel.show();
```

#### hide

```typescript
hide(): void
```

隐藏面板。

**示例：**
```typescript
statePanel.hide();
```

#### update

```typescript
update(): void
```

手动更新面板内容（一般情况下不需要调用，面板会自动更新）。

**示例：**
```typescript
statePanel.update();
```

#### updateConfig

```typescript
updateConfig(config: Partial<GameStatePanelConfig>): void
```

更新面板配置。

**参数：**
- `config`: 部分配置对象

**示例：**
```typescript
// 动态显示/隐藏生命值
statePanel.updateConfig({ showLives: false });

// 更改刷新间隔
statePanel.updateConfig({ refreshInterval: 2000 });
```

#### destroy

```typescript
destroy(): void
```

销毁面板并清理资源。

**示例：**
```typescript
statePanel.destroy();
```

---

## 📊 使用场景

### 场景1：单人游戏状态面板

```typescript
const statePanel = new GameStatePanel({
  container: document.getElementById('game-container'),
  modeType: GameModeType.SINGLE_PLAYER,
  showPlayerInfo: true,
  showScore: true,
  showLives: true,
  showTime: true,
  showComparison: false, // 单人模式不需要对比
});
```

**显示内容：**
- 玩家信息（玩家1）
- 得分（实时更新）
- 生命值（❤️❤️❤️）
- 时间限制

### 场景2：本地对抗状态面板

```typescript
const statePanel = new GameStatePanel({
  container: document.getElementById('game-container'),
  modeType: GameModeType.LOCAL_BATTLE,
  showComparison: true, // 启用对战对比
  refreshInterval: 500,  // 更快的刷新
});
```

**显示内容：**
- 玩家信息（玩家1、玩家2）
- 得分（两个玩家）
- 生命值（两个玩家）
- 时间限制
- **对战对比**：
  - 领先玩家
  - 分数差
  - 生命差

### 场景3：多人游戏状态面板

```typescript
const statePanel = new GameStatePanel({
  container: document.getElementById('game-container'),
  modeType: GameModeType.MULTIPLAYER,
  showComparison: false, // 多人模式不需要对比
});
```

**显示内容：**
- 玩家信息（所有玩家）
- 得分（所有玩家）
- 生命值（所有玩家）
- 时间限制

### 场景4：自定义面板

```typescript
// 只显示玩家信息和分数
const statePanel = new GameStatePanel({
  container: document.getElementById('game-container'),
  modeType: GameModeType.SINGLE_PLAYER,
  showPlayerInfo: true,
  showScore: true,
  showLives: false,  // 不显示生命值
  showTime: false,    // 不显示时间
});
```

### 场景5：动态更新配置

```typescript
// 初始配置
const statePanel = new GameStatePanel({
  container: document.getElementById('game-container'),
  modeType: GameModeType.SINGLE_PLAYER,
  showLives: false,
});

// 用户点击按钮后显示生命值
document.getElementById('show-lives-btn').addEventListener('click', () => {
  statePanel.updateConfig({ showLives: true });
});

// 用户点击按钮后隐藏面板
document.getElementById('hide-panel-btn').addEventListener('click', () => {
  statePanel.hide();
});
```

---

## 🎨 面板样式

面板使用内联样式，自动适应不同模式：

### 单人/多人模式
```
┌─────────────────┐
│  游戏状态       │
├─────────────────┤
│ 玩家信息        │
│ ───────────────  │
│ 玩家1          │
│                 │
│ 得分            │
│ ───────────────  │
│ 玩家1: 50分    │
│                 │
│ 生命值          │
│ ───────────────  │
│ 玩家1: ❤️❤️❤️   │
│                 │
│ 时间            │
│ ───────────────  │
│      60秒       │
└─────────────────┘
```

### 对抗模式
```
┌─────────────────┐
│  本地对抗状态   │
├─────────────────┤
│ 玩家信息        │
│ ───────────────  │
│ ● 玩家1        │
│ ● 玩家2        │
│                 │
│ 得分            │
│ ───────────────  │
│ 玩家1: 50分    │
│ 玩家2: 45分    │
│                 │
│ 生命值          │
│ ───────────────  │
│ 玩家1: ❤️❤️❤️   │
│ 玩家2: ❤️❤️     │
│                 │
│ 时间            │
│ ───────────────  │
│      60秒       │
│                 │
│ 对战状态        │
│ ───────────────  │
│ 玩家1领先       │
│ ──────── ──────│
│ 玩家1 | 玩家2  │
│ 50分   | 45分   │
│ 3生命  | 2生命  │
│ 分数差: 5       │
│ 生命差: 1       │
└─────────────────┘
```

---

## ⚠️ 注意事项

### 1. 资源清理

面板使用完毕后必须销毁：

```typescript
// 方式1：游戏结束后清理
modeManager.on('game_ended', () => {
  setTimeout(() => statePanel.destroy(), 3000);
});

// 方式2：页面卸载时清理
window.addEventListener('beforeunload', () => {
  statePanel.destroy();
});
```

### 2. 刷新间隔

刷新间隔不宜设置过短，以免影响性能：

```typescript
// ✅ 推荐
refreshInterval: 1000,  // 1秒刷新一次

// ⚠️ 可接受
refreshInterval: 500,   // 0.5秒刷新一次（对抗模式）

// ❌ 不推荐
refreshInterval: 100,   // 0.1秒刷新一次（太频繁）
```

### 3. 对比显示

`showComparison` 仅在对抗模式下有效：

```typescript
// 单人/多人模式：showComparison 无效
const panel1 = new GameStatePanel({
  modeType: GameModeType.SINGLE_PLAYER,
  showComparison: true, // 不会显示对比
});

// 对抗模式：showComparison 生效
const panel2 = new GameStatePanel({
  modeType: GameModeType.LOCAL_BATTLE,
  showComparison: true, // 会显示对比
});
```

### 4. 容器验证

使用前确保容器存在：

```typescript
const container = document.getElementById('game-container');
if (!container) {
  console.error('容器不存在');
  return;
}

const statePanel = new GameStatePanel({
  container: container,
  modeType: GameModeType.SINGLE_PLAYER,
});
```

---

## 🎯 集成示例

### 完整的单人游戏示例

```typescript
import { GameStatePanel } from './core/components/GameStatePanel';
import { UnifiedModeManager } from './core/manager/UnifiedModeManager';
import { GameModeType } from './core/interfaces';
import { ArithmeticGameV2 } from './arithmetic/ArithmeticGameV2';

async function runSinglePlayerGame() {
  const container = document.getElementById('game-container');
  if (!container) return;

  // 1. 创建模式管理器
  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
  modeManager.setRuleConfig({
    aiDifficulty: 'medium',
    timeLimit: 60,
    maxLives: 3,
  });

  // 2. 创建状态面板
  const statePanel = new GameStatePanel({
    container: container,
    modeType: GameModeType.SINGLE_PLAYER,
  });

  // 3. 绑定模式管理器
  statePanel.bindModeManager(modeManager);

  // 4. 创建并启动游戏
  await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic' },
      },
    ],
  });

  await modeManager.startAllGames();

  // 5. 游戏结束后清理
  modeManager.on('game_ended', async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await statePanel.destroy();
    await modeManager.destroyAllGames();
  });

  // 6. 页面卸载时清理
  window.addEventListener('beforeunload', async () => {
    statePanel.destroy();
    await modeManager.destroyAllGames();
  });
}

// 运行游戏
runSinglePlayerGame();
```

### 完整的本地对抗示例

```typescript
async function runLocalBattleGame() {
  const container = document.getElementById('game-container');
  if (!container) return;

  // 1. 创建模式管理器
  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);
  modeManager.setRuleConfig({
    timeLimit: 60,
    maxLives: 3,
  });

  // 2. 创建状态面板（启用对比）
  const statePanel = new GameStatePanel({
    container: container,
    modeType: GameModeType.LOCAL_BATTLE,
    showComparison: true,
    refreshInterval: 500,
  });

  // 3. 绑定模式管理器
  statePanel.bindModeManager(modeManager);

  // 4. 创建并启动游戏
  await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic' },
      },
      {
        playerId: 'player2',
        name: '玩家2',
        config: { gameType: 'arithmetic' },
      },
    ],
  });

  await modeManager.startAllGames();

  // 5. 对战结束后清理
  modeManager.on('battle_ended', async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await statePanel.destroy();
    await modeManager.destroyAllGames();
  });

  // 6. 页面卸载时清理
  window.addEventListener('beforeunload', async () => {
    statePanel.destroy();
    await modeManager.destroyAllGames();
  });
}

// 运行游戏
runLocalBattleGame();
```

---

## 📚 相关文件

- `GameStatePanel.ts` - 状态面板实现
- `GameStatePanelUsage.ts` - 使用示例
- `UnifiedModeManager.ts` - 统一模式管理器
- `PHASE1_GUIDE.md` - 阶段1使用指南
