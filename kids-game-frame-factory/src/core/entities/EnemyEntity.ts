// ============================================================================
// 👾 敌人实体类
// ============================================================================
// 
// 📌 说明:
//   敌人的业务逻辑层，包含 AI 状态和行为
// ============================================================================

import { BaseEntity } from './BaseEntity'

/**
 * ⭐ 敌人类型
 */
export enum EnemyType {
  LIGHT = 'light',      // 轻型（快速，低血量）
  MEDIUM = 'medium',    // 中型（平衡）
  HEAVY = 'heavy'       // 重型（慢速，高血量）
}

/**
 * ⭐ 敌人 AI 状态
 */
export enum EnemyAIState {
  PATROL = 'patrol',     // 巡逻
  CHASE = 'chase',       // 追击
  ATTACK = 'attack',     // 攻击
  RETREAT = 'retreat'    // 撤退
}

/**
 * ⭐ 敌人实体
 */
export class EnemyEntity extends BaseEntity {
  // ─── 敌人特有属性 ──────────────────────────────────────────
  
  /** 敌人类型 */
  public type: EnemyType = EnemyType.LIGHT
  
  /** AI 状态 */
  public aiState: EnemyAIState = EnemyAIState.PATROL
  
  /** 经验值奖励 */
  public expReward: number = 10
  
  /** 分数奖励 */
  public scoreReward: number = 100
  
  /** 攻击范围（像素） */
  public attackRange: number = 400
  
  /** 警戒范围（像素） */
  public alertRange: number = 600
  
  /** 射击冷却时间（毫秒） */
  public shootCooldown: number = 2000
  
  /** 上次射击时间 */
  private lastShootTime: number = 0
  
  /** 移动方向改变计时器 */
  private directionChangeTimer: number = 0
  
  // ─── 构造函数 ─────────────────────────────────────────────
  
  constructor(sprite: Phaser.Physics.Arcade.Sprite, type: EnemyType = EnemyType.LIGHT) {
    super(sprite)
    
    this.type = type
    this.applyTypeConfig()
  }
  
  // ─── 实现抽象方法 ─────────────────────────────────────────
  
  /**
   * ⭐ 每帧更新
   */
  update(delta: number): void {
    if (!this.isAlive) return
    
    // 更新 AI 状态
    this.updateAI(delta)
  }
  
  // ─── AI 逻辑 ──────────────────────────────────────────────
  
  /**
   * ⭐ 更新 AI 状态
   */
  private updateAI(delta: number): void {
    // 简单的状态机
    switch (this.aiState) {
      case EnemyAIState.PATROL:
        this.patrol(delta)
        break
      case EnemyAIState.CHASE:
        this.chasePlayer()
        break
      case EnemyAIState.ATTACK:
        this.attack()
        break
      case EnemyAIState.RETREAT:
        this.retreat()
        break
    }
  }
  
  /**
   * ⭐ 巡逻行为
   */
  private patrol(_delta: number): void {
    // 随机移动，定期改变方向
    this.directionChangeTimer -= 16 // 假设 60fps
    
    if (this.directionChangeTimer <= 0 && this._sprite) {
      this.changeDirectionRandomly()
      this.directionChangeTimer = Phaser.Math.Between(1000, 3000)
    }
  }
  
  /**
   * ⭐ 追击玩家
   */
  private chasePlayer(): void {
    if (!this._sprite) return
    
    // 获取玩家位置（需要从外部传入或查找）
    const playerSprite = this.findNearestPlayer()
    if (!playerSprite) return
    
    // 计算朝向玩家的向量
    const angle = Phaser.Math.Angle.Between(
      this._sprite.x,
      this._sprite.y,
      playerSprite.x,
      playerSprite.y
    )
    
    // 移动到玩家
    this._sprite.setVelocityX(Math.cos(angle) * this.speed)
    this._sprite.setVelocityY(Math.sin(angle) * this.speed)
  }
  
  /**
   * ⭐ 攻击行为
   */
  private attack(): void {
    // 尝试射击
    this.tryShoot()
  }
  
  /**
   * ⭐ 撤退行为
   */
  private retreat(): void {
    // 远离玩家
    if (!this._sprite) return
    
    const playerSprite = this.findNearestPlayer()
    if (!playerSprite) return
    
    const angle = Phaser.Math.Angle.Between(
      playerSprite.x,
      playerSprite.y,
      this._sprite.x,
      this._sprite.y
    )
    
    this._sprite.setVelocityX(Math.cos(angle) * this.speed)
    this._sprite.setVelocityY(Math.sin(angle) * this.speed)
  }
  
  /**
   * ⭐ 尝试射击
   */
  tryShoot(): boolean {
    const now = Date.now()
    
    if (now - this.lastShootTime < this.shootCooldown) return false
    
    this.lastShootTime = now
    console.log('🔫 [Enemy] 射击')
    return true
  }
  
  /**
   * ⭐ 随机改变方向
   */
  private changeDirectionRandomly(): void {
    if (!this._sprite) return
    
    const directions = [
      { x: -this.speed, y: 0 },   // 左
      { x: this.speed, y: 0 },    // 右
      { x: 0, y: -this.speed },   // 上
      { x: 0, y: this.speed }     // 下
    ]
    
    const dir = Phaser.Utils.Array.GetRandom(directions)
    this._sprite.setVelocity(dir.x, dir.y)
  }
  
  /**
   * ⭐ 查找最近的玩家
   */
  private findNearestPlayer(): Phaser.Physics.Arcade.Sprite | null {
    // TODO: 需要通过 EntityManager 或其他机制查找玩家
    // 这里返回 null，实际使用时需要注入依赖
    return null
  }
  
  // ─── 配置方法 ─────────────────────────────────────────────
  
  /**
   * ⭐ 应用类型配置
   */
  private applyTypeConfig(): void {
    switch (this.type) {
      case EnemyType.LIGHT:
        this.health = 30
        this.speed = 250
        this.damage = 5
        this.expReward = 5
        this.scoreReward = 50
        break
        
      case EnemyType.MEDIUM:
        this.health = 60
        this.speed = 150
        this.damage = 10
        this.expReward = 10
        this.scoreReward = 100
        break
        
      case EnemyType.HEAVY:
        this.health = 120
        this.speed = 80
        this.damage = 20
        this.expReward = 20
        this.scoreReward = 200
        break
    }
    
    this.maxHealth = this.health
  }
  
  // ─── 重写方法 ─────────────────────────────────────────────
  
  /**
   * ⭐ 死亡回调（重写）
   */
  protected die(): void {
    super.die()
    console.log(`💰 [Enemy] 被击败！奖励：${this.expReward}exp, ${this.scoreReward}分`)
  }
}
