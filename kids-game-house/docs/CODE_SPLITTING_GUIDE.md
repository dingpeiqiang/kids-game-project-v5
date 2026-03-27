# 📦 游戏代码拆分与组织指南

**版本**: v1.0  
**最后更新**: 2026-03-27  
**适用范围**: 所有基于本框架开发的游戏项目

---

## 🎯 核心原则

### 一句话总结

> **单个文件不超过 600 行，按功能模块拆分，保持高内聚低耦合。**

---

## 📊 代码量控制标准

### 文件行数限制

| 等级 | 行数范围 | 处理建议 |
|------|---------|---------|
| 🟢 **优秀** | <400 行 | 保持现状，无需优化 |
| ✅ **良好** | 400-600 行 | 可以接受，关注是否需拆分 |
| 🟡 **警告** | 600-800 行 | 建议拆分，提升可维护性 |
| 🔴 **需重构** | >800 行 | **必须拆分**，否则影响协作 |

### 函数/类大小限制

| 类型 | 限制 | 说明 |
|------|------|------|
| **函数** | <50 行 | 每个函数只做一件事 |
| **方法** | <30 行 | 类中的方法应更精简 |
| **类** | <300 行 | 每个类只负责一个功能模块 |
| **组件** | <500 行 | Vue 组件模板 + 脚本总行数 |

---

## 🏗️ 推荐的文件结构

### 飞机大战示例

```
src/components/game/
│
├── PhaserGame.ts                    # 主框架 (<600 行)
│   ├── 可复用框架层 (1-600 行)       # 不修改
│   └── 游戏特定层 (600 行+)          # 只保留编排调用
│
├── components/                      # 组件库目录
│   ├── GTRSLoader.ts                # 主题加载器
│   ├── ScreenAdapter.ts             # 屏幕适配器
│   ├── AudioManager.ts              # 音频管理器
│   └── ItemSystem.ts                # 道具系统
│
├── renderers/                       # 🎨 渲染器目录（新增）
│   ├── PlayerRenderer.ts            # 玩家飞机渲染 (<200 行)
│   ├── EnemyRenderer.ts             # 敌机渲染 (<200 行)
│   ├── BulletRenderer.ts            # 子弹渲染 (<150 行)
│   ├── PowerupRenderer.ts           # 道具渲染 (<150 行)
│   └── index.ts                     # 统一导出
│
├── logic/                           # 🧠 游戏逻辑目录（新增）
│   ├── PlayerLogic.ts               # 玩家移动逻辑 (<200 行)
│   ├── EnemyLogic.ts                # 敌机 AI 逻辑 (<200 行)
│   ├── CollisionSystem.ts           # 碰撞检测系统 (<250 行)
│   ├── ScoreSystem.ts               # 分数系统 (<100 行)
│   └── index.ts                     # 统一导出
│
└── types/                           # 📝 类型定义目录
    ├── player.types.ts              # 玩家类型定义
    ├── enemy.types.ts               # 敌机类型定义
    ├── bullet.types.ts              # 子弹类型定义
    └── index.ts                     # 统一导出
```

---

## 🎨 按职责拆分的最佳实践

### 场景 1: 渲染逻辑拆分

#### ❌ 错误做法（所有渲染在一个文件）

```typescript
// PhaserGame.ts - 2000+ 行 😱
export class YourGamePhaserGame {
  // ... 600 行框架代码 ...
  
  private renderPlayer(player: any): void { /* 300 行 */ }
  private renderEnemy(enemy: any): void { /* 400 行 */ }
  private renderBullet(bullet: any): void { /* 200 行 */ }
  private renderPowerup(powerup: any): void { /* 150 行 */ }
  private renderExplosion(x: number, y: number): void { /* 100 行 */ }
  private renderUI(): void { /* 200 行 */ }
  // ... 还有其他渲染方法 500+ 行 ...
}
```

**问题**:
- 🔴 文件超过 2000 行，难以阅读
- 🔴 所有渲染逻辑耦合在一起
- 🔴 不同开发者修改同一文件，容易冲突
- 🔴 无法单独测试某个渲染逻辑

#### ✅ 正确做法（独立渲染器）

```typescript
// renderers/PlayerRenderer.ts
export class PlayerRenderer {
  private scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  render(player: Player): void {
    // 只负责玩家渲染，约 150 行
    const playerKey = this.getThemeAssetKey('player_ship')
    if (playerKey && this.scene.textures.exists(playerKey)) {
      // ... 渲染逻辑 ...
    }
  }
  
  private getThemeAssetKey(assetName: string): string | null {
    // ... 实现细节 ...
  }
}

// renderers/EnemyRenderer.ts
export class EnemyRenderer {
  private scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  render(enemy: Enemy): void {
    // 只负责敌机渲染，约 180 行
    const enemyKey = this.getThemeAssetKey(`enemy_${enemy.type}`)
    // ... 渲染逻辑 ...
  }
}

// renderers/BulletRenderer.ts
export class BulletRenderer {
  // ... 只负责子弹渲染，约 120 行
}

// PhaserGame.ts - 清爽的编排调用
export class YourGamePhaserGame {
  private playerRenderer: PlayerRenderer
  private enemyRenderer: EnemyRenderer
  private bulletRenderer: BulletRenderer
  
  private renderAll(): void {
    // 职责清晰，只有调用
    this.playerRenderer.render(this.currentPlayer)
    this.enemyRenderer.renderAll(this.enemies)
    this.bulletRenderer.renderAll(this.bullets)
  }
}
```

**优势**:
- ✅ 每个文件<200 行，易于阅读
- ✅ 职责单一，便于维护
- ✅ 多人协作不冲突
- ✅ 可以单独测试每个渲染器

---

### 场景 2: 游戏逻辑拆分

#### ❌ 错误做法（所有逻辑在主类中）

```typescript
// PhaserGame.ts - 上帝类 😰
export class YourGamePhaserGame {
  update(time: number, delta: number): void {
    // 200 行：处理玩家输入
    if (this.cursors.left.isDown) { /* ... */ }
    
    // 150 行：更新玩家位置
    this.currentPlayer.x += speed * delta
    
    // 300 行：生成和管理敌机
    if (time - this.lastSpawnTime > 2000) { /* ... */ }
    
    // 200 行：更新敌机位置
    this.enemies.forEach(e => e.y += speed * delta)
    
    // 400 行：碰撞检测
    this.bullets.forEach(b => {
      this.enemies.forEach(e => {
        // ... 复杂的碰撞逻辑 ...
      })
    })
    
    // 150 行：更新分数
    this.score += 10
    
    // 100 行：检查游戏结束
    if (this.lives <= 0) { /* ... */ }
    
    // ... 总共 1500+ 行 ...
  }
}
```

#### ✅ 正确做法（模块化逻辑）

```typescript
// logic/PlayerLogic.ts
export class PlayerLogic {
  update(input: InputState, delta: number): PlayerState {
    // 只负责玩家逻辑，约 120 行
    let newX = input.x
    let newY = input.y
    
    // 边界检查
    newX = Phaser.Math.Clamp(newX, 0, GRID_COLS - 1)
    newY = Phaser.Math.Clamp(newY, 0, GRID_ROWS - 1)
    
    return { x: newX, y: newY }
  }
}

// logic/EnemyLogic.ts
export class EnemyLogic {
  spawn(time: number): Enemy | null {
    // 只负责敌机生成，约 100 行
    if (time - this.lastSpawnTime > 2000) {
      return this.createEnemy()
    }
    return null
  }
  
  update(enemies: Enemy[], delta: number): void {
    // 只负责敌机移动，约 80 行
    enemies.forEach(e => e.y += SPEED * delta)
  }
}

// logic/CollisionSystem.ts
export class CollisionSystem {
  checkCollisions(gameState: GameState): CollisionResult[] {
    // 只负责碰撞检测，约 200 行
    const collisions: CollisionResult[] = []
    
    // 子弹击中敌机
    gameState.bullets.forEach(bullet => {
      gameState.enemies.forEach(enemy => {
        if (this.isColliding(bullet, enemy)) {
          collisions.push({ type: 'bullet_enemy', bullet, enemy })
        }
      })
    })
    
    // 玩家撞敌机
    gameState.enemies.forEach(enemy => {
      if (this.isColliding(gameState.player, enemy)) {
        collisions.push({ type: 'player_enemy', player: gameState.player, enemy })
      }
    })
    
    return collisions
  }
  
  private isColliding(obj1: GameObject, obj2: GameObject): boolean {
    const dist = Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y)
    return dist < COLLISION_THRESHOLD
  }
}

// logic/ScoreSystem.ts
export class ScoreSystem {
  addScore(points: number): void {
    // 只负责分数管理，约 80 行
    this.score += points
    this.onScoreChange?.(this.score)
  }
}

// PhaserGame.ts - 清晰的编排
export class YourGamePhaserGame {
  private playerLogic: PlayerLogic
  private enemyLogic: EnemyLogic
  private collisionSystem: CollisionSystem
  private scoreSystem: ScoreSystem
  
  update(time: number, delta: number): void {
    // 职责清晰，只有编排调用（约 50 行）
    const playerInput = this.handleInput()
    const newPlayerPos = this.playerLogic.update(playerInput, delta)
    
    const newEnemy = this.enemyLogic.spawn(time)
    this.enemyLogic.update(this.enemies, delta)
    
    const collisions = this.collisionSystem.checkCollisions(this.gameState)
    this.handleCollisions(collisions)
    
    this.scoreSystem.addScore(this.calculateScore())
    
    if (this.checkGameOver()) {
      this.gameOver()
    }
  }
}
```

---

## 📁 使用 index.ts 统一管理

### 为什么需要 index.ts？

**没有 index.ts 的情况**:

```typescript
// 在 Vue 组件或 PhaserGame 中导入
import { PlayerRenderer } from '@/components/game/renderers/PlayerRenderer'
import { EnemyRenderer } from '@/components/game/renderers/EnemyRenderer'
import { BulletRenderer } from '@/components/game/renderers/BulletRenderer'
import { PowerupRenderer } from '@/components/game/renderers/PowerupRenderer'
import { PlayerLogic } from '@/components/game/logic/PlayerLogic'
import { EnemyLogic } from '@/components/game/logic/EnemyLogic'
import { CollisionSystem } from '@/components/game/logic/CollisionSystem'
import { ScoreSystem } from '@/components/game/logic/ScoreSystem'
// ... 导入语句很长，容易出错
```

**有 index.ts 的情况**:

```typescript
// 统一导入，简洁明了
import {
  PlayerRenderer,
  EnemyRenderer,
  BulletRenderer,
  PowerupRenderer
} from '@/components/game/renderers'

import {
  PlayerLogic,
  EnemyLogic,
  CollisionSystem,
  ScoreSystem
} from '@/components/game/logic'
```

### index.ts 编写示例

```typescript
// renderers/index.ts
export { PlayerRenderer } from './PlayerRenderer'
export { EnemyRenderer } from './EnemyRenderer'
export { BulletRenderer } from './BulletRenderer'
export { PowerupRenderer } from './PowerupRenderer'

// logic/index.ts
export { PlayerLogic } from './PlayerLogic'
export { EnemyLogic } from './EnemyLogic'
export { CollisionSystem } from './CollisionSystem'
export { ScoreSystem } from './ScoreSystem'

// components/index.ts (可选：如果需要更统一的导出)
export * from './renderers'
export * from './logic'
export { GTRSLoader } from './GTRSLoader'
export { ScreenAdapter } from './ScreenAdapter'
export { AudioManager } from './AudioManager'
export { ItemSystem } from './ItemSystem'
```

---

## 🔍 判断是否需要拆分的信号

### 🚨 危险信号（立即拆分）

- [ ] 单个文件超过 800 行
- [ ] 一个类有超过 10 个公共方法
- [ ] 一个函数超过 50 行
- [ ] 导入语句超过 20 个
- [ ] 文件名包含"And"（如 `PlayerAndEnemyRenderer.ts`）
- [ ] 注释写着"TODO: 重构这部分"
- [ ] 不同开发者频繁修改同一文件导致冲突

### ✅ 健康信号（保持现状）

- [x] 每个文件<600 行
- [x] 每个类<10 个公共方法
- [x] 每个函数<50 行
- [x] 导入语句<20 个
- [x] 文件名清晰表达单一职责
- [x] 可以轻松写出单元测试
- [x] 多人协作不冲突

---

## 🛠️ 实际案例对比

### 案例 1: 贪吃蛇游戏（原始版本）

**文件结构**:
```
games/snake/src/components/game/
├── PhaserGame.ts (2200 行) 😱
├── GTRSLoader.ts
├── ScreenAdapter.ts
├── AudioManager.ts
└── ItemSystem.ts
```

**PhaserGame.ts 内容**:
- 1-600 行：框架层（可复用）
- 600-900 行：渲染蛇的方法
- 900-1200 行：渲染食物的方法
- 1200-1500 行：游戏逻辑
- 1500-1800 行：碰撞检测
- 1800-2200 行：其他辅助方法

**问题**:
- 🔴 文件太大，打开都困难
- 🔴 想修改渲染逻辑，却不小心改到游戏逻辑
- 🔴 新人看到就害怕，不敢参与

### 案例 2: 飞机大战（优化版本）⭐

**文件结构**:
```
games/plane-shooter/src/components/game/
├── PhaserGame.ts (650 行) ✅
│   └── 只负责框架和编排调用
│
├── components/
│   ├── GTRSLoader.ts (150 行)
│   ├── ScreenAdapter.ts (120 行)
│   ├── AudioManager.ts (180 行)
│   └── ItemSystem.ts (200 行)
│
├── renderers/
│   ├── PlayerRenderer.ts (160 行) ✅
│   ├── EnemyRenderer.ts (190 行) ✅
│   ├── BulletRenderer.ts (130 行) ✅
│   ├── PowerupRenderer.ts (140 行) ✅
│   └── index.ts (10 行)
│
├── logic/
│   ├── PlayerLogic.ts (120 行) ✅
│   ├── EnemyLogic.ts (180 行) ✅
│   ├── CollisionSystem.ts (240 行) ✅
│   ├── ScoreSystem.ts (90 行) ✅
│   └── index.ts (10 行)
│
└── types/
    ├── player.types.ts (50 行)
    ├── enemy.types.ts (80 行)
    ├── bullet.types.ts (60 行)
    └── index.ts (10 行)
```

**优势**:
- ✅ 每个文件都很小，敢于让人看
- ✅ 职责清晰，修改渲染不会影响到逻辑
- ✅ 新人可以快速上手（每次只看一个小文件）
- ✅ 多人协作不冲突（各改各的文件）

---

## 📈 拆分的好处总结

### 对个人

- ✅ **减少压力**: 面对小文件心理负担小
- ✅ **提高效率**: 快速定位要修改的代码
- ✅ **降低风险**: 修改 A 功能不会影响 B 功能
- ✅ **方便测试**: 轻松写单元测试

### 对团队

- ✅ **减少冲突**: Git 合并冲突大幅减少
- ✅ **便于协作**: 每人负责不同模块
- ✅ **知识传承**: 新人更容易接手
- ✅ **代码审查**: Review 更高效

### 对项目

- ✅ **可维护性**: 长期维护成本降低
- ✅ **可扩展性**: 添加新功能更容易
- ✅ **代码质量**: Bug 更少，稳定性更高
- ✅ **技术债务**: 不容易积累技术债

---

## 🎯 实施建议

### 新项目

**从一开始就做好**:

1. **设计阶段**: 在 GDD 中就规划好文件结构
2. **开发阶段**: 严格遵守代码量限制
3. **评审阶段**: 检查是否符合拆分原则
4. **验收阶段**: 不符合标准的打回重做

### 已有项目

**渐进式重构**:

1. **识别问题文件**: 找出>800 行的文件
2. **优先级排序**: 从最乱的开始
3. **小步重构**: 每次只重构一个模块
4. **保证测试**: 重构前后功能一致
5. **逐步推进**: 不要指望一步到位

**重构顺序建议**:

```
第 1 步：提取渲染逻辑 → renderers/
第 2 步：提取游戏逻辑 → logic/
第 3 步：提取类型定义 → types/
第 4 步：创建 index.ts → 统一导出
```

---

## 📞 常见问题

### Q1: 拆分太细会不会增加复杂度？

**A**: 短期看似乎复杂了（文件多了），长期看简化了（每个文件都简单）。

就像整理房间：
- ❌ 所有东西堆一起 → 看起来简单，找东西困难
- ✅ 分类收纳 → 看起来复杂，找东西容易

### Q2: 有些功能就是很复杂，无法拆分怎么办？

**A**: 继续拆分！再复杂的功能也可以分解为多个子功能。

**技巧**:
- 按数据流拆分（输入→处理→输出）
- 按业务逻辑拆分（玩家→敌人→道具）
- 按时间顺序拆分（初始化→更新→渲染）

### Q3: 拆分后性能会下降吗？

**A**: 几乎不会。现代 JS 引擎很智能，模块化的代码反而更容易优化。

**实测数据**:
- 导入导出开销：<1ms
- 代码执行时间：基本不变
- 内存占用：略有增加（可忽略）

### Q4: 如何说服团队成员遵守这个规范？

**A**: 用事实说话！

1. **展示对比**: 拿大文件和小文件对比给大家看
2. **分享痛苦**: 让大家说说修改大文件的痛苦经历
3. **制定规则**: 写入开发规范，Code Review 时检查
4. **工具辅助**: 使用 ESLint 等工具自动检测文件大小

---

<div align="center">

## 🎉 总结

**核心理念**:

> **代码是写给人看的，顺便给机器执行。**

**行动口号**:

> **拒绝大文件，拥抱模块化！**

**立即行动**:

1. 检查你的项目，有没有>800 行的文件
2. 如果有，立即制定重构计划
3. 新项目从一开始就严格遵守
4. 养成习惯，持续改进

</div>

---

**文档版本**: v1.0  
**最后更新**: 2026-03-27  
**适用范围**: 所有基于本框架开发的游戏项目
