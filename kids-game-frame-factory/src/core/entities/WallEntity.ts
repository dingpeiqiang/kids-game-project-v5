// ============================================================================
// 🧱 墙壁实体类
// ============================================================================
// 
// 📌 说明:
//   墙壁的业务逻辑层，处理耐久度和破坏
// ============================================================================

import { BaseEntity } from './BaseEntity'

/**
 * ⭐ 墙壁类型
 */
export enum WallType {
  BRICK = 'brick',      // 砖墙（可破坏）
  STEEL = 'steel',      // 钢墙（不可破坏）
  WATER = 'water',      // 水域（子弹可通过）
  FOREST = 'forest'     // 森林（遮挡视线）
}

/**
 * ⭐ 墙壁实体
 */
export class WallEntity extends BaseEntity {
  // ─── 墙壁特有属性 ──────────────────────────────────────────
  
  /** 墙壁类型 */
  public type: WallType = WallType.BRICK
  
  /** 最大耐久度 */
  public maxDurability: number = 100
  
  /** 当前耐久度 */
  public durability: number = 100
  
  /** 是否可破坏 */
  public destructible: boolean = true
  
  // ─── 构造函数 ─────────────────────────────────────────────
  
  constructor(sprite: Phaser.Physics.Arcade.Sprite, type: WallType = WallType.BRICK) {
    super(sprite)
    
    this.type = type
    this.applyTypeConfig()
  }
  
  // ─── 实现抽象方法 ─────────────────────────────────────────
  
  /**
   * ⭐ 每帧更新（墙壁不需要）
   */
  update(_delta: number): void {
    // 墙壁是静态的，不需要更新
  }
  
  // ─── 墙壁专属方法 ─────────────────────────────────────────
  
  /**
   * ⭐ 承受伤害（重写）
   */
  takeDamage(amount: number): number {
    if (!this.destructible || !this.isAlive) return 0
    
    this.durability -= amount
    
    console.log(`🧱 [Wall] ${this.type} 受到 ${amount} 点伤害 (剩余耐久：${this.durability})`)
    
    if (this.durability <= 0) {
      this.destroy()
    }
    
    return amount
  }
  
  /**
   * ⭐ 应用类型配置
   */
  private applyTypeConfig(): void {
    switch (this.type) {
      case WallType.BRICK:
        this.maxDurability = 100
        this.durability = 100
        this.destructible = true
        break
        
      case WallType.STEEL:
        this.maxDurability = 999999
        this.durability = 999999
        this.destructible = false
        break
        
      case WallType.WATER:
        this.maxDurability = 0
        this.durability = 0
        this.destructible = false
        break
        
      case WallType.FOREST:
        this.maxDurability = 0
        this.durability = 0
        this.destructible = false
        break
    }
  }
}
