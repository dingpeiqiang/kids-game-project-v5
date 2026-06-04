// ============================================================================
// 👤 玩家实体类
// ============================================================================
// 
// 📌 说明:
//   玩家角色的业务逻辑层，与渲染层完全解耦
// ============================================================================

import { BaseEntity } from './BaseEntity'

/**
 * ⭐ 玩家实体
 */
export class PlayerEntity extends BaseEntity {
  // ─── 玩家特有属性 ──────────────────────────────────────────
  
  /** 当前分数 */
  public score: number = 0
  
  /** 连击数 */
  public combo: number = 0
  
  /** 最大连击记录 */
  public maxCombo: number = 0
  
  /** 剩余生命数 */
  public lives: number = 3
  
  /** 射击冷却时间（毫秒） */
  public shootCooldown: number = 500
  
  /** 上次射击时间 */
  private lastShootTime: number = 0
  
  /** 是否正在死亡动画中 */
  public isDying: boolean = false
  
  /** 复活倒计时（毫秒） */
  public respawnTimer: number = 0
  
  // ─── 构造函数 ─────────────────────────────────────────────
  
  constructor(sprite: Phaser.Physics.Arcade.Sprite) {
    super(sprite)
    
    // 设置默认值
    this.health = 100
    this.maxHealth = 100
    this.speed = 200
    this.damage = 25
  }
  
  // ─── 实现抽象方法 ─────────────────────────────────────────
  
  /**
   * ⭐ 每帧更新
   */
  update(_delta: number): void {
    if (!this.isAlive || this.isDying) return
    
    // 检查无敌状态是否结束
    if (this.isInvincible()) {
      // 可以在这里添加闪烁效果
    }
  }
  
  // ─── 玩家专属方法 ─────────────────────────────────────────
  
  /**
   * ⭐ 尝试射击
   * 
   * @returns 是否成功射击
   */
  tryShoot(): boolean {
    const now = Date.now()
    
    if (!this.isAlive || this.isDying) return false
    if (now - this.lastShootTime < this.shootCooldown) return false
    
    this.lastShootTime = now
    console.log('🔫 [Player] 射击')
    return true
  }
  
  /**
   * ⭐ 移动
   * 
   * @param dx - X 方向速度
   * @param dy - Y 方向速度
   */
  move(dx: number, dy: number): void {
    if (!this.isAlive || this.isDying || !this._sprite) return
    
    this._sprite.setVelocity(dx, dy)
  }
  
  /**
   * ⭐ 停止移动
   */
  stopMoving(): void {
    if (!this._sprite) return
    this._sprite.setVelocity(0, 0)
  }
  
  /**
   * ⭐ 增加分数
   */
  addScore(points: number): void {
    this.score += points
    console.log(`📊 [Player] 得分 +${points} (总分：${this.score})`)
  }
  
  /**
   * ⭐ 增加连击
   */
  addCombo(): void {
    this.combo++
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo
    }
    console.log(`⚡ [Player] 连击 x${this.combo}`)
  }
  
  /**
   * ⭐ 重置连击
   */
  resetCombo(): void {
    if (this.combo > 0) {
      console.log(`💔 [Player] 连击中断！最终连击：${this.combo}`)
    }
    this.combo = 0
  }
  
  /**
   * ⭐ 承受伤害（重写）
   */
  takeDamage(amount: number): number {
    if (this.isInvincible() || this.isDying) return 0
    
    const actualDamage = super.takeDamage(amount)
    
    if (actualDamage > 0) {
      this.resetCombo() // 受伤时连击中断
    }
    
    return actualDamage
  }
  
  /**
   * ⭐ 死亡回调（重写）
   */
  protected die(): void {
    super.die()
    this.lives--
    this.isDying = true
    
    console.log(`☠️ [Player] 死亡！剩余生命：${this.lives}`)
    
    if (this.lives <= 0) {
      this.onGameOver()
    } else {
      this.startRespawn()
    }
  }
  
  /**
   * ⭐ 开始复活流程
   */
  private startRespawn(): void {
    this.respawnTimer = 2000 // 2 秒后复活
    console.log('⏰ [Player] 开始复活倒计时...')
  }
  
  /**
   * ⭐ 检查是否可以复活
   */
  canRespawn(now: number): boolean {
    return now >= this.respawnTimer
  }
  
  /**
   * ⭐ 执行复活
   */
  respawn(): void {
    this.isAlive = true
    this.isDying = false
    this.health = this.maxHealth
    this.setInvincible(3000) // 复活后 3 秒无敌
    console.log('✨ [Player] 复活！')
  }
  
  /**
   * ⭐ 游戏结束回调
   */
  private onGameOver(): void {
    console.log('🎮 [Player] 游戏结束！')
    // 可以通过事件通知 GameScene
  }
  
  // ─── Getter/Setter ────────────────────────────────────────
  
  /**
   * ⭐ 获取伤害倍率（基于连击）
   */
  getDamageMultiplier(): number {
    if (this.combo >= 100) return 5.0
    if (this.combo >= 50) return 3.0
    if (this.combo >= 20) return 2.0
    if (this.combo >= 10) return 1.5
    if (this.combo >= 6) return 1.2
    return 1.0
  }
}
