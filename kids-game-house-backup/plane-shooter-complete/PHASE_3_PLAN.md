# 🎮 飞机大战 - 第三阶段开发计划

**当前状态**: ✅ 环境搭建完成，开发服务器运行中  
**服务器**: http://localhost:8081  
**开始日期**: 2026-03-26

---

## ✅ 当前完成情况

### 环境验证 ✅

```bash
✅ npm install - 依赖安装成功
✅ npm run dev - 开发服务器启动成功
✅ VITE v5.4.21 ready in 692ms
✅ 服务器运行在 http://localhost:8081
```

### 预览浏览器 ✅

- ✅ 预览浏览器已设置
- ✅ 可以通过工具面板按钮访问
- ✅ 支持多网络接口访问

---

## 📋 第三阶段任务清单

### Task 1: 验证当前游戏状态 ⏳ (优先级：高)

**目标**: 确认从贪吃蛇复制的框架能正常运行

**步骤**:
1. [x] 安装依赖
2. [x] 启动开发服务器
3. [ ] 访问 http://localhost:8081
4. [ ] 检查控制台错误
5. [ ] 验证资源加载

**预期结果**:
- ✅ 能看到游戏开始界面
- ✅ UI 组件显示正常
- ✅ 无严重错误
- ⚠️ 游戏内容可能还是贪吃蛇 (待修改)

---

### Task 2: 修改开始界面 📝 (优先级：高)

**文件**: `src/views/StartView.vue`

**需要修改的内容**:

#### 2.1 标题和描述

```vue
<template>
  <div>
    <!-- 标题 -->
    <h2 class="font-bold mb-4">
      🎮 飞机大战
    </h2>
    <p class="text-gray-400 mt-4">
      经典纵向卷轴射击游戏
    </p>
    
    <!-- 操作说明 -->
    <div class="mt-4 text-center text-gray-400">
      <p>💡 WASD/方向键控制移动</p>
      <p>🔫 自动射击</p>
      <p>⚡ 收集道具强化战力</p>
    </div>
  </div>
</template>
```

**参考**: `../plane-shooter-vue3/game-design.md`

---

### Task 3: 实现 Phaser 游戏场景 🎮 (核心任务)

**文件**: `src/phaser/scenes/PlaneShooterScene.ts` (新建)

**实现步骤**:

#### 3.1 基础架构 (参考贪吃蛇)

```typescript
import { Scene } from 'phaser'

export class PlaneShooterScene extends Scene {
  private player!: Phaser.GameObjects.Image
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: {
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
  }
  
  constructor() {
    super('PlaneShooterScene')
  }
  
  preload(): void {
    // 加载 GTRS 资源
    this.loadGTRSResources()
  }
  
  create(): void {
    // 创建玩家飞机
    this.createPlayer()
    
    // 初始化输入
    this.initInput()
    
    // 创建敌机组
    this.enemyGroup = this.add.group()
    
    // 创建子弹组
    this.bulletGroup = this.add.group()
    
    // 启动射击定时器
    this.time.addEvent({
      delay: 200,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true
    })
    
    // 启动敌机生成器
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    })
  }
  
  update(time: number, delta: number): void {
    // 玩家移动
    this.handlePlayerMovement()
    
    // 碰撞检测
    this.checkCollisions()
  }
}
```

#### 3.2 玩家控制

```typescript
private createPlayer(): void {
  const centerX = this.cameras.main.width / 2
  const bottomY = this.cameras.main.height - 100
  
  // 使用 GTRS 资源
  this.player = this.add.image(centerX, bottomY, 'player_plane')
  this.player.setDisplaySize(60, 80)
  
  // 添加物理身体
  this.physics.add.existing(this.player)
  const body = this.player.body as Phaser.Physics.Arcade.Body
  body.setCollideWorldBounds(true)
}

private initInput(): void {
  // 键盘输入
  this.cursors = this.input.keyboard!.createCursorKeys()
  this.wasd = {
    up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
  }
}

private handlePlayerMovement(): void {
  const speed = 10
  const body = this.player.body as Phaser.Physics.Arcade.Body
  
  if (this.cursors.left.isDown || this.wasd.left.isDown) {
    body.setVelocityX(-speed)
  } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
    body.setVelocityX(speed)
  } else {
    body.setVelocityX(0)
  }
  
  if (this.cursors.up.isDown || this.wasd.up.isDown) {
    body.setVelocityY(-speed)
  } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
    body.setVelocityY(speed)
  } else {
    body.setVelocityY(0)
  }
}
```

#### 3.3 自动射击系统

```typescript
private fireBullet(): void {
  const playerBody = this.player.body as Phaser.Physics.Arcade.Body
  
  // 创建子弹
  const bullet = this.add.image(
    this.player.x,
    this.player.y - 40,
    'bullet_player_1'
  )
  bullet.setDisplaySize(10, 20)
  
  this.physics.add.existing(bullet)
  const bulletBody = bullet.body as Phaser.Physics.Arcade.Body
  bulletBody.setVelocityY(-15)
  
  this.bulletGroup.add(bullet)
  
  // 播放射击音效
  this.playSound('effect_fire')
  
  // 自动清理超出屏幕的子弹
  this.time.delayedCall(2000, () => {
    if (bullet.active) {
      bullet.destroy()
    }
  })
}
```

#### 3.4 敌机生成系统

```typescript
private spawnEnemy(): void {
  const types = ['small', 'medium', 'large']
  const type = Phaser.Utils.Array.GetRandom(types)
  
  let enemy: Phaser.GameObjects.Image
  let health: number
  let score: number
  
  switch (type) {
    case 'small':
      enemy = this.add.image(
        Phaser.Math.Between(50, this.cameras.main.width - 50),
        -50,
        'enemy_small'
      )
      enemy.setDisplaySize(40, 40)
      health = 1
      score = 100
      break
    case 'medium':
      enemy = this.add.image(
        Phaser.Math.Between(50, this.cameras.main.width - 50),
        -50,
        'enemy_medium'
      )
      enemy.setDisplaySize(50, 60)
      health = 3
      score = 300
      break
    case 'large':
      enemy = this.add.image(
        Phaser.Math.Between(50, this.cameras.main.width - 50),
        -50,
        'enemy_large'
      )
      enemy.setDisplaySize(80, 80)
      health = 10
      score = 1000
      break
    default:
      return
  }
  
  this.physics.add.existing(enemy)
  const body = enemy.body as Phaser.Physics.Arcade.Body
  body.setVelocityY(Phaser.Math.Between(2, 5))
  
  // 存储敌机属性
  enemy.setData('health', health)
  enemy.setData('score', score)
  enemy.setData('type', type)
  
  this.enemyGroup.add(enemy)
}
```

#### 3.5 碰撞检测

```typescript
private checkCollisions(): void {
  // 子弹击中敌机
  this.physics.overlap(
    this.bulletGroup,
    this.enemyGroup,
    this.onBulletHitEnemy,
    undefined,
    this
  )
  
  // 敌机撞击玩家
  this.physics.overlap(
    this.player,
    this.enemyGroup,
    this.onPlayerHit,
    undefined,
    this
  )
}

private onBulletHitEnemy(bullet: any, enemy: any): void {
  // 销毁子弹
  bullet.destroy()
  
  // 减少敌机生命值
  const health = enemy.getData('health') - 1
  enemy.setData('health', health)
  
  if (health <= 0) {
    // 敌机死亡
    const score = enemy.getData('score')
    this.updateScore(score)
    
    // 播放爆炸特效
    this.createExplosion(enemy.x, enemy.y)
    
    // 可能掉落道具
    if (Phaser.Math.Between(1, 100) <= 20) {
      this.spawnPowerUp(enemy.x, enemy.y)
    }
    
    enemy.destroy()
  }
}

private onPlayerHit(): void {
  // 玩家受伤逻辑
  console.log('玩家被撞！')
  // TODO: 减少生命值、播放受伤动画等
}
```

#### 3.6 道具系统

```typescript
private spawnPowerUp(x: number, y: number): void {
  const types = ['weapon', 'speed', 'shield', 'health', 'bomb']
  const type = Phaser.Utils.Array.GetRandom(types)
  
  const powerUp = this.add.image(x, y, `powerup_${type}`)
  powerUp.setDisplaySize(30, 30)
  
  this.physics.add.existing(powerUp)
  const body = powerUp.body as Phaser.Physics.Arcade.Body
  body.setVelocityY(3)
  
  powerUp.setData('type', type)
  
  // 添加拾取检测
  this.physics.add.overlap(
    this.player,
    powerUp,
    () => this.collectPowerUp(powerUp),
    undefined,
    this
  )
}

private collectPowerUp(powerUp: any): void {
  const type = powerUp.getData('type')
  console.log('获得道具:', type)
  
  // TODO: 实现道具效果
  // weapon: 升级子弹等级
  // speed: 提升移动速度
  // shield: 添加护盾
  // health: 恢复生命
  // bomb: 清除所有敌人
  
  // 播放音效
  this.playSound('effect_powerup')
  
  powerUp.destroy()
}
```

---

### Task 4: 更新游戏状态管理 💾

**文件**: `src/stores/game.ts`

**需要添加的状态**:

```typescript
interface GameState {
  // 基础状态
  score: number
  highScore: number
  lives: number
  
  // 飞机大战特有状态
  wave: number          // 当前波次
  bulletLevel: number   // 子弹等级 (1-3)
  powerUps: {
    weapon: boolean
    speed: boolean
    shield: boolean
  }
  combo: number         // 连击数
  
  // 统计
  enemiesKilled: number
  powerUpsCollected: number
}

// 添加方法
const actions = {
  // ... 现有方法
  
  addScore(points: number) {
    state.score += points
    // 保存最高分
    if (state.score > state.highScore) {
      state.highScore = state.score
      localStorage.setItem('plane-shooter-high-score', state.highScore.toString())
    }
  },
  
  upgradeBullet() {
    if (state.bulletLevel < 3) {
      state.bulletLevel++
    }
  },
  
  activateShield() {
    state.powerUps.shield = true
    // 10 秒后失效
    setTimeout(() => {
      state.powerUps.shield = false
    }, 10000)
  },
  
  // ... 其他方法
}
```

---

### Task 5: 集成到 PhaserGame.ts 🔧

**文件**: `src/components/game/PhaserGame.ts`

**修改内容**:

```typescript
// 在合适的地方导入
import { PlaneShooterScene } from '@/phaser/scenes/PlaneShooterScene'

// 在 start() 方法中
async start(difficulty: Difficulty, themeId?: string): Promise<void> {
  // ... 现有代码
  
  this.game = new Phaser.Game({
    // ... 现有配置
    scene: [
      PlaneShooterScene  // 👈 添加新场景
    ]
  })
}
```

---

## 📅 开发时间表

### Day 1 (今天): 环境验证 + 开始界面
- [x] ✅ 安装依赖并启动服务器
- [x] ✅ 设置预览浏览器
- [ ] 访问并测试当前游戏
- [ ] 修改 StartView.vue 标题和描述

### Day 2-3: 核心游戏逻辑
- [ ] 创建 PlaneShooterScene.ts
- [ ] 实现玩家控制
- [ ] 实现自动射击
- [ ] 实现敌机 AI

### Day 4-5: 游戏系统完善
- [ ] 实现碰撞检测
- [ ] 实现道具系统
- [ ] 更新 stores/game.ts
- [ ] 完整流程测试

### Day 6-7: 测试和优化
- [ ] 功能完整性测试
- [ ] 性能优化
- [ ] Bug 修复
- [ ] 用户体验优化

---

## 🎯 验收标准

### 功能完整性
- [ ] 玩家飞机可正常移动和射击
- [ ] 敌机按设计模式生成和移动
- [ ] 碰撞检测准确无误
- [ ] 道具系统正常工作
- [ ] 得分系统正确计算
- [ ] 游戏流程完整

### 性能指标
- [ ] 平均帧率 ≥ 55 FPS
- [ ] 内存占用 < 200MB
- [ ] 加载时间 < 5 秒
- [ ] 无明显卡顿和延迟

### 用户体验
- [ ] 操作简单易上手
- [ ] 视觉效果清晰美观
- [ ] 音效反馈及时
- [ ] 难度曲线合理

---

## 📞 参考资料

### 代码参考
- 🐍 [`snake-vue3/src/components/game/PhaserGame.ts`](../snake-vue3/src/components/game/PhaserGame.ts)
- 🐍 [`snake-vue3/src/stores/game.ts`](../snake-vue3/src/stores/game.ts)
- 🐍 [`snake-vue3/src/views/StartView.vue`](../snake-vue3/src/views/StartView.vue)

### 设计文档
- 📖 [`game-design.md`](./game-design.md)
- 📋 [`resource-list.md`](./resource-list.md)
- 📐 [`GAME_DEVELOPMENT_STANDARD.md`](../../../GAME_DEVELOPMENT_STANDARD.md)

### 技术规范
- 💡 [游戏坐标系统避免偏移](memory://游戏坐标系统中避免中心点偏移重复计算)
- 🎮 [GTRS 资源配置规范](memory://GTRS 配置克隆开发规范与参考资源)

---

## 🎉 立即开始

**下一步行动**:

1. **访问预览浏览器**
   - 点击工具面板的预览按钮
   - 访问 http://localhost:8081
   - 查看当前游戏状态

2. **修改 StartView.vue**
   ```bash
   # 打开文件
   code src/views/StartView.vue
   
   # 修改标题为"🎮 飞机大战"
   # 修改描述和操作说明
   ```

3. **创建 PlaneShooterScene.ts**
   ```bash
   # 创建目录
   mkdir -p src/phaser/scenes
   
   # 创建文件并实现基础功能
   code src/phaser/scenes/PlaneShooterScene.ts
   ```

**加油！✈️🎮**

---

**最后更新**: 2026-03-26  
**维护者**: Lingma AI Assistant  
**状态**: 开发环境就绪，等待核心实现
