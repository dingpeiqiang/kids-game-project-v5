# 🎯 敌人射击系统 - 难度提升功能

## 📋 功能概述

实现了敌人发射子弹的功能，随着波次增加，更多敌人类型获得射击能力，游戏难度不断提升！

---

## ✨ 核心特性

### 1. **波次解锁机制**

不同敌人类型在不同波次解锁射击能力：

| 敌人类型 | 解锁波次 | 冷却时间 | 射程 | 伤害 | 子弹速度 | 颜色 |
|---------|---------|---------|------|------|---------|------|
| **Tank（坦克）** | 第5波 | 3秒 | 200px | 15 | 3 | 🟡 黄色 |
| **Boss** | 第8波 | 2秒 | 250px | 25 | 4 | 🔴 红色 |
| **Flyer（飞行者）** | 第12波 | 2.5秒 | 180px | 12 | 3.5 | 🔵 蓝色 |

---

### 2. **智能瞄准系统**

敌人会优先攻击：
1. **最近的炮台**（如果在射程内）
2. **玩家角色**（默认目标）

```typescript
// 寻找目标逻辑
let targetX = state.player.x
let targetY = state.player.y
let minDist = distance(enemy, player)

// 如果有炮台，瞄准最近的炮台
for (const turret of state.turrets) {
  const dist = distance(enemy, turret)
  if (dist < minDist && dist <= enemy.shootRange) {
    targetX = turret.x
    targetY = turret.y
    minDist = dist
  }
}
```

---

### 3. **视觉效果**

- ✨ **发光效果**: 子弹带有颜色光晕
- 💫 **击中特效**: 碰撞时产生3个粒子爆炸
- 📊 **伤害数字**: 显示对炮台的伤害值
- 🎨 **颜色区分**: 不同敌人类型的子弹颜色不同

---

## 🔧 技术实现

### 文件结构

```
src/games/rpgShooterTowerDefense/
├── types.ts              # 添加 EnemyBullet 接口和 GameState.enemyBullets
├── config.ts             # 添加 ENEMY_SHOOT_CONFIGS 配置
├── enemies.ts            # 添加 updateEnemyShooting 函数
├── enemyBullets.ts       # 新建：敌人子弹更新和绘制
└── init.ts               # 集成敌人子弹系统
```

---

### 1. 类型定义（types.ts）

```typescript
// 敌人子弹接口
export interface EnemyBullet {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  speed: number
  color: string
  size: number
  owner: string         // 发射者ID
}

// GameState 添加
enemyBullets: EnemyBullet[]
```

---

### 2. 射击配置（config.ts）

```typescript
export const ENEMY_SHOOT_CONFIGS = {
  tank: {
    minWave: 5,
    shootCooldown: 3000,
    shootRange: 200,
    bulletDamage: 15,
    bulletSpeed: 3,
    bulletColor: '#FFD93D',
    bulletSize: 4
  },
  boss: {
    minWave: 8,
    shootCooldown: 2000,
    shootRange: 250,
    bulletDamage: 25,
    bulletSpeed: 4,
    bulletColor: '#FF0000',
    bulletSize: 6
  },
  flyer: {
    minWave: 12,
    shootCooldown: 2500,
    shootRange: 180,
    bulletDamage: 12,
    bulletSpeed: 3.5,
    bulletColor: '#87CEEB',
    bulletSize: 3
  }
}
```

---

### 3. 敌人生成（enemies.ts）

```typescript
// createEnemy 函数添加 wave 参数
export function createEnemy(
  type: EnemyType,
  x: number,
  y: number,
  difficultyMultiplier: number = 1,
  wave: number = 1  // 当前波次
): Enemy {
  const base = ENEMY_BASE_STATS[type]
  
  // 检查是否可以射击（根据波次）
  const shootConfig = (ENEMY_SHOOT_CONFIGS as any)[type]
  const canShoot = shootConfig && wave >= shootConfig.minWave
  
  return {
    // ... 其他属性
    canShoot,
    shootCooldown: canShoot ? (shootConfig.shootCooldown || 3000) : 0,
    lastShot: 0,
    shootRange: canShoot ? (shootConfig.shootRange || 200) : 0
  }
}
```

---

### 4. 射击逻辑（enemies.ts）

```typescript
// 在 updateEnemies 中调用
if (enemy.canShoot && !enemy.frozen) {
  updateEnemyShooting(state, enemy, Date.now())
}

// 射击函数
function updateEnemyShooting(
  state: GameState,
  enemy: Enemy,
  currentTime: number
): void {
  // 检查冷却时间
  if (currentTime - enemy.lastShot < enemy.shootCooldown) {
    return
  }
  
  // 获取射击配置
  const shootConfig = (ENEMY_SHOOT_CONFIGS as any)[enemy.type]
  if (!shootConfig) return
  
  // 寻找目标（玩家或最近的炮台）
  let targetX = state.player.x
  let targetY = state.player.y
  // ... 瞄准逻辑
  
  // 检查是否在射程内
  if (minDist > enemy.shootRange) {
    return
  }
  
  // 计算子弹方向
  const dx = targetX - enemy.x
  const dy = targetY - enemy.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  
  const vx = (dx / dist) * shootConfig.bulletSpeed
  const vy = (dy / dist) * shootConfig.bulletSpeed
  
  // 创建敌人子弹
  state.enemyBullets.push({
    id: `eb_${Date.now()}_${Math.random()}`,
    x: enemy.x,
    y: enemy.y,
    vx,
    vy,
    damage: shootConfig.bulletDamage,
    speed: shootConfig.bulletSpeed,
    color: shootConfig.bulletColor,
    size: shootConfig.bulletSize,
    owner: enemy.id
  })
  
  enemy.lastShot = currentTime
}
```

---

### 5. 子弹更新和碰撞（enemyBullets.ts）

```typescript
export function updateEnemyBullets(state: GameState, dt: number): void {
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const bullet = state.enemyBullets[i]
    
    // 移动子弹
    bullet.x += bullet.vx * 60 * dt
    bullet.y += bullet.vy * 60 * dt
    
    // 检查是否超出屏幕
    if (bullet.x < -50 || bullet.x > CANVAS_WIDTH + 50 || 
        bullet.y < -50 || bullet.y > CANVAS_HEIGHT + 50) {
      state.enemyBullets.splice(i, 1)
      continue
    }
    
    // 检查与玩家的碰撞
    const distToPlayer = Math.sqrt(
      (bullet.x - state.player.x) ** 2 + 
      (bullet.y - state.player.y) ** 2
    )
    
    if (distToPlayer < 8 * SCALE_RATIO + bullet.size) {
      // 击中玩家
      playerHit(state, bullet.damage)
      
      // 击中特效
      for (let j = 0; j < 3; j++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 1 + Math.random() * 2
        state.particles.push({
          x: bullet.x,
          y: bullet.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.3 + Math.random() * 0.2,
          maxLife: 0.5,
          color: bullet.color,
          size: 2 + Math.random() * 2
        })
      }
      
      state.enemyBullets.splice(i, 1)
      continue
    }
    
    // 检查与炮台的碰撞
    // ... 类似逻辑
  }
}
```

---

### 6. 集成到主循环（init.ts）

```typescript
// 导入
import { updateEnemyBullets, drawEnemyBullets } from './enemyBullets'

// 更新循环
updateEnemies(state, dt)
updateEnemyBullets(state, dt)  // 新增
updateProjectiles(state, dt)

// 绘制循环
drawEnemy(ctx, enemy)
drawEnemyBullets(ctx, state)  // 新增
drawProjectiles(ctx, state)
```

---

## 🎮 游戏体验提升

### 难度曲线

```
波次 1-4:   普通敌人，无射击能力
波次 5-7:   Tank开始射击（3秒冷却，中等威胁）
波次 8-11:  Boss加入射击（2秒冷却，高威胁）
波次 12+:   Flyer加入射击（2.5秒冷却，空中威胁）
```

### 策略变化

**之前**:
- 主要关注近战敌人
- 炮台位置不太重要
- 可以轻松风筝敌人

**现在**:
- 需要保护炮台免受远程攻击
- 炮台摆放位置更加关键
- 需要躲避敌人子弹
- 优先击杀射手型敌人

---

## 📊 性能优化

1. **对象池**: 可以考虑使用对象池管理子弹
2. **空间分区**: 大量子弹时使用四叉树优化碰撞检测
3. **离屏剔除**: 只更新屏幕内的子弹

---

## 🔄 未来扩展

### 可能的增强

1. **特殊子弹类型**:
   - 追踪弹
   - 散射弹
   - 穿透弹
   - 爆炸弹

2. **敌人技能**:
   - 蓄力射击（更高伤害）
   - 快速连射
   - 弹幕模式

3. **防御机制**:
   - 护盾炮台（吸收子弹）
   - 反射陷阱（反弹子弹）
   - 闪避技能（玩家主动躲避）

4. **难度调整**:
   - 动态调整射击频率
   - 根据玩家血量调整瞄准精度
   - Boss阶段转换时的弹幕攻击

---

## 📝 修改文件清单

| 文件 | 修改内容 | 行数变化 |
|------|---------|---------|
| `types.ts` | 添加 EnemyBullet 接口和 enemyBullets 数组 | +15 |
| `config.ts` | 添加 ENEMY_SHOOT_CONFIGS 配置 | +34 |
| `state.ts` | 初始化 enemyBullets 数组 | +1 |
| `enemies.ts` | 修改 createEnemy，添加 updateEnemyShooting | +78 |
| `enemyBullets.ts` | 新建模块：更新和绘制敌人子弹 | +142 |
| `init.ts` | 集成敌人子弹系统 | +5 |

**总计**: +275行新代码

---

## ✅ 测试建议

1. **基础测试**:
   - 第5波前确认敌人不射击
   - 第5波后Tank应该射击
   - 第8波后Boss应该射击
   - 第12波后Flyer应该射击

2. **碰撞测试**:
   - 子弹击中玩家 → 扣血
   - 子弹击中炮台 → 炮台扣血
   - 子弹超出屏幕 → 自动清除

3. **视觉测试**:
   - 子弹颜色和大小正确
   - 击中特效正常显示
   - 伤害数字正确显示

4. **性能测试**:
   - 大量敌人同时射击时的帧率
   - 长时间游戏的内存占用

---

## 🎉 总结

敌人射击系统的实现大幅提升了游戏的挑战性和策略性：

✅ **波次解锁机制** - 逐步增加难度  
✅ **智能瞄准** - 优先攻击炮台  
✅ **视觉反馈** - 发光效果和粒子特效  
✅ **模块化设计** - 独立的enemyBullets模块  
✅ **可扩展性** - 易于添加新的子弹类型  

游戏现在更具竞技性和解压感！🚀
