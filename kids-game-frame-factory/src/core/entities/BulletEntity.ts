// ============================================================================
// 🔫 子弹实体类
// ============================================================================
// 
// 📌 说明:
//   子弹的业务逻辑层，处理移动和碰撞伤害
// ============================================================================

import { BaseEntity } from './BaseEntity'

/**
 * ⭐ 子弹类型
 */
export enum BulletType {
  PLAYER = 'player',      // 玩家子弹
  ENEMY = 'enemy'         // 敌人子弹
}

/**
 * ⭐ 子弹实体
 */
export class BulletEntity extends BaseEntity {
  // ─── 子弹特有属性 ──────────────────────────────────────────
  
  /** 子弹类型 */
  public type: BulletType = BulletType.PLAYER
  
  /** 飞行速度 */
  public flySpeed: number = 400
  
  /** 穿透力（能穿透几个敌人） */
  public penetration: number = 0
  
  /** 已穿透次数 */
  private penetrateCount: number = 0
  
  /** 存在时间（毫秒） */
  private lifetime: number = 3000
  
  /** 创建时间 */
  private createTime: number = 0
  
  // ─── 构造函数 ─────────────────────────────────────────────
  
  constructor(sprite: Phaser.Physics.Arcade.Sprite, type: BulletType = BulletType.PLAYER) {
    super(sprite)
    
    this.type = type
    this.createTime = Date.now()
    
    // 子弹没有生命值概念
    this.health = 1
  }
  
  // ─── 实现抽象方法 ─────────────────────────────────────────
  
  /**
   * ⭐ 每帧更新
   */
  update(_delta: number): void {
    if (!this.isAlive) return
    
    // 检查是否超过存在时间
    const age = Date.now() - this.createTime
    if (age >= this.lifetime) {
      this.destroy()
    }
  }
  
  // ─── 子弹专属方法 ─────────────────────────────────────────
  
  /**
   * ⭐ 设置速度向量
   */
  setVelocity(vx: number, vy: number): void {
    if (!this._sprite) return
    
    this._sprite.setVelocity(vx, vy)
  }
  
  /**
   * ⭐ 击中目标
   * 
   * @returns 是否成功造成伤害
   */
  onHit(): boolean {
    if (this.penetrateCount >= this.penetration) {
      this.destroy()
      return false
    }
    
    this.penetrateCount++
    return true
  }
  
  /**
   * ⭐ 获取子弹方向角度
   */
  getAngle(): number {
    if (!this._sprite || !this._sprite.body) return 0
    
    const velocity = this._sprite.body.velocity as Phaser.Math.Vector2
    return Math.atan2(velocity.y, velocity.x)
  }
  
  // ─── 重写方法 ─────────────────────────────────────────────
  
  /**
   * ⭐ 销毁（重写）
   */
  destroy(): void {
    console.log('💨 [Bullet] 子弹消失')
    super.destroy()
  }
}
