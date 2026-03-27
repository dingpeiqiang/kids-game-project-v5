# 📋 游戏框架优化 - 快速参考

**版本**: v2.0.0  
**日期**: 2026-03-27  
**用途**: 快速查阅新增类型和用法

---

## 🎯 新增类型分类

### 游戏实体（2 个）

| 类型 | 用途 | 示例 |
|------|------|------|
| `SpriteConfig` | 精灵配置 | x, y, scale, rotation |
| `PhysicsBodyConfig` | 物理身体配置 | size, offset, bounce |

---

### 粒子系统（2 个）

| 类型 | 用途 | 预设值 |
|------|------|--------|
| `ParticleEmitterConfig` | 粒子发射器配置 | texture, frequency, lifespan |
| `ParticlePreset` | 粒子效果预设 | 'explosion', 'sparkle', 'fire' |

---

### 状态管理（3 个）

| 类型 | 用途 | 枚举值 |
|------|------|--------|
| `GamePhase` | 游戏阶段 | NOT_STARTED, PLAYING, PAUSED, VICTORY, DEFEAT |
| `GameEventType` | 事件类型 | 'game:start', 'score:update', 'player:die' |
| `GameEventHandler` | 事件处理器 | `(event: any) => void` |

---

### 输入控制（3 个）

| 类型 | 用途 | 说明 |
|------|------|------|
| `InputDirection` | 输入方向 | 位运算支持：UP=1, DOWN=2, LEFT=4, RIGHT=8 |
| `VirtualJoystickConfig` | 虚拟摇杆配置 | scene, x, y, radius, color |
| `ButtonMapping` | 按钮映射 | confirm, cancel, pause, menu |

---

### 数据持久化（8 个）

| 类型 | 用途 | 核心字段 |
|------|------|---------|
| `SaveData` | 存档数据 | saveId, progress, player, settings |
| `GameProgress` | 游戏进度 | currentLevel, highScore, totalPlayTime |
| `PlayerData` | 玩家数据 | playerId, level, coins, diamonds |
| `InventoryItem` | 背包物品 | itemId, itemType, quantity, rarity |
| `EquipmentSlot` | 装备槽位 | 'head', 'body', 'weapon', 'accessory' |
| `GameSettings` | 游戏设置 | bgmVolume, sfxVolume, difficulty |
| `GameStatistics` | 统计数据 | winRate, totalKills, averageScore |
| `AchievementData` | 成就数据 | unlockedAchievements, achievementProgress |

---

### 动画系统（2 个）

| 类型 | 用途 | 配置项 |
|------|------|--------|
| `AnimationClipConfig` | 动画剪辑配置 | key, texture, frames, frameRate |
| `TweenConfig` | 补间动画配置 | targets, duration, ease, onComplete |

---

### 工具类（2 个）

| 类型 | 用途 | 方法 |
|------|------|------|
| `SeededRandomGenerator` | 随机种子生成器 | setSeed, next, int, float, choice, shuffle |
| `NotificationConfig` | 通知配置 | type, title, message, duration |

---

## ⚡ 快速使用示例

### 1. 创建游戏精灵

```typescript
import type { SpriteConfig } from '@kids-game/framework/types'

const playerConfig: SpriteConfig = {
  key: 'player',
  x: 100,
  y: 200,
  scale: 1.5,
  rotation: Math.PI / 4
}

const player = this.add.sprite(playerConfig.x, playerConfig.y, playerConfig.key)
```

---

### 2. 配置物理身体

```typescript
import type { PhysicsBodyConfig } from '@kids-game/framework/types'

const bodyConfig: PhysicsBodyConfig = {
  enable: true,
  size: { width: 32, height: 64 },
  bounce: 0.5,
  drag: 0.1
}

this.physics.add.existing(gameObject, false)
gameObject.body.setSize(bodyConfig.size.width, bodyConfig.size.height)
```

---

### 3. 管理游戏状态

```typescript
import { GamePhase } from '@kids-game/framework/types'

class GameState {
  private phase: GamePhase = GamePhase.NOT_STARTED
  
  startGame(): void {
    if (this.phase === GamePhase.NOT_STARTED) {
      this.phase = GamePhase.PLAYING
      this.emit('game:start')
    }
  }
  
  pause(): void {
    if (this.phase === GamePhase.PLAYING) {
      this.phase = GamePhase.PAUSED
      this.emit('game:pause')
    }
  }
}
```

---

### 4. 处理输入方向

```typescript
import { InputDirection } from '@kids-game/framework/types'

function getDirection(keys: KeyboardKeys): InputDirection {
  let dir = InputDirection.NONE
  
  if (keys.up) dir |= InputDirection.UP
  if (keys.down) dir |= InputDirection.DOWN
  if (keys.left) dir |= InputDirection.LEFT
  if (keys.right) dir |= InputDirection.RIGHT
  
  return dir
}

// 使用
const direction = getDirection(this.input.keyboard.keys)
```

---

### 5. 保存游戏进度

```typescript
import type { SaveData } from '@kids-game/framework/types'

const saveData: SaveData = {
  saveId: 'save_001',
  saveName: '我的存档',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  progress: {
    currentLevel: 5,
    highScore: 10000,
    totalPlayTime: 7200
  },
  player: {
    playerId: 'player_123',
    playerName: '小明',
    level: 10,
    coins: 1000
  },
  settings: {
    bgmVolume: 0.8,
    sfxVolume: 0.6,
    difficulty: 'medium'
  }
}

localStorage.setItem('save', JSON.stringify(saveData))
```

---

### 6. 创建粒子效果

```typescript
import type { ParticlePreset } from '@kids-game/framework/types'

function createExplosion(scene: Phaser.Scene, x: number, y: number): void {
  const emitter = scene.particles.createEmitter({
    texture: 'particles',
    x, y,
    speed: { min: 100, max: 200 },
    scale: { start: 1, end: 0 },
    lifespan: 500,
    gravityY: 0,
    blendMode: 'ADD'
  })
  
  setTimeout(() => emitter.stop(), 100)
}
```

---

### 7. 播放补间动画

```typescript
import type { TweenConfig } from '@kids-game/framework/types'

const tweenConfig: TweenConfig = {
  targets: player,
  x: player.x + 100,
  duration: 500,
  ease: 'Power2',
  yoyo: true,
  onComplete: () => console.log('动画完成')
}

this.tweens.add(tweenConfig)
```

---

### 8. 显示通知

```typescript
import type { NotificationConfig } from '@kids-game/framework/types'

const notification: NotificationConfig = {
  type: 'success',
  title: '成就解锁！',
  message: '恭喜获得"首次胜利"成就',
  duration: 3000,
  icon: '🏆',
  onClick: () => console.log('通知被点击')
}

showNotification(notification)
```

---

## 📊 类型导入速查

### 整体导入

```typescript
import * as T from '@kids-game/framework/types'

const config: T.SpriteConfig = { ... }
```

---

### 按需导入

```typescript
import type { 
  SpriteConfig,
  GamePhase,
  SaveData
} from '@kids-game/framework/types'
```

---

### 分类导入

```typescript
// 游戏实体
import type { SpriteConfig, PhysicsBodyConfig } from '@kids-game/framework/types/entities'

// 粒子系统
import type { ParticleEmitterConfig, ParticlePreset } from '@kids-game/framework/types/particles'

// 状态管理
import type { GamePhase, GameEventType } from '@kids-game/framework/types/state'

// 数据持久化
import type { SaveData, PlayerData } from '@kids-game/framework/types/save-data'
```

---

## 🔧 常用工具函数

### 颜色工具

```typescript
import { hexToNumber, lerpColor } from '@kids-game/framework/utils'

const red = hexToNumber('#ff0000')
const blue = hexToNumber('#0000ff')
const purple = lerpColor(red, blue, 0.5) // 紫色
```

---

### 数学工具

```typescript
import { lerp, clamp, randomInt } from '@kids-game/framework/utils'

// 插值
const value = lerp(0, 100, 0.5) // 50

// 限制范围
const clamped = clamp(150, 0, 100) // 100

// 随机整数
const rand = randomInt(1, 10) // 1-10 之间的随机数
```

---

## 📋 检查清单

### 类型使用检查

- [ ] 导入正确的类型
- [ ] 添加类型注解
- [ ] 遵循类型约束
- [ ] 使用可选属性（?）
- [ ] 扩展接口而非修改

---

### 最佳实践

- [ ] 优先使用接口而非类型别名
- [ ] 使用 readonly 标记只读属性
- [ ] 使用联合类型表示有限选项
- [ ] 为回调函数定义类型
- [ ] 使用泛型提高复用性

---

## 📞 常见问题

### Q: 如何选择使用 interface 还是 type？

**A**: 
- ✅ **interface**: 对象形状定义，支持扩展
- ✅ **type**: 联合类型、元组、复杂类型

---

### Q: 如何处理 Phaser 的类型？

**A**: 
- ✅ 使用 `any` 简化依赖
- ✅ 必要时从 'phaser' 导入
- ✅ 避免深度嵌套的 Phaser 类型

---

### Q: 如何为游戏添加自定义类型？

**A**: 
```typescript
// 1. 继承框架类型
import type { SaveData } from '@kids-game/framework/types'

export interface MyGameSaveData extends SaveData {
  // 添加游戏特定字段
  specialPowerups: string[]
  unlockedCharacters: string[]
}

// 2. 在项目中使用
const save: MyGameSaveData = { ... }
```

---

## 🎯 下一步学习

### 推荐阅读顺序

1. **本文档** - 快速了解新增类型
2. [完整类型定义](./src/types/framework.types.ts) - 查看源码
3. [优化报告](./FRAMEWORK_OPTIMIZATION_REPORT.md) - 详细了解
4. [使用示例](./README.md) - 实际案例

---

**版本**: v2.0.0  
**最后更新**: 2026-03-27  
**维护者**: Sitech AI Team  
**状态**: ✅ 可立即使用
