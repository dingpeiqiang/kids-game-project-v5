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
    console.log('🎮 [TankGameScene] Preload 阶段开始')
    
    // 🔴 严格模式：预加载所有资源，不允许失败
    try {
      this.preloadFromGTRS()
      console.log('✅ [TankGameScene] Preload 阶段完成')
    } catch (error) {
      console.error('❌ [TankGameScene] Preload 失败，游戏无法启动:', error)
      throw error // 严格模式：直接向上抛出错误，不允许继续
    }
  }

  async create(): Promise<void> {
    super.create()
    
    console.log('🎮 坦克大战启动（重构版 - 管理器架构）')
    
    // ✅ 初始化渲染管理器（优先）
    this.renderManager = new RenderManager(this)
    this.renderManager.initDefaultLayers()
    
    // ✅ 初始化对象池和工具
    this.explosionPool = new ExplosionPool(this, this.renderManager)
    this.particleSystem = new ParticleSystemUtil(this)
    
    const configStore = useConfigStore()
    const config = configStore.getEffectiveConfig
    
    // 🛑 重置游戏状态
    this.isGameOver = false
    this.score = 0
    this.currentLevel = 1
    
    // ✅ 计算地图尺寸
    const mapWidth = this.gridCols * this.cellSize
    const mapHeight = this.gridRows * this.cellSize
    
    console.log('🎮 坦克大战启动（重构版 - 管理器架构）')
    console.log('📐 地图尺寸:', { mapWidth, mapHeight, screenW: this.screenW, screenH: this.screenH })

    // 初始化游戏商店
    this.gameStore = useGameStore()  // ✅ 保存引用供子管理器使用
    console.log('🏪 [调试] 初始化 gameStore 前:', { lives: this.gameStore.lives })
    
    this.gameStore.$patch({
      lives: config.playerLives || 3,
      score: 0,
      isGameOver: false
    })
    console.log('🏪 [调试] $patch 后:', { lives: this.gameStore.lives })
    
    this.gameStore.reset()
    console.log('🏪 [调试] reset() 后:', { lives: this.gameStore.lives })

    if (config.timeLimit) {
      this.timeLeft = config.timeLimit
    }

    // ✅ 创建背景（覆盖整个地图区域，而非屏幕）
    // 🔧 关键修复：背景必须使用地图中心，而不是屏幕中心
    const bg = this.renderManager.createSprite(
      mapWidth / 2,      // ✅ 地图宽度的一半
      mapHeight / 2,     // ✅ 地图高度的一半
      'bg_main',
      undefined,
      'background'
    )
    bg.setOrigin(0.5, 0.5)
    bg.setSize(mapWidth, mapHeight)  // ✅ 背景大小与地图一致
    bg.setScrollFactor(0)  // ✅ 背景不随相机移动
    bg.setDepth(-10)
    
    console.log('✅ 背景已创建:', {
      x: bg.x,
      y: bg.y,
      width: bg.width,
      height: bg.height
    })
    
    // ✅ 绘制地图边界和网格（明显可见的边界线）
    this.drawMapBoundaries(mapWidth, mapHeight)
    
    // ✅ 初始化 EntityManager（注入 RenderManager）
    this.entityManager = new EntityManager(this, this.renderManager)
    
    // 🔴 设置物理世界边界（与地图大小一致，考虑坦克实体大小）
    const physicsPadding = 32  // 坦克半径约 32px
    this.physics.world.setBounds(
      physicsPadding,                    // ✅ 从左边界内缩
      physicsPadding,                    // ✅ 从上边界内缩
      mapWidth - physicsPadding * 2,     // ✅ 宽度减去两边内缩
      mapHeight - physicsPadding * 2     // ✅ 高度减去上下内缩
    )
    
    // 🔧 设置相机边界和位置（固定视角，俯视整个地图）
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight)
    this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2)
    this.cameras.main.setZoom(1)
    
    console.log('🔧 物理世界边界已设置:', {
      x: physicsPadding,
      y: physicsPadding,
      width: mapWidth - physicsPadding * 2,
      height: mapHeight - physicsPadding * 2,
      mapSize: `${mapWidth}x${mapHeight}`
    })
    
    console.log('📷 相机已设置为固定视角:', {
      scrollX: this.cameras.main.scrollX,
      scrollY: this.cameras.main.scrollY,
      zoom: this.cameras.main.zoom,
      bounds: this.cameras.main.getBounds()
    })
    
    // ✅ 初始化键盘输入（在相机设置之后）
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyJ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J)

    console.log('✅ 键盘输入已初始化:', {
      hasCursors: !!this.cursors,
      hasKeyW: !!this.keyW,
      hasKeyA: !!this.keyA,
      hasKeyS: !!this.keyS,
      hasKeyD: !!this.keyD,
      hasKeySpace: !!this.keySpace,
      hasKeyJ: !!this.keyJ
    })
    
    // ✅ 从 EntityManager 获取实体组（使用类型断言）
    this.bullets = this.entityManager.getGroup(EntityType.BULLET_PLAYER) as Phaser.Physics.Arcade.Group
    this.enemyBullets = this.entityManager.getGroup(EntityType.BULLET_ENEMY) as Phaser.Physics.Arcade.Group
    this.powerUps = this.entityManager.getGroup(EntityType.POWERUP) as Phaser.Physics.Arcade.Group
    // ✅ 敌人群包含所有类型（使用 ENEMY_LIGHT 作为代表，因为所有敌人都在同一个组）
    this.enemies = this.entityManager.getGroup(EntityType.ENEMY_LIGHT) as Phaser.Physics.Arcade.Group
    this.walls = this.entityManager.getGroup(EntityType.WALL_BRICK) as Phaser.Physics.Arcade.StaticGroup
    
    // ✅ 初始化所有管理器（在创建玩家之前）
    this.stateManager = new PlayerStateManager(this)
    
    // 创建玩家（stateManager 已初始化）
    this.createPlayer()
    
    // ✅ 继续初始化其他管理器（需要 player 引用）
    this.movementManager = new PlayerMovementManager(this, this.player)
    this.combatManager = new PlayerCombatManager(this, this.stateManager)
    this.collisionManager = new CollisionManager(this)
    this.enemyAIManager = new EnemyAIManager(this)
    
    // 💥 设置碰撞检测（委托给 CollisionManager）
    this.collisionManager.setupAllCollisions()
    
    // ⭐ 创建关卡编排器
    this.orchestrator = new TankGameOrchestrator(this)
    
    // ⭐ 设置进度回调
    this.orchestrator.onProgress = (event) => {
      this.updateLoadingUI(event.progress, event.message)
    }
    
    // ✅ 设置关卡完成回调（关键！）
    this.onLevelComplete = (result: ILevelResult) => {
      console.log('✅ [TankGameScene] 关卡完成:', result)
      // 可以在这里处理关卡完成后的逻辑
    }
    
    // 🎮 加载并运行关卡（验证关卡配置）
    const levelConfig = await LevelConfigLoader.loadLevelConfig('tank_level_1')
    
    // 🔴 严格模式：验证关卡配置中的资源列表
    if (!levelConfig?.resources) {
      throw new Error('❌ [关卡配置错误] resources 字段不存在')
    }
    
    console.log('📋 [关卡配置] 资源列表验证通过')
    this.runLevelAsync(levelConfig)
  }
  
  update(_time: number, _delta: number): void {
    if (this.isGameOver) return
    
    // ✅ 关键：如果玩家不能行动，直接返回
    // 🔧 修复：允许玩家在 RESPAWNING 状态下移动（只是不能射击）
    const currentState = this.stateManager.getState()
    if (currentState === 'DEAD' || currentState === 'DYING') {
      console.log('⚠️ 玩家无法行动，当前状态:', currentState)
      return
    }
    
    // 🎯 移动控制（委托给 movementManager）- 所有状态都允许移动
    this.movementManager.update(this.cursors, {
      keyW: this.keyW,
      keyA: this.keyA,
      keyS: this.keyS,
      keyD: this.keyD
    })
    
    // ⚔️ 射击控制（委托给 combatManager）- 只有 ALIVE 状态可以射击
    if ((this.keySpace?.isDown || this.keyJ?.isDown) && currentState === 'ALIVE') {
      this.combatManager.tryShoot()
    }
  }
  
  shutdown(): void {
    console.log('🛑 场景关闭，清理资源')
    this.stateManager.destroy()
  }
  
  // ═══════════════════════════════════════
  // 🔧 私有辅助方法
  // ═══════════════════════════════════════
  
  /**
   * ⭐ 绘制地图边界和网格（明显可见的边界线）
   */
  private drawMapBoundaries(mapWidth: number, mapHeight: number): void {
    const graphics = this.add.graphics()
    
    // 🟨 绘制外边框（粗黄色边框，非常明显）
    graphics.lineStyle(4, 0xffd700, 1)  // 4px 金色边框
    graphics.strokeRect(0, 0, mapWidth, mapHeight)
    
    // 🟫 绘制内部网格线（较细的棕色线）
    graphics.lineStyle(1, 0x8b4513, 0.5)  // 1px 棕色半透明
    
    // 垂直网格线
    for (let x = 0; x <= mapWidth; x += this.cellSize) {
      graphics.moveTo(x, 0)
      graphics.lineTo(x, mapHeight)
    }
    
    // 水平网格线
    for (let y = 0; y <= mapHeight; y += this.cellSize) {
      graphics.moveTo(0, y)
      graphics.lineTo(mapWidth, y)
    }
    
    graphics.strokePath()
    
    // 🎯 添加四个角的标记（更清晰显示实际移动区域）
    const physicsPadding = 32
    graphics.lineStyle(2, 0x00ff00, 1)  // 2px 绿色
    
    // 左上角
    graphics.strokeRect(physicsPadding, physicsPadding, 20, 20)
    // 右上角
    graphics.strokeRect(mapWidth - physicsPadding - 20, physicsPadding, 20, 20)
    // 左下角
    graphics.strokeRect(physicsPadding, mapHeight - physicsPadding - 20, 20, 20)
    // 右下角
    graphics.strokeRect(mapWidth - physicsPadding - 20, mapHeight - physicsPadding - 20, 20, 20)
    
    console.log('✅ 地图边界已绘制:', { 
      mapSize: `${mapWidth}x${mapHeight}`, 
      cellSize: this.cellSize,
      physicsBounds: `(${physicsPadding}, ${physicsPadding}) - (${mapWidth - physicsPadding}, ${mapHeight - physicsPadding})`
    })
  }
  
  /**
   * 创建玩家坦克
   */
  private createPlayer(): void {
    // ✅ 玩家应该出生在地图底部中心（固定视角）
    const mapWidth = this.gridCols * this.cellSize
    const mapHeight = this.gridRows * this.cellSize
    const startX = mapWidth / 2  // 地图水平中心
    const startY = mapHeight - 100  // 距离底部 100 像素
    
    console.log('📍 计算玩家出生位置:', {
      gridCols: this.gridCols,
      gridRows: this.gridRows,
      cellSize: this.cellSize,
      mapWidth: mapWidth,
      mapHeight: mapHeight,
      calculatedX: startX,
      calculatedY: startY
    })
    
    this.player = this.entityManager.createEntity({
      type: EntityType.PLAYER,
      x: startX,
      y: startY,
      texture: 'player_tank_up',
      attributes: { health: 1, speed: 200 }
    }) as Phaser.Physics.Arcade.Sprite
    
    console.log('✅ 玩家实体已创建:', {
      x: this.player.x,
      y: this.player.y,
      active: this.player.active,
      visible: this.player.visible,
      bodyExists: !!this.player.body
    })
    
    // ❌ 移除相机跟随 - 坦克大战应该是固定视角
    // 传统坦克大战中，玩家坦克在屏幕范围内移动，相机不跟随
    // this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    // this.cameras.main.setZoom(1)
    
    // ✅ 设置相机位置（固定在地图上方）
    this.cameras.main.setBounds(
      0,  // ✅ 从 (0,0) 开始，而不是 offsetX
      0,
      this.gridCols * this.cellSize,  // ✅ 只设置游戏区域大小
      this.gridRows * this.cellSize
    )
    
    // ✅ 将相机定位到地图中心
    this.cameras.main.centerOn(
      (this.gridCols * this.cellSize) / 2,
      (this.gridRows * this.cellSize) / 2
    )
    
    console.log('📷 相机已设置为固定视角:', {
      scrollX: this.cameras.main.scrollX,
      scrollY: this.cameras.main.scrollY,
      zoom: this.cameras.main.zoom,
      bounds: this.cameras.main.getBounds()
    })
    
    console.log('🛡️ 玩家出生，获得 3 秒无敌保护')
    console.log('✅ 玩家坦克已创建', { x: startX, y: startY })
    
    // 🔧 关键修复：玩家初始状态应该是 ALIVE，而不是 RESPAWNING
    // startRespawning() 会触发闪烁效果，这只应该在死亡复活时使用
    // ✅ 玩家出生时就是 ALIVE 状态，可以正常行动
  }
  
  /**
   * 异步运行关卡
   */
  private async runLevelAsync(levelConfig: any): Promise<void> {
    try {
      await this.orchestrator.runLevel(levelConfig)
    } catch (error) {
      console.error('❌ 关卡运行失败:', error)
      this.handleGameOver()
    }
  }
  
  /**
   * 更新加载 UI
   */
  private updateLoadingUI(progress: number, message: string): void {
    console.log(`📊 加载进度：${Math.round(progress * 100)}% - ${message}`)
  }
  
  /**
   * 游戏结束处理
   */
  public handleGameOver(): void {
    if (this.isGameOver) return
    
    console.log('💀 游戏结束')
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
    // 🟡 宽松模式：音效不存在时只记录警告，不阻止游戏
    if (!this.cache.audio.exists(key)) {
      console.warn(`⚠️ [音效失败] 音效 "${key}" 未加载，游戏将静音运行`)
      return // 直接返回，不抛出错误
    }

    // 播放音效（添加轻微随机音调以增强听感）
    this.sound.play(key, {
      volume,
      detune: Phaser.Math.Between(-50, 50) // 较小的随机范围
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
    console.log(`🎁 拾取道具：${type}`)
    
    // ⚔️ 委托给 combatManager 处理
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
    
    powerUp.destroy()
    this.playSound('sfx_powerup', 0.5)
    this.spawnSparks(powerUp.x, powerUp.y, '#ffd700', 8)
  }
  
  /**
   * 基地被摧毁（宽松模式 - 允许 base 不存在）
   */
  public baseDestroyed(): void {
    // 🟡 宽松模式：base 不存在时不阻止游戏结束
    if (!this.base || !this.base.active) {
      console.warn('⚠️ [基地警告] base 不存在或已失效，但仍触发游戏结束')
      this.handleGameOver()
      return
    }

    console.log('💥 基地被摧毁！')
    this.spawnExplosion(this.base.x, this.base.y, 2)
    this.playSound('sfx_explosion', 1.0)
    this.cameraShake(500)

    // 🟡 宽松模式：纹理不存在时使用文字提示
    if (!this.textures.exists('base_destroyed')) {
      console.warn('⚠️ [纹理警告] base_destroyed 纹理未加载，使用文字替代')
      const baseText = this.add.text(this.base.x, this.base.y, '🏠 基地已毁', {
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
