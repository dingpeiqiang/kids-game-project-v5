// ============================================================================
// 🍎 食物实体 - Snake2 专属（统一所有可收集物）
// ============================================================================
// 
// 📌 说明:
//   继承 BaseEntity，实现 IPoolable 接口支持对象池复用
//   统一所有可收集物（普通食物、奖励食物、特效食物）
//   支持 GTRS 主题渲染
// ============================================================================

import { BaseEntity } from './BaseEntity'
import { FoodType, type FoodConfig } from '../../../types/entity'

/**
 * 🍎 食物实体类（统一所有可收集物）
 * 
 * @remarks
 * 核心特性：
 * - 统一处理所有食物类型（普通、奖励、特效）
 * - 实现 IPoolable 接口，支持对象池复用
 * - 支持 GTRS 主题渲染
 * - 带动画效果（旋转、闪烁）
 */
export class Food extends BaseEntity implements IPoolable {
  public type = 'food' as const
  
  // === 食物专属属性 ===
  public foodType: FoodType = 'normal'
  public score: number = 10
  public growsSnake: boolean = true
  public lengthIncrease: number = 1
  
  // === 特效属性（可选）===
  public hasEffect: boolean = false
  public effectType?: 'speed_change' | 'invincibility'
  public effectValue?: number
  public effectDuration?: number
  
  // === 生命周期 ===
  private lifetime?: number  // 总生存时间（毫秒）
  private createdAt: number = 0  // 创建时间
  private animationTime: number = 0  // 动画计时器
  
  constructor() {
    super()
    this.zIndex = 5  // 食物渲染层级
  }
  
  /**
   * ⭐ 初始化食物（对象池调用）
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param config - 食物配置
   */
  public init(x: number, y: number, config: FoodConfig): void {
    this.x = x
    this.y = y
    this.width = 40
    this.height = 40
    
    // 基础属性
    this.foodType = config.type
    this.score = config.baseScore
    this.growsSnake = config.growsSnake
    this.lengthIncrease = config.lengthIncrease || 1
    
    // 特效配置
    if (config.hasEffect) {
      this.hasEffect = true
      this.effectType = config.effectType
      this.effectValue = config.effectValue
      this.effectDuration = config.effectDuration
    } else {
      this.hasEffect = false
    }
    
    // 生命周期
    if (config.lifetime) {
      this.lifetime = config.lifetime
      this.createdAt = Date.now()
    } else {
      this.lifetime = undefined
    }
    
    // 状态重置
    this.active = true
    this.visible = true
    this.animationTime = 0
    
    this.updateCollider()
  }
  
  /**
   * ⭐ 每帧更新
   * @param deltaTime - 距离上一帧的时间（秒）
   */
  public update(deltaTime: number): void {
    // 1. 检查生命周期
    if (this.lifetime) {
      const age = Date.now() - this.createdAt
      if (age >= this.lifetime) {
        this.destroy()
        return
      }
    }
    
    // 2. 更新动画
    this.animationTime += deltaTime
    this.scaleX = 1 + Math.sin(this.animationTime * 5) * 0.1  // 缩放动画
    this.scaleY = this.scaleX
    this.updateCollider()
  }
  
  /**
   * ⭐ 渲染食物
   * 
   * @param ctx - Phaser 场景或 Canvas 上下文
   */
  public render(ctx: any): void {
    if (!this.visible || !this.active) return
    
    // === 方式 1: 使用 GTRS 主题资源（优先）===
    // TODO: 集成 GTRS 主题后实现
    // const foodKey = GTRS?.getAssetKey(`food_${this.foodType}`)
    // if (foodKey && ctx.textures?.exists(foodKey)) {
    //   ctx.save()
    //   ctx.translate(this.x + this.width/2, this.y + this.height/2)
    //   ctx.scale(this.scaleX, this.scaleY)
    //   ctx.drawImage(ctx.textures.get(foodKey), -this.width/2, -this.height/2)
    //   ctx.restore()
    //   return
    // }
    
    // === 方式 2: 程序化绘制（后备方案）===
    ctx.save()
    
    // 移动到中心并应用缩放
    const centerX = this.x + this.width / 2
    const centerY = this.y + this.height / 2
    ctx.translate(centerX, centerY)
    ctx.scale(this.scaleX, this.scaleY)
    
    // 根据食物类型选择颜色
    const colors: Record<FoodType, string> = {
      normal: '#ef4444',     // 红色
      bonus: '#fbbf24',      // 金色
      special: '#a855f7',    // 紫色
      speed_up: '#3b82f6',   // 蓝色
      slow_down: '#22c55e',  // 绿色
      invincible: '#ffffff'  // 白色
    }
    
    const color = colors[this.foodType] || colors.normal
    
    // 添加发光效果（特效食物）
    if (this.hasEffect) {
      ctx.shadowColor = color
      ctx.shadowBlur = 10 + Math.sin(this.animationTime * 10) * 5  // 脉动效果
    }
    
    // 绘制圆形食物
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(0, 0, this.width / 2 * 0.8, 0, Math.PI * 2)
    ctx.fill()
    
    // 重置阴影
    ctx.shadowBlur = 0
    
    // 绘制图标
    this.renderIcon(ctx)
    
    ctx.restore()
  }
  
  /**
   * 绘制图标
   */
  private renderIcon(ctx: any): void {
    ctx.fillStyle = 'white'
    ctx.font = `${this.width * 0.6}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const icons: Record<FoodType, string> = {
      normal: '',           // 无图标
      bonus: '⭐',          // 星星
      special: '💎',        // 钻石
      speed_up: '⚡',       // 闪电
      slow_down: '🐌',      // 蜗牛
      invincible: '🛡️'      // 盾牌
    }
    
    const icon = icons[this.foodType] || ''
    if (icon) {
      ctx.fillText(icon, 0, 0)
    }
  }
  
  /**
   * ⭐ 重置食物（回收到对象池时调用）
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
    this.scaleX = 1
    this.scaleY = 1
    this.lifetime = undefined
  }
  
  /**
   * ⭐ 释放回调（对象池复用时调用）
   */
  public onRelease?(): void {
    // 清理逻辑（如果需要）
  }
}

/**
 * IPoolable 接口定义
 */
interface IPoolable {
  active: boolean
  init(...args: any[]): void
  reset(): void
  onRelease?(): void
}
