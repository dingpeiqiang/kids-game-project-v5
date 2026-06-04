# 游戏核心架构

## 概述

本项目实现了一套**分层解耦、接口驱动**的游戏架构，通过策略化设计实现网页小游戏玩法模式的**复用性、动态扩展**，让每个游戏自动支持多模式。

## 核心特性

### 已实现功能

1. **抽象契约层** - 定义所有模块的通用接口
2. **公共服务层** - 计分、存储、通信、玩家状态管理、事件总线
3. **玩法模式层** - 单机、本地对抗、组队、网络对抗四种模式
4. **模式管理与适配层** - 模式注册表、动态绑定、配置驱动
5. **游戏核心适配器** - 为游戏开发提供基类
6. **配置管理** - 预定义的游戏-模式映射配置

## 架构设计

### 分层架构图

```
┌─────────────────────────────────────────┐
│         游戏核心层 (Game Core)           │
│  专注游戏规则：胜负判定、消除逻辑等       │
└──────────────┬──────────────────────────┘
               │ 依赖
┌──────────────▼──────────┐      ┌──────────▼──────────────────────┐
│     玩法模式层             │      │      公共服务层                  │
│  单机/本地/组队/网络      │      │  计分/存储/通信/玩家状态/事件总线  │
└──────────────┬──────────┘      └──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────┐
│                    抽象契约层 (Interfaces)                            │
└─────────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────┐
│              模式管理与适配层 (Manager & Registry)                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 项目结构

```
kids-game-frontend/src/modules/game/core/
├── interfaces/              # 抽象契约层
│   ├── GameCoreInterface.ts
│   ├── GameModeInterface.ts
│   ├── ServiceInterface.ts
│   └── IGameCore.ts
│
├── services/               # 公共服务层
│   ├── EventBusService.ts  # 事件总线
│   ├── ScoringService.ts   # 计分服务
│   ├── StorageService.ts   # 存储服务
│   ├── PlayerStateService.ts # 玩家状态
│   └── NetworkService.ts   # 网络服务
│
├── modes/                 # 玩法模式层
│   ├── BaseGameMode.ts
│   ├── SinglePlayerMode.ts
│   ├── LocalBattleMode.ts
│   ├── TeamMode.ts
│   └── OnlineBattleMode.ts
│
├── manager/               # 模式管理
│   └── ModeManager.ts
│
└── config/                # 配置
    └── GameModeRegistry.ts
```

## 核心设计原则

### 1. 组合优于继承

- 游戏核心不继承任何模式类，而是通过**依赖注入**将模式实例"组合"到游戏中
- 效果：同一模式可被所有游戏复用，同一游戏可组合任意模式

### 2. 事件驱动解耦

- 游戏层与模式层通过**事件总线**交互，而非直接调用
- 优势：修改模式逻辑无需改动游戏核心

### 3. 配置化与注册制

- 每种模式的参数通过配置文件管理，游戏加载时动态读取
- 新增模式/游戏时，仅需实现接口并注册

### 4. 职责单一化

- 游戏层：只管"游戏规则"
- 模式层：只管"对战/交互规则"
- 公共服务层：只管"通用能力"

## 快速开始

### 使用模式管理器

```typescript
import { ModeManager, GameModeType } from '@/modules/game/core';

const modeManager = ModeManager.getInstance();

// 创建单机模式
const singlePlayerMode = await modeManager.createMode(
  GameModeType.SINGLE_PLAYER,
  {
    maxPlayers: 2,
    supportAI: true,
    customConfig: {
      aiDifficulty: 'medium',
    },
  }
);
```

### 创建游戏

```typescript
import { ArithmeticGameV2 } from '@/modules/game/arithmetic';

const game = new ArithmeticGameV2('game-container');
await game.initialize(gameConfig, singlePlayerMode);
game.start();
```

### 订阅游戏事件

```typescript
game.on('game_start', (data) => console.log('Game started!', data));
game.on('score_change', (data) => console.log('Score changed:', data));
```

## 开发新游戏

### 继承 GameCoreAdapter

```typescript
import { GameCoreAdapter, GameConfig } from '@/modules/game/core';

export class MyGame extends GameCoreAdapter {
  constructor(private containerId: string) {
    const config: GameConfig = {
      gameId: 'my-game',
      gameName: 'My Game',
      maxPlayers: 2,
      supportAI: true,
    };
    super(config);
  }

  protected onUpdate(delta: number): void { /* 游戏更新 */ }
  protected onRender(): void { /* 游戏渲染 */ }
  protected onCheckWinCondition(): boolean { return false; }
  protected onReset(): void { /* 重置 */ }
  protected onCleanup(): void { /* 清理 */ }
}
```

### 配置游戏模式

```typescript
import { ModeManager, GameModeType } from '@/modules/game/core';

modeManager.registerGameModeMapping({
  gameId: 'my-game',
  supportedModes: [
    GameModeType.SINGLE_PLAYER,
    GameModeType.LOCAL_BATTLE,
  ],
});
```

## 添加新玩法模式

### 实现模式类

```typescript
import { BaseGameMode, GameModeConfig, GameModeType } from '@/modules/game/core';

export class MyCustomMode extends BaseGameMode {
  constructor(config?: Partial<GameModeConfig>) {
    super({
      ...config,
      modeType: GameModeType.CAMPAIGN,
      modeName: 'My Custom Mode',
      maxPlayers: 4,
    });
  }
}
```

### 注册模式

```typescript
const modeManager = ModeManager.getInstance();
modeManager.registerMode({
  modeType: GameModeType.CAMPAIGN,
  modeName: 'Campaign Mode',
  factory: (config) => new MyCustomMode(config),
});
```

## API 参考

### IGameCore 接口

```typescript
interface IGameCore {
  initialize(config: GameConfig, gameMode: IGameMode): Promise<void>;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  handleInput(input: any): void;
  executeRule(action: any): boolean;
  checkWinCondition(): boolean;
  getGameState(): GameState;
  getScoringService(): IScoringService;
  getStorageService(): IStorageService;
  getNetworkService(): INetworkService;
  on(eventType: string, callback: (data: any) => void): void;
  cleanup(): void;
}
```

### 游戏事件类型

```typescript
enum GameEventType {
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  GAME_PAUSE = 'game_pause',
  PLAYER_ACTION = 'player_action',
  TURN_CHANGE = 'turn_change',
  SCORE_CHANGE = 'score_change',
}
```

## 最佳实践

### 事件驱动通信

```typescript
// 推荐：通过事件通信
game.emit('player_action', {
  playerId: 'player1',
  action,
  timestamp: Date.now(),
});
```

### 资源清理

```typescript
protected onCleanup(): void {
  if (this.timer) clearInterval(this.timer);
  this.eventBusService.clear();
  if (this.networkService) this.networkService.disconnect();
}
```

## 优势总结

| 特性 | 说明 |
|------|------|
| **复用性** | 同一模式可被多个游戏复用 |
| **扩展性** | 新增游戏或模式无需修改现有代码 |
| **可维护性** | 清晰的分层结构，职责单一 |
| **灵活性** | 游戏可动态切换模式 |

---

**版本**: v2.0.0
**最后更新**: 2026-03-20
