// ============================================================================
// 🎁 道具管理器 - 管理道具生成、拾取和效果应用
// ============================================================================
// 
// 📌 说明:
//   统一管理所有道具的生成逻辑、拾取检测、效果应用
//   支持概率生成、最大数量限制、定时生成等特性
// ============================================================================

import { IGameManager } from './IGameManager'
import type { EntityManager } from './EntityManager'
import type { PlayerCombatManager } from './PlayerCombatManager'
import type { PowerUpEntity } from '../entities/PowerUpEntity'
import { PowerUpType } from '../entities/PowerUpEntity'

/**
 * ⭐ 道具配置
 */
export interface IPowerUpConfig {
  maxCount: number                    // 场上最大道具数量
  spawnInterval: number               // 生成间隔（毫秒）
  despawnTime: number                 // 未拾取消失时间（毫秒）
  spawnRates: Record<PowerUpType, number>  // 各道具生成概率
}

/**
 * ⭐ 道具管理器
 */
export class PowerUpManager implements IGameManager {
  protected scene: Phaser.Scene
  protected entityManager: EntityManager
  protected combatManager?: PlayerCombatManager
  
  // 状态
  private spawnTimer: Phaser.Time.TimerEvent | null = null
  private currentSpawnCount: number = 0
  
  // 默认配置
  private readonly config: IPowerUpConfig = {
    maxCount: 3,
    spawnInterval: 10000,  // 10 秒生成一个
    despawnTime: 15000,    // 15 秒后消失
    
    spawnRates: {
      [PowerUpType.GUN]: 0.25,       // 25% - 火力升级
      [PowerUpType.SHIELD]: 0.15,    // 15% - 护盾
      [PowerUpType.CLOCK]: 0.10,     // 10% - 时间冻结
      [PowerUpType.STAR]: 0.15,      // 15% - 速度提升
      [PowerUpType.HEART]: 0.05,     // 5% - 额外生命
      [PowerUpType.BOMB]: 0.05,      // 5% - 全屏炸弹
      [PowerUpType.SHOTGUN]: 0.15,   // 15% - 散弹枪
      [PowerUpType.HOMING]: 0.10     // 10% - 追踪导弹
    }
  }
  
  constructor(
    scene: Phaser.Scene,
    entityManager: EntityManager,
    combatManager?: PlayerCombatManager
  ) {
    this.scene = scene
    this.entityManager = entityManager
    this.combatManager = combatManager
  }
  
  // ===========================================================================
  // 📌 IGameManager 接口实现
  // ===========================================================================
  
  /**
   * ⭐ 初始化
   */
  init(): void {
    console.log('✅ [PowerUpManager] 已创建')
    console.log(`📊 [PowerUpManager] 配置：最大 ${this.config.maxCount} 个，每 ${this.config.spawnInterval / 1000}s 生成`)
    
    // 开始定时生成
    this.startSpawnTimer()
  }
  
  /**
   * ⭐ 每帧更新
   */
  update?(_time: number, delta: number): void {
    // 检查场上道具数量
    const activeCount = this.entityManager.powerUps.getChildren()
      .filter((child: any) => child.active).length
    
    this.currentSpawnCount = activeCount
  }
  
  /**
   * ⭐ 销毁清理
   */
  destroy(): void {
    console.log('🗑️ [PowerUpManager] 销毁')
    
    if (this.spawnTimer) {
      this.spawnTimer.destroy()
      this.spawnTimer = null
    }
    
    // 清除所有道具
    this.clearAllPowerUps()
  }
  
  // ===========================================================================
  // 📌 公开 API - 生成控制
  // ===========================================================================
  
  /**
   * ⭐ 启动定时生成
   */
  startSpawnTimer(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy()
    }
    
    this.spawnTimer = this.scene.time.addEvent({
      delay: this.config.spawnInterval,
      callback: () => this.spawnRandomPowerUp(),
      loop: true
    })
    
    console.log('⏰ [PowerUpManager] 开始定时生成道具')
  }
  
  /**
   * ⭐ 停止定时生成
   */
  stopSpawnTimer(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy()
      this.spawnTimer = null
      console.log('⏹️ [PowerUpManager] 停止定时生成')
    }
  }
  
  /**
   * ⭐ 手动生成道具
   * 
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param type - 指定类型（可选，随机）
   */
  spawnPowerUp(x: number, y: number, type?: PowerUpType): PowerUpEntity {
    // 检查是否超过最大数量
    const currentCount = this.entityManager.powerUps.getChildren()
      .filter((child: any) => child.active).length
    
    if (currentCount >= this.config.maxCount) {
      console.warn('⚠️ [PowerUpManager] 场上道具已达上限，无法生成')
      return null as any
    }
    
    // 确定类型
    const powerUpType = type || this.getRandomType()
    
    // 创建道具实体
    const powerUp = this.entityManager.createEntity({
      type: 'powerup' as any,
      x,
      y,
      texture: `prop_${powerUpType}`,
      attributes: {
        type: powerUpType
      }
    }) as PowerUpEntity
    
    console.log(`🎁 [PowerUpManager] 生成道具：${powerUpType} at (${x}, ${y})`)
    
    return powerUp
  }
  
  /**
   * ⭐ 清除所有道具
   */
  clearAllPowerUps(): void {
    const powerUps = this.entityManager.powerUps.getChildren()
    
    powerUps.forEach((powerUp: any) => {
      if (powerUp.active) {
        const entity = powerUp.getData('entity') as PowerUpEntity
        if (entity) {
          entity.destroy()
        }
        powerUp.destroy()
      }
    })
    
    console.log('🗑️ [PowerUpManager] 清除所有道具')
  }
  
  // ===========================================================================
  // 📌 公开 API - 拾取处理
  // ===========================================================================
  
  /**
   * ⭐ 处理道具拾取
   * 
   * @param powerUp - 被拾取的道具
   */
  handleCollect(powerUp: PowerUpEntity): void {
    if (!powerUp || powerUp.isCollected) return
    
    console.log(`🎁 [PowerUpManager] 处理道具拾取：${powerUp.type}`)
    
    // 标记为已拾取
    powerUp.collect()
    
    // 应用效果
    this.applyEffect(powerUp)
    
    // 从场景中移除（延迟一点，让效果播放）
    setTimeout(() => {
      if (powerUp.sprite && powerUp.sprite.active) {
        powerUp.sprite.destroy()
      }
    }, 500)
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 随机生成一个道具
   */
  private spawnRandomPowerUp(): void {
    // 获取可用的生成区域（需要在游戏层设置）
    const spawnPoints = this.getAvailableSpawnPoints()
    
    if (spawnPoints.length === 0) {
      console.warn('⚠️ [PowerUpManager] 没有可用的生成点')
      return
    }
    
    // 随机选择一个点
    const point = Phaser.Utils.Array.GetRandom(spawnPoints)
    const type = this.getRandomType()
    
    this.spawnPowerUp(point.x, point.y, type)
  }
  
  /**
   * 获取可用的生成点
   */
  private getAvailableSpawnPoints(): { x: number; y: number }[] {
    // TODO: 需要从游戏层获取生成点配置
    // 这里返回一些示例点
    return [
      { x: 400, y: 300 },
      { x: 600, y: 200 },
      { x: 300, y: 500 },
      { x: 700, y: 600 }
    ]
  }
  
  /**
   * 根据概率随机选择类型
   */
  private getRandomType(): PowerUpType {
    const rand = Math.random()
    let cumulative = 0
    
    for (const [typeStr, rate] of Object.entries(this.config.spawnRates)) {
      cumulative += rate
      
      if (rand <= cumulative) {
        return typeStr as PowerUpType
      }
    }
    
    // 默认返回 GUN
    return PowerUpType.GUN
  }
  
  /**
   * 应用道具效果
   */
  private applyEffect(powerUp: PowerUpEntity): void {
    if (!this.combatManager) {
      console.warn('⚠️ [PowerUpManager] combatManager 未设置，无法应用效果')
      return
    }
    
    switch (powerUp.type) {
      case PowerUpType.GUN:
        this.combatManager.activateUpgrade()
        break
        
      case PowerUpType.SHIELD:
        this.combatManager.activateShield(powerUp.duration)
        break
        
      case PowerUpType.SHOTGUN:
        this.combatManager.activateShotgun()
        break
        
      case PowerUpType.HOMING:
        this.combatManager.activateHomingMissile()
        break
        
      case PowerUpType.BOMB:
        this.combatManager.activateFullScreenBomb()
        break
        
      case PowerUpType.STAR:
        // 速度提升需要 MovementManager 配合
        console.log(`⭐ [PowerUpManager] 速度提升 ${powerUp.power}x 持续 ${powerUp.duration}ms`)
        break
        
      case PowerUpType.CLOCK:
        // 时间冻结需要 EnemyAIManager 配合
        console.log(`🕐 [PowerUpManager] 时间冻结 ${powerUp.duration}ms`)
        break
        
      case PowerUpType.HEART:
        // 额外生命需要 GameScene 处理
        console.log('❤️ [PowerUpManager] 额外生命 +1')
        break
    }
  }
}
