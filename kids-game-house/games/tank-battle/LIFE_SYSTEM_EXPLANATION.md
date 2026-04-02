# 玩家生命与复活系统说明

## 📊 核心设计决策

### ✅ 采用方案：重置状态（而非销毁重建）

**理由**：
1. ✅ **保持对象引用** - 所有管理器（movementManager、collisionManager 等）无需更新
2. ✅ **调试面板稳定** - 不会显示"玩家不存在"然后突然"玩家存在"
3. ✅ **代码简单** - 不需要复杂的引用更新逻辑
4. ✅ **Phaser 最佳实践** - Phaser 推荐使用对象池或状态重置

**对比销毁重建方案**：
```typescript
// ❌ 销毁重建（不推荐）
if (scene.player) {
  scene.player.destroy()
}
scene.player = entityManager.createEntity({...})
movementManager.setPlayer(newPlayer)  // 需要更新引用
collisionManager.rebindAllCollisions() // 需要重新绑定

// ✅ 重置状态（推荐）
player.x = startX
player.y = startY
player.body.reset(startX, startY)
player.direction = 'UP'
```

---

## 🔄 完整生命流程

### 1️⃣ 玩家被击中

```typescript
// PlayerCombatManager.onHitWithBullet()
onHitWithBullet(bullet: any): void {
  // 1. 检查保护状态（有保护则不扣命）
  if (this.isShieldActive) {
    this.consumeShield(bullet)  // 消耗护盾
    return  // ❌ 不扣命，不死亡
  }
  
  if (this.isInvincibleActive) {
    this.consumeInvincible(bullet)  // 消耗无敌
    return  // ❌ 不扣命，不死亡
  }
  
  if (this.currentArmor > 0) {
    this.currentArmor--  // 消耗护甲
    bullet.destroy()
    this.playHitFeedback()
    return  // ❌ 不扣命，不死亡
  }
  
  // 2. 无保护，进入死亡流程
  this.handleDeath()
}
```

### 2️⃣ 扣减生命值

```typescript
// PlayerCombatManager.handleDeath()
private handleDeath(): void {
  // 1. 扣减生命值
  const currentLives = gameStore.lives
  gameStore.loseLife()  // lives--
  
  console.log(`💥 玩家被击中，生命值：${currentLives} → ${gameStore.lives}`)
  
  // 2. 判断是否可复活
  if (gameStore.lives > 0) {
    // ✅ 还有命，可以复活
    this.stateManager.onHit(() => {
      this.startRespawn(gameStore.lives)
    })
  } else {
    // ❌ 生命耗尽，游戏结束
    this.stateManager.markAsDead()
    this.scene.handleGameOver()
  }
}
```

### 3️⃣ 死亡状态

```typescript
// PlayerStateManager.onHit()
onHit(onDeathComplete: () => void): void {
  // 1. 进入死亡状态
  this.enterDyingState()  // state = DYING
  
  // 2. 播放死亡动画（1 秒）
  this.scene.time.delayedCall(this.config.dyingDuration, () => {
    onDeathComplete()  // 调用复活回调
  })
}
```

### 4️⃣ 复活流程

```typescript
// PlayerCombatManager.startRespawn()
private startRespawn(currentLives: number): void {
  console.log(`🔄 开始复活，剩余生命：${currentLives}`)
  
  // 1. 计算复活点坐标
  const startX = (gridCols * cellSize) / 2
  const startY = (gridRows * cellSize) - 100
  
  // 2. 启动状态管理器的复活流程
  this.stateManager.startRespawning(() => {
    // 3. 复活完成回调（2 秒无敌闪烁后）
    
    // ✅ 重置玩家位置
    player.x = startX
    player.y = startY
    
    // ✅ 重置物理体
    player.body.reset(startX, startY)
    player.body.setVelocity(0, 0)
    
    // ✅ 重置方向
    player.direction = 'UP'
    player.setFrame(0)
    
    // ✅ 清除周围敌人
    this.clearSpawnArea(startX, startY, 150)
    
    console.log('✅ [复活完成] 玩家已重置')
  })
}
```

### 5️⃣ 无敌闪烁

```typescript
// PlayerStateManager.startRespawning()
startRespawning(onRespawnComplete: () => void): void {
  // 1. 进入复活状态
  this.enterRespawningState()  // state = RESPAWNING
  
  // 2. 启动闪烁效果（10 次，1 秒）
  this.startBlinkEffect()
  
  // 3. 2 秒无敌时间
  this.scene.time.delayedCall(this.config.invincibleDuration, () => {
    this.finishRespawning()  // state = INVINCIBLE → ALIVE
  })
}
```

---

## 📋 状态流转图

```
ALIVE（存活）
  ↓ 被子弹击中
  ↓ 检查保护（护盾/无敌/护甲）
  ↓ 有保护 → 消耗保护，不扣命
  ↓ 无保护
  ↓
DYING（死亡中）
  ↓ 播放死亡动画（1 秒）
  ↓
  ├─ lives > 0 → RESPAWNING（复活中）
  │   ↓ 闪烁效果（1 秒）
  │   ↓
  │   INVINCIBLE（无敌）
  │   ↓ 2 秒无敌时间
  │   ↓
  │   ALIVE（存活）
  │
  └─ lives = 0 → DEAD（死亡）
      ↓
      GAME_OVER
```

---

## 🎯 关键属性

### PlayerCombatManager
```typescript
{
  isShieldActive: boolean      // 护盾是否激活
  isInvincibleActive: boolean  // 无敌是否激活
  currentArmor: number         // 当前护甲层数
  maxArmor: number             // 最大护甲层数
}
```

### PlayerStateManager
```typescript
{
  currentState: PlayerState    // 当前状态
  isInvincibleInternal: boolean // 内部无敌标记
  blinkTimer: TimerEvent       // 闪烁定时器
  forceVisibleTimer: TimerEvent // 强制可见定时器
}
```

### GameStore（生命值）
```typescript
{
  lives: number  // 剩余生命数
  loseLife(): void  // 扣减生命值
}
```

---

## 🔍 调试要点

### 1. 检查控制台日志
```
💥 玩家被击中，生命值：3 → 2
📊 状态变更：ALIVE → DYING
🎭 播放受击反馈
 触发事件：lifeLost
🔄 PlayerCombatManager: 开始复活，剩余生命：2
📍 复活位置计算：{ startX: 768, startY: 1436 }
 清除 1 个敌人
🔄 状态变更：DYING → RESPAWNING
🔍 [闪烁] 开始闪烁效果
📊 状态变更：RESPAWNING → INVINCIBLE
📍 [复活] 玩家位置重置到 (768, 1436)
✅ [复活] 物理体已重置
✅ [复活] 方向已重置
✅ [复活完成] 玩家已重置
```

### 2. 检查调试面板
- **位置**：应该显示复活点坐标
- **状态**：RESPAWNING → INVINCIBLE → ALIVE
- **可见**：✅（即使在闪烁期间，consumeShield 也会强制设置可见）
- **生命数**：扣减后的值

### 3. 常见问题排查

**问题 1：玩家消失但监控显示可见**
- 原因：闪烁效果停在 invisible 状态
- 解决：consumeShield 中调用 stopBlinkEffect()

**问题 2：调试面板显示"玩家不存在"**
- 原因：销毁重建方案导致引用失效
- 解决：使用重置状态方案

**问题 3：复活后被敌人包围**
- 原因：没有清除周围敌人
- 解决：调用 clearSpawnArea()

---

## 📝 测试场景

### 场景 1：有护盾时被击中
```
预期：
1. 护盾消耗
2. 不扣命（lives 不变）
3. 玩家不死亡
4. 继续游戏
```

### 场景 2：无保护时被击中（lives=3）
```
预期：
1. 扣命（lives: 3→2）
2. 进入死亡状态
3. 播放死亡动画（1 秒）
4. 开始复活
5. 闪烁效果（1 秒）
6. 出现在复活点
7. 无敌状态（2 秒）
8. 恢复正常
```

### 场景 3：最后一条命被击中（lives=1）
```
预期：
1. 扣命（lives: 1→0）
2. 进入死亡状态
3. 播放死亡动画（1 秒）
4. 生命耗尽
5. 游戏结束
```

---

## 🎨 视觉效果

### 死亡动画
- 播放爆炸粒子效果
- 相机震动
- 播放受击音效

### 复活闪烁
- 10 次闪烁（100ms 间隔）
- 可见/不可见切换
- 结束后强制可见

### 无敌状态
- 半透明效果（alpha=0.5）
- 持续 2 秒
- 自动消失

---

## 🚀 性能优化

### 对象池（未来优化）
```typescript
// 当前：直接重置状态
player.x = startX
player.y = startY

// 未来：使用对象池
const player = playerPool.get()
player.reset(startX, startY)
```

### 定时器清理
```typescript
// 确保死亡时清理所有定时器
this.cleanupTimers()
```

---

## 📚 相关文件

- `PlayerCombatManager.ts` - 战斗逻辑、生命扣减
- `PlayerStateManager.ts` - 状态管理、复活流程
- `PlayerDebugPanel.ts` - 调试信息显示
- `GameStore.ts` - 生命值存储

---

## ✅ 总结

**核心设计**：
1. ✅ 采用状态重置方案（不销毁重建）
2. ✅ 保护机制优先（护盾/无敌/护甲）
3. ✅ 只有无保护时才扣命
4. ✅ 扣命后判断是否可复活
5. ✅ 复活时重置所有状态

**优势**：
- 代码简单清晰
- 调试面板稳定
- 管理器引用不失效
- 符合 Phaser 最佳实践
