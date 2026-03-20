# 游戏架构使用指南

本文档详细说明了如何使用游戏架构系统开发支持多模式的网页小游戏。

## 目录

1. [架构概览](#架构概览)
2. [快速开始](#快速开始)
3. [开发新游戏](#开发新游戏)
4. [添加新玩法模式](#添加新玩法模式)
5. [配置游戏模式](#配置游戏模式)
6. [API参考](#api参考)
7. [最佳实践](#最佳实践)
8. [常见问题](#常见问题)

---

## 架构概览

### 核心设计理念

本架构采用**分层解耦 + 接口驱动**的设计，实现以下目标：

- **复用性**：玩法模式作为独立组件，可被多个游戏复用
- **扩展性**：新增游戏或模式无需修改现有代码
- **可维护性**：清晰的分层结构，职责单一化

### 分层架构

```
┌─────────────────────────────────────────┐
│         游戏核心层 (Game Core)           │
│  专注游戏规则：胜负判定、消除逻辑等       │
└──────────────┬──────────────────────────┘
               │ 依赖
               ├───────────────────────────────┐
               │                               │
┌──────────────▼──────────┐      ┌──────────▼──────────────────────┐
│     玩法模式层             │      │      公共服务层                  │
│  单机/本地/组队/网络      │      │  计分/存储/通信/玩家状态          │
└──────────────┬──────────┘      └──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────┐
│                    抽象契约层 (Interfaces)                            │
│           定义所有模块必须遵守的接口和抽象类                          │
└─────────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────┐
│              模式管理与适配层 (Manager & Registry)                     │
│           模式注册、动态绑定、配置驱动                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 核心组件

| 组件 | 说明 | 文件位置 |
|------|------|----------|
| `IGameCore` | 游戏核心接口 | `core/interfaces/IGameCore.ts` |
| `IGameMode` | 玩法模式接口 | `core/interfaces/GameModeInterface.ts` |
| `EventBusService` | 事件总线服务 | `core/services/EventBusService.ts` |
| `ScoringService` | 计分服务 | `core/services/ScoringService.ts` |
| `StorageService` | 存储服务 | `core/services/StorageService.ts` |
| `NetworkService` | 网络服务 | `core/services/NetworkService.ts` |
| `PlayerStateService` | 玩家状态服务 | `core/services/PlayerStateService.ts` |
| `ModeManager` | 模式管理器 | `core/manager/ModeManager.ts` |
| `GameCoreAdapter` | 游戏核心适配器 | `core/GameCoreAdapter.ts` |

---

## 快速开始

### 1. 初始化模式管理器

```typescript
import { ModeManager } from '@/modules/game/core';

const modeManager = ModeManager.getInstance();

// 查看已注册的模式
console.log(modeManager.getRegisteredModes());
```

### 2. 创建游戏模式

```typescript
import { GameModeType } from '@/modules/game/core';

// 创建单机模式
const singlePlayerMode = await modeManager.createMode(
  GameModeType.SINGLE_PLAYER,
  {
    maxPlayers: 2,
    supportAI: true,
    customConfig: {
      aiDifficulty: 'medium',
      responseDelay: 2000,
    },
  }
);

// 创建网络对抗模式
const onlineMode = await modeManager.createMode(
  GameModeType.ONLINE_BATTLE,
  {
    maxPlayers: 2,
    roomId: 'room_123',
    serverUrl: 'ws://localhost:8080',
  }
);
```

### 3. 创建游戏实例

```typescript
import { ArithmeticGameV2 } from '@/modules/game/arithmetic/ArithmeticGameV2';

const game = new ArithmeticGameV2('game-container');

// 初始化游戏
await game.initialize(gameConfig, singlePlayerMode);

// 启动游戏
game.start();
```

---

## 开发新游戏

### 步骤1：创建游戏类

继承 `GameCoreAdapter` 并实现抽象方法：

```typescript
import { GameCoreAdapter, GameConfig } from '@/modules/game/core';

export class MyGame extends GameCoreAdapter {
  constructor(private containerId: string) {
    const config: GameConfig = {
      gameId: 'my-game',
      gameName: 'My Game',
      version: '1.0.0',
      maxPlayers: 2,
      minPlayers: 1,
      supportAI: true,
    };

    super(config);
  }

  protected onUpdate(delta: number): void {
    // 每帧更新逻辑
  }

  protected onRender(): void {
    // 每帧渲染逻辑
  }

  protected onHandleInput(input: any): void {
    // 处理输入
  }

  protected onExecuteRule(action: any): boolean {
    // 执行游戏规则
    return true;
  }

  protected onCheckWinCondition(): boolean {
    // 检查胜利条件
    return false;
  }

  protected onCheckLoseCondition(): boolean {
    // 检查失败条件
    return false;
  }

  protected onReset(): void {
    // 重置游戏
  }

  protected onCleanup(): void {
    // 清理资源
  }
}
```

### 步骤2：配置游戏模式

```typescript
import { ModeManager, GameModeType } from '@/modules/game/core';

const modeManager = ModeManager.getInstance();

// 注册游戏模式映射
modeManager.registerGameModeMapping({
  gameId: 'my-game',
  supportedModes: [
    GameModeType.SINGLE_PLAYER,
    GameModeType.LOCAL_BATTLE,
    GameModeType.ONLINE_BATTLE,
  ],
  modeConfigs: {
    [GameModeType.SINGLE_PLAYER]: {
      maxPlayers: 2,
      supportAI: true,
      customConfig: {
        aiDifficulty: 'medium',
      },
    },
    [GameModeType.LOCAL_BATTLE]: {
      maxPlayers: 2,
      supportAI: false,
    },
    [GameModeType.ONLINE_BATTLE]: {
      maxPlayers: 2,
      supportAI: false,
      serverUrl: 'ws://localhost:8080',
    },
  },
});
```

### 步骤3：使用游戏

```typescript
// 创建游戏
const game = new MyGame('game-container');

// 创建模式
const mode = await modeManager.createModeForGame(
  'my-game',
  GameModeType.SINGLE_PLAYER
);

// 初始化游戏
await game.initialize(game.getGameConfig(), mode);

// 添加玩家
const player: Player = {
  id: 'player1',
  name: 'Player 1',
  score: 0,
  lives: 3,
  isReady: true,
};

game.getPlayerStateService().addPlayer(player);
mode.addPlayer(player);

// 启动游戏
game.start();

// 订阅游戏事件
game.on('game_start', (data) => {
  console.log('Game started!', data);
});

game.on('score_change', (data) => {
  console.log('Score changed:', data);
});
```

---

## 添加新玩法模式

### 步骤1：实现模式类

继承 `BaseGameMode` 并实现特定逻辑：

```typescript
import { BaseGameMode, GameModeConfig, GameModeType } from '@/modules/game/core';

export class MyCustomMode extends BaseGameMode {
  constructor(config?: Partial<GameModeConfig>) {
    super({
      ...config,
      modeType: GameModeType.CAMPAIGN, // 或其他自定义类型
      modeName: 'My Custom Mode',
      maxPlayers: 4,
      supportAI: false,
    });
  }

  // 可以重写父类方法或添加自定义方法
  handlePlayerAction(playerId: string, action: any): boolean {
    const result = super.handlePlayerAction(playerId, action);

    // 添加自定义逻辑
    console.log('Custom mode handling action:', action);

    return result;
  }

  // 添加模式特有的方法
  public processCustomLogic(): void {
    // 自定义逻辑
  }
}
```

### 步骤2：注册模式

```typescript
import { ModeManager, GameModeType } from '@/modules/game/core';

const modeManager = ModeManager.getInstance();

modeManager.registerMode({
  modeType: GameModeType.CAMPAIGN,
  modeName: 'Campaign Mode',
  factory: (config) => new MyCustomMode(config),
  defaultConfig: {
    maxPlayers: 4,
    supportAI: false,
    timeLimit: 600,
  },
});
```

### 步骤3：使用新模式

```typescript
// 创建自定义模式
const customMode = await modeManager.createMode(
  GameModeType.CAMPAIGN,
  {
    maxPlayers: 4,
  }
);

// 初始化游戏
await game.initialize(gameConfig, customMode);
```

---

## 配置游戏模式

### 使用配置模板

```typescript
import { GameModeRegistry } from '@/modules/game/core/config';

const registry = GameModeRegistry.getInstance();

// 加载所有预配置
registry.loadAllConfigurations();

// 或加载特定游戏配置
registry.loadConfiguration('arithmetic');

// 获取游戏支持的模式
const supportedModes = registry.getSupportedModes('arithmetic');

// 创建游戏模式
const mode = await registry.createGameMode(
  'arithmetic',
  GameModeType.SINGLE_PLAYER
);
```

### 添加自定义配置

```typescript
import { GameModeRegistry, GameModeMapping } from '@/modules/game/core/config';

const registry = GameModeRegistry.getInstance();

const customConfig: GameModeMapping = {
  gameId: 'my-custom-game',
  supportedModes: [GameModeType.SINGLE_PLAYER, GameModeType.TEAM],
  modeConfigs: {
    [GameModeType.SINGLE_PLAYER]: {
      maxPlayers: 1,
      supportAI: true,
      timeLimit: 300,
    },
    [GameModeType.TEAM]: {
      maxPlayers: 6,
      supportAI: false,
      timeLimit: 600,
      teamCount: 3,
    },
  },
};

registry.addConfiguration(customConfig);
```

---

## API参考

### IGameCore 接口

```typescript
interface IGameCore {
  initialize(config: GameConfig, gameMode: IGameMode): Promise<void>;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  update(delta: number): void;
  render(): void;
  handleInput(input: any): void;
  executeRule(action: any): boolean;
  checkWinCondition(): boolean;
  checkLoseCondition(): boolean;
  getGameState(): GameState;
  getGameConfig(): GameConfig;
  getGameMode(): IGameMode;
  setGameMode(gameMode: IGameMode): void;
  getScoringService(): IScoringService;
  getStorageService(): IStorageService;
  getNetworkService(): INetworkService;
  getPlayerStateService(): IPlayerStateService;
  getEventBusService(): IEventBusService;
  saveGame(): Promise<boolean>;
  loadGame(): Promise<boolean>;
  on(eventType: string, callback: (data: any) => void): void;
  off(eventType: string, callback: (data: any) => void): void;
  emit(event: GameEvent): void;
  getStatistics(): Record<string, any>;
  reset(): void;
  cleanup(): void;
}
```

### IGameMode 接口

```typescript
interface IGameMode {
  initialize(config: GameModeConfig): Promise<void>;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  addPlayer(player: Player): boolean;
  removePlayer(playerId: string): boolean;
  getPlayers(): Player[];
  getPlayer(playerId: string): Player | null;
  updatePlayer(player: Player): boolean;
  handlePlayerAction(playerId: string, action: any): boolean;
  broadcastEvent(event: GameEvent): void;
  sendMessageToPlayer(playerId: string, message: any): void;
  getModeType(): GameModeType;
  getModeConfig(): GameModeConfig;
  validateAction(playerId: string, action: any): boolean;
  getCurrentTurnPlayerId(): string | null;
  nextTurn(): string | null;
  canStartGame(): boolean;
  getStatistics(): Record<string, any>;
  on(eventType: string, callback: (data: any) => void): void;
  off(eventType: string, callback: (data: any) => void): void;
  emit(eventType: string, data: any): void;
}
```

### 游戏事件类型

```typescript
enum GameEventType {
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  GAME_PAUSE = 'game_pause',
  GAME_RESUME = 'game_resume',
  PLAYER_ACTION = 'player_action',
  TURN_CHANGE = 'turn_change',
  SCORE_CHANGE = 'score_change',
  LIVES_CHANGE = 'lives_change',
  STATE_SYNC = 'state_sync',
  ERROR = 'error',
}
```

---

## 最佳实践

### 1. 事件驱动通信

使用事件总线进行模块间通信，避免直接依赖：

```typescript
// ❌ 不推荐：直接调用
gameMode.handleAction(action);

// ✅ 推荐：通过事件
game.emit('player_action', {
  playerId: 'player1',
  action,
  timestamp: Date.now(),
});
```

### 2. 依赖注入

通过构造函数或初始化方法注入依赖：

```typescript
// ✅ 推荐
constructor(private scoringService: ScoringService) {
  this.scoringService = scoringService;
}

async initialize(config: GameConfig, gameMode: IGameMode): Promise<void> {
  this.gameMode = gameMode;
  // ...
}
```

### 3. 资源清理

在 `cleanup()` 方法中清理所有资源：

```typescript
protected onCleanup(): void {
  // 清理定时器
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }

  // 清理事件监听
  this.eventBusService.clear();

  // 清理网络连接
  if (this.networkService) {
    this.networkService.disconnect();
  }
}
```

### 4. 错误处理

使用 try-catch 处理异步错误：

```typescript
async start(): Promise<void> {
  try {
    await this.initialize();
    this.gameMode.start();
  } catch (error) {
    console.error('Failed to start game:', error);
    this.emit('error', { error });
    throw error;
  }
}
```

### 5. 配置驱动

使用配置文件管理游戏参数：

```typescript
// game.config.ts
export const GAME_CONFIG = {
  arithmetic: {
    gameId: 'arithmetic',
    maxPlayers: 2,
    supportAI: true,
    aiDifficulty: 'medium',
    responseDelay: 2000,
  },
};

// 使用
import { GAME_CONFIG } from './game.config';
const config = GAME_CONFIG.arithmetic;
```

---

## 常见问题

### Q: 如何切换游戏模式？

```typescript
const currentMode = game.getGameMode();
const newMode = await modeManager.createModeForGame(
  'my-game',
  GameModeType.ONLINE_BATTLE
);

// 暂停当前模式
currentMode.pause();

// 切换到新模式
game.setGameMode(newMode);
newMode.start();

// 或者使用模式管理器
await modeManager.switchMode(
  'my-game',
  currentMode.getModeType(),
  GameModeType.ONLINE_BATTLE
);
```

### Q: 如何保存和加载游戏进度？

```typescript
// 保存游戏
const saved = await game.saveGame();
console.log('Game saved:', saved);

// 加载游戏
const loaded = await game.loadGame();
console.log('Game loaded:', loaded);
```

### Q: 如何自定义AI行为？

```typescript
import { SinglePlayerMode, AIDifficulty } from '@/modules/game/core';

const mode = new SinglePlayerMode(config, {
  difficulty: AIDifficulty.HARD,
  responseDelay: 1000,
  errorRate: 0.1,
});

// 或在运行时调整
mode.setAIDifficulty(AIDifficulty.EXPERT);
```

### Q: 如何处理网络断线？

```typescript
import { OnlineBattleMode } from '@/modules/game/core';

const mode = new OnlineBattleMode(config);

mode.on('network_error', (error) => {
  console.error('Network error:', error);
  // 提示用户重连
});

mode.on('network_reconnected', () => {
  console.log('Reconnected to server');
  // 恢复游戏
});
```

### Q: 如何调试游戏？

```typescript
// 启用服务日志
const eventBus = new EventBusService({ enableLogging: true });

// 获取统计信息
console.log(game.getStatistics());
console.log(game.getGameMode().getStatistics());
console.log(game.getScoringService().getStatistics());
```

---

## 示例项目

完整的示例代码请参考：
- `ArithmeticGameV2.ts` - 算数游戏示例
- `SinglePlayerMode.ts` - 单机模式示例
- `LocalBattleMode.ts` - 本地对抗模式示例

---

## 更新日志

- **v2.0.0** - 初始版本，实现完整的分层架构
- 后续版本将添加更多功能和优化

---

## 贡献指南

欢迎贡献代码和提出建议！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

---

## 许可证

本项目采用 MIT 许可证。
