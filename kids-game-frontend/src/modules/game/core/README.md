# 可复用可扩展游戏玩法模式架构

## 项目概述

本项目实现了一套**分层解耦、接口驱动**的游戏架构，通过策略化设计实现网页小游戏玩法模式的**复用性、动态扩展**，让每个游戏自动支持多模式。

## 核心特性

### ✅ 已实现功能

1. **抽象契约层** - 定义所有模块的通用接口
2. **公共服务层** - 计分、存储、通信、玩家状态管理、事件总线
3. **玩法模式层** - 单机、本地对抗、组队、网络对抗四种模式
4. **模式管理与适配层** - 模式注册表、动态绑定、配置驱动
5. **游戏核心适配器** - 为游戏开发提供基类
6. **配置管理** - 预定义的游戏-模式映射配置

### 📁 项目结构

```
kids-game-frontend/src/modules/game/core/
├── interfaces/              # 抽象契约层
│   ├── GameCoreInterface.ts      # 游戏核心接口
│   ├── GameModeInterface.ts      # 玩法模式接口
│   ├── ServiceInterface.ts       # 公共服务接口
│   ├── IGameCore.ts              # 游戏核心接口定义
│   └── index.ts
│
├── services/               # 公共服务层
│   ├── EventBusService.ts       # 事件总线服务
│   ├── ScoringService.ts        # 计分服务
│   ├── StorageService.ts        # 存储服务
│   ├── PlayerStateService.ts    # 玩家状态服务
│   ├── NetworkService.ts        # 网络服务
│   └── index.ts
│
├── modes/                 # 玩法模式层
│   ├── BaseGameMode.ts          # 模式基类
│   ├── SinglePlayerMode.ts      # 单机模式
│   ├── LocalBattleMode.ts       # 本地对抗模式
│   ├── TeamMode.ts              # 组队模式
│   ├── OnlineBattleMode.ts      # 网络对抗模式
│   └── index.ts
│
├── manager/               # 模式管理与适配层
│   ├── ModeManager.ts           # 模式管理器
│   └── index.ts
│
├── config/                # 配置管理
│   └── GameModeRegistry.ts      # 游戏模式注册表
│
├── GameCoreAdapter.ts     # 游戏核心适配器
├── GAME_ARCHITECTURE_GUIDE.md  # 架构使用指南
├── DEVELOPMENT_GUIDE.md        # 开发规范
└── README.md              # 本文档
```

## 架构设计

### 分层架构图

```
┌─────────────────────────────────────────┐
│         游戏核心层 (Game Core)           │
│  专注游戏规则：胜负判定、消除逻辑等       │
│  例如：算数游戏、消消乐、对战游戏        │
└──────────────┬──────────────────────────┘
               │ 依赖
               ├───────────────────────────────┐
               │                               │
┌──────────────▼──────────┐      ┌──────────▼──────────────────────┐
│     玩法模式层             │      │      公共服务层                  │
│  单机/本地/组队/网络      │      │  计分/存储/通信/玩家状态/事件总线  │
│  可插拔的策略组件         │      │  全局复用的通用能力               │
└──────────────┬──────────┘      └──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────┐
│                    抽象契约层 (Interfaces)                            │
│           定义所有模块必须遵守的接口和抽象类                          │
└─────────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────┐
│              模式管理与适配层 (Manager & Registry)                     │
│           模式注册表、动态绑定、配置驱动                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 核心设计原则

#### 1. 组合优于继承

- 游戏核心不继承任何模式类，而是通过**依赖注入**将模式实例"组合"到游戏中
- 效果：同一模式可被所有游戏复用，同一游戏可组合任意模式

#### 2. 事件驱动解耦

- 游戏层与模式层通过**事件总线**交互，而非直接调用
- 优势：修改模式逻辑无需改动游戏核心

#### 3. 配置化与注册制

- 每种模式的参数通过配置文件管理，游戏加载时动态读取
- 新增模式/游戏时，仅需实现接口并注册，无需修改现有代码

#### 4. 职责单一化

- 游戏层：只管"游戏规则"
- 模式层：只管"对战/交互规则"
- 公共服务层：只管"通用能力"

## 快速开始

### 1. 使用模式管理器

```typescript
import { ModeManager, GameModeType } from '@/modules/game/core';

const modeManager = ModeManager.getInstance();

// 查看已注册的模式
console.log(modeManager.getRegisteredModes());

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
```

### 2. 创建游戏

```typescript
import { ArithmeticGameV2 } from '@/modules/game/arithmetic/ArithmeticGameV2';

const game = new ArithmeticGameV2('game-container');

// 初始化游戏
await game.initialize(gameConfig, singlePlayerMode);

// 启动游戏
game.start();
```

### 3. 订阅游戏事件

```typescript
game.on('game_start', (data) => {
  console.log('Game started!', data);
});

game.on('score_change', (data) => {
  console.log('Score changed:', data);
});

game.on('player_action', (data) => {
  console.log('Player action:', data);
});
```

## 开发新游戏

### 步骤1：继承 GameCoreAdapter

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
    // 游戏更新逻辑
  }

  protected onRender(): void {
    // 游戏渲染逻辑
  }

  protected onHandleInput(input: any): void {
    // 输入处理逻辑
  }

  protected onExecuteRule(action: any): boolean {
    // 游戏规则执行
    return true;
  }

  protected onCheckWinCondition(): boolean {
    // 胜利条件检查
    return false;
  }

  protected onCheckLoseCondition(): boolean {
    // 失败条件检查
    return false;
  }

  protected onReset(): void {
    // 游戏重置
  }

  protected onCleanup(): void {
    // 资源清理
  }
}
```

### 步骤2：配置游戏模式

```typescript
import { ModeManager, GameModeType } from '@/modules/game/core';

const modeManager = ModeManager.getInstance();

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

## 添加新玩法模式

### 步骤1：继承 BaseGameMode

```typescript
import { BaseGameMode, GameModeConfig, GameModeType } from '@/modules/game/core';

export class MyCustomMode extends BaseGameMode {
  constructor(config?: Partial<GameModeConfig>) {
    super({
      ...config,
      modeType: GameModeType.CAMPAIGN,
      modeName: 'My Custom Mode',
      maxPlayers: 4,
      supportAI: false,
    });
  }

  handlePlayerAction(playerId: string, action: any): boolean {
    const result = super.handlePlayerAction(playerId, action);
    // 添加自定义逻辑
    return result;
  }
}
```

### 步骤2：注册新模式

```typescript
import { ModeManager } from '@/modules/game/core';

const modeManager = ModeManager.getInstance();

modeManager.registerMode({
  modeType: GameModeType.CAMPAIGN,
  modeName: 'Campaign Mode',
  factory: (config) => new MyCustomMode(config),
});
```

## 核心组件说明

### 1. 游戏核心接口 (IGameCore)

定义所有游戏必须实现的生命周期和核心能力：
- 初始化、启停、暂停、恢复
- 游戏规则执行、胜负条件校验
- 事件发布

### 2. 玩法模式接口 (IGameMode)

定义所有模式通用的交互/对战规则：
- 玩家管理、回合/交互控制
- 通信适配、模式特有配置

### 3. 公共服务

- **EventBusService** - 事件总线，实现模块间解耦通信
- **ScoringService** - 计分管理、排名、历史记录
- **StorageService** - 统一存储接口，支持多种后端
- **PlayerStateService** - 玩家生命周期管理
- **NetworkService** - WebSocket 通信、自动重连

### 4. 玩法模式

- **SinglePlayerMode** - 单机模式，处理 AI 对手逻辑
- **LocalBattleMode** - 本地对抗模式，处理多玩家本地输入同步
- **TeamMode** - 组队模式，处理团队分组、组队匹配
- **OnlineBattleMode** - 网络对抗模式，处理 WebSocket 通信

### 5. 模式管理器 (ModeManager)

- 模式注册、加载、切换
- 游戏与模式的动态绑定
- 配置驱动

## 使用场景示例

### 场景1：算数游戏支持单机和网络对战

```typescript
// 单机模式
const singleMode = await modeManager.createModeForGame(
  'arithmetic',
  GameModeType.SINGLE_PLAYER
);

// 网络对战模式
const onlineMode = await modeManager.createModeForGame(
  'arithmetic',
  GameModeType.ONLINE_BATTLE,
  { roomId: 'room_123' }
);

// 切换模式
await modeManager.switchMode(
  'arithmetic',
  GameModeType.SINGLE_PLAYER,
  GameModeType.ONLINE_BATTLE
);
```

### 场景2：为对战游戏添加组队模式

```typescript
// 注册组队模式
modeManager.registerMode({
  modeType: GameModeType.TEAM,
  modeName: 'Team Battle',
  factory: (config) => new TeamMode(config),
});

// 配置对战游戏支持组队模式
modeManager.registerGameModeMapping({
  gameId: 'battle',
  supportedModes: [GameModeType.LOCAL_BATTLE, GameModeType.ONLINE_BATTLE, GameModeType.TEAM],
  modeConfigs: {
    [GameModeType.TEAM]: {
      maxPlayers: 4,
      teamCount: 2,
    },
  },
});
```

## 优势总结

### ✅ 复用性

- 同一模式可被多个游戏复用
- 游戏无需重复实现模式逻辑
- 公共服务层避免代码重复

### ✅ 扩展性

- 新增游戏：只需实现 `IGameCore` 接口
- 新增模式：只需实现 `IGameMode` 接口并注册
- 配置驱动，无需修改现有代码

### ✅ 可维护性

- 清晰的分层结构
- 职责单一化
- 事件驱动解耦
- 完善的类型定义

### ✅ 灵活性

- 游戏可动态切换模式
- 模式可配置化调整
- 支持组合多种模式

## 文档

- **[游戏架构使用指南](./GAME_ARCHITECTURE_GUIDE.md)** - 详细的 API 使用说明和示例
- **[开发规范](./DEVELOPMENT_GUIDE.md)** - 编码规范和最佳实践
- **[TypeScript 接口定义](./interfaces/)** - 完整的接口文档
- **[服务实现](./services/)** - 服务使用说明
- **[模式实现](./modes/)** - 模式使用说明

## 示例项目

- **ArithmeticGameV2.ts** - 算数游戏示例，展示如何适配新架构
- **SinglePlayerMode.ts** - 单机模式示例
- **LocalBattleMode.ts** - 本地对抗模式示例
- **OnlineBattleMode.ts** - 网络对抗模式示例
- **TeamMode.ts** - 组队模式示例

## 未来扩展

计划支持的模式：

- **闯关模式** (Campaign) - 多关卡挑战
- **天梯模式** (Ranked) - 排名匹配对战
- **锦标赛模式** (Tournament) - 淘汰赛制
- **合作模式** (Cooperative) - 玩家协作完成任务

## 贡献指南

欢迎贡献代码和提出建议！

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

---

**作者**：AI Assistant  
**版本**：2.0.0  
**最后更新**：2026-03-07
