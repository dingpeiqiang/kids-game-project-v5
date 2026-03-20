# 对战模式架构详解

## 核心理念

### ❌ 传统方式（不推荐）

```
玩家1设备                          玩家2设备
┌──────────────┐                  ┌──────────────┐
│ 游戏实例1     │                  │ 游戏实例2     │
│ ├─ 游戏规则   │                  │ ├─ 游戏规则   │
│ ├─ 玩家1状态  │                  │ ├─ 玩家2状态  │
│ ├─ 玩家2状态  │                  │ ├─ 玩家1状态  │
│ └─ 渲染1      │                  │ └─ 渲染2      │
└──────────────┘                  └──────────────┘
      │                                  │
      └────────── 网络同步 ──────────────┘

问题：
1. 代码重复（两个游戏实例包含相同逻辑）
2. 状态同步复杂（需要同步两套状态）
3. 资源浪费（重复加载资源）
4. 维护困难（修改游戏规则需要改两处）
```

### ✅ 推荐方式（本架构）

```
┌─────────────────────────────────────────────────────┐
│                   游戏核心实例                        │
│  GameCore (游戏规则、渲染逻辑、资源管理)              │
│  ┌───────────────────────────────────────────────┐  │
│  │  游戏规则（五子棋规则、算数题目生成等）        │  │
│  │  渲染引擎（Phaser场景、UI渲染）               │  │
│  │  资源管理（图片、音效、配置）                  │  │
│  └───────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 包含
                     │
┌────────────────────▼────────────────────────────────┐
│               玩法模式实例                             │
│  BattleMode (LocalBattleMode 或 OnlineBattleMode)    │
│  ┌───────────────────────────────────────────────┐  │
│  │  玩家管理器                                    │  │
│  │   ├─ Player1: { id, name, score, lives }      │  │
│  │   ├─ Player2: { id, name, score, lives }      │  │
│  │   └─ PlayerN: { id, name, score, lives }      │  │
│  ├───────────────────────────────────────────────┤  │
│  │  输入分发器                                    │  │
│  │   ├─ 处理 Player1 的输入 (WASD)                │  │
│  │   ├─ 处理 Player2 的输入 (方向键)              │  │
│  │   └─ 分发到游戏核心                            │  │
│  ├───────────────────────────────────────────────┤  │
│  │  状态管理                                      │  │
│  │   ├─ 维护每个玩家的独立状态                    │  │
│  │   ├─ 计算排名                                 │  │
│  │   └─ 判断胜负                                 │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
  本地对抗模式              网络对抗模式
  (同一设备)                (不同设备)
        │                         │
  ┌─────▼─────┐           ┌──────▼──────┐
  │ 玩家1      │           │ 玩家1设备   │
  │ 玩家2      │           │ └─ 玩家1     │
  └───────────┘           │              │
                          │ 玩家2设备   │
                          │ └─ 玩家2     │
                          └──────────────┘

优势：
1. 代码复用（游戏规则只实现一次）
2. 状态管理清晰（模式统一管理所有玩家）
3. 资源高效（资源只加载一次）
4. 易于维护（修改游戏规则只需改一处）
5. 模式可插拔（轻松切换不同模式）
```

## 具体实现对比

### 本地对抗模式（LocalBattleMode）

```typescript
// ✅ 推荐：一个游戏实例 + 一个模式实例

const game = new ArithmeticGameV2('game-container');
const battleMode = new LocalBattleMode();

// 创建两个玩家
const player1: Player = { id: 'p1', name: 'Player 1', score: 0, lives: 3 };
const player2: Player = { id: 'p2', name: 'Player 2', score: 0, lives: 3 };

// 添加到模式
battleMode.addPlayer(player1);
battleMode.addPlayer(player2);

// 添加到游戏的玩家状态服务
game.getPlayerStateService().addPlayer(player1);
game.getPlayerStateService().addPlayer(player2);

// 初始化并启动
await game.initialize(gameConfig, battleMode);
game.start();

// 处理输入
battleMode.handlePlayerAction('p1', { action: 'answer', answer: 5 });
battleMode.handlePlayerAction('p2', { action: 'answer', answer: 7 });
```

**工作流程：**

```
玩家1按W键              玩家2按方向键
    │                       │
    ▼                       ▼
LocalBattleMode.handlePlayerAction('p1', { input: 'W' })
LocalBattleMode.handlePlayerAction('p2', { input: 'ArrowUp' })
    │                       │
    └───────────┬───────────┘
                │
                ▼
        GameCore.onHandleInput(input)
                │
                ▼
        更新游戏状态
                │
                ▼
        GameCore.render()
                │
                ▼
        渲染两个玩家的状态
```

### 网络对抗模式（OnlineBattleMode）

```typescript
// ✅ 推荐：每个设备一个游戏实例 + 一个模式实例

// 玩家1设备（主机）
const game1 = new ArithmeticGameV2('game-container-1');
const onlineMode1 = new OnlineBattleMode({
  roomId: 'room_123',
  serverUrl: 'ws://localhost:8080',
});

const player1: Player = { id: 'p1', name: 'Player 1', score: 0, lives: 3 };
onlineMode1.setLocalPlayer(player1);
onlineMode1.addPlayer(player1);

await game1.initialize(gameConfig, onlineMode1);
game1.start();


// 玩家2设备（客机）
const game2 = new ArithmeticGameV2('game-container-2');
const onlineMode2 = new OnlineBattleMode({
  roomId: 'room_123',
  serverUrl: 'ws://localhost:8080',
});

const player2: Player = { id: 'p2', name: 'Player 2', score: 0, lives: 3 };
onlineMode2.setLocalPlayer(player2);
onlineMode2.addPlayer(player2);

await game2.initialize(gameConfig, onlineMode2);
game2.start();

// 玩家1操作
onlineMode1.sendNetworkMessage('move', { action: 'answer', answer: 5 });
//  → 服务器 →  onlineMode2 接收并渲染
```

**工作流程：**

```
玩家1设备                          玩家2设备
┌──────────────┐                  ┌──────────────┐
│ OnlineMode1  │                  │ OnlineMode2  │
│ ├─ 本地玩家   │                  │ ├─ 本地玩家   │
│ └─ 发送消息   │                  │ └─ 接收消息   │
└──────┬───────┘                  └──────┬───────┘
       │                                 │
       │ sendNetworkMessage()             │
       │                                 │
       ▼                                 ▼
    WebSocket服务器                      │
       │                                 │
       │ broadcast()                      │
       │                                 │
       ├─────────────────────────────────┤
       │                                 │
       ▼                                 ▼
  OnlineMode1收到确认              OnlineMode2收到消息
       │                                 │
       ▼                                 ▼
   更新本地玩家1状态                  渲染玩家1操作
```

## 数据流示意图

### 本地对抗模式数据流

```
玩家1输入               玩家2输入
    │                      │
    ▼                      ▼
┌──────────────────────────────────────┐
│      LocalBattleMode                  │
│  ┌────────────────────────────────┐ │
│  │ Input Handling                  │ │
│  │  ├─ handlePlayerAction('p1')    │ │
│  │  └─ handlePlayerAction('p2')    │ │
│  └────────────┬───────────────────┘ │
└───────────────┼──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│      PlayerStateService              │
│  ┌────────────────────────────────┐ │
│  │ Players                        │ │
│  │  {                             │ │
│  │    'p1': { score: 10, lives: 3 }│ │
│  │    'p2': { score: 15, lives: 2 }│ │
│  │  }                             │ │
│  └────────────┬───────────────────┘ │
└───────────────┼──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│      GameCore (ArithmeticGame)       │
│  ┌────────────────────────────────┐ │
│  │ Game Rules                     │ │
│  │  ├─ 检查答案是否正确            │ │
│  │  ├─ 更新分数                   │ │
│  │  └─ 判断胜负                   │ │
│  └────────────┬───────────────────┘ │
└───────────────┼──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│      Rendering                      │
│  ┌────────────────────────────────┐ │
│  │ UI Display                     │ │
│  │  ├─ Player1: score=10 lives=3 │ │
│  │  ├─ Player2: score=15 lives=2 │ │
│  │  └─ Question: 5 + 3 = ?        │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### 网络对抗模式数据流

```
玩家1设备                                玩家2设备
┌──────────────┐                        ┌──────────────┐
│ Player1输入  │                        │ 渲染Player1   │
│      │       │                        │      │       │
│      ▼       │                        │      ▼       │
│ OnlineMode1  │                        │ OnlineMode2  │
│      │       │                        │      │       │
│ sendNetwork   │                        │  receive     │
│ Message()     │                        │  Message()   │
│      │       │                        │      │       │
└──────┼───────┘                        └──────┼───────┘
       │                                       │
       │ WebSocket                             │
       │                                       │
       ▼                                       ▼
    WebSocket服务器                          │
       │                                       │
       │ broadcast(message)                    │
       │                                       │
       ├───────────────────────────────────────┤
       │                                       │
       │ 1. 发送给Player1 (确认)               │
       │ 2. 发送给Player2 (转发)               │
       │                                       │
       ▼                                       ▼
    OnlineMode1收到确认                  OnlineMode2收到消息
       │                                       │
       ▼                                       ▼
   更新本地Player1状态                    渲染Player1操作
   (score++, etc.)                     (显示动画等)
```

## 关键要点总结

### 1. 为什么不需要两个游戏实例？

| 方面 | 两个游戏实例 | 一个游戏实例 |
|------|-------------|-------------|
| 代码重复 | ✗ 相同逻辑写两遍 | ✓ 只写一次 |
| 内存占用 | ✗ 两倍内存 | ✓ 单倍内存 |
| 资源加载 | ✗ 重复加载图片/音效 | ✓ 只加载一次 |
| 状态同步 | ✗ 需要同步两套状态 | ✓ 统一管理 |
| 维护成本 | ✗ 修改需要改两处 | ✓ 只改一处 |
| 模式切换 | ✗ 需要重新创建 | ✓ 轻松切换 |

### 2. 模式的作用是什么？

- **玩家管理** - 创建、添加、删除玩家
- **状态管理** - 维护每个玩家的独立状态
- **输入分发** - 识别玩家身份，分发输入到游戏核心
- **规则执行** - 实现对战特有规则（回合制、计时等）
- **通信适配** - 网络模式下处理WebSocket通信

### 3. 游戏核心的作用是什么？

- **游戏规则** - 定义游戏特有的规则（五子棋落位、算数计算等）
- **渲染逻辑** - 渲染游戏场景、UI、动画
- **资源管理** - 加载和管理图片、音效等资源
- **事件处理** - 响应用户输入、触发游戏事件

### 4. 什么时候需要多个游戏实例？

**只有在以下情况才需要：**
- 多个独立的游戏窗口（例如在一个页面运行两个不同的游戏）
- 不同类型的游戏（例如一个算数游戏，一个消消乐）

**对战游戏不需要！** 对战游戏只需要一个游戏实例 + 一个模式实例。

## 实际代码示例

### 完整的本地对抗实现

```typescript
import { LocalBattleMode, GameModeType } from '@/modules/game/core/modes';
import { Player } from '@/modules/game/core/interfaces';
import { ArithmeticGameV2 } from '@/modules/game/arithmetic/ArithmeticGameV2';

async function playLocalBattle() {
  // 1. 创建模式
  const battleMode = new LocalBattleMode();
  await battleMode.initialize({
    modeType: GameModeType.LOCAL_BATTLE,
    modeName: 'Local Battle',
    maxPlayers: 2,
    supportAI: false,
  });

  // 2. 创建玩家
  const player1: Player = {
    id: 'player1',
    name: 'Player 1',
    score: 0,
    lives: 3,
    isReady: true,
    properties: {
      inputKeys: ['W', 'A', 'S', 'D'],
      color: '#FF6B9D',
    },
  };

  const player2: Player = {
    id: 'player2',
    name: 'Player 2',
    score: 0,
    lives: 3,
    isReady: true,
    properties: {
      inputKeys: ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'],
      color: '#4ECDC4',
    },
  };

  // 3. 添加玩家到模式
  battleMode.addPlayer(player1);
  battleMode.addPlayer(player2);

  // 4. 创建游戏（只需要一个！）
  const game = new ArithmeticGameV2('game-container');

  // 5. 初始化游戏
  await game.initialize(game.getGameConfig(), battleMode);

  // 6. 添加玩家到游戏的玩家状态服务
  const playerStateService = game.getPlayerStateService();
  playerStateService.addPlayer(player1);
  playerStateService.addPlayer(player2);

  // 7. 订阅游戏事件
  game.on('score_change', (data) => {
    console.log('Score changed:', data);
    // 更新UI显示
  });

  // 8. 启动游戏
  game.start();

  // 9. 处理玩家输入
  document.addEventListener('keydown', (event) => {
    // 判断是哪个玩家的输入
    if (['W', 'A', 'S', 'D'].includes(event.key)) {
      const input = {
        playerId: 'player1',
        action: 'key',
        key: event.key,
        timestamp: Date.now(),
      };
      battleMode.handlePlayerAction('player1', input);
    } else if (['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.key)) {
      const input = {
        playerId: 'player2',
        action: 'key',
        key: event.key,
        timestamp: Date.now(),
      };
      battleMode.handlePlayerAction('player2', input);
    }
  });
}
```

## 总结

**核心概念：**
- **游戏实例 = 1个** - 包含游戏规则、渲染逻辑、资源管理
- **模式实例 = 1个** - 管理多个玩家、处理输入、执行对战规则
- **玩家状态 = N个** - 每个玩家有独立的状态（分数、生命值等）

**优势：**
1. 代码复用 - 游戏规则只实现一次
2. 易于维护 - 修改游戏规则只需改一处
3. 资源高效 - 图片、音效只加载一次
4. 模式可插拔 - 轻松切换单机/本地/网络模式
5. 扩展性强 - 新增模式无需修改游戏代码
