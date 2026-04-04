// ============================================================================
// 🎮 坦克大战游戏场景 - 重构版（单一入口架构）
// ============================================================================
//
// 📌 架构说明:
//   - PlayerController: 玩家状态/属性变更的唯一入口（单一入口原则）
//   - PlayerStateManager: 纯状态机（只做 PlayerState 枚举转换和查询）
//   - PlayerMovementManager: 移动控制（输入处理、边界检查）
//   - PlayerCombatManager: 纯射击逻辑（射击冷却、子弹创建）
//   - PowerUpEffectApplier: 纯视觉效果（道具持续视觉标识）
//   - CollisionManager: 碰撞检测（统一管理所有碰撞）
//   - EntityManager: 实体创建与管理
//   - TankGameOrchestrator: 关卡流程编排
//
// ⚠️ 核心规则:
//   所有玩家状态变更必须通过 PlayerController，禁止：
//     ❌ 直接操作 player.setAlpha() / setVisible() / setActive()
//     ❌ 直接调用 gameStore.loseLife() / addLife() / $patch()
// ============================================================================

import GameScene from './GameScene'
import { useGameStore } from '@/stores/game'
import { useConfigStore } from '@/stores/config'
import { EntityManager, EntityType } from '@/managers/EntityManager'
import type { ILevelResult } from '../types/level-types'
import { TankGameOrchestrator } from '../core/TankGameOrchestrator'
import { LevelConfigLoader } from '../utils/LevelConfigLoader'
import { PlayerController } from '@/managers/PlayerController'
import { PlayerStateManager } from '@/managers/PlayerStateManager'
import { PlayerMovementManager } from '@/managers/PlayerMovementManager'
import { PlayerCombatManager } from '@/managers/PlayerCombatManager'
import { CollisionManager } from '@/managers/CollisionManager'
import { EnemyAIManager } from '@/managers/EnemyAIManager'
import { ExplosionPool } from '../pools/ExplosionPool'
import { ParticleSystemUtil } from '../utils/ParticleSystemUtil'
import { RenderManager } from '@/managers/RenderManager'
import { PoolMonitorPanel } from '@/debug/PoolMonitorPanel'
import { PlayerDebugPanel } from '@/debug/PlayerDebugPanel'
import { EntityDebugPanel } from '@/debug/EntityDebugPanel'
import { EnemyDebugManager } from '@/debug/EnemyDebugManager'
import { TopDebugToolbarManager } from '@/ui/TopDebugToolbarManager'
import { PowerUpEffectApplier } from '../utils/PowerUpEffectApplier'
import { PowerUpType } from '../types/powerup-types'
import { Logger } from '../utils/Logger'

/**
 * ⭐ 坦克大战游戏场景（单一入口架构版）
 */
export default class TankGameScene extends GameScene {
  // ═══════════════════════════════════════
  // 🎮 游戏配置（只读数据）
  // ═══════════════════════════════════════

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly levelConfigs = [
    { level: 1, name: '训练关卡', enemyCount: 5, spawnInterval: 3000, enemyTypes: ['LIGHT'], mapType: 'simple', timeLimit: 120 },
    { level: 2, name: '初次战斗', enemyCount: 8, spawnInterval: 2500, enemyTypes: ['LIGHT', 'MEDIUM'], mapType: 'medium', timeLimit: 180 },
    { level: 3, name: '钢铁防线', enemyCount: 12, spawnInterval: 2000, enemyTypes: ['LIGHT', 'MEDIUM', 'HEAVY'], mapType: 'complex', timeLimit: 240 },
    { level: 4, name: '腹背受敌', enemyCount: 15, spawnInterval: 1800, enemyTypes: ['MEDIUM', 'HEAVY'], mapType: 'open', timeLimit: 300 },
    { level: 5, name: '最终决战', enemyCount: 20, spawnInterval: 1500, enemyTypes: ['LIGHT', 'MEDIUM', 'HEAVY'], mapType: 'hard', timeLimit: 360 }
  ]

  // ═══════════════════════════════════════
  // ⭐ 管理器引用
  // ═══════════════════════════════════════

  private entityManager!: EntityManager
  private orchestrator!: TankGameOrchestrator
  private stateManager!: PlayerStateManager
  private movementManager!: PlayerMovementManager
  private combatManager!: PlayerCombatManager
  private playerController!: PlayerController    // ⭐ 新增：单一入口控制器
  private collisionManager!: CollisionManager
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private enemyAIManager!: EnemyAIManager
  private explosionPool!: ExplosionPool
  private particleSystem!: ParticleSystemUtil
  private renderManager!: RenderManager
  private poolMonitor!: PoolMonitorPanel
  private playerDebugPanel!: PlayerDebugPanel
  private entityDebugPanel!: EntityDebugPanel
  private enemyDebugManager!: EnemyDebugManager
  private topDebugToolbar!: TopDebugToolbarManager
  private powerUpEffectApplier!: PowerUpEffectApplier

  // ═══════════════════════════════════════
  // 🎯 游戏实体引用
  // ═══════════════════════════════════════

  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyW!: Phaser.Input.Keyboard.Key
  private keyA!: Phaser.Input.Keyboard.Key
  private keyS!: Phaser.Input.Keyboard.Key
  private keyD!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key
  private keyJ!: Phaser.Input.Keyboard.Key

  // 实体组
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private bullets!: Phaser.Physics.Arcade.Group
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private enemyBullets!: Phaser.Physics.Arcade.Group
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private powerUps!: Phaser.Physics.Arcade.Group
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private enemies!: Phaser.Physics.Arcade.Group
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private walls!: Phaser.Physics.Arcade.StaticGroup
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private base!: Phaser.Physics.Arcade.Sprite

  // ═══════════════════════════════════════
  // 📊 游戏状态（仅保留 Scene 层需要的状态）
  // ═══════════════════════════════════════

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private currentLevel: number = 1
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private fireRate: number = 500
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private timeLeft: number = 0

  // ⭐ 关卡系统回调
  public onLevelComplete?: (result: ILevelResult) => void
  public _resolveLevelResult?: (result: ILevelResult) => void

  // 🏪 游戏商店（暴露给子管理器使用）
  public gameStore!: ReturnType<typeof useGameStore>

  // ═══════════════════════════════════════
  // 🎮 Phaser 生命周期方法
  // ═══════════════════════════════════════

  async preload(): Promise<void> {
    try {
      // ⭐ 注册真实加载进度事件（用于 Loading UI）
      this.setupLoadingProgressEvents()

      this.preloadFromGTRS()
    } catch (error) {
      throw error
    }
  }

  /**
   * ⭐ 设置 Phaser 真实加载进度事件监听
   */
  private setupLoadingProgressEvents(): void {
    // 总进度事件（0-1）
    this.load.on('progress', (value: number) => {
      this.events.emit('loadingProgress', value)
    })

    // 单文件进度事件
    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.events.emit('loadingFile', file.key)
    })

    // 文件加载完成事件
    this.load.on('filecomplete', (file: Phaser.Loader.File) => {
      this.events.emit('loadingFileComplete', file.key)
    })

    // 加载开始事件
    this.load.on('start', () => {
      this.events.emit('loadingStart')
    })

    // 加载完成事件
    this.load.on('complete', () => {
      this.events.emit('loadingComplete')
    })
  }

  async create(): Promise<void> {
    super.create()

    // 初始化渲染管理器
    this.renderManager = new RenderManager(this)
    this.renderManager.initDefaultLayers()

    // 初始化对象池和工具
    this.explosionPool = new ExplosionPool(this, this.renderManager)
    this.particleSystem = new ParticleSystemUtil(this)

    const configStore = useConfigStore()
    const config = configStore.getEffectiveConfig

    this.currentLevel = 1

    const mapWidth = this.gridCols * this.cellSize
    const mapHeight = this.gridRows * this.cellSize

    // 初始化 gameStore（仅做初始设置，后续所有修改走 PlayerController）
    this.gameStore = useGameStore()
    this.gameStore.reset()

    if (config.timeLimit) {
      this.timeLeft = config.timeLimit
    }

    // 创建背景
    const bg = this.renderManager.createSprite(
      mapWidth / 2,
      mapHeight / 2,
      'bg_main',
      undefined,
      'background'
    )
    bg.setOrigin(0.5, 0.5)
    bg.setSize(mapWidth, mapHeight)
    bg.setScrollFactor(0)
    bg.setDepth(-10)

    // 绘制地图边界和网格
    this.drawMapBoundaries(mapWidth, mapHeight)

    // 初始化 EntityManager
    this.entityManager = new EntityManager(this, this.renderManager)

    // 设置物理世界边界
    const physicsPadding = 32
    this.physics.world.setBounds(
      physicsPadding,
      physicsPadding,
      mapWidth - physicsPadding * 2,
      mapHeight - physicsPadding * 2
    )

    // 设置相机边界和位置
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight)
    this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2)
    this.cameras.main.setZoom(1)

    // 初始化键盘输入
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyJ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J)

    // 获取实体组
    this.bullets = this.entityManager.getGroup(EntityType.BULLET_PLAYER) as Phaser.Physics.Arcade.Group
    this.enemyBullets = this.entityManager.getGroup(EntityType.BULLET_ENEMY) as Phaser.Physics.Arcade.Group
    this.powerUps = this.entityManager.getGroup(EntityType.POWERUP) as Phaser.Physics.Arcade.Group
    this.enemies = this.entityManager.getGroup(EntityType.ENEMY_LIGHT) as Phaser.Physics.Arcade.Group
    this.walls = this.entityManager.getGroup(EntityType.WALL_BRICK) as Phaser.Physics.Arcade.StaticGroup

    // ⭐ 初始化管理器（新架构）
    // 1. 状态管理器（纯状态机，无 scene 依赖）
    this.stateManager = new PlayerStateManager()

    // 2. 创建玩家
    this.createPlayer()

    // 3. 移动管理器
    this.movementManager = new PlayerMovementManager(this, this.player)

    // 4. 战斗管理器（纯射击，无 stateManager 依赖）
    this.combatManager = new PlayerCombatManager(this)

    // 5. ⭐ 玩家控制器（单一入口）
    this.playerController = new PlayerController(this)
    this.playerController.reset(config.playerLives || 3)

    // 6. 碰撞管理器
    this.collisionManager = new CollisionManager(this)

    // 7. 敌人 AI
    this.enemyAIManager = new EnemyAIManager(this)

    // 8. 道具视觉效果（纯视觉）
    this.powerUpEffectApplier = new PowerUpEffectApplier(this)

    // 设置碰撞检测（由 CollisionManager 统一管理）
    this.collisionManager.setupAllCollisions()

    // 初始化调试面板
    this.poolMonitor = new PoolMonitorPanel(this, this.renderManager)
    this.poolMonitor.init()

    this.playerDebugPanel = new PlayerDebugPanel(this)
    this.entityDebugPanel = new EntityDebugPanel(this)
    this.enemyDebugManager = new EnemyDebugManager(this, this.entityDebugPanel)
    this.topDebugToolbar = new TopDebugToolbarManager(this)

    // 添加玩家到实体监控面板
    this.entityDebugPanel.addEntity('player', {
      name: '🎮 玩家坦克',
      type: 'player',
      entity: this.player
    })

    // 创建关卡编排器
    this.orchestrator = new TankGameOrchestrator(this)
    this.orchestrator.onProgress = (event) => {
      this.updateLoadingUI(event.progress, event.message)
    }

    this.onLevelComplete = (result: ILevelResult) => {}

    // 加载并运行关卡
    const levelConfig = await LevelConfigLoader.loadLevelConfig('tank_level_1')

    if (!levelConfig?.resources) {
      throw new Error('resources 字段不存在')
    }

    this.runLevelAsync(levelConfig)
  }

  update(_time: number, _delta: number): void {
    // ⭐ 通过 PlayerController 获取游戏状态
    const pd = this.playerController.data
    if (pd.isGameOver) return

    // 状态检查（通过只读快照）
    if (!pd.isValid) return

    // 移动更新
    this.movementManager.update(this.cursors, {
      keyW: this.keyW,
      keyA: this.keyA,
      keyS: this.keyS,
      keyD: this.keyD
    })

    // 射击更新（通过 PlayerController 的只读快照查询能力）
    if ((this.keySpace?.isDown || this.keyJ?.isDown)) {
      this.combatManager.tryShoot(pd.canAct, pd.canShoot)
    }

    // 更新调试面板
    this.playerDebugPanel.update(_time)
    this.enemyDebugManager.update(_time)
    this.entityDebugPanel.update(_time)
    this.poolMonitor.update(_time)
  }

  shutdown(): void {
    this.playerController.destroy()
    this.stateManager.destroy()
    this.playerDebugPanel.destroy()
    this.entityDebugPanel.destroy()
    this.topDebugToolbar.destroy()
    this.poolMonitor.destroy()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 私有辅助方法
  // ═══════════════════════════════════════════════════════════════════════════

  private drawMapBoundaries(mapWidth: number, mapHeight: number): void {
    const graphics = this.add.graphics()

    graphics.lineStyle(4, 0xffd700, 1)
    graphics.strokeRect(0, 0, mapWidth, mapHeight)

    graphics.lineStyle(1, 0x8b4513, 0.5)

    for (let x = 0; x <= mapWidth; x += this.cellSize) {
      graphics.moveTo(x, 0)
      graphics.lineTo(x, mapHeight)
    }

    for (let y = 0; y <= mapHeight; y += this.cellSize) {
      graphics.moveTo(0, y)
      graphics.lineTo(mapWidth, y)
    }

    graphics.strokePath()

    const physicsPadding = 32
    graphics.lineStyle(2, 0x00ff00, 1)
    graphics.strokeRect(physicsPadding, physicsPadding, 20, 20)
    graphics.strokeRect(mapWidth - physicsPadding - 20, physicsPadding, 20, 20)
    graphics.strokeRect(physicsPadding, mapHeight - physicsPadding - 20, 20, 20)
    graphics.strokeRect(mapWidth - physicsPadding - 20, mapHeight - physicsPadding - 20, 20, 20)
  }

  private createPlayer(): void {
    const cellSize = 64
    const cols = 13
    const rows = 12

    const baseCenterX = cols * cellSize / 2
    const baseY = (rows - 0.5) * cellSize
    const protectionTop = baseY - cellSize
    const startX = baseCenterX
    const startY = protectionTop - cellSize * 1.5

    this.player = this.entityManager.createEntity({
      type: EntityType.PLAYER,
      x: startX,
      y: startY,
      texture: 'player_tank_up',
      attributes: { health: 1, speed: 200 }
    }) as Phaser.Physics.Arcade.Sprite

    this.cameras.main.setBounds(
      0, 0,
      this.gridCols * this.cellSize,
      this.gridRows * this.cellSize
    )

    this.cameras.main.centerOn(
      (this.gridCols * this.cellSize) / 2,
      (this.gridRows * this.cellSize) / 2
    )
  }

  private async runLevelAsync(levelConfig: any): Promise<void> {
    try {
      await this.orchestrator.runLevel(levelConfig)
    } catch (error) {
      this.handleGameOver()
    }
  }

  private updateLoadingUI(progress: number, message: string): void {
    Logger.debug(`加载进度：${Math.round(progress * 100)}% - ${message}`)
  }

  /**
   * ⭐ 游戏结束处理 —— 走 PlayerController.setGameOver()
   */
  public handleGameOver(): void {
    // ⭐ 委托给 PlayerController
    this.playerController.setGameOver()

    this.time.delayedCall(1000, () => {
      this.scene.start('GameoverScene', { score: this.playerController.data.score })
    })
  }

  /**
   * ⭐ 添加分数 —— 走 PlayerController.addScore()
   */
  public addScore(points: number): void {
    this.playerController.addScore(points)
  }

  /**
   * 生成爆炸特效
   */
  public spawnExplosion(x: number, y: number, size: number = 1): void {
    this.explosionPool.playExplosion(x, y, size)
    this.particleSystem.createExplosionDebris(x, y, 0xff6600, 8 + size * 4, size)
    this.particleSystem.createExplosionDebris(x, y, 0xffcc00, 4 + size * 2, size * 0.7)
    this.cameraShake(200 * size)
  }

  public spawnPowerUpEffect(x: number, y: number, label?: string, color: number = 0xffd700): void {
    this.particleSystem.createExplosionDebris(x, y, color, 20, 3)
    this.particleSystem.createExplosionDebris(x, y, 0xffffff, 10, 2)
    this.spawnSparks(x, y, '#ffd700', 16)
    this.spawnSparks(x, y, '#ffffff', 8)

    const ring = this.add.graphics()
    ring.lineStyle(4, color, 1)
    ring.strokeCircle(0, 0, 5)
    ring.x = x
    ring.y = y
    this.tweens.add({
      targets: ring,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => ring.destroy()
    })

    if (label) {
      const text = this.add.text(x, y - 20, label, {
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 5,
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
      }).setOrigin(0.5).setDepth(9999)

      this.tweens.add({
        targets: text,
        y: y - 80,
        scaleX: 1.4,
        scaleY: 1.4,
        alpha: 0,
        duration: 1200,
        ease: 'Power2',
        onComplete: () => text.destroy()
      })
    }

    this.cameraShake(120, 2)
  }

  public getRenderManager(): RenderManager {
    return this.renderManager
  }

  public spawnSparks(x: number, y: number, color: string, count: number = 4): void {
    const colorNum = parseInt(color.replace('#', '0x'))
    this.particleSystem.createSparks(x, y, colorNum, count)
  }

  public spawnDebris(x: number, y: number, color: string): void {
    const colorNum = parseInt(color.replace('#', '0x'))
    this.particleSystem.createExplosionDebris(x, y, colorNum, 6, 2)
  }

  public cameraShake(duration: number = 200, intensity: number = 3): void {
    this.cameras.main.shake(duration, intensity / 1000)
  }

  public playSound(key: string, volume: number = 1): void {
    if (!this.cache.audio.exists(key)) return
    this.sound.play(key, {
      volume,
      detune: Phaser.Math.Between(-50, 50)
    })
  }

  public destroyEnemy(enemy: any): void {
    if (!enemy || !enemy.active) return

    this.spawnExplosion(enemy.x, enemy.y, 1.2)
    this.playSound('sfx_explosion', 0.9)
    this.addScore(100)
    enemy.destroy()
  }

  // ═══════════════════════════════════════
  // 🎁 道具拾取（收口到 PlayerController）
  // ═══════════════════════════════════════

  private readonly POWERUP_META: Record<string, { label: string; color: number; tankTint: number }> = {
    star:      { label: '⭐ 火力升级！', color: 0xFFFF00, tankTint: 0xFFFF00 },
    shield:    { label: '🛡️ 护盾激活！', color: 0x00BFFF, tankTint: 0x00BFFF },
    clock:     { label: '⏰ 时间冻结！', color: 0xBF00FF, tankTint: 0xBF00FF },
    gun:       { label: '🔫 散弹枪！',   color: 0xFF6600, tankTint: 0xFF6600 },
    homing:    { label: '🚀 追踪导弹！', color: 0x00FFFF, tankTint: 0x00FFFF },
    bomb:      { label: '💣 全屏炸弹！', color: 0xFF2200, tankTint: 0xFF4444 },
    speed:     { label: '💨 速度提升！', color: 0xAAFFAA, tankTint: 0x88FF88 },
    health:    { label: '❤️ 回复生命！', color: 0xFF69B4, tankTint: 0xFF69B4 },
    armor:     { label: '🔩 装甲强化！', color: 0xC0C0C0, tankTint: 0xC0C0C0 },
    grenade:   { label: '💥 手榴弹！',   color: 0xFF4500, tankTint: 0xFF4500 },
    invincible:{ label: '✨ 无敌状态！', color: 0xFFD700, tankTint: 0xFFD700 },
    life:      { label: '❤️ +1 生命！',  color: 0xFF0000, tankTint: 0xFF6666 },
  }

  /**
   * ⭐ 拾取道具 —— 属性加成走 PlayerController，视觉效果走 PowerUpEffectApplier
   */
  public collectPowerUp(powerUp: any): void {
    if (!powerUp || !powerUp.active) return

    const rawType = powerUp.getData('type') || powerUp.texture?.key?.replace('prop_', '') || ''
    const type = rawType.toLowerCase()
    const player = this.player
    const meta = this.POWERUP_META[type] || { label: `🎁 ${type}！`, color: 0xffd700, tankTint: 0xffd700 }

    Logger.debug(`🎁 [TankGameScene] 拾取道具：${type}`)

    // ⭐ 1. 属性加成 → PlayerController（唯一入口）
    const powerUpTypeEnum = PowerUpType[type.toUpperCase() as keyof typeof PowerUpType]
    if (powerUpTypeEnum !== undefined) {
      this.playerController.applyPowerUp(powerUpTypeEnum, player)
    } else {
      Logger.warn(`⚠️ 未识别的道具类型：${type}`)
    }

    // ⭐ 2. 持续视觉效果 → PowerUpEffectApplier
    if (powerUpTypeEnum !== undefined && player) {
      this.powerUpEffectApplier.startVisual(powerUpTypeEnum, player)
    }

    // 🎁 音效和拾取特效
    this.playSound('sfx_bonus_captured', 0.6)
    this.spawnPowerUpEffect(powerUp.x, powerUp.y, meta.label, meta.color)

    // 🌈 坦克闪烁反馈
    if (player && player.active) {
      this.flashTankColor(player, meta.tankTint, 600)
    }
  }

  private flashTankColor(tank: Phaser.Physics.Arcade.Sprite, tintColor: number, duration: number): void {
    const flashCount = 3
    const interval = duration / (flashCount * 2)
    let count = 0
    const timer = this.time.addEvent({
      delay: interval,
      repeat: flashCount * 2 - 1,
      callback: () => {
        if (!tank.active) { timer.remove(); return }
        count++
        if (count % 2 === 1) {
          tank.setTint(tintColor)
        } else {
          tank.clearTint()
        }
        if (count >= flashCount * 2) {
          tank.clearTint()
        }
      }
    })
  }

  public baseDestroyed(): void {
    if (!this.base || !this.base.active) {
      this.handleGameOver()
      return
    }

    this.spawnExplosion(this.base.x, this.base.y, 2)
    this.playSound('sfx_explosion', 1.0)
    this.cameraShake(500)

    if (!this.textures.exists('base_destroyed')) {
      const baseText = this.add.text(this.base.x, this.base.y, '基地已毁', {
        fontSize: '24px',
        color: '#FF0000',
        backgroundColor: '#000000'
      }).setOrigin(0.5)

      this.time.delayedCall(1500, () => {
        baseText.destroy()
        this.handleGameOver()
      })
      return
    }

    this.base.setTexture('base_destroyed')
    this.time.delayedCall(1500, () => this.handleGameOver())
  }
}
