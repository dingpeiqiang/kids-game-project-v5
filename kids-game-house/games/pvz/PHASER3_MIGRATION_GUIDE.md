# Phaser 2 → Phaser 3 快速迁移指南

## 核心概念映射

| Phaser 2 | Phaser 3 | 说明 |
|----------|----------|------|
| `Phaser.Game` | `Phaser.Game` | 游戏实例创建方式改变 |
| `game.state` | `Scene` | 状态管理改为场景系统 |
| `Phaser.Sprite` | `Phaser.Physics.Arcade.Sprite` | Sprite 基类变化 |
| `game.add.*` | `this.add.*` | 添加对象的方式 |
| `game.physics.arcade` | `this.physics` | 物理系统访问 |
| `animations.add()` | `anims.create()` | 动画定义方式 |
| `input.onTap` | `input.on('pointerdown')` | 输入事件 |

## 快速对照表

### 1. 游戏初始化

```javascript
// ❌ Phaser 2
const game = new Phaser.Game(800, 600, Phaser.AUTO, 'game-container')
game.state.add('Boot', BootState)
game.state.start('Boot')

// ✅ Phaser 3
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 } }
  },
  scene: [BootScene, PlayScene]
}
const game = new Phaser.Game(config)
```

### 2. 场景/状态定义

```javascript
// ❌ Phaser 2 - State
module.exports = {
  preload() { ... },
  create() { ... },
  update() { ... }
}

// ✅ Phaser 3 - Scene
export default class MyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MyScene' })
  }
  preload() { ... }
  create() { ... }
  update(time, delta) { ... }
}
```

### 3. 场景切换

```javascript
// ❌ Phaser 2
this.game.state.start('PlayState')

// ✅ Phaser 3
this.scene.start('PlayScene')
```

### 4. 加载资源

```javascript
// ❌ Phaser 2
this.game.load.image('player', 'assets/player.png')
this.game.load.atlasJSONHash('sprites', 'sprites.png', 'sprites.json')

// ✅ Phaser 3
this.load.image('player', '/assets/player.png')
this.load.atlas('sprites', '/sprites.png', '/sprites.json')
```

### 5. 创建物理对象

```javascript
// ❌ Phaser 2
const player = this.game.add.sprite(100, 100, 'player')
this.game.physics.enable(player, Phaser.Physics.ARCADE)

// ✅ Phaser 3
const player = this.physics.add.sprite(100, 100, 'player')
// 或继承 Phaser.Physics.Arcade.Sprite
```

### 6. 创建物理组

```javascript
// ❌ Phaser 2
this.enemies = this.game.add.physicsGroup(Phaser.Physics.ARCADE)

// ✅ Phaser 3
this.enemies = this.physics.add.group()
```

### 7. 碰撞检测

```javascript
// ❌ Phaser 2
this.game.physics.arcade.collide(player, enemies)
this.game.physics.arcade.overlap(bullets, enemies, callback, null, this)

// ✅ Phaser 3
this.physics.add.collider(player, enemies)
this.physics.add.overlap(bullets, enemies, callback, null, this)
```

### 8. 设置速度

```javascript
// ❌ Phaser 2
sprite.body.velocity.setTo(100, 0)
sprite.body.velocity.x = 100

// ✅ Phaser 3
sprite.setVelocity(100, 0)
sprite.setVelocityX(100)
```

### 9. 边界检测

```javascript
// ❌ Phaser 2
sprite.checkWorldBounds = true
sprite.outOfBoundsKill = true

// ✅ Phaser 3
sprite.setCollideWorldBounds(true)
sprite.on('worldbounds', () => sprite.destroy())
```

### 10. 动画系统

```javascript
// ❌ Phaser 2
sprite.animations.add('walk', ['frame1', 'frame2'], 10, true)
sprite.animations.play('walk')

// ✅ Phaser 3
// 在场景中定义（只需一次）
this.anims.create({
  key: 'walk',
  frames: [
    { key: 'texture', frame: 'frame1' },
    { key: 'texture', frame: 'frame2' }
  ],
  frameRate: 10,
  repeat: -1
})

// 播放动画
sprite.play('walk')
```

### 11. 音频系统

```javascript
// ❌ Phaser 2
const sound = this.game.add.audio('music')
sound.play()

// ✅ Phaser 3
const sound = this.sound.add('music')
sound.play()
```

### 12. 定时事件

```javascript
// ❌ Phaser 2
this.game.time.events.add(1000, callback, this)
this.game.time.events.loop(1000, callback, this)

// ✅ Phaser 3
this.time.addEvent({ delay: 1000, callback, callbackScope: this })
this.time.addEvent({ 
  delay: 1000, 
  callback, 
  callbackScope: this,
  loop: true 
})
```

### 13. 输入事件

```javascript
// ❌ Phaser 2
this.game.input.onTap.add((pointer) => { ... })

// ✅ Phaser 3
this.input.on('pointerdown', (pointer) => { ... })
```

### 14. 文本对象

```javascript
// ❌ Phaser 2
const text = this.game.add.text(x, y, 'Hello', { font: '20px Arial' })
text.anchor.setTo(0.5)

// ✅ Phaser 3
const text = this.add.text(x, y, 'Hello', { font: '20px Arial' })
text.setOrigin(0.5)
```

### 15. 图像对象

```javascript
// ❌ Phaser 2
const image = this.game.add.image(x, y, 'background')
image.anchor.setTo(0, 0)

// ✅ Phaser 3
const image = this.add.image(x, y, 'background')
image.setOrigin(0, 0)
```

## 常见陷阱

### ⚠️ 1. 动画重复定义

```javascript
// ❌ 错误：每次创建精灵都定义动画
class Player extends Phaser.Physics.Arcade.Sprite {
  createAnimations() {
    this.scene.anims.create({ ... }) // 会报错：动画已存在
  }
}

// ✅ 正确：检查动画是否存在
createAnimations() {
  if (!this.scene.anims.exists('walk')) {
    this.scene.anims.create({ ... })
  }
}
```

### ⚠️ 2. 忘记添加到场景

```javascript
// ❌ 错误：创建了精灵但未添加
class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet')
    // 忘记添加！
  }
}

// ✅ 正确：必须添加到场景和物理世界
constructor(scene, x, y) {
  super(scene, x, y, 'bullet')
  scene.add.existing(this)
  scene.physics.add.existing(this)
}
```

### ⚠️ 3. 使用旧的 API

```javascript
// ❌ 错误：Phaser 2 API
this.game.world.setBounds(...)
this.game.input.maxPointers = 1

// ✅ 正确：Phaser 3 API
this.physics.world.setBounds(...)
this.input.maxPointers = 1
```

### ⚠️ 4. 随机数生成

```javascript
// ❌ 错误：Phaser 2
const row = this.game.rnd.integerInRange(0, 6)

// ✅ 正确：Phaser 3
const row = Phaser.Math.Between(0, 6)
```

## 调试技巧

### 启用物理调试

```javascript
const config = {
  physics: {
    default: 'arcade',
    arcade: {
      debug: true // 显示碰撞框
    }
  }
}
```

### 查看场景列表

```javascript
console.log(this.scene.getScenes(true))
```

### 检查动画

```javascript
console.log(this.anims.getAnimationNames())
```

## 迁移步骤

1. **更新依赖**
   ```bash
   npm install phaser@^3.60.0
   ```

2. **重构入口文件**
   - 使用 `config` 对象配置游戏
   - 在 `scene` 数组中注册所有场景

3. **转换 States 为 Scenes**
   - 创建继承 `Phaser.Scene` 的类
   - 修改 `module.exports` 为 `export default class`

4. **更新模型类**
   - 继承 `Phaser.Physics.Arcade.Sprite`
   - 在构造函数中调用 `scene.add.existing(this)`

5. **替换 API 调用**
   - 使用对照表查找对应的 Phaser 3 API
   - 注意方法名的变化（如 `anchor` → `setOrigin`）

6. **测试和调试**
   - 逐个场景测试
   - 启用物理调试模式
   - 检查控制台错误

## 参考资源

- [Phaser 3 官方文档](https://phaser.io/phaser3)
- [Phaser 3 Examples](https://labs.phaser.io/)
- [迁移指南（官方）](https://phaser.io/tutorials/making-your-first-phaser-3-game)
- [API 文档](https://photonstorm.github.io/phaser3-docs/)

---

**提示**: 建议先在小型项目上练习 Phaser 3，熟悉新 API 后再迁移大型项目。