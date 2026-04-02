# 敌人坦克基地攻击优化报告

## 📋 优化目标

将敌人坦克的主要目标从"追逐玩家"改为"攻击基地"，提升游戏策略性和挑战性。

## 🎯 优化方案

### 1. 移动策略优化：优先向基地移动

**修改文件**: `src/managers/EnemyAIManager.ts`

**核心改动**: `changeDirectionSmart()` 方法

#### 方向评分权重对比

| 目标 | 旧权重 | 新权重 | 说明 |
|------|--------|--------|------|
| 追逐玩家 | 10 | 5 | 从主要目标降为次要目标 |
| 攻击基地 | 0 | 30 | 新增主要目标，权重 6 倍 |
| 基地距离加成 | 0 | 15 | 越接近基地，得分越高 |

#### 方向得分算法

```typescript
// 🏠 基地攻击得分（主要目标，权重 30）
const distanceToBase = Phaser.Math.Distance.Between(
  enemy.x + dir.x * 0.1,
  enemy.y + dir.y * 0.1,
  baseX,
  baseY
)
const currentDistanceToBase = Phaser.Math.Distance.Between(enemy.x, enemy.y, baseX, baseY)

if (distanceToBase < currentDistanceToBase) {
  score += (currentDistanceToBase - distanceToBase) * 30  // 权重 30
}

// 🏠 基地距离加成（鼓励靠近基地）
const baseProximityBonus = Math.max(0, 800 - distanceToBase) / 10
score += baseProximityBonus * 15  // 权重 15

// 🎯 追逐玩家得分（次要目标，权重 5）
const distanceToPlayer = Phaser.Math.Distance.Between(
  enemy.x + dir.x * 0.1,
  enemy.y + dir.y * 0.1,
  playerX,
  playerY
)
const currentDistanceToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, playerX, playerY)

if (distanceToPlayer < currentDistanceToPlayer) {
  score += (currentDistanceToPlayer - distanceToPlayer) * 5  // 权重 5
}
```

#### 敌人类型差异化策略

| 敌人类型 | 基地攻击权重 | 策略特点 |
|----------|--------------|----------|
| **轻型** | 40 | 进攻性最强，优先快速接近基地 |
| **中型** | 25 | 平衡策略，兼顾基地和玩家 |
| **重型** | 20 | 稳定推进，轻微随机性 |

### 2. 射击策略优化：优先攻击基地

**核心改动**: `enemyShoot()` 方法

#### 射击优先级

1. **最高优先级**: 基地在前方 → 射击基地
2. **次要优先级**: 玩家在前方 → 射击玩家
3. **智能转向**:
   - 重型敌人：转向朝向基地
   - 中型敌人：50% 概率转向朝向基地
   - 轻型敌人：不射击，等待转向

#### 射击逻辑流程

```typescript
// 🏠 判断基地是否在敌人前方（优先目标）
const baseAhead = this.isTargetAhead(enemy, base, velocity)

// 🎯 判断玩家是否在敌人前方（次要目标）
const player = (this.scene as any).player
let playerAhead = false
if (player && player.active) {
  playerAhead = this.isTargetAhead(enemy, player, velocity)
}

// 🎯 决策逻辑
if (baseAhead) {
  // ✅ 基地在前方，射击基地（最高优先级）
  shouldShoot = true
} else if (playerAhead) {
  // ✅ 玩家在前方，射击玩家
  shouldShoot = true
} else {
  // 🧠 转向朝向基地（重型 > 中型概率）
  if (enemy.enemyType === 'ENEMY_HEAVY') {
    this.turnTowardsBase(enemy, base)
    shouldShoot = true
  } else if (enemy.enemyType === 'ENEMY_MEDIUM' && Math.random() < 0.5) {
    this.turnTowardsBase(enemy, base)
    shouldShoot = true
  } else {
    // 等待转向
    shouldShoot = false
  }
}
```

### 3. 动态射击频率优化

**核心改动**: `updateEnemyAI()` 方法

根据敌人距离基地的远近动态调整射击频率：

| 距离基地 | 射击概率 | 说明 |
|----------|----------|------|
| < 300px | 15% | 非常靠近基地时，攻击最频繁 |
| < 500px | 10% | 靠近基地时，攻击频率提升 |
| ≥ 500px | 5% | 远离基地时，基础攻击频率 |

```typescript
// 🏠 计算到基地的距离
const base = (this.scene as any).base
let distanceToBase = Infinity
if (base && base.active) {
  distanceToBase = Phaser.Math.Distance.Between(enemy.x, enemy.y, base.x, base.y)
}

// 🎯 动态射击概率
let shootProbability = 0.05  // 基础 5%
if (distanceToBase < 300) {
  shootProbability = 0.15  // 靠近基地时提升到 15%
} else if (distanceToBase < 500) {
  shootProbability = 0.10  // 中等距离时提升到 10%
}

// 🔫 动态射击
if (Math.random() < shootProbability) {
  this.enemyShoot(enemy)
}
```

### 4. 新增通用方法

#### `isTargetAhead()` - 判断目标是否在敌人前方

```typescript
private isTargetAhead(enemy: any, target: any, velocity: any): boolean {
  const tolerance = 100

  const dx = target.x - enemy.x
  const dy = target.y - enemy.y

  if (Math.abs(velocity.y) > Math.abs(velocity.x)) {
    // 垂直移动
    if (velocity.y < 0) {
      return dy < -tolerance  // 向上移动，目标必须在上方
    } else {
      return dy > tolerance   // 向下移动，目标必须在下方
    }
  } else {
    // 水平移动
    if (velocity.x < 0) {
      return dx < -tolerance  // 向左移动，目标必须在左侧
    } else {
      return dx > tolerance   // 向右移动，目标必须在右侧
    }
  }
}
```

#### `turnTowardsTarget()` - 转向朝向目标

```typescript
private turnTowardsTarget(enemy: any, target: any): void {
  const dx = target.x - enemy.x
  const dy = target.y - enemy.y

  const speed = enemy.speed || 100
  let vx = 0, vy = 0

  // 判断主要移动方向
  if (Math.abs(dx) > Math.abs(dy)) {
    vx = dx > 0 ? speed : -speed
    vy = 0
  } else {
    vx = 0
    vy = dy > 0 ? speed : -speed
  }

  // 设置新速度
  if (enemy.body) {
    enemy.body.setVelocity(vx, vy)
    this.updateEnemyDirection(enemy, vx, vy)
  }
}
```

#### `turnTowardsBase()` - 转向朝向基地（重型敌人专属）

```typescript
private turnTowardsBase(enemy: any, base: any): void {
  this.turnTowardsTarget(enemy, base)
}
```

## ✅ 优化效果

### 战略提升

1. **基地优先级**:
   - ✅ 敌人移动优先向基地靠拢
   - ✅ 射击优先攻击基地
   - ✅ 靠近基地时攻击频率提升

2. **玩家挑战**:
   - ✅ 玩家需要兼顾消灭敌人和保护基地
   - ✅ 增加了游戏的策略性和紧迫感
   - ✅ 经典坦克大战核心玩法还原

3. **AI 智能**:
   - ✅ 基地在前方时优先攻击
   - ✅ 重型敌人智能转向基地
   - ✅ 动态射击频率，越近越危险

### 游戏体验

| 场景 | 旧行为 | 新行为 |
|------|--------|--------|
| 敌人生成 | 随机移动 | 立即向基地移动 |
| 接近基地 | 可能忽略玩家 | 集中火力攻击基地 |
| 多个敌人 | 分散攻击玩家 | 协同进攻基地 |
| 基地附近 | 偶尔射击 | 频繁射击（15%） |

## 🔗 相关文件

- `src/managers/EnemyAIManager.ts` - 核心优化文件
- `src/core/TankSpawner.ts` - 敌人生成器（未修改，保持兼容）
- `src/scenes/TankGameScene.ts` - 游戏场景（基地引用来源）

## 📊 技术细节

### 方向权重计算公式

```typescript
score = 100  // 基础得分（安全方向）
      + (currentDistanceToBase - distanceToBase) * 30  // 基地接近得分
      + baseProximityBonus * 15  // 基地距离加成
      + (currentDistanceToPlayer - distanceToPlayer) * 5  // 玩家接近得分（次要）
      + (currentDistanceToBase - distanceToBase) * typeMultiplier  // 类型加成
```

### 射击概率曲线

```
15% ████████████████████  < 300px
10% ██████████████████    < 500px
 5% █████████████        ≥ 500px
```

## 🧪 测试建议

1. **基地攻击测试**:
   - 观察敌人是否优先向基地移动
   - 验证基地在前方时射击优先级
   - 检查靠近基地时攻击频率是否提升

2. **玩家挑战测试**:
   - 测试玩家需要兼顾消灭敌人和保护基地
   - 验证多个敌人协同进攻基地的情况
   - 确认游戏策略性和紧迫感提升

3. **敌人类型差异**:
   - 轻型：快速接近基地
   - 中型：平衡策略
   - 重型：稳定推进 + 智能转向

## 🎮 经典坦克大战对比

| 特性 | 经典坦克大战 | 当前版本 |
|------|--------------|----------|
| 敌人目标 | 基地 + 玩家 | 基地 + 玩家（权重优化） |
| 基地优先级 | 高 | 高（权重 30） |
| 射击频率 | 靠近基地时提升 | 动态调整（5-15%） |
| 敌人类型差异 | 有 | 有（轻/中/重型） |

---

**优化完成时间**: 2026-04-03
**优化类型**: AI 策略增强
**影响范围**: 所有敌人坦克的移动和射击行为
