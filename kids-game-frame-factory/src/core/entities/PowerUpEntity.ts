// ============================================================================
// 🎁 道具实体类
// ============================================================================
// 
// 📌 说明:
//   道具的业务逻辑层，处理拾取和效果触发
// ============================================================================

import { BaseEntity } from './BaseEntity'

/**
 * ⭐ 道具类型
 */
export enum PowerUpType {
  GUN = 'gun',          // 火力升级
  SHIELD = 'shield',    // 护盾
  CLOCK = 'clock',      // 时间冻结
  STAR = 'star',        // 速度提升
  HEART = 'heart',      // 额外生命
  BOMB = 'bomb',        // 全屏炸弹
  SHOTGUN = 'shotgun',  // 散弹枪
  HOMING = 'homing'     // 追踪导弹
}

/**
 * ⭐ 道具实体
 */
export class PowerUpEntity extends BaseEntity {
  // ─── 道具特有属性 ──────────────────────────────────────────
  
  /** 道具类型 */
  public type: PowerUpType = PowerUpType.GUN
  
  /** 效果持续时间（毫秒，0 为永久） */
  public duration: number = 0
  
  /** 效果值 */
  public power: number = 0
  
  /** 是否已被拾取 */
  public isCollected: boolean = false
  
  /** 存在时间（毫秒） */
  private spawnTime: number = 0
  
  /** 消失时间（毫秒） */
  private despawnTime: number = 15000 // 默认 15 秒后消失
  
  // ─── 构造函数 ─────────────────────────────────────────────
  
  constructor(sprite: Phaser.Physics.Arcade.Sprite, type: PowerUpType = PowerUpType.GUN) {
    super(sprite)
    
    this.type = type
    this.spawnTime = Date.now()
    this.applyTypeConfig()
    
    // 道具没有生命值
    this.health = 0
  }
  
  // ─── 实现抽象方法 ─────────────────────────────────────────
  
  /**
   * ⭐ 每帧更新
   */
  update(_delta: number): void {
    if (!this.isAlive || this.isCollected) return
    
    // 检查是否超过存在时间
    const age = Date.now() - this.spawnTime
    if (age >= this.despawnTime) {
      this.destroy()
    }
  }
  
  // ─── 道具专属方法 ─────────────────────────────────────────
  
  /**
   * ⭐ 被拾取
   */
  collect(): void {
    if (this.isCollected || !this.isAlive) return
    
    this.isCollected = true
    console.log(`🎁 [PowerUp] 拾取 ${this.type}`)
    
    // 触发拾取效果（由外部处理）
    this.onCollect()
  }
  
  /**
   * ⭐ 应用类型配置
   */
  private applyTypeConfig(): void {
    switch (this.type) {
      case PowerUpType.GUN:
        this.power = 1
        this.duration = 0
        break
        
      case PowerUpType.SHIELD:
        this.power = 1
        this.duration = 10000
        break
        
      case PowerUpType.CLOCK:
        this.power = 1
        this.duration = 8000
        break
        
      case PowerUpType.STAR:
        this.power = 1.5 // 速度 +50%
        this.duration = 10000
        break
        
      case PowerUpType.HEART:
        this.power = 1
        this.duration = 0
        break
        
      case PowerUpType.BOMB:
        this.power = 1
        this.duration = 0
        break
        
      case PowerUpType.SHOTGUN:
        this.power = 1
        this.duration = 5000
        break
        
      case PowerUpType.HOMING:
        this.power = 1
        this.duration = 10000
        break
    }
  }
  
  /**
   * ⭐ 拾取效果回调（子类可以重写）
   */
  protected onCollect(): void {
    // 由外部监听器处理具体效果
  }
  
  // ─── 重写方法 ─────────────────────────────────────────────
  
  /**
   * ⭐ 销毁（重写）
   */
  destroy(): void {
    if (!this.isCollected) {
      console.log('🗑️ [PowerUp] 道具消失（未拾取）')
    }
    super.destroy()
  }
}
