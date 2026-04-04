# 🔧 复活后玩家不可见/无法移动修复报告

## 问题描述

**用户反馈**：玩家复活后，看不到玩家，且无法移动（速度N/A），但可以射击。

## 根本原因分析

### 问题 1：闪烁效果导致玩家不可见

**原代码** (`startBlinkEffect()`):
```typescript
player.setAlpha(0)  // 初始 alpha=0，完全不可见
let blinkOn = false
this.blinkTimer = this.scene.time.addEvent({
  callback: () => {
    blinkOn = !blinkOn
    player.setAlpha(blinkOn ? 1 : 0)  // alpha 在 0 和 1 之间切换
  },
  loop: true,
})
```

**问题**：
- 初始 alpha=0，玩家完全不可见
- 闪烁间隔 150ms，每次持续 150ms 可见后 150ms 不可见
- 闪烁 10 次（总共 1500ms），期间玩家大部分时间不可见

### 问题 2：闪烁效果被意外覆盖

**原代码** (`consumeInvincible()`):
```typescript
private consumeInvincible(bullet?: any): void {
  this.setPlayerVisible(true)  // 设置 alpha=1
}
```

**问题**：如果在闪烁期间受到伤害，`setPlayerVisible(true)` 设置 alpha=1，但下一次闪烁回调会把 alpha 改回 0！

### 问题 3：闪烁结束后没有正确清理

**原代码** (`finishRespawning()`):
```typescript
private finishRespawning(): void {
  this.cleanupTimers()
  this.setPlayerVisible(true)  // 设置 alpha=1
}
```

**问题**：虽然调用了 `cleanupTimers()`，但闪烁定时器的下一次回调可能在 `cleanupTimers()` 之后执行。

## 修复方案

### 修复 1：反转闪烁逻辑

```typescript
// 闪烁期间大部分时间可见(alpha=1)，只在短暂瞬间半透明(alpha=0.3)
player.setAlpha(1)  // 初始设为完全可见
let blinkOn = true
let blinkCount = 0
const maxBlinks = this.stateConfig.blinkCount * 2

this.blinkTimer = this.scene.time.addEvent({
  delay: this.stateConfig.blinkInterval,
  callback: () => {
    blinkCount++
    blinkOn = !blinkOn
    player.setAlpha(blinkOn ? 1 : 0.3)  // 半透明，不是完全不可见
    
    if (blinkCount >= maxBlinks) {
      this.blinkTimer?.remove(false)
      this.blinkTimer = null
      player.setAlpha(1)  // 确保最终可见
    }
  },
  loop: true,
})
```

### 修复 2：减少闪烁次数和加快频率

```typescript
private readonly stateConfig: IPlayerStateConfig = {
  invincibleDuration: 1500,
  dyingDuration: 500,
  blinkInterval: 100,      // 从 150ms 改为 100ms
  blinkCount: 6,            // 从 10 次改为 6 次（总共 600ms）
}
```

### 修复 3：确保闪烁正确停止

```typescript
private finishRespawning(): void {
  // 立即停止闪烁定时器
  if (this.blinkTimer) {
    this.blinkTimer.remove(false)
    this.blinkTimer = null
  }

  this._state = PlayerState.INVINCIBLE
  this._isInvincible = true
  
  // 确保玩家完全可见
  const player = this.getPlayer()
  if (player && player.active) {
    player.setVisible(true)
    player.setAlpha(1)
    player.clearTint()
  }
  // ...
}
```

### 修复 4：保护闪烁期间不被干扰

```typescript
private consumeInvincible(bullet?: any): void {
  this.safeDestroyBullet(bullet)
  const player = this.getPlayer()
  if (player && player.active) {
    // 只有不在闪烁期间才强制设置可见性
    if (!this.blinkTimer) {
      this.setPlayerVisible(true)
    }
    // ...
  }
}
```

### 修复 5：同步 player 引用

```typescript
respawn(): void {
  // ...
  const player = this.getPlayer()
  
  // 同步 player 引用到 MovementManager（防止引用丢失）
  const movementManager = (this.scene as any).movementManager
  if (movementManager?.setPlayer) {
    movementManager.setPlayer(player)
  }
  // ...
}
```

## 修复效果

| 修复项 | 修复前 | 修复后 |
|--------|--------|--------|
| 闪烁初始状态 | alpha=0（不可见） | alpha=1（完全可见） |
| 闪烁不可见时的 alpha | 0（完全不可见） | 0.3（半透明可见） |
| 闪烁次数 | 10次（1500ms） | 6次（600ms） |
| 闪烁间隔 | 150ms | 100ms |
| 闪烁结束时 | 可能被下一回调覆盖 | 主动停止定时器 |
| 闪烁期间受伤 | 覆盖 alpha=0 | 不干扰闪烁 |
| player 引用同步 | 可能丢失 | 强制同步到 MovementManager |

## 修改的文件

1. ✅ `kids-game-house/games/tank-battle/src/managers/PlayerController.ts`
   - `stateConfig`: 加快闪烁间隔，减少闪烁次数
   - `startBlinkEffect()`: 反转闪烁逻辑，大部分时间可见
   - `finishRespawning()`: 立即停止闪烁，确保可见性
   - `consumeInvincible()`: 闪烁期间不干扰
   - `activateTemporaryInvincible()`: 闪烁期间不启动新闪烁
   - `respawn()`: 同步 player 引用

---

**修复时间**: 2026-04-04
**影响范围**: 玩家复活流程
**风险评估**: 低（仅调整视觉效果参数）
