# 📦 Frame-Factory 管理器架构使用指南

## 🎯 什么是管理器架构？

管理器架构是一种**职责分离**的设计模式，将游戏逻辑拆分为多个独立的管理器类，每个管理器只负责一个特定领域。

### **传统写法 vs 管理器架构**

#### ❌ 传统写法（大杂烩）

```typescript
// GameScene.ts - 1500+ 行代码
class GameScene extends Phaser.Scene {
  // 所有状态混在一起
  private isDying: boolean = false
  private isInvincible: boolean = false
  private score: number = 0
  
  update(): void {
    // 所有逻辑混在 update 中
    if (!this.isDying) {
      // 移动逻辑
      if (cursors.up.isDown) { ... }
      
      // 射击逻辑
      if (space.isDown) { ... }
      
      // 碰撞检测
      this.physics.collide(...)
    }
  }
}
```

**问题**:
- ❌ 职责不清（一个类做所有事）
- ❌ 难以维护（改一个 bug 出三个新 bug）
- ❌ 无法复用（想用在另一个游戏？没门）
- ❌ 测试困难（怎么单元测试？）

---

#### ✅ 管理器架构

```typescript
// GameScene.ts - 仅协调层
class GameScene extends Phaser.Scene {
  // ⭐ 清晰的管理器引用
  private entityManager!: EntityManager
  private stateManager!: PlayerStateManager
  private movementManager!: PlayerMovementManager
  private combatManager!: PlayerCombatManager
  private collisionManager!: CollisionManager
  
  update(): void {
    // ⭐ 简单的委托调用
    if (!this.stateManager.canAct()) return
    
    this.movementManager.update(cursors)
    this.combatManager.tryShoot()
  }
}
```

**优势**:
- ✅ 职责清晰（每个类只做一件事）
- ✅ 易于维护（出问题快速定位）
- ✅ 高度复用（管理器可以跨游戏使用）
- ✅ 易于测试（每个管理器独立测试）

---

## 🏗️ 核心管理器介绍

### **1. EntityManager（实体管理）**

**职责**: 统一管理所有游戏实体的创建和销毁

```typescript
import { EntityManager, EntityType } from '@/core/managers/EntityManager'

// 创建玩家
const player = entityManager.createEntity({
  type: EntityType.PLAYER,
  x: 400,
  y: 300,
  texture: 'player_tank_up',
  attributes: { health: 100, speed: 200 }
})

// 创建敌人
const enemy = entityManager.createEntity({
  type: EntityType.ENEMY,
  x: 600,
  y: 200,
  texture: 'enemy_tank_1',
  attributes: { damage: 10 }
})

// 创建墙壁
entityManager.createEntity({
  type: EntityType.WALL,
  x: 500,
  y: 400,
  texture: 'brick_wall'
})
```

**核心方法**:
- `createEntity(data)` - 创建实体
- `getEntity(id)` - 获取实体
- `removeEntity(id)` - 移除实体
- `clearAll()` - 清空所有实体

---

### **2. PlayerStateManager（状态管理）**

**职责**: 管理玩家的状态机（ALIVE/DYING/DEAD）

```typescript
import { PlayerStateManager, PlayerState } from '@/core/managers/PlayerStateManager'

const stateManager = new PlayerStateManager(player)

// 检查是否可以行动
if (stateManager.canAct()) {
  // 玩家可以移动和射击
}

// 进入死亡状态
stateManager.setDying()

// 开始复活（2 秒后）
stateManager.startRespawn(2000)

// 获取当前状态
const currentState = stateManager.currentState // PlayerState.ALIVE
```

**状态枚举**:
- `ALIVE` - 存活，可操作
- `DYING` - 正在死亡（受击动画中）
- `RESPAWNING` - 等待复活（无敌闪烁中）
- `INVINCIBLE` - 无敌状态（复活后保护期）
- `DEAD` - 死亡（生命耗尽）

---

### **3. PlayerMovementManager（移动控制）**

**职责**: 处理玩家输入和边界检查

```typescript
import { PlayerMovementManager } from '@/core/managers/PlayerMovementManager'

const movementManager = new PlayerMovementManager(player, config)

// 每帧调用
update(): void {
  movementManager.update(cursors, {
    keyW: this.keyW,
    keyA: this.keyA,
    keyS: this.keyS,
    keyD: this.keyD
  })
}
```

**功能**:
- ✅ 键盘输入处理（方向键 + WASD）
- ✅ 边界检查（防止走出地图）
- ✅ 位置校正（超出边界时拉回）
- ✅ 速度控制（支持加速/减速道具）

---

### **4. PlayerCombatManager（战斗逻辑）**

**职责**: 处理射击、受击、道具效果

```typescript
import { PlayerCombatManager } from '@/core/managers/PlayerCombatManager'

const combatManager = new PlayerCombatManager(stateManager, config)

// 尝试射击
if (keySpace.isDown) {
  combatManager.tryShoot()
}

// 玩家被击中
combatManager.onHit()

// 激活道具
combatManager.activateShield()  // 护盾
combatManager.activateFreeze()  // 冻结敌人
```

**功能**:
- ✅ 射击控制（冷却时间管理）
- ✅ 受击处理（护甲、护盾、冻结）
- ✅ 死亡和复活流程
- ✅ 道具效果激活

---

### **5. CollisionManager（碰撞检测）**

**职责**: 统一管理所有碰撞关系

```typescript
import { CollisionManager } from '@/core/managers/CollisionManager'

const collisionManager = new CollisionManager(scene)

// 设置所有碰撞关系
collisionManager.setupAllCollisions()

// 或单独设置
collisionManager.setupPlayerVsEnemy()
collisionManager.setupBulletVsWall()
```

**管理的碰撞关系**:
- 玩家子弹 ↔ 墙壁
- 敌人子弹 ↔ 墙壁
- 玩家子弹 ↔ 敌人
- 敌人子弹 ↔ 玩家
- 玩家 ↔ 敌人（物理碰撞）
- 敌人子弹 ↔ 基地
- 玩家 ↔ 道具

---

## 🚀 快速开始

### **Step 1: 继承 GameScene 基类**

```typescript
// src/scenes/MyGameScene.ts
import GameScene from './scenes/GameScene'
import { EntityManager, EntityType } from '@/core/managers/EntityManager'

export class MyGameScene extends GameScene {
  protected createAdditionalManagers(): void {
    // 创建额外的管理器
    this.entityManager = new EntityManager(this)
    this.managers.push(this.entityManager)
  }
  
  protected createGameObjects(): void {
    // 使用 EntityManager 创建对象
    const player = this.entityManager.createEntity({
      type: EntityType.PLAYER,
      x: 400,
      y: 300,
      texture: 'player'
    })
  }
  
  gameLoop(time: number, delta: number): void {
    // 游戏主循环
  }
}
```

### **Step 2: 在 Vue 中使用**

```vue
<!-- PhaserGame.vue -->
<template>
  <div>
    <PhaserGame :scene="MyGameScene" />
  </div>
</template>

<script setup lang="ts">
import { MyGameScene } from './scenes/MyGameScene'
</script>
```

---

## 📊 最佳实践

### **✅ 推荐做法**

1. **每个管理器只做一件事**
   ```typescript
   // ✅ 好：职责单一
   PlayerMovementManager 只负责移动
   PlayerCombatManager 只负责战斗
   
   // ❌ 坏：职责混乱
   class GameManager {
     updateMovement() { ... }
     handleCombat() { ... }
     checkCollisions() { ... }
   }
   ```

2. **管理器之间通过接口通信**
   ```typescript
   // ✅ 好：依赖倒置
   class PlayerCombatManager {
     constructor(private stateManager: PlayerStateManager) {}
   }
   
   // ❌ 坏：直接耦合
   class PlayerCombatManager {
     onHit() {
       scene.stateManager.setDying() // 不应该知道 scene 的存在
     }
   }
   ```

3. **在基类中统一初始化和清理**
   ```typescript
   // ✅ 好：统一管理
   initializeManagers(): void {
     this.managers.forEach(manager => manager.init())
   }
   
   shutdown(): void {
     this.managers.forEach(manager => manager.destroy())
   }
   ```

---

### **❌ 常见陷阱**

1. **在管理器中直接访问 Scene 属性**
   ```typescript
   // ❌ 错误
   class PlayerCombatManager {
     onHit() {
       this.scene.score += 100 // 不应该知道 scene 的内部结构
     }
   }
   
   // ✅ 正确
   class PlayerCombatManager {
     onHit() {
       this.emit('hit', { damage: 10 }) // 通过事件通信
     }
   }
   ```

2. **管理器之间循环依赖**
   ```typescript
   // ❌ 错误
   A 依赖 B
   B 依赖 C
   C 依赖 A // 死循环！
   
   // ✅ 正确
   所有管理器都依赖接口，不互相依赖
   ```

3. **忘记清理资源**
   ```typescript
   // ❌ 错误
   destroy(): void {
     // 什么都不做
   }
   
   // ✅ 正确
   destroy(): void {
     this.timer?.destroy()
     this.particles?.destroy()
   }
   ```

---

## 🎯 进阶用法

### **创建自定义管理器**

```typescript
// src/managers/CustomComboManager.ts
import { IGameManager } from '@/core/managers/IGameManager'

export class ComboManager implements IGameManager {
  private currentCombo: number = 0
  private maxCombo: number = 0
  
  init(): void {
    this.currentCombo = 0
  }
  
  addCombo(): void {
    this.currentCombo++
    console.log(`连击：x${this.currentCombo}`)
  }
  
  destroy(): void {
    // 清理资源
  }
}

// 在 GameScene 中使用
class MyGameScene extends GameScene {
  private comboManager!: ComboManager
  
  protected createAdditionalManagers(): void {
    this.comboManager = new ComboManager(this)
    this.managers.push(this.comboManager)
  }
  
  gameLoop(): void {
    // 击杀敌人时
    this.comboManager.addCombo()
  }
}
```

---

## 📝 故障排查

### **问题 1: 管理器未初始化**

**症状**: `Cannot read properties of undefined`

**原因**: 忘记在 `createAdditionalManagers()` 中创建管理器

**解决**:
```typescript
protected createAdditionalManagers(): void {
  this.combatManager = new PlayerCombatManager(...)
  this.managers.push(this.combatManager) // ← 别忘了这行
}
```

---

### **问题 2: 更新顺序错误**

**症状**: 管理器行为异常

**原因**: 管理器更新顺序不正确

**解决**:
```typescript
// 确保按正确顺序更新
update(time: number, delta: number): void {
  // 1. 先更新状态
  this.stateManager.update(time, delta)
  
  // 2. 再更新移动
  this.movementManager.update(cursors)
  
  // 3. 最后更新战斗
  this.combatManager.tryShoot()
}
```

---

### **问题 3: 内存泄漏**

**症状**: 游戏越来越卡

**原因**: 管理器没有正确清理

**解决**:
```typescript
shutdown(): void {
  // 必须调用所有管理器的 destroy
  this.managers.forEach(manager => manager.destroy())
  super.shutdown()
}
```

---

## 🎮 完整示例

### **坦克大战风格游戏**

```typescript
// src/scenes/TankBattleScene.ts
import GameScene from './scenes/GameScene'
import { EntityManager, EntityType } from '@/core/managers/EntityManager'
import { PlayerStateManager } from '@/core/managers/PlayerStateManager'
import { PlayerMovementManager } from '@/core/managers/PlayerMovementManager'
import { PlayerCombatManager } from '@/core/managers/PlayerCombatManager'
import { CollisionManager } from '@/core/managers/CollisionManager'

export class TankBattleScene extends GameScene {
  // 管理器引用
  private stateManager!: PlayerStateManager
  private movementManager!: PlayerMovementManager
  private combatManager!: PlayerCombatManager
  private collisionManager!: CollisionManager
  
  // 游戏对象
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  
  protected createAdditionalManagers(): void {
    // 创建所有管理器
    this.stateManager = new PlayerStateManager(this.player)
    this.movementManager = new PlayerMovementManager(this.player)
    this.combatManager = new PlayerCombatManager(this.stateManager)
    this.collisionManager = new CollisionManager(this)
    
    // 注册到基类
    this.managers.push(
      this.stateManager,
      this.movementManager,
      this.combatManager,
      this.collisionManager
    )
  }
  
  protected createGameObjects(): void {
    // 创建玩家
    this.player = this.entityManager.createEntity({
      type: EntityType.PLAYER,
      x: 400,
      y: 300,
      texture: 'player_tank_up'
    }) as Phaser.Physics.Arcade.Sprite
    
    // 创建敌人
    for (let i = 0; i < 5; i++) {
      this.entityManager.createEntity({
        type: EntityType.ENEMY,
        x: 200 + i * 150,
        y: 100,
        texture: 'enemy_tank_1'
      })
    }
    
    // 创建墙壁
    for (let i = 0; i < 10; i++) {
      this.entityManager.createEntity({
        type: EntityType.WALL,
        x: 300 + i * 80,
        y: 400,
        texture: 'brick_wall'
      })
    }
  }
  
  gameLoop(_time: number, _delta: number): void {
    // 检查玩家是否可以行动
    if (!this.stateManager.canAct()) return
    
    // 移动控制
    this.movementManager.update(this.cursors)
    
    // 射击控制
    if (this.cursors.space?.isDown) {
      this.combatManager.tryShoot()
    }
  }
}
```

---

## 📚 相关文档

- [架构升级方案](./ARCHITECTURE_UPGRADE_PLAN.md) - 完整的升级计划
- [EntityManager API](./src/core/managers/EntityManager.ts) - 实体管理器文档
- [IGameManager 接口](./src/core/managers/IGameManager.ts) - 管理器接口定义

---

## 🙋 常见问题

**Q: 管理器架构适合小游戏吗？**

A: 完全适合！你可以只用 `EntityManager`，其他管理器按需选择。

**Q: 旧游戏需要迁移到新架构吗？**

A: 不是必须的。新架构向后兼容，但可以逐步迁移以获得更好的可维护性。

**Q: 如何测试管理器？**

A: 每个管理器都是独立的类，可以直接实例化并测试：
```typescript
const manager = new PlayerMovementManager(player)
manager.init()
manager.update(cursors)
// 断言...
```

---

**祝你使用愉快！** 🎮✨
