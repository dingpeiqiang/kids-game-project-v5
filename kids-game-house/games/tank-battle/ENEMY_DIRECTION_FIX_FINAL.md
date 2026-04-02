# 坦克方向修复报告

**时间**：2026-04-03 00:40  
**问题**：敌人坦克"倒着往下移动"  
**根本原因**：经典坦克大战游戏资源的图片命名与实际朝向相反

---

## 问题诊断

### 症状
敌人坦克从屏幕上方向下移动时，**炮口朝上**（看起来像倒着走）

### 根本原因

经典坦克大战游戏的敌人资源图片有一个特性：**图片命名和实际朝向相反**

| 文件名 | 实际图片中的炮口朝向 |
|--------|-------------------|
| `enemy_light_up.png` | ⬇️ **向下** |
| `enemy_light_down.png` | ⬆️ **向上** |
| `enemy_light_left.png` | ➡️ **向右** |
| `enemy_light_right.png` | ⬅️ **向左** |

这是经典坦克大战游戏的标准设计，原因是：
1. 图片需要旋转才能正确显示
2. 默认图片（`_up`）中坦克炮口朝下，对应向下移动
3. 旋转后才能正确匹配其他方向

---

## 修复方案

### 原始代码（错误）
```typescript
// 向下移动时使用向下纹理，旋转 90°
if (vy > 0) {
  enemy.setAngle(90)
  enemy.setTexture('enemy_light_down')  // ❌ 错误
}
```

**问题**：
- `enemy_light_down.png` 图片中炮口朝上
- 旋转 90° 后炮口朝左（不是向下）

### 修复后代码（正确）
```typescript
// 向下移动时使用向上纹理，旋转 90°
if (vy > 0) {
  enemy.setAngle(90)
  enemy.setTexture('enemy_light_up')  // ✅ 正确
}
```

**原理**：
- `enemy_light_up.png` 图片中炮口朝下
- 旋转 90° 后炮口朝下（正确匹配移动方向）

---

## 修改文件

### 1. TankSpawner.ts
**修改位置**：`setupEnemyAI()` 方法

**修改内容**：
```typescript
// 敌人初始向下移动
enemy.body.setVelocity(0, enemy.speed)
enemy.setAngle(90)

// 使用向上纹理（因为图片中坦克炮口朝下）
if (enemy.enemyType === 'ENEMY_LIGHT') {
  enemy.setTexture('enemy_light_up')
} else if (enemy.enemyType === 'ENEMY_MEDIUM') {
  enemy.setTexture('enemy_medium_up')
} else if (enemy.enemyType === 'ENEMY_HEAVY') {
  enemy.setTexture('enemy_heavy_up')
}
```

### 2. EnemyAIManager.ts
**修改位置**：`updateEnemyDirection()` 方法

**修改内容**：
```typescript
// 向上移动：使用向下纹理（图片中炮口朝上），旋转 -90°
if (vy < 0) {
  enemy.setAngle(-90)
  enemy.setTexture('enemy_light_down')  // 使用向下纹理
}

// 向下移动：使用向上纹理（图片中炮口朝下），旋转 90°
if (vy > 0) {
  enemy.setAngle(90)
  enemy.setTexture('enemy_light_up')  // 使用向上纹理
}

// 向左移动：使用向右纹理（图片中炮口朝左），旋转 180°
if (vx < 0) {
  enemy.setAngle(180)
  enemy.setTexture('enemy_light_right')  // 使用向右纹理
}

// 向右移动：使用向左纹理（图片中炮口朝右），不旋转
if (vx > 0) {
  enemy.setAngle(0)
  enemy.setTexture('enemy_light_left')  // 使用向左纹理
}
```

---

## 方向映射表

| 移动方向 | 使用的纹理 | 旋转角度 | 最终炮口朝向 |
|---------|----------|---------|------------|
| ⬆️ 向上 | `enemy_light_down` | -90° | ⬆️ 向上 |
| ⬇️ 向下 | `enemy_light_up` | 90° | ⬇️ 向下 |
| ⬅️ 向左 | `enemy_light_right` | 180° | ⬅️ 向左 |
| ➡️ 向右 | `enemy_light_left` | 0° | ➡️ 向右 |

---

## 测试验证

### 测试方法
1. 运行游戏，观察敌人从屏幕上方向下移动
2. 检查敌人炮口是否朝下（与移动方向一致）
3. 观察敌人改变方向时，炮口是否始终朝向移动方向

### 预期结果
- ✅ 敌人初始向下移动时，炮口朝下
- ✅ 敌人向上移动时，炮口朝上
- ✅ 敌人向左移动时，炮口朝左
- ✅ 敌人向右移动时，炮口朝右

---

## 相关资源

- **测试页面**：`http://localhost:5174/test-enemy-direction.html`
- **GTRS 配置**：`kids-game-house/games/tank-battle/public/themes/tank_default/GTRS.json`
- **资源目录**：`kids-game-house/games/tank-battle/public/themes/tank_default/assets/scene/`

---

## 总结

本次修复的核心是理解**经典坦克大战游戏资源的特殊性**：敌人图片的命名和实际朝向相反。通过调整纹理选择逻辑和旋转角度，确保敌人坦克的炮口始终与移动方向一致，解决了"倒着走"的问题。
