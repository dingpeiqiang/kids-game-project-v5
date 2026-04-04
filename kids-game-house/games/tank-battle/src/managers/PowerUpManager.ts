// ============================================================================
// 🎁 坦克大战道具管理器 - 配置驱动
// ============================================================================
// 
// 📌 说明:
//   基于配置驱动的道具管理系统
//   支持概率生成、最大数量限制、定时生成等特性
// ============================================================================

import { PowerUpData, PowerUpConfigService, PowerUpDomainService } from '../entities/PowerUpEntity'
import { PowerUpType, IPowerUpSpawnConfig } from '../types/powerup-types'
import { Logger } from '../utils/Logger'

/**
 * ⭐ 道具管理器类
 */
export class PowerUpManager {
  // ─── 属性 ──────────────────────────────────────────────
  
  /** 当前场上的道具列表 */
  private powerUps: Map<string, PowerUpData> = new Map()
  
  /** 生成定时器 ID */
  private spawnTimerId: NodeJS.Timeout | null = null
  
  /** 是否正在生成 */
  private isSpawning: boolean = false
  
  /** 默认配置 */
  private readonly defaultConfig: IPowerUpSpawnConfig = {
    maxCount: 3,
    spawnInterval: 10000,  // 10 秒
    despawnTime: 15000,    // 15 秒
    
    spawnRates: {
      [PowerUpType.STAR]: 0.25,        // 25% - 火力升级
      [PowerUpType.SHIELD]: 0.15,      // 15% - 护盾
      [PowerUpType.CLOCK]: 0.10,       // 10% - 时间冻结
      [PowerUpType.GUN]: 0.15,         // 15% - 散弹枪
      [PowerUpType.HOMING]: 0.10,      // 10% - 追踪导弹
      [PowerUpType.BOMB]: 0.05,        // 5% - 全屏炸弹
      [PowerUpType.SPEED]: 0.08,       // 8% - 速度提升
      [PowerUpType.HEALTH]: 0.05,      // 5% - 生命恢复
      [PowerUpType.ARMOR]: 0.04,       // 4% - 装甲强化
      [PowerUpType.GRENADE]: 0.02,     // 2% - 手榴弹
      [PowerUpType.INVINCIBLE]: 0.03,  // 3% - 无敌状态
      [PowerUpType.LIFE]: 0.02         // 2% - 额外生命
    }
  }
  
  /** 当前配置 */
  private config: IPowerUpSpawnConfig
  
  // ─── 构造函数 ──────────────────────────────────────────
  
  constructor(config?: Partial<IPowerUpSpawnConfig>) {
    this.config = { ...this.defaultConfig, ...config }
    Logger.info('✅ [PowerUpManager] 已创建')
    Logger.debug(`📊 [PowerUpManager] 配置：最大 ${this.config.maxCount} 个，每 ${this.config.spawnInterval / 1000}s 生成`)
  }
  
  // ─── 公开方法 ──────────────────────────────────────────
  
  /**
   * ⭐ 启动定时生成
   */
  startAutoSpawn(): void {
    if (this.isSpawning) return
    
    this.isSpawning = true
    Logger.debug(`⏰ [PowerUpManager] 开始自动生成为了每 ${this.config.spawnInterval / 1000}s`)
    
    this.spawnTimerId = setInterval(() => {
      this.spawnRandomPowerUp()
    }, this.config.spawnInterval)
  }
  
  /**
   * ⭐ 停止自动生成
   */
  stopAutoSpawn(): void {
    if (!this.isSpawning) return
    
    this.isSpawning = false
    
    if (this.spawnTimerId) {
      clearInterval(this.spawnTimerId)
      this.spawnTimerId = null
      Logger.debug('⏹️ [PowerUpManager] 停止自动生成')
    }
  }
  
  /**
   * ⭐ 手动生成道具
   * 
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param type - 指定类型（可选，随机）
   */
  spawnPowerUp(x: number, y: number, type?: PowerUpType): PowerUpData {
    // 检查是否超过最大数量
    const currentCount = this.powerUps.size
    if (currentCount >= this.config.maxCount) {
      Logger.warn(`⚠️ [PowerUpManager] 场上道具已达上限 (${currentCount}/${this.config.maxCount})`)
      return null as any
    }
    
    // 确定类型
    const powerUpType = type || this.getRandomType()
    
    // 1. 从配置服务获取配置
    const config = PowerUpConfigService.getConfig(powerUpType)
    
    // 2. 创建道具数据对象
    const powerUp = new PowerUpData(config)
    
    // 3. 存储到列表中
    const id = `powerup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.powerUps.set(id, powerUp)
    
    Logger.debug(`🎁 [PowerUpManager] 生成道具：${powerUpType} at (${x}, ${y})`)
    
    return powerUp
  }
  
  /**
   * ⭐ 处理道具拾取
   * 
   * @param powerUp - 被拾取的道具数据
   * @param callback - 拾取后的回调函数
   */
  handleCollect(powerUp: PowerUpData, callback?: (type: PowerUpType) => void): void {
    if (!powerUp || powerUp.isCollected) return
    
    Logger.debug(`🎁 [PowerUpManager] 处理道具拾取：${powerUp.type}`)
    
    // 使用领域服务标记为已拾取
    PowerUpDomainService.collect(powerUp)
    
    // 调用回调函数（由游戏层处理具体效果）
    if (callback) {
      callback(powerUp.type)
    }
    
    // 从列表中移除
    this.removeFromList(powerUp)
  }
  
  /**
   * ⭐ 清除所有道具
   */
  clearAll(): void {
    this.powerUps.forEach((powerUp, id) => {
      if (!powerUp.isCollected) {
        Logger.debug(`🗑️ [PowerUpManager] 清除未拾取道具：${powerUp.type}`)
      }
    })
    
    this.powerUps.clear()
    Logger.debug('🗑️ [PowerUpManager] 已清除所有道具')
  }
  
  /**
   * ⭐ 更新所有道具
   * 
   * @remarks
   * 每帧调用，清理超时的道具
   */
  update(): void {
    this.powerUps.forEach((powerUp, id) => {
      // 使用领域服务检查是否应该消失
      if (PowerUpDomainService.shouldDespawn(powerUp)) {
        if (!powerUp.isCollected) {
          Logger.debug(`⏰ [PowerUpManager] 道具超时消失：${powerUp.type}`)
        }
        
        // 从列表中移除
        this.removeFromList(powerUp)
      }
    })
  }
  
  /**
   * ⭐ 获取场上剩余道具数量
   */
  getCount(): number {
    return this.powerUps.size
  }
  
  /**
   * ⭐ 设置生成概率
   * 
   * @param type - 道具类型
   * @param rate - 概率（0-1）
   */
  setSpawnRate(type: PowerUpType, rate: number): void {
    this.config.spawnRates[type] = Math.max(0, Math.min(1, rate))
    Logger.debug(`📊 [PowerUpManager] 调整 ${type} 生成概率：${rate * 100}%`)
  }
  
  // ─── 私有方法 ──────────────────────────────────────────
  
  /**
   * ⭐ 随机生成一个道具
   */
  private spawnRandomPowerUp(): void {
    // 从游戏层获取可用生成点（通过事件或回调）
    const spawnPoints = this.getAvailableSpawnPoints()
    
    if (spawnPoints.length === 0) {
      Logger.warn('⚠️ [PowerUpManager] 没有可用的生成点')
      return
    }
    
    // 随机选择一个点
    const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)]
    const type = this.getRandomType()
    
    this.spawnPowerUp(point.x, point.y, type)
  }
  
  /**
   * ⭐ 获取可用生成点
   */
  private getAvailableSpawnPoints(): { x: number, y: number }[] {
    // 默认生成点列表（可以在游戏层配置）
    return [
      { x: 400, y: 300 },
      { x: 600, y: 200 },
      { x: 300, y: 500 },
      { x: 700, y: 600 },
      { x: 200, y: 400 },
      { x: 500, y: 350 },
      { x: 350, y: 250 },
      { x: 650, y: 450 }
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
    
    // 默认返回 STAR
    return PowerUpType.STAR
  }
  
  /**
   * ⭐ 从列表中移除道具
   */
  private removeFromList(powerUp: PowerUpData): void {
    this.powerUps.forEach((value, key) => {
      if (value === powerUp) {
        this.powerUps.delete(key)
      }
    })
  }
  
  // ─── 销毁 ──────────────────────────────────────────────
  
  /**
   * ⭐ 销毁管理器
   */
  destroy(): void {
    this.stopAutoSpawn()
    this.clearAll()
    Logger.debug('🗑️ [PowerUpManager] 已销毁')
  }
}
