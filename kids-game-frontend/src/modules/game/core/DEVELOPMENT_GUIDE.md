# 游戏开发规范

本文档定义了使用游戏架构系统开发游戏时的编码规范和最佳实践。

## 目录

1. [代码组织](#代码组织)
2. [命名规范](#命名规范)
3. [类型定义](#类型定义)
4. [错误处理](#错误处理)
5. [性能优化](#性能优化)
6. [测试规范](#测试规范)
7. [文档规范](#文档规范)

---

## 代码组织

### 文件结构

```
src/modules/game/
├── core/                 # 核心模块
│   ├── interfaces/       # 接口定义
│   ├── services/         # 服务实现
│   ├── modes/           # 模式实现
│   ├── manager/         # 管理器
│   ├── config/          # 配置
│   └── index.ts         # 导出
├── arithmetic/          # 算数游戏
│   ├── ArithmeticGame.ts
│   ├── ArithmeticGameV2.ts
│   └── index.ts
├── puzzle/              # 消消乐游戏
│   ├── PuzzleGame.ts
│   └── index.ts
└── battle/              # 对战游戏
    ├── BattleGameBase.ts
    └── index.ts
```

### 导入顺序

```typescript
// 1. 核心框架和外部库
import Phaser from 'phaser';
import { ref, computed } from 'vue';

// 2. 核心模块接口
import {
  IGameCore,
  GameConfig,
  GameEventType,
} from '@/modules/game/core/interfaces';

// 3. 核心模块服务
import {
  EventBusService,
  ScoringService,
} from '@/modules/game/core/services';

// 4. 核心模块模式
import {
  BaseGameMode,
  SinglePlayerMode,
} from '@/modules/game/core/modes';

// 5. 核心模块管理器
import { ModeManager } from '@/modules/game/core/manager';

// 6. 相关的游戏模块
import { ArithmeticGame } from './ArithmeticGame';

// 7. 工具函数和类型
import type { Player } from '@/modules/game/core/interfaces';
```

### 文件命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 接口 | 大驼峰，以 I 开头 | `IGameCore.ts` |
| 类 | 大驼峰 | `GameCoreAdapter.ts` |
| 服务 | 大驼峰，以 Service 结尾 | `EventBusService.ts` |
| 模式 | 大驼峰，以 Mode 结尾 | `SinglePlayerMode.ts` |
| 工具 | 小驼峰 | `gameUtils.ts` |
| 常量 | 大驼峰或大写下划线 | `GAME_CONFIG` 或 `GameConfig` |
| 类型 | 大驼峰 | `GameState.ts` |

---

## 命名规范

### 变量和函数

```typescript
// ✅ 推荐：使用有意义的名称
const playerScore = 10;
function calculateScore(action: any): number { }

// ❌ 不推荐：使用缩写或无意义名称
const ps = 10;
function calc(a: any): number { }
```

### 常量

```typescript
// ✅ 推荐：全大写下划线
const MAX_PLAYERS = 4;
const DEFAULT_TIME_LIMIT = 300;
const API_BASE_URL = 'http://localhost:8080';

// 或使用 const 对象
const GameConstants = {
  MAX_PLAYERS: 4,
  DEFAULT_TIME_LIMIT: 300,
};
```

### 私有成员

```typescript
// ✅ 推荐：使用 # 或 _ 前缀
class Game {
  private #internalState: any;
  private _config: GameConfig;

  private processInternal(): void {
    this.#internalState = {};
  }
}
```

### 事件名称

```typescript
// ✅ 推荐：使用下划线分隔的动词_名词格式
const GAME_EVENTS = {
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  PLAYER_ACTION: 'player_action',
  SCORE_CHANGE: 'score_change',
};

game.emit(GAME_EVENTS.PLAYER_ACTION, { action });
```

---

## 类型定义

### 接口 vs 类型别名

```typescript
// ✅ 推荐：使用接口定义对象形状
interface Player {
  id: string;
  name: string;
  score: number;
}

// ✅ 推荐：使用类型别名定义联合类型、映射类型
type PlayerId = string;
type Score = number;
type PlayerMap = Record<string, Player>;
```

### 泛型

```typescript
// ✅ 推荐：使用泛型提高复用性
interface Repository<T> {
  get(id: string): T | null;
  save(entity: T): void;
}

class PlayerRepository implements Repository<Player> {
  get(id: string): Player | null { }
  save(entity: Player): void { }
}
```

### 可选属性

```typescript
// ✅ 推荐：明确标记可选属性
interface GameConfig {
  gameId: string;
  gameName: string;
  maxPlayers: number;
  timeLimit?: number;  // 可选
  customConfig?: Record<string, any>;
}
```

### 只读属性

```typescript
// ✅ 推荐：使用 readonly 保护不可变属性
interface GameConfig {
  readonly gameId: string;      // 只读
  readonly gameName: string;    // 只读
  version: string;              // 可修改
}

const config: GameConfig = {
  gameId: 'my-game',
  gameName: 'My Game',
  version: '1.0.0',
};

// config.gameId = 'new-game';  // 编译错误
```

---

## 错误处理

### 异步错误

```typescript
// ✅ 推荐：使用 try-catch 处理异步错误
async initializeGame(): Promise<void> {
  try {
    await this.initialize();
    await this.loadGame();
  } catch (error) {
    console.error('Failed to initialize game:', error);
    this.emit('error', { error });
    throw new GameInitializationError(error);
  }
}
```

### 自定义错误类

```typescript
// ✅ 推荐：定义自定义错误类
class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GameError';
  }
}

class NetworkError extends GameError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

// 使用
try {
  await networkService.connect();
} catch (error) {
  if (error instanceof NetworkError) {
    // 处理网络错误
  }
  throw error;
}
```

### 验证错误

```typescript
// ✅ 推荐：验证输入参数
function addPlayer(player: Player): boolean {
  if (!player.id || !player.name) {
    throw new Error('Invalid player: missing required fields');
  }

  if (player.id.length > 50) {
    throw new Error('Invalid player: id too long');
  }

  // 添加玩家逻辑
  return true;
}
```

---

## 性能优化

### 事件监听

```typescript
// ❌ 不推荐：每次都添加监听器
function handleInput(input: any) {
  game.on('input', this.processInput);
}

// ✅ 推荐：在初始化时添加监听器
constructor() {
  this.setupEventListeners();
}

private setupEventListeners(): void {
  game.on('input', this.processInput);
  game.on('score_change', this.updateScoreDisplay);
}
```

### 防抖和节流

```typescript
// ✅ 推荐：对频繁触发的事件使用防抖/节流
import { debounce, throttle } from 'lodash-es';

// 防抖：延迟执行
const debouncedSave = debounce(() => {
  this.saveGame();
}, 1000);

game.on('state_change', debouncedSave);

// 节流：限制执行频率
const throttledUpdate = throttle((delta: number) => {
  this.update(delta);
}, 100);

game.on('tick', throttledUpdate);
```

### 对象池

```typescript
// ✅ 推荐：使用对象池复用对象
class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize: number = 10) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  get(): T {
    return this.pool.pop() || this.factory();
  }

  release(obj: T): void {
    this.pool.push(obj);
  }
}

// 使用
const bulletPool = new ObjectPool(() => new Bullet());
const bullet = bulletPool.get();
// 使用 bullet
bulletPool.release(bullet);
```

### 懒加载

```typescript
// ✅ 推荐：延迟加载大型资源
class Game {
  private _heavyResource: any = null;

  get heavyResource(): any {
    if (!this._heavyResource) {
      this._heavyResource = this.loadHeavyResource();
    }
    return this._heavyResource;
  }

  private loadHeavyResource(): any {
    // 加载大型资源
  }
}
```

---

## 测试规范

### 单元测试

```typescript
// ✅ 推荐：为每个服务编写单元测试
import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringService } from './ScoringService';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
    service.initialize({
      initialScore: 0,
      scorePerAction: 10,
      scorePenalty: 5,
      enableMultiplier: false,
      multiplierRules: [],
    });
  });

  it('should add score to player', () => {
    service.addScore('player1', 10);
    expect(service.getPlayerScore('player1')).toBe(10);
  });

  it('should deduct score from player', () => {
    service.addScore('player1', 20);
    service.deductScore('player1', 5);
    expect(service.getPlayerScore('player1')).toBe(15);
  });

  it('should return correct ranking', () => {
    service.addScore('player1', 100);
    service.addScore('player2', 200);
    service.addScore('player3', 150);

    const ranking = service.getRanking();
    expect(ranking).toEqual(['player2', 'player3', 'player1']);
  });
});
```

### 集成测试

```typescript
// ✅ 推荐：测试多个组件的协作
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameCoreAdapter } from './GameCoreAdapter';
import { SinglePlayerMode } from './SinglePlayerMode';

describe('Game Integration', () => {
  let game: GameCoreAdapter;
  let mode: SinglePlayerMode;

  beforeEach(async () => {
    mode = new SinglePlayerMode();
    await mode.initialize({
      modeType: GameModeType.SINGLE_PLAYER,
      modeName: 'Single Player',
      maxPlayers: 2,
      supportAI: true,
    });

    game = new MyGame('test-container');
    await game.initialize(gameConfig, mode);
  });

  afterEach(() => {
    game.cleanup();
    mode.cleanup();
  });

  it('should start and stop game', async () => {
    game.start();
    expect(game.getGameState().isRunning).toBe(true);

    game.stop();
    expect(game.getGameState().isRunning).toBe(false);
  });

  it('should handle player actions correctly', async () => {
    game.start();

    const result = game.executeRule({ action: 'move' });
    expect(result).toBe(true);

    const score = game.getScoringService().getPlayerScore('player1');
    expect(score).toBeGreaterThan(0);
  });
});
```

---

## 文档规范

### JSDoc 注释

```typescript
// ✅ 推荐：为公共 API 添加 JSDoc 注释
/**
 * 添加玩家分数
 *
 * @param playerId - 玩家唯一标识
 * @param points - 要增加的分数
 *
 * @throws {Error} 如果玩家不存在
 *
 * @example
 * ```typescript
 * scoringService.addScore('player1', 10);
 * ```
 */
addScore(playerId: string, points: number): void {
  // 实现代码
}
```

### 类和接口注释

```typescript
/**
 * 计分服务
 *
 * 提供分数管理、排名、历史记录等功能
 *
 * @example
 * ```typescript
 * const service = new ScoringService();
 * service.initialize(config);
 * service.addScore('player1', 10);
 * ```
 */
export class ScoringService implements IScoringService {
  // 实现代码
}

/**
 * 玩家信息接口
 *
 * 定义玩家的基本属性和状态
 */
export interface Player {
  /** 玩家唯一标识 */
  id: string;

  /** 玩家名称 */
  name: string;

  /** 玩家分数 */
  score: number;

  /** 玩家生命值 */
  lives: number;

  /** 玩家是否准备就绪 */
  isReady: boolean;
}
```

### 文件头注释

```typescript
/**
 * 游戏核心适配器
 *
 * 提供游戏核心接口的默认实现，作为游戏开发的基类
 *
 * @module game/core
 * @author Your Name
 * @since 2.0.0
 * @see {@link GAME_ARCHITECTURE_GUIDE.md} 完整文档
 */

import { IGameCore } from './interfaces';

// 实现代码
```

---

## 最佳实践总结

1. **保持简洁**：避免过度设计，优先简单直接的实现
2. **单一职责**：每个类和函数只做一件事
3. **接口隔离**：使用细粒度的接口，避免臃肿的接口
4. **依赖注入**：通过构造函数注入依赖，提高可测试性
5. **错误处理**：正确处理异步错误和异常情况
6. **性能优化**：合理使用防抖、节流、对象池等技术
7. **编写测试**：为关键逻辑编写单元测试和集成测试
8. **完善文档**：为公共 API 添加详细的文档注释

---

## 相关资源

- [游戏架构使用指南](./GAME_ARCHITECTURE_GUIDE.md)
- [TypeScript 编码规范](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Phaser 游戏框架](https://photonstorm.github.io/phaser3-docs/)
