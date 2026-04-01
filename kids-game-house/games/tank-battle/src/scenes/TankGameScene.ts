import GameScene from './GameScene'
import { useGameStore } from '@/stores/game'
import { useConfigStore } from '@/stores/config'
import { EntityManager, EntityType } from '@/managers/EntityManager'

/**
 * 坦克大战游戏场景
 * 核心游戏逻辑实现
 */
export default class TankGameScene extends GameScene {
  // 关卡配置
  private levelConfigs = [
    {
      level: 1,
      name: '训练关卡',
      enemyCount: 5,
      spawnInterval: 3000,
      enemyTypes: ['LIGHT'],
      mapType: 'simple',
      timeLimit: 120
    },
    {
      level: 2,
      name: '初次战斗',
      enemyCount: 8,
      spawnInterval: 2500,
      enemyTypes: ['LIGHT', 'MEDIUM'],
      mapType: 'medium',
      timeLimit: 180
    },
    {
      level: 3,
      name: '钢铁防线',
      enemyCount: 12,
      spawnInterval: 2000,
      enemyTypes: ['LIGHT', 'MEDIUM', 'HEAVY'],
      mapType: 'complex',
      timeLimit: 240
    },
    {
      level: 4,
      name: '腹背受敌',
      enemyCount: 15,
      spawnInterval: 1800,
      enemyTypes: ['MEDIUM', 'HEAVY'],
      mapType: 'open',
      timeLimit: 300
    },
    {
      level: 5,
      name: '最终决战',
      enemyCount: 20,
      spawnInterval: 1500,
      enemyTypes: ['LIGHT', 'MEDIUM', 'HEAVY'],
      mapType: 'hard',
      timeLimit: 360
    }
  ]
  // 玩家属性
  private playerSpeedMultiplier: number = 1

  // 敌人类型配置（供生成时随机选择）
  // 道具相关状态
  private powerUpLevel: number = 1
  private bulletDamage: number = 10
  private currentLevel!: number           // 当前关卡
  private totalLevels: number = 5         // 总关卡数          // 火力等级 (1-3)
  private isShieldActive: boolean = false   // 护盾是否激活
  private isFrozen: boolean = false         // 是否被冻结
  private enemySpawnTimer: Phaser.Time.TimerEvent | null = null
  private gameTimer: Phaser.Time.TimerEvent | null = null

  // 受击反馈
  private isInvincible: boolean = false    // 无敌帧
  private isDying: boolean = false          // 正在阵亡（防止 500ms 窗口内重复触发）
  private isBaseDestroyed: boolean = false  // 基地是否已被摧毁
  private playerArmor: number = 0          // 护甲层数
  private blinkTimer: Phaser.Time.TimerEvent | null = null // 闪烁定时器引用

  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyW!: Phaser.Input.Keyboard.Key
  private keyA!: Phaser.Input.Keyboard.Key
  private keyS!: Phaser.Input.Keyboard.Key
  private keyD!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key
  private keyJ!: Phaser.Input.Keyboard.Key
  
  // ✅ 使用 EntityManager 统一管理实体
  private entityManager!: EntityManager
  
  // 保留引用以便直接访问（从 EntityManager 获取）
  private bullets!: Phaser.Physics.Arcade.Group
  private enemyBullets!: Phaser.Physics.Arcade.Group
  private powerUps!: Phaser.Physics.Arcade.Group
  private enemies!: Phaser.Physics.Arcade.Group
  private walls!: Phaser.Physics.Arcade.StaticGroup
  private base!: Phaser.Physics.Arcade.Sprite
  
  private isGameOver: boolean = false
  private score: number = 0
  private lastFiredTime: number = 0
  private fireRate: number = 500 // 射击间隔（毫秒）
  private timeLeft: number = 0
  
  preload(): void {
    // 从 GTRS 加载所有资源
    this.preloadFromGTRS()
  }
  
  create(): void {
    super.create() // 必须调用

    const configStore = useConfigStore()
    const config = configStore.getEffectiveConfig

    console.log('🎮 坦克大战启动')
    console.log('难度配置:', config)

    // 🛑 重置所有状态标志（scene.restart() 时需要）
    this.collisionsSetup = false
    this.isGameOver = false
    this.isDying = false           // 🛡️ 必须重置！否则新游戏第一帧就 return
    this.isLevelTransitioning = false
    this.isInvincible = false
    this.score = 0

    // 初始化游戏状态
    const gameStore = useGameStore()
    // 确保 lives 不为 0、isGameOver 为 false（scene.restart() 时 store 状态可能残留）
    gameStore.$patch({
      lives: config.playerLives || 3,
      score: 0,
      isGameOver: false
    })
    gameStore.reset() // 同步重置 store 的 isGameOver 和 lives
    
    if (config.timeLimit) {
      this.timeLeft = config.timeLimit
    }
    
    // 添加背景（使用 tileSprite 优化性能）
    const bg = this.add.tileSprite(
      this.screenW / 2, 
      this.screenH / 2, 
      this.screenW, 
      this.screenH, 
      'bg_main'
    )
    bg.setOrigin(0.5, 0.5)
    
    // ✅ 初始化 EntityManager
    this.entityManager = new EntityManager(this)
    
    // 🔴 设置物理世界边界为地图区域（防止敌人/子弹跑出地图）
    const worldBoundsX = this.offsetX
    const worldBoundsY = this.offsetY
    const worldBoundsWidth = this.gridCols * this.cellSize
    const worldBoundsHeight = this.gridRows * this.cellSize
    this.physics.world.setBounds(worldBoundsX, worldBoundsY, worldBoundsWidth, worldBoundsHeight)
    
    console.log('🌍 物理世界边界已设置:', {
      x: worldBoundsX,
      y: worldBoundsY,
      width: worldBoundsWidth,
      height: worldBoundsHeight
    })
    
    // 从 EntityManager 获取各组引用
    this.bullets = this.entityManager.getGroup(EntityType.BULLET_PLAYER)!
    this.enemyBullets = this.entityManager.getGroup(EntityType.BULLET_ENEMY)!
    this.powerUps = this.entityManager.getGroup(EntityType.POWERUP)!
    this.enemies = this.entityManager.getGroup(EntityType.ENEMY_LIGHT)!
    this.walls = this.entityManager.getGroup(EntityType.WALL_BRICK) as any
    
    // 创建地图（会初始化 walls 组）
    this.createMap()
    
    // 创建玩家坦克
    this.createPlayer()
    
    // 设置碰撞检测（在 loadLevel 之前先设置一次）
    this.setupCollisions()
    
    // 初始化关卡
    this.currentLevel = 1
    this.loadLevel(this.currentLevel)
    
    // 生成敌人
    this.startEnemySpawning(config.spawnInterval, config.enemyCount)
    
    // 启动计时器
    if (config.timeLimit) {
      this.startTimer()
    }
    
    console.log('✅ 游戏初始化完成')
    
    // 播放游戏开始音效
    this.playSound('sfx_start', 0.5)
  }
  
  /**
   * 创建地图
   */
  private createMap(): void {
    // ✅ 复用 EntityManager 的墙壁组，不要新建！（新建会断开 EntityManager 引用）
    this.walls.clear(true, true) // 清空旧墙壁

    // 🔴 添加地图边界墙（四周一圈钢墙，让玩家能看到边界）
    const borderWidth = 64
    const mapLeft = this.offsetX - borderWidth
    const mapRight = this.offsetX + this.gridCols * this.cellSize
    const mapTop = this.offsetY - borderWidth
    const mapBottom = this.offsetY + this.gridRows * this.cellSize
    
    // 上边界
    for (let x = mapLeft; x <= mapRight; x += 64) {
      this.createWall(x, mapTop, 'wall_steel')
    }
    // 下边界
    for (let x = mapLeft; x <= mapRight; x += 64) {
      this.createWall(x, mapBottom, 'wall_steel')
    }
    // 左边界
    for (let y = mapTop; y <= mapBottom; y += 64) {
      this.createWall(mapLeft, y, 'wall_steel')
    }
    // 右边界
    for (let y = mapTop; y <= mapBottom; y += 64) {
      this.createWall(mapRight, y, 'wall_steel')
    }

    // 创建基地
    this.base = this.physics.add.sprite(
      this.offsetX + this.gridCols * this.cellSize / 2,
      this.offsetY + this.gridRows * this.cellSize - 100,
      'base_home'
    ).setImmovable(true)
    
    // 保护基地的墙
    const baseX = this.offsetX + this.gridCols * this.cellSize / 2
    const baseY = this.offsetY + this.gridRows * this.cellSize - 100
    
    this.createWall(baseX - 64, baseY, 'wall_brick')
    this.createWall(baseX + 64, baseY, 'wall_brick')
    this.createWall(baseX, baseY - 64, 'wall_brick')
    this.createWall(baseX - 64, baseY - 64, 'wall_brick')
    this.createWall(baseX + 64, baseY - 64, 'wall_brick')
    
    // 随机障碍物
    for (let i = 0; i < 20; i++) {
      const x = this.offsetX + Phaser.Math.Between(2, this.gridCols - 2) * this.cellSize
      const y = this.offsetY + Phaser.Math.Between(2, this.gridRows - 3) * this.cellSize
      
      // 避开基地区域
      if (Math.abs(x - baseX) < 200 && Math.abs(y - baseY) < 200) {
        continue
      }
      
      const wallType = Phaser.Math.Between(1, 10) > 7 ? 'wall_steel' : 'wall_brick'
      this.createWall(x, y, wallType)
    }
  }
  
  /**
   * 创建墙壁
   */
  private createWall(x: number, y: number, texture: string): void {
    // 使用静态精灵（不受物理影响）并启用碰撞
    const wall = this.physics.add.staticSprite(x, y, texture).setImmovable(true)
    this.walls.add(wall)
  }
  
  /**
   * 创建玩家坦克
   */
  private createPlayer(): void {
    console.log('🎮 创建玩家坦克')

    const startX = this.offsetX + this.gridCols * this.cellSize / 2
    const startY = this.offsetY + this.gridRows * this.cellSize - 200

    this.player = this.physics.add.sprite(startX, startY, 'player_tank_up')
    this.player.setCollideWorldBounds(true)

    // ✅ 确保玩家处于激活状态
    this.player.setActive(true)
    this.player.setVisible(true)

    // ✅ 重置死亡标志
    this.isDying = false
    this.isInvincible = false

    // 🔍 诊断日志
    console.log('✅ 玩家创建 | id:', this.player.id, '| active:', this.player.active, '| scene:', this.player.scene)

    console.log('✅ 玩家坦克创建完成，位置:', { x: startX, y: startY })
    
    // 输入控制
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyJ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J)
  }
  
  /**
   * 设置碰撞检测（增强版 - 带视觉/音效反馈）
   */
  private collisionsSetup: boolean = false // 防止重复设置碰撞

  private setupCollisions(): void {
    // 🛑 防止重复设置碰撞（collider 是累加的，不能多次调用）
    if (this.collisionsSetup) return
    this.collisionsSetup = true

    // ═══ 玩家与墙壁碰撞（物理阻挡） ═══
    this.physics.add.collider(this.player, this.walls)

    // ═══ 敌人与墙壁碰撞 ═══
    this.physics.add.collider(this.enemies, this.walls)

    // ═══ 玩家子弹与墙碰撞 ═══
    this.physics.add.collider(this.bullets, this.walls, (bullet: any, wall: any) => {
      if (!bullet.active) return
      const bx = bullet.x, by = bullet.y
      const isSteel = wall.texture?.key === 'wall_steel'
      bullet.destroy()

      if (isSteel) {
        // 钢墙：不可摧毁，火花特效 + 弹回音效
        this.spawnSparks(bx, by, '#94a3b8', 5)
        this.playSound('sfx_hit', 0.3)
      } else {
        // 砖墙：摧毁，碎片特效 + 爆炸音效
        wall.destroy()
        this.spawnDebris(bx, by, '#8B4513')
        this.playSound('sfx_explosion', 0.4)
        this.cameraShake(100)
      }
    })

    // ═══ 敌人子弹与墙碰撞 ═══
    this.physics.add.collider(this.enemyBullets, this.walls, (bullet: any, wall: any) => {
      if (!bullet.active) return
      const bx = bullet.x, by = bullet.y
      const isSteel = wall.texture?.key === 'wall_steel'
      bullet.destroy()

      if (isSteel) {
        this.spawnSparks(bx, by, '#94a3b8', 4)
        this.playSound('sfx_hit', 0.2)
      } else {
        wall.destroy()
        this.spawnDebris(bx, by, '#8B4513')
        this.playSound('sfx_explosion', 0.3)
      }
    })

    // ═══ 玩家子弹击中敌人 ═══
    this.physics.add.overlap(this.bullets, this.enemies, (bullet: any, enemy: any) => {
      if (!bullet.active) return
      bullet.destroy()
      this.destroyEnemy(enemy)
    })

    // ═══ 敌人子弹击中玩家 ═══
    this.physics.add.overlap(this.enemyBullets, this.player, (bullet: any) => {
      console.log('💥 检测到敌人子弹击中玩家！')
      console.log('   [重叠开始] player.active =', this.player?.active)
      console.log('   [重叠开始] player.visible =', this.player?.visible)
      
      // 🛡️ 防御：确保玩家仍然有效
      if (!this.player || !this.player.active) {
        console.log('⚠️ 玩家已无效，子弹直接标记销毁')
        bullet.setData('pendingDestroy', true)
        return
      }
      
      // ✅ 保存玩家状态快照
      const snapshot = {
        active: this.player.active,
        visible: this.player.visible,
        scene: this.player.scene?.constructor.name
      }
      console.log('📸 玩家状态快照:', snapshot)
      
      // ✅ 标记子弹待销毁（不立即销毁，避免副作用）
      console.log('🔫 标记子弹待销毁...')
      bullet.setData('pendingDestroy', true)
      bullet.setActive(false)
      bullet.setVisible(false)
      console.log('✅ 子弹已标记')
      
      // 🔍 再次检查玩家状态
      console.log('   [标记后] player.active =', this.player?.active)
      console.log('   [标记后] player.visible =', this.player?.visible)
      
      console.log('🎯 调用 playerHit()')
      this.playerHit()
    })

    // ═══ 玩家撞敌人（物理碰撞，触发伤害） ═══
    this.physics.add.collider(this.player, this.enemies, () => {
      if (!this.player || !this.player.active) return
      this.playerHit()
    })

    // ═══ 敌人子弹打基地 ═══
    this.physics.add.overlap(this.enemyBullets, this.base, (bullet: any) => {
      if (bullet.active) bullet.destroy()
      this.baseDestroyed()
    })

    // ═══ 玩家拾取道具 ═══
    this.physics.add.overlap(this.player, this.powerUps, (_player: any, powerUp: any) => {
      this.collectPowerUp(powerUp)
    })
  }

  // ═══════════════════════════════════════
  //  视觉特效工具方法
  // ═══════════════════════════════════════

  /**
   * 爆炸粒子效果（使用 Phaser 粒子系统 + 备用 Graphics）
   */
  private spawnExplosion(x: number, y: number, size: number = 1): void {
    // 主爆炸 sprite（使用 explosion 纹理）
    const frames = ['explosion_1', 'explosion_2', 'explosion_3']
    const available = frames.filter(f => this.textures.exists(f))

    if (available.length > 0) {
      // 逐帧动画：先显示第1帧 → 第2帧 → 第3帧
      available.forEach((frame, i) => {
        this.time.delayedCall(i * 80, () => {
          const spr = this.add.sprite(x, y, frame)
          spr.setScale(size * (1 + i * 0.4))
          spr.setAlpha(1 - i * 0.2)
          this.tweens.add({
            targets: spr,
            alpha: 0,
            scale: spr.scaleX * 1.5,
            duration: 300,
            onComplete: () => spr.destroy(),
          })
        })
      })
    }

    // 备用：用 Graphics 绘制粒子碎片
    this.spawnBurstParticles(x, y, 0xff6600, 8 + size * 4, size)
    this.spawnBurstParticles(x, y, 0xffcc00, 4 + size * 2, size * 0.7)

    // 相机震动
    this.cameraShake(150 * size)
  }

  /**
   * 用 Graphics 绘制扩散粒子（不依赖额外纹理）
   */
  private spawnBurstParticles(x: number, y: number, color: number, count: number, scale: number = 1): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.3, 0.3)
      const distance = Phaser.Math.Between(20, 60) * scale
      const pSize = Phaser.Math.Between(2, 5) * scale

      const g = this.add.graphics()
      g.fillStyle(color, 1)
      g.fillCircle(0, 0, pSize)
      g.setPosition(x, y)

      this.tweens.add({
        targets: g,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: Phaser.Math.Between(200, 400),
        ease: 'Power2',
        onComplete: () => g.destroy(),
      })
    }
  }

  /**
   * 墙壁碎片效果
   */
  private spawnDebris(x: number, y: number, color: string): void {
    const intColor = parseInt(color.replace('#', ''), 16)
    this.spawnBurstParticles(x, y, intColor, 6, 0.6)

    // 额外的小方块碎片
    for (let i = 0; i < 4; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const dist = Phaser.Math.Between(15, 40)
      const g = this.add.graphics()
      g.fillStyle(intColor, 0.9)
      g.fillRect(-3, -3, 6, 6)
      g.setPosition(x, y)
      g.setRotation(Phaser.Math.FloatBetween(0, Math.PI))

      this.tweens.add({
        targets: g,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        rotation: g.rotation + Phaser.Math.FloatBetween(-2, 2),
        duration: Phaser.Math.Between(300, 500),
        ease: 'Cubic.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /**
   * 火花特效（用于钢墙反弹）
   */
  private spawnSparks(x: number, y: number, color: string, count: number): void {
    const intColor = parseInt(color.replace('#', ''), 16)
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const dist = Phaser.Math.Between(10, 30)
      const g = this.add.graphics()
      g.lineStyle(1, intColor, 1)
      g.beginPath()
      g.moveTo(0, -4)
      g.lineTo(0, 4)
      g.strokePath()
      g.setPosition(x, y)

      this.tweens.add({
        targets: g,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: Phaser.Math.Between(150, 300),
        ease: 'Power1',
        onComplete: () => g.destroy(),
      })
    }
  }

  /**
   * 相机震动
   */
  private cameraShake(intensity: number = 100): void {
    try {
      this.cameras.main.shake(intensity, 0.008)
    } catch {
      // 静默失败（如果相机不存在）
    }
  }

  /**
   * 炮口闪光效果
   */
  private spawnMuzzleFlash(x: number, y: number): void {
    const g = this.add.graphics()
    g.fillStyle(0xffcc00, 0.9)
    g.fillCircle(0, 0, 6)
    g.setPosition(x, y)

    this.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 120,
      onComplete: () => g.destroy(),
    })
  }

  // ═══════════════════════════════════════
  //  道具系统
  // ═══════════════════════════════════════

  /**
   * 拾取道具
   */
  private collectPowerUp(powerUp: any): void {
    if (!powerUp.active) return
    const type = powerUp.type as string
    powerUp.destroy()

    // 拾取音效
    this.playSound('sfx_prop', 0.5)

    // 拾取闪光效果
    this.spawnBurstParticles(powerUp.x, powerUp.y, 0xfbbf24, 8, 0.8)

    switch (type) {
      case 'star':
        // 火力升级（最高 3 级）
        if (this.powerUpLevel < 3) {
          this.powerUpLevel++
          this.bulletDamage = 10 * this.powerUpLevel
          this.fireRate = Math.max(200, 500 - (this.powerUpLevel - 1) * 100)
        }
        break

      case 'shield':
        // 护盾（10 秒）
        this.isShieldActive = true
        this.time.delayedCall(10000, () => {
          this.isShieldActive = false
        })
        // 护盾视觉：蓝色光环
        this.showShieldEffect()
        break

      case 'speed':
        // 加速（8 秒）
        this.playerSpeedMultiplier = 1.5
        this.time.delayedCall(8000, () => {
          this.playerSpeedMultiplier = 1
        })
        break

      case 'freeze':
        // 冻结敌人（5 秒）
        this.isFrozen = true
        this.enemies.children.iterate((enemy: any) => {
          if (enemy && enemy.active) {
            enemy.setVelocity(0, 0)
          }
          return false // 不中断迭代
        })
        this.time.delayedCall(5000, () => {
          this.isFrozen = false
        })
        break

      case 'health':
        // 恢复一条命
        const gameStore = useGameStore()
        if (gameStore.lives < 5) {
          gameStore.$patch({ lives: gameStore.lives + 1 })
          this.game.events.emit('lifeLost', gameStore.lives)
        }
        break

      case 'bomb':
        // 全屏炸弹：消灭所有敌人
        this.enemies.children.iterate((enemy: any) => {
          if (enemy && enemy.active) {
            this.spawnExplosion(enemy.x, enemy.y, 0.8)
            enemy.destroy()
            this.score += 100
          }
          return false // 不中断迭代
        })
        this.cameraShake(400)
        this.playSound('sfx_explosion', 0.9)
        const gs = useGameStore()
        gs.score = this.score
        this.game.events.emit('scoreUpdate', this.score)
        this.checkLevelComplete()
        break

      case 'armor':
        // 护甲（吸收一次伤害）
        this.playerArmor = 1
        break
    }
  }

  /**
   * 护盾视觉效果
   */
  private showShieldEffect(): void {
    if (!this.player.active) return
    const shield = this.add.graphics()
    shield.lineStyle(2, 0x3b82f6, 0.6)
    shield.strokeCircle(0, 0, 24)
    shield.setPosition(this.player.x, this.player.y)

    // 跟随玩家
    const updateEvent = this.time.addEvent({
      delay: 16,
      callback: () => {
        if (!this.player.active || !shield.active) {
          shield.destroy()
          updateEvent.destroy()
          return
        }
        shield.setPosition(this.player.x, this.player.y)
      },
      loop: true,
    })

    // 10 秒后消失
    this.time.delayedCall(10000, () => {
      this.tweens.add({
        targets: shield,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          shield.destroy()
          updateEvent.destroy()
        },
      })
    })
  }
  
  /**
   * 加载关卡
   */
  private loadLevel(level: number): void {
    const config = this.levelConfigs[level - 1]
    if (!config) {
      console.log('🎉 恭喜通关所有关卡！')
      this.handleVictory()
      return
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📍 进入第${level}关：${config.name}`)
    console.log(`   敌人数量：${config.enemyCount}`)
    console.log(`   生成间隔：${config.spawnInterval}ms`)
    console.log(`   敌人类型：${config.enemyTypes.join(', ')}`)
    console.log(`   时间限制：${config.timeLimit}秒`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // 🛑 清除旧计时器，防止重复累积
    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.destroy()
      this.enemySpawnTimer = null
    }
    if (this.gameTimer) {
      this.gameTimer.destroy()
      this.gameTimer = null
    }

    // ✅ 使用 EntityManager 重置本关状态（保留玩家）
    this.entityManager.clearAllEntities(false)  // false = 不清空玩家

    // 保存玩家火力等级
    const savedPowerLevel = this.powerUpLevel

    // 重新创建地图（会重新创建墙壁和基地）
    this.createMap()

    // 重置玩家位置（不重新创建对象）
    const startX = this.offsetX + this.gridCols * this.cellSize / 2
    const startY = this.offsetY + this.gridRows * this.cellSize - 200
    
    console.log('🔍 loadLevel: 检查玩家状态', {
      playerId: this.player?.id,
      playerActive: this.player?.active,
      playerScene: this.player?.scene,
      isDying: this.isDying
    })
    
    // ✅ 检查玩家是否还存活，如果死亡则重新创建
    if (this.player?.active) {
      console.log('✅ 玩家存活，重置位置')
      this.player.setPosition(startX, startY)
      this.player.setVelocity(0, 0)
      this.player.setTexture('player_tank_up')
      // ✅ 重要：必须确保玩家处于激活状态！
      this.player.setActive(true)
      // ✅ 重置 isDying 和 isInvincible，否则新关卡第一帧就会跳过受击逻辑！
      this.isDying = false
      this.isInvincible = false
    } else {
      console.log('🔄 玩家已死亡，重新创建玩家实体')
      this.createPlayer()
    }

    // 恢复火力等级
    this.powerUpLevel = savedPowerLevel
    this.bulletDamage = 10 * savedPowerLevel

    // ✅ 重要：重新设置碰撞检测（因为实体已被清空）
    this.setupCollisions()

    // 生成敌人
    this.startEnemySpawning(config.spawnInterval, config.enemyCount)

    // 更新时间限制
    if (config.timeLimit) {
      this.timeLeft = config.timeLimit
      this.startTimer()
    }
  }
  
  /**
   * 生成敌人
   */
  private startEnemySpawning(interval: number, maxCount: number): void {
    let spawned = 0
    
    this.enemySpawnTimer = this.time.addEvent({
      delay: interval,
      callback: () => {
        if (spawned >= maxCount || this.isGameOver) {
          return
        }
        
        this.spawnEnemy()
        spawned++
      },
      loop: true,
    })
  }
  
  /**
   * 生成单个敌人
   */
  private spawnEnemy(): void {
    const spawnPoints = [
      { x: this.offsetX + 100, y: this.offsetY + 100 },
      { x: this.offsetX + this.gridCols * this.cellSize / 2, y: this.offsetY + 100 },
      { x: this.offsetX + this.gridCols * this.cellSize - 100, y: this.offsetY + 100 },
    ]
    
    const point = Phaser.Math.RND.pick(spawnPoints)
    const enemyTypes = ['enemy_tank_1', 'enemy_tank_2', 'enemy_tank_3']
    const type = Phaser.Math.RND.pick(enemyTypes)
    
    const enemy = this.physics.add.sprite(point.x, point.y, type)
    enemy.setCollideWorldBounds(true)
    
    // 随机属性
    const configStore = useConfigStore()
    const config = configStore.getEffectiveConfig
    ;(enemy as any).speed = config.enemySpeed
    
    this.enemies.add(enemy)
    
    // 敌人 AI
    this.time.addEvent({
      delay: Phaser.Math.Between(1000, 3000),
      callback: () => this.updateEnemyAI(enemy),
      loop: true,
    })
    
    // 敌人射击
    this.time.addEvent({
      delay: Phaser.Math.Between(2000, 4000),
      callback: () => this.enemyShoot(enemy),
      loop: true,
    })
  }
  
  /**
   * 更新敌人 AI
   */
  private updateEnemyAI(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (!enemy.active || this.isGameOver || this.isFrozen) return
    
    // 简单的随机移动
    const directions = ['up', 'down', 'left', 'right']
    const direction = Phaser.Math.RND.pick(directions)
    
    const speed = (enemy as any).speed || 150
    
    switch (direction) {
      case 'up':
        this.tweens.add({ targets: enemy, y: enemy.y - 100, duration: 1000 })
        break
      case 'down':
        this.tweens.add({ targets: enemy, y: enemy.y + 100, duration: 1000 })
        break
      case 'left':
        this.tweens.add({ targets: enemy, x: enemy.x - 100, duration: 1000 })
        break
      case 'right':
        this.tweens.add({ targets: enemy, x: enemy.x + 100, duration: 1000 })
        break
    }
  }
  
  /**
   * 敌人射击
   */
  private enemyShoot(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (!enemy.active || this.isGameOver || this.isFrozen) return
    // 🛡️ 防御：确保玩家有效
    if (!this.player || !this.player.active) return

    const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'bullet_enemy')
    if (bullet) {
      this.physics.moveToObject(bullet, this.player, 300)
      this.time.delayedCall(2000, () => {
        if (bullet.active) bullet.destroy()
      })
    }
  }
  
  /**
   * 销毁敌人
   */
  

  /**
   * 生成道具（击败敌人时概率触发）
   */
  private spawnPowerUp(x: number, y: number): void {
    // 5% 概率生成炸弹，其他各 15% 概率
    const rand = Math.random()
    const types = ['star', 'shield', 'speed', 'freeze', 'health', 'bomb', 'armor']
    let selectedType = ''
    
    if (rand < 0.05) {
      selectedType = 'bomb'  // 5% 炸弹
    } else if (rand < 0.20) {
      selectedType = types[Math.floor(Math.random() * 6)]  // 其他 6 种均分 15%
    } else {
      return  // 不生成
    }
    
    // 创建道具精灵
    const powerUp = this.physics.add.sprite(x, y, `prop_${selectedType}`)
    powerUp.setImmovable(true)
    ;(powerUp as any).checkWorldBounds = true
    ;(powerUp as any).outOfBoundsDestruct = true
    
    // 添加类型标识
    ;(powerUp as any).type = selectedType
    
    this.powerUps.add(powerUp)
    
    // 添加浮动动画
    this.tweens.add({
      targets: powerUp,
      angle: 5,
      duration: 1000,
      yoyo: true,
      repeat: -1
    })
  }

  /**
   * 检查关卡是否完成
   */
  private isLevelTransitioning: boolean = false // 防止重复触发

  private checkLevelComplete(): void {
    if (this.isLevelTransitioning) return // 防止重复

    const config = this.levelConfigs[this.currentLevel - 1]
    if (!config) return

    // 检查是否所有敌人都被消灭
    if (this.enemies.countActive(true) === 0 && !this.isGameOver) {
      this.isLevelTransitioning = true
      console.log(`✅ 第${this.currentLevel}关完成！`)

      this.time.delayedCall(2000, () => {
        this.isLevelTransitioning = false
        // 进入下一关
        this.currentLevel++

        if (this.currentLevel > this.totalLevels) {
          // 通关游戏
          console.log('🏆 恭喜通关！')
          this.handleVictory()
        } else {
          // 加载下一关
          this.loadLevel(this.currentLevel)
        }
      })
    }
  }  private destroyEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (!enemy.active) return

    // 🎆 增强爆炸效果
    this.spawnExplosion(enemy.x, enemy.y, 1.2)

    // 💥 爆炸音效
    this.playSound('sfx_explosion', 0.6)

    enemy.destroy()

    // 概率生成道具
    this.spawnPowerUp(enemy.x, enemy.y)

    // 加分
    this.score += 100

    // 更新 Store + 事件
    const gameStore = useGameStore()
    gameStore.score = this.score
    this.game.events.emit('scoreUpdate', this.score)

    // 检查关卡是否完成
    this.checkLevelComplete()
  }
  
  /**
   * 玩家被击中（增强版 - 带无敌帧 + 视觉反馈）
   */
  private playerHit(): void {
    console.log('🔥 playerHit() 被调用')
    console.log('   - this.player:', this.player)
    console.log('   - this.player?.active:', this.player?.active)
    console.log('   - typeof this.player:', typeof this.player)
    console.log('   - isDying:', this.isDying)
    console.log('   - isInvincible:', this.isInvincible)
    // 🔍 深度诊断
    if (this.player) {
      console.log('   - player.id:', this.player.id, 'player.x:', this.player.x, 'player.y:', this.player.y)
      console.log('   - player.scene:', this.player.scene, '| player.visible:', this.player.visible, '| player.active:', this.player.active)
    }
    
    // 🛡️ 防御：正在阵亡动画中、被销毁或不存在时不再处理
    if (this.isDying || !this.player || !this.player.active) {
      console.log('⚠️ 玩家已死亡或正在死亡，跳过受击逻辑')
      console.log('   - isDying =', this.isDying)
      console.log('   - !this.player =', !this.player)
      console.log('   - !this.player.active =', !this.player?.active)
      return
    }

    // 无敌帧保护：无敌期间不受伤
    if (this.isInvincible) {
      console.log('🛡️ 玩家处于无敌状态，免疫伤害')
      return
    }

    // 护盾保护
    if (this.isShieldActive) {
      this.isShieldActive = false
      this.playSound('sfx_hit', 0.4)
      this.spawnSparks(this.player.x, this.player.y, '#3b82f6', 8)
      this.cameraShake(80)
      return
    }

    const gameStore = useGameStore()
    const previousLives = gameStore.lives  // 保存之前的生命值
    console.log('💡 受击前生命值:', previousLives)
    
    gameStore.loseLife()  // 失去一条生命
    console.log('💡 扣减后生命值:', gameStore.lives)
    
    this.game.events.emit('lifeLost', gameStore.lives)

    console.log(`💥 玩家被击中，剩余生命：${gameStore.lives}`)

    // 💥 受击反馈：爆炸 + 震动 + 音效
    this.spawnExplosion(this.player.x, this.player.y, 0.6)
    this.cameraShake(200)
    this.playSound('sfx_hit', 0.7)

    // ✅ 判断是否还有生命（previousLives > 1 表示可以复活）
    console.log('💡 判断复活条件:', previousLives > 1)
    if (previousLives > 1) {
      // 🛡️ 重生流程：快速响应（减少延迟）

      // 1. 清除旧闪烁定时器（防止多次调用累积）
      if (this.blinkTimer) {
        this.blinkTimer.destroy()
        this.blinkTimer = null
      }

      // 2. 计算复活位置（调整到地图中心偏上，更开阔的位置）
      const startX = this.offsetX + this.gridCols * this.cellSize / 2
      const startY = this.offsetY + this.gridRows * this.cellSize * 0.4  // ✅ 从底部改为 40% 位置，更居中

      // 3. 清除复活点周围的敌人（防止刚复活就被撞死）
      const safeRadius = 150
      this.enemies.getChildren().forEach((enemy: any) => {
        if (enemy.active) {
          const dx = enemy.x - startX
          const dy = enemy.y - startY
          if (Math.sqrt(dx * dx + dy * dy) < safeRadius) {
            enemy.destroy()
            this.spawnExplosion(enemy.x, enemy.y, 0.8)
            this.score += 50
          }
        }
      })

      // 4. 立即传送玩家（无延迟）
      this.player.setPosition(startX, startY)
      this.player.setVelocity(0, 0)
      this.player.setActive(true)
      this.player.setVisible(true)
      this.player.setTexture('player_tank_up')
      this.player.clearTint()  // ✅ 清除任何 tint
      this.player.setAlpha(1)   // ✅ 确保完全不透明
            
      // ✅ 重置死亡标志
      this.isDying = false
      
      // 5. 启动无敌帧（1.5 秒）
      this.isInvincible = true
      
      console.log('🛡️ 无敌帧开始')
      
      // ✅ 先清除旧的定时器（防止累积）
      if (this.blinkTimer) {
        ;(this.blinkTimer as Phaser.Time.TimerEvent).destroy()
        this.blinkTimer = null
      }
      
      // 立即开始闪烁
      this.blinkTimer = this.time.addEvent({
        delay: 150,
        callback: () => {
          if (!this.player || !this.player.active) return
          const isVisible = this.player.visible
          this.player.setVisible(!isVisible)
        },
        loop: true,
      })
      
      // ✅ 1.5 秒后结束无敌帧并清除定时器
      this.time.delayedCall(1500, () => {
        this.isInvincible = false
        
        // ✅ 关键：清除闪烁定时器
        if (this.blinkTimer) {
          ;(this.blinkTimer as Phaser.Time.TimerEvent).destroy()
          this.blinkTimer = null
        }
        
        // 恢复玩家状态
        if (this.player) {
          this.player.setActive(true)
          this.player.setVisible(true)
          this.player.clearTint()
          this.player.setAlpha(1)
        }
        console.log('🛡️ 无敌帧结束')
      })
                  
      // 每 100ms 切换一次可见性（简单直接的方式）
      this.blinkTimer = this.time.addEvent({
        delay: 150,  // ✅ 加快闪烁频率
        callback: () => {
          if (!this.player || !this.player.active) return
          // ✅ 交替显示/隐藏，但保持 active
          const isVisible = this.player.visible
          this.player.setVisible(!isVisible)
        },
        loop: true,
      })
    } else {
      // 🛑 玩家生命耗尽，游戏结束
      if (this.isDying || !this.player.active) return
      this.isDying = true
      this.isInvincible = true
      
      // 玩家阵亡大爆炸
      this.spawnExplosion(this.player.x, this.player.y, 2)
      this.playSound('sfx_explosion', 0.9)
      this.cameraShake(400)
      this.player.setVisible(false)
      this.player.setActive(false)
      
      this.time.delayedCall(500, () => this.handleGameOver())
    }
  }
  
  /**
   * 基地被摧毁（增强版）
   */
  private baseDestroyed(): void {
    if (this.isBaseDestroyed || this.isGameOver) return
    this.isBaseDestroyed = true

    // 大爆炸效果
    this.spawnExplosion(this.base.x, this.base.y, 1.5)
    this.playSound('sfx_explosion', 0.8)
    this.cameraShake(300)

    // 纹理不存在时用 tint 变红表示被摧毁
    if (this.textures.exists('base_destroyed')) {
      this.base.setTexture('base_destroyed')
    } else {
      this.base.setTint(0xff0000)
      this.base.setAlpha(0.6)
    }

    this.time.delayedCall(1500, () => {
      this.handleGameOver()
    })
  }
  
  /**
   * 游戏主循环 - 处理玩家输入和移动
   */
  update(_time: number, delta: number): void {
    if (this.isGameOver) return
    
    // 🔍 监控玩家状态变化
    if (this.player && !this.player.active) {
      console.log('⚠️ [UPDATE] 检测到玩家变为 inactive!')
      console.log('   - visible:', this.player.visible)
      console.log('   - scene:', this.player.scene)
      console.log('   - x:', this.player.x, 'y:', this.player.y)
      
      // ✅ 强制恢复！每帧检查并修复
      console.log('🔧 强制恢复玩家 active...')
      this.player.setActive(true)
      console.log('✅ 玩家已恢复 active =', this.player.active)
    }
    
    // ✅ 清理待销毁的子弹（统一在 update 中处理，避免回调副作用）
    this.cleanupPendingDestroyBullets()
    
    this.handlePlayerMovement()
    this.handlePlayerShooting()
  }
  
  /**
   * 清理标记为待销毁的子弹
   */
  private cleanupPendingDestroyBullets(): void {
    // 清理敌人子弹
    this.enemyBullets.getChildren().forEach((bullet: any) => {
      if (bullet.getData('pendingDestroy')) {
        bullet.destroy()
      }
    })
    
    // 清理玩家子弹
    this.bullets.getChildren().forEach((bullet: any) => {
      if (bullet.getData('pendingDestroy')) {
        bullet.destroy()
      }
    })
  }
  
  /**
   * 处理玩家移动
   */
  private handlePlayerMovement(): void {
    if (!this.player?.active) {
      console.log('⚠️ [handlePlayerMovement] player.active = false')
      return
    }
    
    // 🔍 检查玩家位置是否异常
    if (this.player.x < this.offsetX || this.player.x > this.offsetX + this.gridCols * this.cellSize) {
      console.log('⚠️ [handlePlayerMovement] 玩家 X 位置异常！x =', this.player.x, 'offsetX =', this.offsetX)
      // 强制拉回中心
      const centerX = this.offsetX + this.gridCols * this.cellSize / 2
      const centerY = this.offsetY + this.gridRows * this.cellSize - 200
      this.player.setPosition(centerX, centerY)
      this.player.setVelocity(0, 0)
    }

    const speed = 200 * this.playerSpeedMultiplier
    let moving = false
    
    // 清除所有速度
    this.player.setVelocityX(0)
    this.player.setVelocityY(0)
    
    // 方向键控制
    if (this.cursors.up.isDown || this.keyW.isDown) {
      this.player.setVelocityY(-speed)
      this.player.setTexture('player_tank_up')
      moving = true
    } else if (this.cursors.down.isDown || this.keyS.isDown) {
      this.player.setVelocityY(speed)
      this.player.setTexture('player_tank_down')
      moving = true
    }
    
    if (this.cursors.left.isDown || this.keyA.isDown) {
      this.player.setVelocityX(-speed)
      this.player.setTexture('player_tank_left')
      moving = true
    } else if (this.cursors.right.isDown || this.keyD.isDown) {
      this.player.setVelocityX(speed)
      this.player.setTexture('player_tank_right')
      moving = true
    }
    
    // 斜向移动时调整炮管方向（可选）
    if (moving && this.cursors.up.isDown && this.cursors.left.isDown) {
      this.player.setTexture('player_tank_up') // 优先向上
    } else if (moving && this.cursors.up.isDown && this.cursors.right.isDown) {
      this.player.setTexture('player_tank_up') // 优先向上
    }
  }
  
  /**
   * 处理玩家射击
   */
  private handlePlayerShooting(): void {
    if (!this.player?.active) return

    const now = Date.now()
    
    if ((this.keySpace.isDown || this.keyJ.isDown) && now > this.lastFiredTime + this.fireRate) {
      this.playerShoot()
      this.lastFiredTime = now
    }
  }
  
  /**
   * 玩家开火
   */
  private playerShoot(): void {
    // 根据坦克方向创建子弹
    const texture = this.player.texture?.key || 'player_tank_up'
    let bullet: Phaser.Physics.Arcade.Image | null = null
    
    if (texture.includes('up')) {
      bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet_player')
      if (bullet) bullet.setVelocityY(-400)
    } else if (texture.includes('down')) {
      bullet = this.bullets.create(this.player.x, this.player.y + 20, 'bullet_player')
      if (bullet) bullet.setVelocityY(400)
    } else if (texture.includes('left')) {
      bullet = this.bullets.create(this.player.x - 20, this.player.y, 'bullet_player')
      if (bullet) bullet.setVelocityX(-400)
    } else if (texture.includes('right')) {
      bullet = this.bullets.create(this.player.x + 20, this.player.y, 'bullet_player')
      if (bullet) bullet.setVelocityX(400)
    }
    
    // 🔊 射击音效 + 炮口闪光
    if (bullet) {
      this.playSound('sfx_shot', 0.4)
      // 炮口闪光（小粒子）
      this.spawnMuzzleFlash(bullet.x, bullet.y)
      
      // 子弹自动销毁
      this.time.delayedCall(2000, () => {
        if (bullet && bullet.active) {
          bullet.destroy()
        }
      })
    }
  }
  
  /**
   * 启动计时器
   */
  private startTimer(): void {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--
        if (this.timeLeft <= 0) {
          this.handleGameOver()
        }
      },
      loop: true,
    })
  }
  
  /**
   * 游戏胜利
   */
  private handleVictory(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    
    console.log('🎉 游戏胜利！')
    
    const gameStore = useGameStore()
    gameStore.nextLevel()
    this.game.events.emit('levelComplete', gameStore.level)
    
    this.time.delayedCall(2000, () => {
      this.scene.restart()
    })
  }
  
  /**
   * 游戏结束（增强版）
   */
  private gameOverContainer: Phaser.GameObjects.Container | null = null

  private handleGameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true
    this.isDying = false
    this.isInvincible = false // 🛡️ 重置无敌标志

    // 清除闪烁定时器
    if (this.blinkTimer) {
      this.blinkTimer.destroy()
      this.blinkTimer = null
    }

    console.log('💀 游戏结束')

    this.playSound('sfx_gameover', 0.8)
    this.cameraShake(500)

    const gameStore = useGameStore()
    gameStore.setGameOver(true)
    this.game.events.emit('gameOver')

    // 显示 Game Over 界面
    this.showGameOverUI()
  }

  /**
   * 显示 Game Over UI
   */
  private showGameOverUI(): void {
    const cx = this.screenW / 2
    const cy = this.screenH / 2

    // 半透明黑色遮罩
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.7)
    overlay.fillRect(0, 0, this.screenW, this.screenH)

    // Game Over 文字
    const goText = this.add.text(cx, cy - 80, 'GAME OVER', {
      fontSize: '64px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 8,
    })
    goText.setOrigin(0.5)

    // 分数文字
    const scoreText = this.add.text(cx, cy, `得分：${this.score}`, {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    })
    scoreText.setOrigin(0.5)

    // 重新开始按钮背景
    const btnBg = this.add.graphics()
    btnBg.fillStyle(0x3b82f6, 1)
    btnBg.fillRoundedRect(cx - 100, cy + 50, 200, 60, 12)
    btnBg.setInteractive(new Phaser.Geom.Rectangle(cx - 100, cy + 50, 200, 60), Phaser.Geom.Rectangle.Contains)
    
    // 创建一个透明的 Zone 用于交互（Graphics 没有 setCursor 方法）
    const hitZone = this.add.zone(cx, cy + 80, 200, 60).setOrigin(0.5)
    hitZone.setInteractive({ useHandCursor: true })

    // 按钮文字
    const btnText = this.add.text(cx, cy + 80, '重新开始', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    })
    btnText.setOrigin(0.5)

    // 按钮悬停效果
    btnBg.on('pointerover', () => btnBg.clear().fillStyle(0x2563eb, 1).fillRoundedRect(cx - 100, cy + 50, 200, 60, 12))
    btnBg.on('pointerout', () => btnBg.clear().fillStyle(0x3b82f6, 1).fillRoundedRect(cx - 100, cy + 50, 200, 60, 12))
    hitZone.on('pointerdown', () => {
      this.playSound('sfx_shot', 0.5)
      this.scene.restart()
    })

    // 收集所有元素
    this.gameOverContainer = this.add.container(0, 0, [overlay, goText, scoreText, btnBg, btnText])
    this.gameOverContainer.setDepth(9999)
  }
}
