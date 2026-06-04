// ============================================================================
// 🎮 游戏实体基类 - 所有实体的抽象父类
// ============================================================================
// 
// 📌 说明:
//   定义所有游戏实体的公共属性和方法
//   实现业务逻辑与渲染层的完全解耦
// ============================================================================

/**
 * ⭐ 实体基础接口
 */
export interface IEntityData {
  x: number                     // X 坐标
  y: number                     // Y 坐标
  texture?: string              // 纹理 key
  attributes?: Record<string, any>  // 自定义属性
}

/**
 * ⭐ 实体基类
 * 
 * @remarks
 * 所有游戏实体必须继承此类，实现:
 * - 统一的属性接口（health, damage, speed 等）
 * - 统一的生命周期方法（update, destroy）
 * - 业务逻辑与 Phaser 渲染层分离
 */
export abstract class BaseEntity {
  // ─── 核心属性 ─────────────────────────────────────────────
  
  /** Phaser 精灵对象（渲染层） */
  protected _sprite: Phaser.Physics.Arcade.Sprite | null = null
  
  /** 实体唯一 ID */
  public readonly id: string
  
  /** 是否存活 */
  public isAlive: boolean = true
  
  /** 生命值 */
  public health: number = 100
  
  /** 最大生命值 */
  public maxHealth: number = 100
  
  /** 移动速度 */
  public speed: number = 200
  
  /** 伤害值 */
  public damage: number = 10
  
  /** 防御力（减伤百分比） */
  public defense: number = 0
  
  /** 无敌时间（毫秒） */
  public invincibleTime: number = 0
  
  // ─── 构造函数 ─────────────────────────────────────────────
  
  constructor(sprite?: Phaser.Physics.Arcade.Sprite) {
    this.id = this.generateId()
    
    if (sprite) {
      this.bindSprite(sprite)
    }
  }
  
  // ─── 抽象方法（子类必须实现） ─────────────────────────────
  
  /**
   * ⭐ 每帧更新逻辑【必须实现】
   * 
   * @param delta - 距离上一帧的毫秒数
   * 
   * @remarks
   * 在这里实现实体的核心逻辑：
   * - 玩家的输入处理
   * - 敌人的 AI 行为
   * - 子弹的移动
   * - 道具的效果等
   */
  abstract update(delta: number): void
  
  // ─── 生命周期方法 ─────────────────────────────────────────
  
  /**
   * ⭐ 销毁实体
   * 
   * @remarks
   * 清理资源和引用
   */
  destroy(): void {
    console.log(`🗑️ [Entity] 销毁实体：${this.constructor.name} (ID: ${this.id})`)
    
    // 销毁 Sprite
    if (this._sprite && this._sprite.active) {
      this._sprite.destroy()
    }
    
    this._sprite = null
    this.isAlive = false
  }
  
  // ─── 业务方法 ─────────────────────────────────────────────
  
  /**
   * ⭐ 承受伤害
   * 
   * @param amount - 伤害值
   * @returns 实际受到的伤害（考虑防御）
   */
  takeDamage(amount: number): number {
    if (!this.isAlive) return 0
    
    // 计算实际伤害（考虑防御）
    const actualDamage = Math.max(1, amount * (1 - this.defense))
    this.health -= actualDamage
    
    console.log(`💥 [Entity] ${this.constructor.name} 受到 ${actualDamage.toFixed(1)} 点伤害 (剩余：${this.health.toFixed(1)})`)
    
    // 检查死亡
    if (this.health <= 0) {
      this.die()
    }
    
    return actualDamage
  }
  
  /**
   * ⭐ 治疗
   * 
   * @param amount - 治疗量
   * @returns 实际治疗量（不超过最大生命值）
   */
  heal(amount: number): number {
    if (!this.isAlive) return 0
    
    const oldHealth = this.health
    this.health = Math.min(this.maxHealth, this.health + amount)
    const actualHeal = this.health - oldHealth
    
    console.log(`💚 [Entity] ${this.constructor.name} 恢复 ${actualHeal.toFixed(1)} 点生命 (当前：${this.health.toFixed(1)})`)
    
    return actualHeal
  }
  
  /**
   * ⭐ 设置无敌状态
   * 
   * @param duration - 持续时间（毫秒）
   */
  setInvincible(duration: number): void {
    this.invincibleTime = Date.now() + duration
    console.log(`🛡️ [Entity] ${this.constructor.name} 进入无敌状态 (${duration}ms)`)
  }
  
  /**
   * ⭐ 检查是否处于无敌状态
   */
  isInvincible(): boolean {
    return this.invincibleTime > Date.now()
  }
  
  // ─── Getter/Setter ────────────────────────────────────────
  
  /**
   * ⭐ 获取关联的 Sprite
   */
  get sprite(): Phaser.Physics.Arcade.Sprite | null {
    return this._sprite
  }
  
  /**
   * ⭐ 获取位置 X
   */
  get x(): number {
    return this._sprite?.x ?? 0
  }
  
  /**
   * ⭐ 获取位置 Y
   */
  get y(): number {
    return this._sprite?.y ?? 0
  }
  
  /**
   * ⭐ 获取中心 X
   */
  get centerX(): number {
    return this.x + (this._sprite?.displayWidth ?? 0) / 2
  }
  
  /**
   * ⭐ 获取中心 Y
   */
  get centerY(): number {
    return this.y + (this._sprite?.displayHeight ?? 0) / 2
  }
  
  // ─── 内部方法 ─────────────────────────────────────────────
  
  /**
   * 绑定 Sprite
   */
  protected bindSprite(sprite: Phaser.Physics.Arcade.Sprite): void {
    this._sprite = sprite
    
    // 将实体引用绑定到 sprite 上，方便从 sprite 反向查找
    sprite.setData('entity', this)
  }
  
  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `${this.constructor.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 死亡回调（子类可以重写）
   */
  protected die(): void {
    console.log(`☠️ [Entity] ${this.constructor.name} 死亡`)
    this.isAlive = false
  }
}
