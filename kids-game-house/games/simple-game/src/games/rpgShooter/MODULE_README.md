# RPG Shooter 模块化系统

## 📚 概述

这是一个将RPG Shooter游戏重构为模块化架构的项目。通过将代码拆分为多个职责单一的模块，提高了代码的可维护性、可测试性和可扩展性。

## 🎯 设计理念

### 单一职责原则
每个模块只负责一个功能领域：
- `config.ts` - 配置管理
- `types.ts` - 类型定义
- `state.ts` - 状态管理
- `player.ts` - 玩家逻辑
- `bullets.ts` - 子弹系统
- `enemies.ts` - 敌人系统
- `powerups.ts` - 道具系统
- `particles.ts` - 粒子特效
- `collision.ts` - 碰撞检测
- `rendering.ts` - 渲染逻辑
- `input.ts` - 输入处理

### 数据驱动
所有游戏逻辑通过操作 `GameState` 对象进行，避免了全局变量和副作用。

### 纯函数优先
大多数函数都是纯函数，接收状态作为参数，返回新状态或修改传入的状态。

## 🚀 快速开始

### 1. 导入模块

```typescript
import {
  GAME_CONFIG,
  createInitialState,
  updatePlayer,
  shoot,
  levelUp
} from './rpgShooter';
```

### 2. 初始化游戏

```typescript
// 创建初始状态
const state = createInitialState();

// 获取canvas上下文
const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
```

### 3. 游戏循环

```typescript
let lastTime = Date.now();

function gameLoop() {
  const now = Date.now();
  const dt = now - lastTime;
  lastTime = now;
  
  // 更新逻辑
  update(state, dt);
  
  // 渲染画面
  render(ctx, state);
  
  requestAnimationFrame(gameLoop);
}

gameLoop();
```

### 4. 更新函数示例

```typescript
function update(state: GameState, dt: number) {
  if (state.gameEnded) return;
  
  // 更新玩家
  updatePlayer(state, dt);
  
  // 自动射击
  if (state.gameStarted) {
    shoot(state);
  }
  
  // 更新子弹
  updatePlayerBullets(state, dt);
  updateEnemyBullets(state, dt);
  
  // 更新其他系统...
}
```

## 📖 API 参考

### 配置模块 (config.ts)

```typescript
// 游戏常量
GAME_CONFIG.CANVAS_WIDTH      // 画布宽度: 400
GAME_CONFIG.CANVAS_HEIGHT     // 画布高度: 600
GAME_CONFIG.GAME_DURATION     // 游戏时长: 120秒
GAME_CONFIG.PLAYER_SPEED      // 玩家速度: 4.5
GAME_CONFIG.BULLET_SPEED      // 子弹速度: 8

// 等级属性
LEVEL_STATS[0]  // Lv1: { hp: 6, atk: 1, speed: 4.5 }
LEVEL_STATS[9]  // Lv10: { hp: 32, atk: 11, speed: 7 }

// 敌人类型
ENEMY_TYPES[0]  // Circle敌人
ENEMY_TYPES[3]  // Boss敌人
```

### 状态模块 (state.ts)

```typescript
// 创建初始状态
const state = createInitialState();

// 重置状态（重新开始游戏）
resetState(state);
```

### 玩家模块 (player.ts)

```typescript
// 初始化玩家属性
initPlayerStats(state);

// 玩家升级
levelUp(state);

// 更新玩家位置
updatePlayer(state, dt);

// 玩家受伤
playerHit(state, damage);
```

### 子弹模块 (bullets.ts)

```typescript
// 玩家射击
shoot(state);

// 更新玩家子弹
updatePlayerBullets(state, dt);

// 生成敌人弹幕
spawnEnemyBullet(state, enemy);

// 更新敌人子弹
updateEnemyBullets(state, dt);
```

## 🔧 扩展示例

### 添加新武器类型

```typescript
// 在 config.ts 中添加
export const WEAPONS = {
  normal: { cd: 200, damage: 1, color: '#00E5FF' },
  shotgun: { cd: 400, damage: 1, color: '#FFD700', count: 5 },
  laser: { cd: 100, damage: 0.5, color: '#FF4757', piercing: true }
};

// 在 bullets.ts 中实现
export function shootWithWeapon(state: GameState, weaponType: string) {
  const weapon = WEAPONS[weaponType];
  // 实现射击逻辑...
}
```

### 添加新敌人类型

```typescript
// 在 config.ts 中添加
export const NEW_ENEMY_TYPE = {
  w: 30, h: 30, hp: 5, score: 50, exp: 30,
  color: '#00FF00', shape: 'new_shape', speedMult: 1.0
};

// 在 enemies.ts 中实现特殊行为
function updateNewEnemy(enemy: Enemy, state: GameState) {
  // 实现特殊AI逻辑...
}
```

### 添加新道具

```typescript
// 在 powerups.ts 中添加
export function useNewPowerup(state: GameState) {
  // 实现道具效果
  state.floatTexts.push({
    text: '✨ 新道具!',
    x: state.playerX,
    y: state.playerY - 40,
    life: 2,
    color: '#FFD700',
    size: 24
  });
}
```

## 🎨 最佳实践

### 1. 状态不可变性（推荐）

```typescript
// ✅ 好的做法：创建新对象
const newState = { ...state, playerHP: state.playerHP - 1 };

// ⚠️ 也可以直接修改（当前实现方式）
state.playerHP -= 1;
```

### 2. 模块间通信

```typescript
// ✅ 通过状态传递数据
function moduleA(state: GameState) {
  state.sharedData = 'value';
}

function moduleB(state: GameState) {
  console.log(state.sharedData);
}
```

### 3. 错误处理

```typescript
// ✅ 添加边界检查
export function safeUpdate(state: GameState, dt: number) {
  if (!state || dt < 0) return;
  
  // 正常更新逻辑...
}
```

## 📊 性能优化建议

### 1. 对象池

对于频繁创建销毁的对象（子弹、粒子），使用对象池：

```typescript
const bulletPool: PlayerBullet[] = [];

function getBullet(): PlayerBullet {
  return bulletPool.pop() || { /* 创建新对象 */ };
}

function releaseBullet(bullet: PlayerBullet) {
  bulletPool.push(bullet);
}
```

### 2. 空间分区

对于大量敌人的碰撞检测，使用网格或四叉树优化。

### 3. 渲染优化

- 只在可见区域渲染
- 合并相同颜色的绘制调用
- 使用离屏canvas缓存静态元素

## 🧪 测试

### 单元测试示例

```typescript
import { createInitialState } from './state';
import { levelUp } from './player';

describe('Player Level Up', () => {
  it('should increase player level', () => {
    const state = createInitialState();
    const initialLevel = state.playerLevel;
    
    levelUp(state);
    
    expect(state.playerLevel).toBe(initialLevel + 1);
  });
  
  it('should restore HP to max', () => {
    const state = createInitialState();
    state.playerHP = 1; // 低血量
    
    levelUp(state);
    
    expect(state.playerHP).toBe(state.playerMaxHP);
  });
});
```

## 🤝 贡献指南

1. 新增功能时，创建对应的模块文件
2. 在 `index.ts` 中导出新功能
3. 更新本文档的API参考
4. 添加单元测试
5. 确保TypeScript类型检查通过

## 📝 待办事项

- [ ] 完成 enemies.ts 模块
- [ ] 完成 powerups.ts 模块
- [ ] 完成 particles.ts 模块
- [ ] 完成 collision.ts 模块
- [ ] 完成 rendering.ts 模块
- [ ] 完成 input.ts 模块
- [ ] 添加完整的单元测试
- [ ] 性能分析和优化
- [ ] 编写更多使用示例

## 📄 许可证

本项目遵循原项目的许可证。

---

**最后更新**: 2026-05-04
**版本**: 1.0.0
