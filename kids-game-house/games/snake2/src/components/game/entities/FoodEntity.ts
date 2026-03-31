// ============================================================================
// 🍎 食物实体（简化版 - 占位）
// ============================================================================
// 
// 📌 说明:
//   这是一个简化版本，仅用于让对象池编译通过
//   完整版将在后续创建
// ============================================================================

import { BaseEntity } from './BaseEntity'
import type { FoodConfig } from '@/types/entity'

/**
 * 🍎 食物实体类（简化版）
 */
export class FoodEntity extends BaseEntity {
  public type = 'food' as const
  
  // === 食物专属属性 ===
  public foodType: string = 'normal'
  public score: number = 10
  public growsSnake: boolean = true
  public lengthIncrease: number = 1
  public hasEffect: boolean = false
  
  /**
   * 初始化食物
   */
  public init(x: number, y: number, config: FoodConfig): void {
    this.x = x
    this.y = y
    this.foodType = config.type
    this.score = config.baseScore
    this.growsSnake = config.growsSnake
    this.lengthIncrease = config.lengthIncrease || 1
    this.hasEffect = config.hasEffect ?? false
    
    this.width = 40
    this.height = 40
    this.active = true
    this.visible = true
  }
  
  /**
   * 重置食物（回收到池时调用）
   */
  public reset(): void {
    this.x = 0
    this.y = 0
    this.foodType = 'normal'
    this.score = 10
    this.growsSnake = true
    this.hasEffect = false
    this.active = false
    this.visible = false
  }
  
  /**
   * 更新（空实现）
   */
  public update(deltaTime: number): void {
    // TODO: 实现动画和生命周期逻辑
  }
  
  /**
   * 渲染（空实现）
   */
  public render(ctx: any): void {
    // TODO: 实现渲染逻辑
  }
}
