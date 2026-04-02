// ============================================================================
// 🎮 坦克大战游戏场景 - 重构版（基于管理器架构）
// ============================================================================

import GameScene from './GameScene'
import { useGameStore } from '@/stores/game'
import { useConfigStore } from '@/stores/config'
import { EntityManager, EntityType } from '@/managers/EntityManager'
import type { ILevelResult } from '../types/level-types'
import { TankGameOrchestrator } from '../core/TankGameOrchestrator'
import { LevelConfigLoader } from '../utils/LevelConfigLoader'
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
import { GameEvents, CollisionEvents } from '../events/GameEvents'

/**
 * ⭐ 坦克大战游戏场景（重构版）
 * 
 * 📌 架构说明:
 *   - PlayerStateManager: 玩家状态管理（ALIVE/DYING/RESPAWNING/DEAD）
 *   - PlayerMovementManager: 移动控制（输入处理、边界检查）
 *   - PlayerCombatManager: 战斗逻辑（射击、受击、道具）
 *   - CollisionManager: 碰撞检测（统一管理所有碰撞）
 *   - EntityManager: 实体创建与管理
 *   - TankGameOrchestrator: 关卡流程编排
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
  // ⭐ 管理器引用（核心架构）
  // ═══════════════════════════════════════
  
  private entityManager!: EntityManager
  private orchestrator!: TankGameOrchestrator
  private stateManager!: PlayerStateManager
  private movementManager!: PlayerMovementManager
  private combatManager!: PlayerCombatManager
  private collisionManager!: CollisionManager
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private enemyAIManager!: EnemyAIManager
  private explosionPool!: ExplosionPool
  private particleSystem!: ParticleSystemUtil
  private renderManager!: RenderManager
  private poolMonitor!: PoolMonitorPanel  // ✅ 新增：对象池监控
  private playerDebugPanel!: PlayerDebugPanel
  private entityDebugPanel!: EntityDebugPanel
  private enemyDebugManager!: EnemyDebugManager
  private topDebugToolbar!: TopDebugToolbarManager
  
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
  
  // 实体组（CollisionManager 需要）
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
  // 📊 游戏状态
  // ═══════════════════════════════════════
  
  private isGameOver: boolean = false
  private score: number = 0
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
    // 🔴 严格模式：预加载所有资源，不允许失败
    try {
      this.preloadFromGTRS()
    } catch (error) {
      throw error
    }
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
    
    // 重置游戏状态
    this.isGameOver = false
    this.score = 0
    this.currentLevel = 1
    
    const mapWidth = this.gridCols * this.cellSize
    const mapHeight = this.gridRows * this.cellSize

    // 初始化游戏商店
    this.gameStore = useGameStore()
    this.gameStore.$patch({
      lives: config.playerLives || 3,
      score: 0,
      isGameOver: false
    })
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
    
    // 初始化管理器
    this.stateManager = new PlayerStateManager(this)
    this.createPlayer()
    this.movementManager = new PlayerMovementManager(this, this.player)
    this.combatManager = new PlayerCombatManager(this, this.stateManager)
    this.collisionManager = new CollisionManager(this)
    this.enemyAIManager = new EnemyAIManager(this)
    
    // 设置碰撞检测（事件驱动）
    this.collisionManager.setupAllCollisions()
    this.registerCollisionHandlers()
    
    // 初始化调试面板
    this.playerDebugPanel = new PlayerDebugPanel(this)
    this.entityDebugPanel = new EntityDebugPanel(this)
    this.enemyDebugManager = new EnemyDebugManager(this, this.entityDebugPanel)
    this.topDebugToolbar = new TopDebugToolbarManager(this)
    
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
    if (this.isGameOver) return
    
    const currentState = this.stateManager.getState()
    if (currentState === 'DEAD' || currentState === 'DYING') return
    
    this.movementManager.update(this.cursors, {
      keyW: this.keyW,
      keyA: this.keyA,
      keyS: this.keyS,
      keyD: this.keyD
    })
    
    if ((this.keySpace?.isDown || this.keyJ?.isDown) && currentState === 'ALIVE') {
      this.combatManager.tryShoot()
    }
    
    // 更新调试面板
    this.playerDebugPanel.update(_time)
    this.enemyDebugManager.update(_time)
    this.entityDebugPanel.update(_time)
  }
  
  shutdown(): void {
    this.unregisterCollisionHandlers()
    this.stateManager.destroy()
    this.playerDebugPanel.destroy()
    this.entityDebugPanel.destroy()
    this.topDebugToolbar.destroy()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎯 碰撞事件处理器（事件驱动替代回调嵌套）
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * ⭐ 注册所有碰撞事件监听
   */
  private registerCollisionHandlers(): void {
    // 玩家子弹 vs 墙壁
    GameEvents.on(this, CollisionEvents.PLAYER_BULLET_WALL, this.handlePlayerBulletWall, this)
    // 敌人子弹 vs 墙壁
    GameEvents.on(this, CollisionEvents.ENEMY_BULLET_WALL, this.handleEnemyBulletWall, this)
    // 玩家子弹 vs 敌人
    GameEvents.on(this, CollisionEvents.PLAYER_BULLET_ENEMY, this.handlePlayerBulletEnemy, this)
    // 敌人子弹 vs 玩家
    GameEvents.on(this, CollisionEvents.ENEMY_BULLET_PLAYER, this.handleEnemyBulletPlayer, this)
    // 玩家 vs 敌人
    GameEvents.on(this, CollisionEvents.PLAYER_ENEMY, this.handlePlayerEnemyCollision, this)
    // 敌人子弹 vs 基地
    GameEvents.on(this, CollisionEvents.ENEMY_BULLET_BASE, this.handleEnemyBulletBase, this)
    // 玩家 vs 道具
    GameEvents.on(this, CollisionEvents.PLAYER_POWERUP, this.handlePlayerPowerUp, this)
  }

  /**
   * ⭐ 注销所有碰撞事件监听
   */
  private unregisterCollisionHandlers(): void {
    GameEvents.off(this, CollisionEvents.PLAYER_BULLET_WALL, this.handlePlayerBulletWall, this)
    GameEvents.off(this, CollisionEvents.ENEMY_BULLET_WALL, this.handleEnemyBulletWall, this)
    GameEvents.off(this, CollisionEvents.PLAYER_BULLET_ENEMY, this.handlePlayerBulletEnemy, this)
    GameEvents.off(this, CollisionEvents.ENEMY_BULLET_PLAYER, this.handleEnemyBulletPlayer, this)
    GameEvents.off(this, CollisionEvents.PLAYER_ENEMY, this.handlePlayerEnemyCollision, this)
    GameEvents.off(this, CollisionEvents.ENEMY_BULLET_BASE, this.handleEnemyBulletBase, this)
    GameEvents.off(this, CollisionEvents.PLAYER_POWERUP, this.handlePlayerPowerUp, this)
  }

  // ===========================================================================
  // 🔫 子弹碰撞处理
  // ===========================================================================

  /**
   * 玩家子弹 vs 墙壁
   */
  private handlePlayerBulletWall(data: any): void {
    const { source: bullet, target: wall } = data
    if (!bullet.active) return

    const bx = bullet.x, by = bullet.y
    const isSteel = wall?.texture?.key === 'wall_steel'
    bullet.destroy()

    if (isSteel) {
      this.spawnSparks(bx, by, '#94a3b8', 4)
      this.playSound('sfx_hit', 0.2)
    } else {
      wall?.destroy()
      this.spawnDebris(bx, by, '#8B4513')
      this.playSound('sfx_explosion', 0.4)
      this.cameraShake(100)
    }
  }

  /**
   * 敌人子弹 vs 墙壁
   */
  private handleEnemyBulletWall(data: any): void {
    const { source: bullet, target: wall } = data
    if (!bullet.active) return

    const bx = bullet.x, by = bullet.y
    const isSteel = wall?.texture?.key === 'wall_steel'
    bullet.destroy()

    if (isSteel) {
      this.spawnSparks(bx, by, '#94a3b8', 4)
      this.playSound('sfx_hit', 0.2)
    } else {
      wall?.destroy()
      this.spawnDebris(bx, by, '#8B4513')
      this.playSound('sfx_explosion', 0.3)
    }
  }

  /**
   * 玩家子弹 vs 敌人
   */
  private handlePlayerBulletEnemy(data: any): void {
    const { source: bullet, target: enemy } = data
    if (!bullet.active) return
    bullet.destroy()
    this.destroyEnemy(enemy)
  }

  /**
   * 敌人子弹 vs 玩家
   */
  private handleEnemyBulletPlayer(data: any): void {
    const { source: bullet } = data
    const combatManager = (this as any).combatManager
    if (combatManager) combatManager.onHitWithBullet(bullet)
    else bullet.destroy()
  }

  /**
   * 玩家 vs 敌人（物理碰撞）
   */
  private handlePlayerEnemyCollision(): void {
    const player = (this as any).player
    if (!player?.active) return

    const combatManager = (this as any).combatManager
    if (combatManager) {
      if (combatManager.hasShield?.()) return
      if ((this as any).stateManager?.isInvincible()) return
      combatManager.onHit()
    }
  }

  /**
   * 敌人子弹 vs 基地
   */
  private handleEnemyBulletBase(data: any): void {
    const { source: bullet } = data
    if (bullet.active) bullet.destroy()
    this.baseDestroyed()
  }

  /**
   * 玩家 vs 道具
   */
  private handlePlayerPowerUp(data: any): void {
    const { target: powerUp } = data
    if (!powerUp?.active) return
    this.collectPowerUp(powerUp)
    powerUp.destroy()
  }
  
  // ═══════════════════════════════════════
  // 🔧 私有辅助方法
  // ═══════════════════════════════════════
  
  /**
   * ⭐ 绘制地图边界和网格
   */
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
  
  /**
   * 创建玩家坦克
   */
  private createPlayer(): void {
    const mapWidth = this.gridCols * this.cellSize
    const mapHeight = this.gridRows * this.cellSize
    const cellSize = 64
    const cols = 13
    const rows = 12
    
    // 🏠 基地保护墙范围（与 TankConfigParser 保持一致）
    const baseCenterX = cols * cellSize / 2  // 416px
    const baseY = (rows - 0.5) * cellSize    // 736px（基地下移后的位置）
    const protectionTop = baseY - cellSize  // 672px（保护墙上边界）
    const protectionBottom = baseY + cellSize * 2  // 864px（保护墙下边界）
    
    // 🎮 玩家初始位置：在基地保护墙上方，保持水平居中
    const startX = baseCenterX
    const startY = protectionTop - cellSize * 1.5  // 保护墙上边界上方 1.5 个格子 = 576px
    
    this.player = this.entityManager.createEntity({
      type: EntityType.PLAYER,
      x: startX,
      y: startY,
      texture: 'player_tank_up',
      attributes: { health: 1, speed: 200 }
    }) as Phaser.Physics.Arcade.Sprite
    
    this.cameras.main.setBounds(
      0,
      0,
      this.gridCols * this.cellSize,
      this.gridRows * this.cellSize
    )
    
    this.cameras.main.centerOn(
      (this.gridCols * this.cellSize) / 2,
      (this.gridRows * this.cellSize) / 2
    )
  }
  
  /**
   * 异步运行关卡
   */
  private async runLevelAsync(levelConfig: any): Promise<void> {
    try {
      await this.orchestrator.runLevel(levelConfig)
    } catch (error) {
      this.handleGameOver()
    }
  }

  /**
   * 更新加载 UI
   */
  private updateLoadingUI(progress: number, message: string): void {
    console.log(`加载进度：${Math.round(progress * 100)}% - ${message}`)
  }

  /**
   * 游戏结束处理
   */
  public handleGameOver(): void {
    if (this.isGameOver) return
    
    this.isGameOver = true
    
    this.gameStore.$patch({
      isGameOver: true,
      score: this.score
    })
    
    this.time.delayedCall(1000, () => {
      this.scene.start('GameoverScene', { score: this.score })
    })
  }
  
  /**
   * 添加分数
   */
  public addScore(points: number): void {
    this.score += points
    this.gameStore.$patch({ score: this.score })
  }
  
  /**
   * 生成爆炸特效（使用对象池 + 粒子系统）
   */
  public spawnExplosion(x: number, y: number, size: number = 1): void {
    // ✅ 使用爆炸对象池（复用 Sprite）
    this.explosionPool.playExplosion(x, y, size)
    
    // ✅ 使用粒子系统（GPU 加速）
    this.particleSystem.createExplosionDebris(x, y, 0xff6600, 8 + size * 4, size)
    this.particleSystem.createExplosionDebris(x, y, 0xffcc00, 4 + size * 2, size * 0.7)
    
    // ✅ 相机震动
    this.cameraShake(200 * size)
  }

  /**
   * 🎆 生成道具拾取特效
   */
  public spawnPowerUpEffect(x: number, y: number): void {
    // ✅ 使用粒子系统（GPU 加速）- 金色粒子
    this.particleSystem.createExplosionDebris(x, y, 0xffd700, 12, 1.5)
    this.particleSystem.createExplosionDebris(x, y, 0xffaa00, 8, 1.0)
    
    // ✅ 火花特效
    this.spawnSparks(x, y, '#ffd700', 10)
    this.spawnSparks(x, y, '#ffaa00', 6)
    
    // ✅ 轻微相机震动（比爆炸弱）
    this.cameraShake(80, 1.5)
  }
  
  /**
   * ⭐ 获取渲染管理器（用于外部访问）
   */
  public getRenderManager(): RenderManager {
    return this.renderManager
  }
  
  /**
   * 生成火花粒子（使用粒子系统）
   */
  public spawnSparks(x: number, y: number, color: string, count: number = 4): void {
    const colorNum = parseInt(color.replace('#', '0x'))
    this.particleSystem.createSparks(x, y, colorNum, count)
  }
  
  /**
   * 生成墙壁碎片（使用粒子系统）
   */
  public spawnDebris(x: number, y: number, color: string): void {
    const colorNum = parseInt(color.replace('#', '0x'))
    this.particleSystem.createExplosionDebris(x, y, colorNum, 6, 2)
  }
  
  /**
   * 相机震动
   */
  public cameraShake(duration: number = 200, intensity: number = 3): void {
    this.cameras.main.shake(duration, intensity / 1000)
  }
  
  /**
   * ⭐ 播放音效（宽松模式 - 允许缺失）
   */
  public playSound(key: string, volume: number = 1): void {
    if (!this.cache.audio.exists(key)) return
    this.sound.play(key, {
      volume,
      detune: Phaser.Math.Between(-50, 50)
    })
  }
  
  /**
   * 摧毁敌人
   */
  public destroyEnemy(enemy: any): void {
    if (!enemy || !enemy.active) return
    
    this.spawnExplosion(enemy.x, enemy.y, 1.2)
    this.playSound('sfx_explosion', 0.9)
    this.addScore(100)
    enemy.destroy()
  }
  
  /**
   * 拾取道具
   */
  public collectPowerUp(powerUp: any): void {
    if (!powerUp || !powerUp.active) return
    
    const type = powerUp.getData('type') || powerUp.texture?.key?.replace('prop_', '')
    
    switch (type) {
      case 'gun':
        this.combatManager.activateUpgrade()
        break
      case 'shield':
        this.combatManager.activateShieldPowerUp()
        break
      case 'clock':
        this.combatManager.activateFreezeEffect()
        break
      case 'star':
        this.movementManager.setSpeedMultiplier(1.5)
        break
    }
    
    // 🎁 播放道具拾取音效（使用正确的音效名称）
    this.playSound('sfx_bonus_captured', 0.6)
    
    // 🎆 播放道具拾取特效
    this.spawnPowerUpEffect(powerUp.x, powerUp.y)
    
    powerUp.destroy()
  }
  
  /**
   * 基地被摧毁
   */
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
