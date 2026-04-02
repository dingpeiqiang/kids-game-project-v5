# 碰撞检测与物理体生命周期顺序问题

## 📊 Phaser 执行顺序

### 游戏循环（Game Loop）

```
1. 事件处理（Input）
2. 更新逻辑（Update）
3. 物理模拟（Physics Step）
4. 碰撞检测（Collision Detection）
5. 渲染（Render）
```

### Phaser 碰撞检测时机

```typescript
// Phaser 内部流程（简化）
function gameStep() {
  // 1. 调用场景的 update()
  scene.update()
  
  // 2. 物理世界步进
  physics.world.step()
    // 2.1 更新所有物理体位置
    bodies.forEach(body => body.update())
    
    // 2.2 检测碰撞
    collisionDetection()
      // 2.3 触发碰撞回调
      overlapCallbacks.fire()
      colliderCallbacks.fire()
  
  // 3. 渲染
  renderer.render()
}
```

---

## 🔍 当前实现分析

### 1. 敌人子弹击中玩家

```typescript
// CollisionManager.ts:193
physics.add.overlap(enemyBullets, player, (bullet, hitPlayer) => {
  // ✅ 立即标记子弹已命中
  bullet.setData('hit', true)
  
  // ✅ 调用战斗管理器
  combatManager.onHitWithBullet(bullet)
})

// PlayerCombatManager.ts
onHitWithBullet(bullet: any): void {
  // 1. 检查保护（护盾/无敌/护甲）
  if (this.isShieldActive) {
    this.consumeShield(bullet)  // ✅ 消耗护盾，销毁子弹
    return
  }
  
  // 2. 无保护，进入死亡流程
  this.handleDeath()  // ✅ 扣命，触发死亡
}
```

**执行顺序**：
```
碰撞检测（overlap）
  ↓
调用回调函数
  ↓
检查保护状态
  ↓
有保护 → consumeShield(bullet)
  ↓
bullet.destroy()  // ✅ 销毁子弹
  ↓
设置玩家可见（防止消失）
```

### 2. 玩家与敌人相撞

```typescript
// CollisionManager.ts:231
physics.add.collider(player, enemies, () => {
  // ✅ 检查保护
  if (combatManager.hasShield()) return
  if (stateManager.isInvincible()) return
  
  // ✅ 调用战斗管理器
  combatManager.onHit()  // 无子弹参数
})
```

**执行顺序**：
```
碰撞检测（collider）
  ↓
调用回调函数
  ↓
检查保护状态
  ↓
无保护 → combatManager.onHit()
  ↓
handleDeath()  // 扣命，触发死亡
```

---

## ⚠️ 关键问题

### 问题：setActive(false) 后还会触发碰撞吗？

**答案：不会！**

```typescript
// 游戏结束时
player.setActive(false)
player.setVisible(false)

// ❌ 问题：setActive(false) 后
// 1. 玩家从物理世界移除
// 2. 不再参与碰撞检测
// 3. 不会触发任何碰撞回调
```

### 验证

```typescript
// Phaser 源码逻辑（简化）
class GameObject {
  setActive(value: boolean) {
    this.active = value
    
    if (!value) {
      // ❌ 从物理世界移除
      this.scene.physics.world.remove(this.body)
      
      // ❌ 从更新列表移除
      this.scene.updateList.remove(this)
      
      // ❌ 从碰撞检测移除
      this.scene.physics.world.bodies.remove(this.body)
    }
  }
}
```

---

## 🎯 正确的执行顺序

### 场景 1：玩家被子弹击中（有护盾）

```
1. 碰撞检测（overlap）
   → enemyBullets vs player
   
2. 触发回调
   → bullet.setData('hit', true)
   → combatManager.onHitWithBullet(bullet)
   
3. 检查保护
   → isShieldActive = true
   
4. 消耗护盾
   → consumeShield(bullet)
   → bullet.destroy()  // ✅ 销毁子弹
   
5. 重置玩家可见
   → stopBlinkEffect()
   → player.setVisible(true)
   → player.setAlpha(1)
   
6. 继续游戏
   → 玩家存活
   → 物理体正常
```

### 场景 2：玩家被子弹击中（无保护）

```
1. 碰撞检测（overlap）
   → enemyBullets vs player
   
2. 触发回调
   → bullet.setData('hit', true)
   → combatManager.onHitWithBullet(bullet)
   
3. 检查保护
   → isShieldActive = false
   → isInvincibleActive = false
   → currentArmor = 0
   
4. 扣减生命值
   → gameStore.loseLife()  // lives--
   
5. 判断是否可复活
   → if (lives > 0)
     → 进入死亡流程
   → else
     → 游戏结束
     
6. 死亡流程（lives > 0）
   → stateManager.onHit()
   → enterDyingState()
   → player.setVisible(false)  // ✅ 隐藏玩家
   → spawnExplosion()  // ✅ 爆炸特效
   → cameraShake()
   
7. 延迟 1 秒后复活
   → startRespawning()
   → enterRespawningState()
   → startBlinkEffect()
   
8. 2 秒后无敌消失
   → finishRespawning()
   → enterInvincibleState()
   → player.setVisible(true)
   
9. 物理体重建（如果需要）
   → if (!player.body)
     → physics.add.existing(player)
   → player.body.reset()
```

### 场景 3：游戏结束（lives = 0）

```
1. 碰撞检测
2. 扣命（lives: 1 → 0）
3. 判断不可复活
4. stateManager.markAsDead()
5. TankGameManager.playerDies()
6. player.setActive(false)  // ❌ 禁用玩家
7. player.setVisible(false)
8. spawnExplosion()
9. cameraShake()
10. 延迟后游戏结束 UI
```

---

## 🚨 潜在问题

### 问题 1：setActive(false) 后物理体失效

**现象**：
```typescript
// 游戏结束
player.setActive(false)

// 复活时
player.setActive(true)
if (player.body) {
  player.body.reset()  // ❌ body.update 是 undefined
}

// Phaser 更新时
ArcadeSprite2.preUpdate() {
  this.body.update()  // ❌ TypeError!
}
```

**解决**：
```typescript
// ✅ 复活时重建物理体
if (!player.body) {
  this.scene.physics.add.existing(player)
}
player.body.reset()
```

### 问题 2：死亡时是否应该销毁物理体？

**当前方案**：
```typescript
// 死亡时
player.setVisible(false)
// ❌ 不调用 setActive(false)
// ❌ 不销毁物理体
```

**优势**：
- ✅ 物理体保持完整
- ✅ 复活时不需要重建
- ✅ 避免 setActive(false) 的副作用

**建议**：
```typescript
// ✅ 游戏结束时不要调用 setActive(false)
player.setVisible(false)
// 保留物理体，只是不渲染
```

---

## ✅ 最佳实践

### 1. 死亡流程

```typescript
// ✅ 推荐方案
onHit(): void {
  // 1. 隐藏玩家（不销毁物理体）
  player.setVisible(false)
  
  // 2. 播放特效
  spawnExplosion()
  cameraShake()
  
  // 3. 延迟后复活
  this.scene.time.delayedCall(1000, () => {
    startRespawning()
  })
}

// ❌ 避免这样做
onHit(): void {
  player.setActive(false)  // ❌ 会导致物理体失效
  player.setVisible(false)
}
```

### 2. 复活流程

```typescript
// ✅ 标准流程
startRespawning(): void {
  // 1. 先激活
  player.setActive(true)
  
  // 2. 检查并重建物理体
  if (!player.body) {
    physics.add.existing(player)
  }
  
  // 3. 重置位置
  player.body.reset(x, y)
  player.body.setVelocity(0, 0)
  
  // 4. 设置可见
  player.setVisible(true)
  player.setAlpha(1)
}
```

### 3. 游戏结束

```typescript
// ✅ 游戏结束
handleGameOver(): void {
  // 隐藏玩家
  player.setVisible(false)
  
  // ❌ 不要禁用（如果需要复活）
  // player.setActive(false)
  
  // 显示 UI
  showGameOverUI()
}
```

---

## 📊 执行顺序总结

### 完整的游戏循环

```
┌─────────────────────────────────┐
│ 1. Input（输入处理）             │
├─────────────────────────────────┤
│ 2. Update（场景更新）            │
│    - scene.update()              │
│    - 玩家移动                    │
│    - 敌人 AI                     │
├─────────────────────────────────┤
│ 3. Physics（物理模拟）           │
│    - world.step()                │
│    - 更新所有物理体位置          │
│    - body.update()               │
├─────────────────────────────────┤
│ 4. Collision（碰撞检测）         │
│    - overlap 检测                │
│    - collider 检测               │
│    - 触发回调函数                │
│      → onHitWithBullet()         │
│      → handleDeath()             │
├─────────────────────────────────┤
│ 5. Render（渲染）                │
│    - 绘制所有可见对象            │
│    - 粒子特效                    │
│    - UI 元素                     │
└─────────────────────────────────┘
```

### 碰撞回调中的操作顺序

```
碰撞发生
  ↓
Phaser 检测碰撞
  ↓
触发回调函数
  ↓
1. ✅ 立即标记（防止重复触发）
   bullet.setData('hit', true)
   
2. ✅ 检查保护状态
   if (hasShield) return
   
3. ✅ 处理逻辑
   consumeShield(bullet)
   handleDeath()
   
4. ✅ 销毁子弹（如果需要）
   bullet.destroy()
   
5. ✅ 重置玩家状态（如果需要）
   player.setVisible(true)
   player.setAlpha(1)
```

---

## 🎯 关键结论

### 1. 碰撞检测在物理体更新之后

```
Physics Step → Collision Detection
  ↓                    ↓
body.update()      overlap/fire()
```

**意义**：
- ✅ 确保碰撞检测时物理体位置是最新的
- ✅ 避免穿弹问题

### 2. setActive(false) 会移除物理体

```
setActive(false)
  ↓
从物理世界移除
  ↓
不再参与碰撞检测
  ↓
body.update = undefined
```

**影响**：
- ❌ 死亡后不会触发碰撞
- ❌ 复活时需要重建物理体

### 3. 正确的做法

```typescript
// ✅ 死亡时
player.setVisible(false)
// 不调用 setActive(false)

// ✅ 复活时
player.setActive(true)
if (!player.body) {
  physics.add.existing(player)
}
player.body.reset()
player.setVisible(true)
```

---

## 📚 相关文件

- `CollisionManager.ts:193-214` - 子弹碰撞检测
- `CollisionManager.ts:231-249` - 敌人碰撞检测
- `PlayerCombatManager.ts:109-165` - 受击处理
- `PlayerStateManager.ts:111-126` - 死亡流程
- `phaser.js:45955` - Phaser 物理体更新

---

## ✅ 总结

**核心答案**：
1. ✅ **碰撞检测在前** - Phaser 先检测碰撞，再触发回调
2. ✅ **物理体更新在前** - 先更新物理体位置，再检测碰撞
3. ✅ **死亡逻辑在后** - 碰撞回调中触发死亡逻辑
4. ✅ **物理体消亡最后** - 死亡后物理体仍然存在（除非主动销毁）

**关键改进**：
- ✅ 死亡时不要调用 `setActive(false)`
- ✅ 复活时检查并重建物理体
- ✅ 使用 `setVisible(false)` 替代 `setActive(false)`

**验证方法**：
- ✅ 查看日志中的"物理体已重新创建"
- ✅ 没有 Phaser 错误
- ✅ 碰撞正常触发
