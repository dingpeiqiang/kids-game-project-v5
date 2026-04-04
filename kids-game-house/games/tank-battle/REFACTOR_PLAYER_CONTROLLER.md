# 坦克大战 - 玩家单一入口原则重构

> 日期：2026-04-04
> 原则：**属性/状态变更的单一入口原则（Single Mutation Entry Point）**
> 状态：✅ **已完成**

---

## 一、问题诊断

### 1.1 当前写入入口分布

```
┌──────────────────────────────────────────────────────────────────┐
│                    玩家属性/状态写入入口                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PlayerStateManager.ts       ← 6处 player.setAlpha/setVisible   │
│  PlayerCombatManager.ts      ← 8处 player.setAlpha/setVisible   │
│                               ← 2处 gameStore.loseLife()         │
│  TankGameManager.ts          ← 8处 player.setAlpha/setVisible   │
│                               ← 1处 gameStore.loseLife()         │
│                               ← 僵尸代码：isDying/isInvincible  │
│  PowerUpEffectApplier.ts     ← 1处 gameStore.addLife()           │
│  TankGameScene.ts            ← 2处 gameStore.$patch()            │
│                                                                  │
│  共计：25+ 处直接写入，6 个文件                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 核心问题

| 问题编号 | 问题描述 | 具体表现 |
|---------|---------|---------|
| P1 | **状态标志散落多个类** | `isShieldActive` 在 CombatManager，`isInvincibleInternal` 在 StateManager，`isDying` 在 TankGameManager 三处都有 |
| P2 | **player 渲染属性无归属** | `setAlpha/setVisible/setActive` 在 4 个文件共 22 处直接操作，互相覆盖 |
| P3 | **gameStore 多层直写** | Scene、Combat、PowerUp、TankGameManager 都各自操作 `loseLife()`/`addLife()`/`$patch()` |
| P4 | **TankGameManager 僵尸代码** | 存在完整但已废弃的 `isDying/isInvincible/isShieldActive`，随时可能被遗留路径激活 |
| P5 | **PowerUpEffectApplier 跨层调用** | 同时操作 `combatManager`、`movementManager`、`gameStore`，没有统一入口 |
| P6 | **TankGameScene 降级路径** | `collectPowerUp` 的 catch 里又直调 `combatManager.activateXxx()`，与 PowerUpEffectApplier 重复 |

---

## 二、重构目标

### 2.1 核心原则

```
所有修改玩家状态/属性的操作，收敛到唯一的 PlayerController。
外部模块只能调用 PlayerController 的公开方法，禁止：
  ❌ 直接修改 player.setAlpha() / setVisible() / setActive()
  ❌ 直接调用 gameStore.loseLife() / addLife() / $patch()
  ❌ 直接修改任何 Manager 的内部状态字段
```

### 2.2 目标架构

```
           外部触发源
    ┌────────┼────────┐
    ▼        ▼        ▼
  Scene   Collision  PowerUp
  (碰撞)   Manager   (道具)
    │        │        │
    └────────┼────────┘
             ▼
  ┌─────────────────────┐
  │   PlayerController   │  ← 唯一入口
  │                      │
  │  ┌─────────────────┐ │
  │  │  PlayerData     │ │  ← 所有玩家数据的只读快照
  │  │  (readonly)     │ │
  │  └─────────────────┘ │
  │                      │
  │  命令方法：           │
  │  - takeDamage()      │
  │  - consumeShield()   │
  │  - activatePowerUp() │
  │  - addLife()         │
  │  - respawn()         │
  │  - setGameOver()     │
  │  - addScore()        │
  │  - reset()           │
  └──────────┬──────────┘
             │ 内部委派
    ┌────────┼────────┐
    ▼        ▼        ▼
  State     Combat    GameStore
  Manager   Manager   (Pinia)
  (只做)    (只做)
  状态转换   战斗计算
```

---

## 三、PlayerController 详细设计

### 3.1 PlayerData 只读数据对象

```typescript
/**
 * 玩家完整数据快照（对外只读）
 */
export interface ReadonlyPlayerData {
  // === 基础属性 ===
  readonly lives: number           // 剩余生命
  readonly score: number           // 当前分数
  readonly level: number           // 当前关卡

  // === 战斗属性 ===
  readonly armor: number           // 当前护甲
  readonly maxArmor: number        // 最大护甲
  readonly bulletDamage: number    // 子弹伤害
  readonly shootCooldown: number   // 射击冷却(ms)
  readonly speedMultiplier: number // 速度倍率

  // === 状态标志 ===
  readonly state: PlayerState      // 状态枚举
  readonly isShieldActive: boolean // 护盾是否激活
  readonly isFrozen: boolean       // 是否被冻结
  readonly isInvincible: boolean   // 是否无敌
  readonly isDying: boolean        // 是否正在死亡
  readonly isGameOver: boolean     // 游戏是否结束
  readonly isHoming: boolean       // 追踪导弹激活

  // === 计算属性 ===
  readonly canAct: boolean         // 是否可以行动
  readonly canShoot: boolean       // 是否可以射击
  readonly isValid: boolean        // 是否有效（可参与碰撞）
}
```

### 3.2 PlayerController 命令方法

```typescript
export class PlayerController {
  // ─── 只读查询 ───────────────────────────
  get data(): ReadonlyPlayerData     // 获取当前只读快照

  // ─── 伤害与防御 ────────────────────────
  takeDamage(source: 'bullet' | 'collision', bullet?: any): void
  consumeShield(): void              // 护盾消耗

  // ─── 生命周期 ──────────────────────────
  addLife(amount: number): void      // 增加生命
  loseLife(): void                   // 失去生命（内部调）
  respawn(): void                    // 复活

  // ─── 道具效果 ──────────────────────────
  applyPowerUp(type: PowerUpType): void   // 统一道具入口

  // ─── 分数与关卡 ────────────────────────
  addScore(points: number): void

  // ─── 游戏流程 ──────────────────────────
  setGameOver(): void
  reset(): void                       // 新游戏重置
  destroy(): void

  // ─── 内部状态变更（仅 Manager 内部调用）───
  // 这些方法只暴露给有权限的内部 Manager
  _setState(state: PlayerState): void
  _setShieldActive(active: boolean): void
  _setInvincible(active: boolean): void
  _setFrozen(frozen: boolean): void
}
```

### 3.3 变更日志（内置审计能力）

```typescript
/**
 * 变更日志条目（调试和追溯用）
 */
interface PlayerStateChange {
  timestamp: number          // 时间戳
  field: string              // 变更字段
  oldValue: any              // 旧值
  newValue: any              // 新值
  reason: string             // 变更原因（如 "护盾消耗" "子弹击中"）
}

// PlayerController 内部维护
private changeLog: PlayerStateChange[] = []

private logChange(field: string, oldValue: any, newValue: any, reason: string): void {
  this.changeLog.push({ timestamp: Date.now(), field, oldValue, newValue, reason })
  console.log(`📝 [PlayerController] ${field}: ${oldValue} → ${newValue} (${reason})`)
}
```

---

## 四、各模块职责重新划分

### 4.1 PlayerStateManager —— 只做状态转换

**保留**：`PlayerState` 枚举、状态查询方法（`getState()`、`canAct()`、`isValid()`、`isInvincible()`、`isDying()`）

**移除**：所有 `player.setAlpha/setVisible/setActive` 的直接操作 → 改为触发事件通知 PlayerController

**移除**：`onHit()` / `startRespawning()` / `markAsDead()` 等高层流程方法 → 上移到 PlayerController

**改为**：
- `transitionTo(state: PlayerState)` —— 唯一的状态转换方法
- PlayerController 在执行 takeDamage/respawn 等逻辑时调用此方法
- 状态变更后发出事件，由 PlayerController 统一处理视觉更新

### 4.2 PlayerCombatManager —— 只做战斗计算

**保留**：`tryShoot()`、射击冷却逻辑、子弹创建

**移除**：`gameStore.loseLife()` → 改为返回伤害结果，由 PlayerController 处理生命扣减

**移除**：`handleDeath()` / `startRespawn()` → 上移到 PlayerController

**移除**：所有 `player.setAlpha/setVisible/setActive` → 由 PlayerController 统一处理

**移除**：`isShieldActive` / `isFrozen` 状态字段 → 移到 PlayerController 的 PlayerData

**改为**：
- `calculateDamage(bullet)` —— 纯计算，返回伤害结果
- `performShoot()` —— 保留
- 道具效果方法（`activateShieldPowerUp` 等）→ 上移到 PlayerController.applyPowerUp()

### 4.3 PlayerMovementManager —— 只做移动计算

**保留**：输入处理、边界检查、方向管理

**移除**：`setSpeedMultiplier()` → 改为只读查询 `config.speedMultiplier`，修改走 PlayerController

### 4.4 PowerUpEffectApplier —— 只做视觉效果

**保留**：所有视觉特效（护盾光圈、脉冲、跟随动画）

**移除**：`applyAttributeBuff()` → 属性加成逻辑统一到 PlayerController.applyPowerUp()

**移除**：`gameStore.addLife()` → 通过 PlayerController

### 4.5 TankGameScene —— 只做事件编排

**保留**：场景创建、碰撞注册、UI 更新

**移除**：`collectPowerUp()` 中的降级直调 → 统一走 PlayerController.applyPowerUp()

**移除**：`gameStore.$patch()` → 统一走 PlayerController

**移除**：`addScore()` 自行维护 score → 统一走 PlayerController

### 4.6 TankGameManager.ts —— 删除

已被 PlayerController + 三个 Manager 完全取代，属于僵尸代码。

---

## 五、重构步骤（分阶段执行）

### Phase 1：创建 PlayerController（不改动现有代码）
1. 新建 `src/managers/PlayerController.ts`
2. 实现 `PlayerData` 只读数据对象
3. 实现所有命令方法（内部暂为空壳，打印日志）
4. 添加变更日志机制

### Phase 2：重构 PlayerStateManager
1. 精简为纯状态机（只有 `transitionTo` + 查询方法）
2. 移除所有 `player` Sprite 直接操作
3. 状态变更时发出事件，供 PlayerController 订阅

### Phase 3：重构 PlayerCombatManager
1. 移除 `gameStore` 依赖和 `player` Sprite 操作
2. 战斗计算返回结果对象，不直接修改状态
3. 道具效果方法迁移到 PlayerController

### Phase 4：重构 PowerUpEffectApplier
1. 属性加成逻辑迁移到 PlayerController
2. 只保留视觉特效功能
3. 通过 PlayerController 获取需要的数据

### Phase 5：重构 TankGameScene
1. 所有玩家操作走 PlayerController
2. 移除 `gameStore` 直接操作
3. 碰撞事件 → PlayerController.takeDamage()

### Phase 6：清理与验证
1. 删除 TankGameManager.ts
2. 全局搜索确认无遗漏的直写路径
3. 功能测试：受击、护盾、复活、道具、死亡、游戏结束

---

## 六、重构前后对比

### 修改护盾状态

```typescript
// ❌ 重构前：3 个文件 5+ 处可以修改
// PlayerCombatManager.ts: this.isShieldActive = true
// PlayerCombatManager.ts: this.isShieldActive = false
// TankGameManager.ts: this.isShieldActive = true/false

// ✅ 重构后：唯一入口
playerController.applyPowerUp(PowerUpType.SHIELD)  // 激活
playerController.consumeShield()                     // 消耗
```

### 玩家受击死亡

```typescript
// ❌ 重构前：4 个文件都能触发
// TankGameManager.playerHit() → gameStore.loseLife() + player.setAlpha(0)
// PlayerCombatManager.handleDeath() → gameStore.loseLife() + stateManager.onHit()
// TankGameScene.handleGameOver() → gameStore.$patch({ isGameOver: true })

// ✅ 重构后：唯一入口
playerController.takeDamage('bullet', bullet)
// 内部自动处理：护盾检查 → 无敌检查 → 护甲扣减 → loseLife → 状态转换 → 视觉更新
```

### 拾取道具

```typescript
// ❌ 重构前：2 条路径
// PowerUpEffectApplier.applyAttributeBuff() → combatManager/movementManager/gameStore
// TankGameScene.collectPowerUp() catch → combatManager.activateXxx()

// ✅ 重构后：唯一入口
playerController.applyPowerUp(type)
// 内部自动处理：属性修改 → 视觉效果委托 → UI 同步 → 日志记录
```

---

---

## 八、实际变更清单

### 新增文件
| 文件 | 说明 |
|------|------|
| `src/managers/PlayerController.ts` | ⭐ 唯一入口控制器（~830行） |

### 重写文件
| 文件 | 变更前 | 变更后 |
|------|--------|--------|
| `src/managers/PlayerStateManager.ts` | 373行（状态机 + Sprite操作 + 高层流程） | 128行（纯状态机，无 scene 依赖） |
| `src/managers/PlayerCombatManager.ts` | 613行（射击 + 受击 + 道具 + gameStore + Sprite） | 180行（纯射击逻辑，无 stateManager/gameStore 依赖） |
| `src/utils/PowerUpEffectApplier.ts` | 379行（属性加成 + 视觉效果） | 226行（纯视觉效果） |
| `src/managers/CollisionManager.ts` | 377行（碰撞 + 旧的 combatManager 直调） | 244行（碰撞 + PlayerController.takeDamage） |
| `src/scenes/TankGameScene.ts` | 814行（碰撞事件 + gameStore 直写 + 降级路径） | 490行（事件编排 + PlayerController 收口） |
| `src/debug/PlayerDebugPanel.ts` | 157行（直接读各 Manager 内部字段） | 139行（读 PlayerController.data 只读快照） |

### 删除文件
| 文件 | 说明 |
|------|------|
| `src/core/TankGameManager.ts` | 僵尸代码（0 处引用） |

### 关键指标
- **直写入口**：25+ 处 → 1 处（PlayerController）
- **总代码量**：2713行 → 2037行（**减少 25%**）
- **gameStore 直写**：6 处 → 0 处（Scene 外）
- **player Sprite 操作**：22 处 → 全部收敛到 PlayerController 内部

| 风险 | 缓解措施 |
|------|---------|
| 重构范围大，可能引入回归 bug | 分 Phase 执行，每阶段验证核心流程（受击→死亡→复活→游戏结束） |
| PlayerController 可能变成上帝类 | 命令方法只做编排，具体逻辑仍在各 Manager 中；PlayerController 本身不含复杂计算 |
| 异步操作（复活定时器）的竞态 | 在 PlayerController 内加状态锁，`takeDamage` 在 DYING/DEAD 状态下直接 return |
| 现有调试面板依赖 Manager 内部字段 | 调试面板改为读取 `playerController.data` 只读快照 |
