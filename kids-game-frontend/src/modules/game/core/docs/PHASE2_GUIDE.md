# 阶段2: 本地对抗模式 - 完整指南

## 📋 概述

本地对抗模式支持两人同设备对战，通过**物理分屏**的方式实现：

- **2个完全独立的游戏实例**
- **物理分屏（垂直/水平）**
- **实时数据收集和对比**
- **智能规则判定**
- **支持游戏状态面板显示**

---

## 🎯 核心特性

### 1. 双独立实例
- 每个玩家拥有独立的游戏实例
- 完全隔离的状态、渲染、输入
- 避免状态同步问题

### 2. 物理分屏
- **垂直分屏**：左右分割（默认）
- **水平分屏**：上下分割
- 自动适配不同屏幕尺寸

### 3. 实时数据收集
- 自动收集两个游戏实例的状态
- 实时对比分数和生命值
- 智能判定领先玩家

### 4. 规则判定
- 生命值耗尽判定
- 分数对比判定
- 多种胜负原因

---

## 🚀 快速开始

### 基础用法

```typescript
import { UnifiedModeManager } from './core/manager/UnifiedModeManager';
import { GameModeType } from './core/interfaces';

// 1. 创建模式管理器
const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);

// 2. 设置规则
modeManager.setRuleConfig({
  timeLimit: 120,    // 时间限制（秒）
  maxLives: 3,       // 最大生命值
  winScore: 100,     // 获胜分数
});

// 3. 创建游戏实例
await modeManager.createGameInstances({
  gameCreator: (container) => new ArithmeticGameV2(container),
  container: document.getElementById('game-container'),
  playerConfigs: [
    { playerId: 'player1', name: '玩家1', config: { difficulty: 'easy' } },
    { playerId: 'player2', name: '玩家2', config: { difficulty: 'medium' } },
  ],
});

// 4. 启动游戏
await modeManager.startAllGames();

// 5. 监听对战结束
modeManager.on('battle_ended', (data) => {
  console.log('获胜者:', data.winner);
  console.log('原因:', data.reason);
});
```

---

## 📐 分屏布局

### 垂直分屏（默认）

```
+------------------+------------------+
|                  |                  |
|   玩家1区域      |   玩家2区域      |
|   (左侧50%)      |   (右侧50%)      |
|   粉色背景       |   青色背景       |
|                  |                  |
+------------------+------------------+
```

### 水平分屏

```
+----------------------------------+
|                                  |
|   玩家1区域 (上半部分50%)         |
|   粉色背景                       |
+----------------------------------+
|                                  |
|   玩家2区域 (下半部分50%)         |
|   青色背景                       |
+----------------------------------+
```

### 设置分屏类型

```typescript
// 垂直分屏（默认）
await modeManager.createGameInstances({
  // ...
});

// 水平分屏（需要在代码中修改）
// 查看 UnifiedModeManager.setupSplitScreen() 方法
```

---

## 🎮 游戏状态面板

### 基础配置

```typescript
import { GameStatePanel } from './core/components/GameStatePanel';

const statePanel = new GameStatePanel({
  container: document.getElementById('state-panel-container'),
  modeType: GameModeType.LOCAL_BATTLE,
  showPlayerInfo: true,     // 显示玩家信息
  showScore: true,          // 显示分数
  showLives: true,          // 显示生命值
  showTime: true,           // 显示时间
  showComparison: true,      // 显示对战状态
  refreshInterval: 1000,    // 刷新间隔（毫秒）
});

// 绑定模式管理器
statePanel.bindModeManager(modeManager);
```

### 面板显示内容

对抗模式下，状态面板会显示：

1. **玩家信息区域**
   - 玩家1名称
   - 玩家2名称

2. **得分区域**
   - 玩家1实时分数
   - 玩家2实时分数

3. **生命值区域**
   - 玩家1生命值
   - 玩家2生命值

4. **对战状态区域**
   - 领先玩家（粉色=玩家1，青色=玩家2）
   - 分数差
   - 生命值差
   - 实时对比卡片

---

## 📊 数据收集和监控

### 获取实时对战数据

```typescript
const battleData = modeManager.getLocalBattleData();

if (battleData) {
  console.log('玩家1:', battleData.player1);
  console.log('玩家2:', battleData.player2);
  console.log('进行中:', battleData.isRunning);
}
```

### 数据结构

```typescript
{
  player1: {
    id: 'player1',
    name: '玩家1',
    score: 50,
    lives: 2,
  },
  player2: {
    id: 'player2',
    name: '玩家2',
    score: 45,
    lives: 3,
  },
  isRunning: true,
}
```

### 实时监控

```typescript
// 每秒获取游戏状态
const monitorInterval = setInterval(() => {
  const battleData = modeManager.getLocalBattleData();
  if (battleData) {
    console.log(`${battleData.player1.name}: ${battleData.player1.score}分`);
    console.log(`${battleData.player2.name}: ${battleData.player2.score}分`);
  }
}, 1000);

// 对战结束清理
modeManager.on('battle_ended', () => {
  clearInterval(monitorInterval);
});
```

---

## 🏆 规则判定

### 胜负判定规则

系统会自动判定胜负，规则优先级如下：

#### 1. 生命值耗尽判定（最高优先级）

```typescript
// 玩家1生命值耗尽 → 玩家2获胜
if (lives1 <= 0 && lives2 > 0) {
  winner = 'player2';
  reason = 'player1_lives_depleted';
}

// 玩家2生命值耗尽 → 玩家1获胜
if (lives2 <= 0 && lives1 > 0) {
  winner = 'player1';
  reason = 'player2_lives_depleted';
}

// 两人都耗尽 → 平局
if (lives1 <= 0 && lives2 <= 0) {
  winner = 'draw';
  reason = 'both_lives_depleted';
}
```

#### 2. 分数对比判定

```typescript
// 分数高者获胜
if (score1 > score2) {
  winner = 'player1';
  reason = 'score_comparison';
} else if (score2 > score1) {
  winner = 'player2';
  reason = 'score_comparison';
} else {
  winner = 'draw';
  reason = 'score_tie';
}
```

### 胜负原因说明

| reason | 说明 |
|--------|------|
| `player1_lives_depleted` | 玩家1生命值耗尽，玩家2获胜 |
| `player2_lives_depleted` | 玩家2生命值耗尽，玩家1获胜 |
| `both_lives_depleted` | 两人都耗尽，平局 |
| `score_comparison` | 分数对比判定胜负 |
| `score_tie` | 分数相同，平局 |

### 监听对战结束

```typescript
modeManager.on('battle_ended', (data) => {
  console.log('=== 对战结果 ===');
  console.log('获胜者:', data.winner);
  console.log('获胜原因:', data.reason);
  console.log('玩家1:', data.player1);
  console.log('玩家2:', data.player2);

  if (data.winner === 'draw') {
    alert('平局！');
  } else {
    alert(`${data.winner} 获胜！`);
  }
});
```

---

## 🎨 高级用法

### 1. 不同难度对战

```typescript
await modeManager.createGameInstances({
  gameCreator: (container) => new ArithmeticGameV2(container),
  container: document.getElementById('game-container'),
  playerConfigs: [
    { 
      playerId: 'player1', 
      name: '小明（新手）', 
      config: { difficulty: 'easy', timePerQuestion: 15 } 
    },
    { 
      playerId: 'player2', 
      name: '小红（高手）', 
      config: { difficulty: 'hard', timePerQuestion: 8 } 
    },
  ],
});
```

### 2. 差异化配置

```typescript
await modeManager.createGameInstances({
  gameCreator: (container) => new ArithmeticGameV2(container),
  container: document.getElementById('game-container'),
  playerConfigs: [
    {
      playerId: 'player1',
      name: '玩家1',
      config: {
        gameType: 'arithmetic',
        difficulty: 'medium',
        timePerQuestion: 10,
        maxQuestions: 10,
      },
    },
    {
      playerId: 'player2',
      name: '玩家2',
      config: {
        gameType: 'arithmetic',
        difficulty: 'hard',
        timePerQuestion: 8,
        maxQuestions: 15,
      },
    },
  ],
});
```

### 3. 多轮对战

```typescript
let round = 1;
const scores = { player1: 0, player2: 0 };

async function startRound() {
  await modeManager.createGameInstances({
    gameCreator: (container) => new ArithmeticGameV2(container),
    container: document.getElementById('game-container'),
    playerConfigs: [
      { playerId: 'player1', name: '玩家1', config: {} },
      { playerId: 'player2', name: '玩家2', config: {} },
    ],
  });

  await modeManager.startAllGames();
}

modeManager.on('battle_ended', (data) => {
  if (data.winner === 'player1') {
    scores.player1++;
  } else if (data.winner === 'player2') {
    scores.player2++;
  }

  modeManager.destroyAllGames();

  round++;
  if (round <= 3) {
    setTimeout(startRound, 2000);
  } else {
    console.log('最终结果:', scores);
  }
});

await startRound();
```

---

## 📋 完整示例

### 完整流程示例

```typescript
import { UnifiedModeManager } from './core/manager/UnifiedModeManager';
import { GameStatePanel } from './core/components/GameStatePanel';
import { GameModeType } from './core/interfaces';

async function completeLocalBattleExample() {
  const container = document.getElementById('game-container');
  const statePanelContainer = document.getElementById('state-panel-container');

  // 1. 创建模式管理器
  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);

  // 2. 创建游戏状态面板
  const statePanel = new GameStatePanel({
    container: statePanelContainer,
    modeType: GameModeType.LOCAL_BATTLE,
    showPlayerInfo: true,
    showScore: true,
    showLives: true,
    showTime: true,
    showComparison: true,
    refreshInterval: 1000,
  });

  // 3. 绑定模式管理器
  statePanel.bindModeManager(modeManager);

  // 4. 设置游戏规则
  modeManager.setRuleConfig({
    timeLimit: 120,
    maxLives: 3,
    winScore: 100,
  });

  // 5. 创建游戏实例
  await modeManager.createGameInstances({
    gameCreator: (container) => new ArithmeticGameV2(container),
    container: container,
    playerConfigs: [
      { playerId: 'player1', name: '小明', config: { difficulty: 'medium' } },
      { playerId: 'player2', name: '小红', config: { difficulty: 'medium' } },
    ],
  });

  // 6. 启动游戏
  await modeManager.startAllGames();

  // 7. 监听游戏事件
  modeManager.on('game_started', (data) => {
    console.log('游戏开始:', data);
  });

  modeManager.on('battle_ended', (data) => {
    console.log('对战结束:', data);
    
    const result = `
      对战结束！
      
      ${data.player1.name}: ${data.player1.score}分
      ${data.player2.name}: ${data.player2.score}分
      
      ${data.winner === 'draw' ? '平局！' : `获胜者: ${data.winner}`}
    `;
    alert(result);

    // 清理
    statePanel.destroy();
    modeManager.destroyAllGames();
  });
}

// 运行示例
completeLocalBattleExample();
```

---

## 🔧 API参考

### UnifiedModeManager

#### 构造函数

```typescript
constructor(modeType: GameModeType)
```

#### 方法

| 方法 | 说明 |
|------|------|
| `setRuleConfig(config)` | 设置游戏规则配置 |
| `createGameInstances(config)` | 创建游戏实例 |
| `startAllGames()` | 启动所有游戏 |
| `pauseAllGames()` | 暂停所有游戏 |
| `resumeAllGames()` | 恢复所有游戏 |
| `stopAllGames()` | 停止所有游戏 |
| `destroyAllGames()` | 销毁所有游戏 |
| `getLocalBattleData()` | 获取本地对战数据 |
| `addPlayer(player)` | 添加玩家 |
| `getPlayer(playerId)` | 获取玩家信息 |
| `getAllPlayers()` | 获取所有玩家 |
| `on(event, callback)` | 监听事件 |
| `off(event, callback)` | 取消监听 |

#### 事件

| 事件名 | 说明 | 数据 |
|--------|------|------|
| `game_started` | 游戏开始 | `{ instanceId, ... }` |
| `game_ended` | 游戏结束 | `{ instanceId, result }` |
| `score_updated` | 分数更新 | `{ instanceId, scoreData }` |
| `battle_ended` | 对战结束 | `{ winner, reason, player1, player2 }` |

---

### GameStatePanel

#### 构造函数

```typescript
constructor(config: GameStatePanelConfig)
```

#### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `container` | HTMLElement | 必填 | 容器元素 |
| `modeType` | GameModeType | 必填 | 游戏模式类型 |
| `showPlayerInfo` | boolean | true | 显示玩家信息 |
| `showScore` | boolean | true | 显示分数 |
| `showLives` | boolean | true | 显示生命值 |
| `showTime` | boolean | true | 显示时间 |
| `showComparison` | boolean | true | 显示对战状态 |
| `refreshInterval` | number | 1000 | 刷新间隔（毫秒） |

#### 方法

| 方法 | 说明 |
|------|------|
| `bindModeManager(manager)` | 绑定模式管理器 |
| `update()` | 手动更新面板 |
| `updateConfig(config)` | 更新配置 |
| `destroy()` | 销毁面板 |

---

## ⚠️ 注意事项

### 1. 玩家数量

本地对抗模式**必须**恰好有2个玩家：

```typescript
// ✅ 正确
playerConfigs: [
  { playerId: 'player1', name: '玩家1', config: {} },
  { playerId: 'player2', name: '玩家2', config: {} },
]

// ❌ 错误
playerConfigs: [
  { playerId: 'player1', name: '玩家1', config: {} }, // 只有1个玩家
]
```

### 2. 容器要求

父容器必须设置 `position: relative`：

```css
#game-container {
  position: relative;
  width: 100%;
  height: 100%;
}
```

### 3. 游戏创建函数

`gameCreator` 函数必须返回实现 `IGameCore` 接口的实例：

```typescript
gameCreator: (container: HTMLElement) => IGameCore
```

### 4. 事件监听

记得在组件销毁时清理事件监听：

```typescript
onUnmounted(() => {
  statePanel.destroy();
  modeManager.destroyAllGames();
});
```

### 5. 内存管理

对抗模式会创建2个游戏实例，注意内存占用：

- 及时销毁不再使用的游戏实例
- 使用对象池复用游戏对象
- 避免在游戏中加载过多资源

---

## 🎯 使用场景

### 适用场景

- ✅ 家庭娱乐：两个孩子同设备对战
- ✅ 教育场景：学生分组PK
- ✅ 展示演示：同时展示两个游戏实例
- ✅ 测试调试：对比不同游戏行为

### 不适用场景

- ❌ 远程对战（应使用网络对抗模式）
- ❌ 3人以上对战（应使用多人模式）
- ❌ 设备性能不足（2个实例会占用较多资源）

---

## 📚 相关文档

- [阶段1: 单人模式基础架构](./PHASE1_GUIDE.md)
- [游戏状态面板使用指南](./GAME_STATE_PANEL_GUIDE.md)
- [总体实施计划](./IMPLEMENTATION_PLAN.md)

---

## 🎉 总结

阶段2实现了完整的本地对抗模式，包括：

✅ 双独立游戏实例  
✅ 物理分屏（垂直/水平）  
✅ 实时数据收集和监控  
✅ 智能规则判定  
✅ 游戏状态面板支持  
✅ 完整的示例和文档  

准备好继续实现阶段3了吗？
