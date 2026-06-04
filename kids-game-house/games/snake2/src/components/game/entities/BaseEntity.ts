// ============================================================================
// 🎮 实体系统 - 所有游戏对象的基类
// ============================================================================
// 
// 📌 说明:
//   所有游戏实体（蛇、食物、障碍物）的父类
//   提供通用属性、碰撞检测、渲染等基础能力
// ============================================================================

import type { AABB, EntityType } from '@/types/entity'

/**
 * 🎯 实体类型枚举
 */
export type EntityType = 'player' | 'food' | 'obstacle' | 'effect'

/**
 * ⭐ 实体基类接口
 */
export interface IEntity {
  id: string
  type: EntityType
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  active: boolean
  zIndex: number
  
  update(deltaTime: number): void
  render(ctx: any): void
  isCollide(other: IEntity): boolean
  destroy(): void
}

/**
 * 🎮 实体基类
 * 
 * @remarks
 * 所有游戏实体的父类，提供：
 * - 位置、尺寸、可见性等通用属性
 * - AABB 碰撞检测
 * - 生命周期管理
 * - 渲染和更新接口
 * 
 * @example
 * ```typescript
 * class SnakeEntity extends BaseEntity {
 *   update(deltaTime: number) {
 *     // 移动逻辑
 *   }
 *   
 *   render(ctx: any) {
 *     // 渲染逻辑
 *   }
 * }
 * ```
 */
export abstract class BaseEntity implements IEntity {
  // === 通用属性 ===
  public id: string = crypto.randomUUID()
  public type: EntityType = 'unknown' as EntityType
  public x: number = 0
  public y: number = 0
  public width: number = 0
  public height: number = 0
  public visible: boolean = true
  public active: boolean = true
  public zIndex: number = 0
  
  // === 缩放和旋转 ===
  public scaleX: number = 1
  public scaleY: number = 1
  public rotation: number = 0
  
  // === 碰撞盒（AABB）===
  protected collider: AABB = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }
  
  // === 生命周期回调 ===
  protected onDestroyCallbacks: (() => void)[] = []
  
  /**
   * ⭐ 每帧更新（抽象方法，子类必须实现）
   * @param deltaTime - 距离上一帧的时间（秒）
   */
  public abstract update(deltaTime: number): void
  
  /**
   * ⭐ 渲染（抽象方法，子类必须实现）
   * @param ctx - Phaser 渲染上下文或 Canvas 上下文
   */
  public abstract render(ctx: any): void
  
  /**
   * ⭐ AABB 矩形碰撞检测
   * @param other - 另一个实体
   * @returns 是否发生碰撞
   */
  public isCollide(other: BaseEntity): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    )
  }
  
  /**
   * 更新碰撞盒
   */
  protected updateCollider(): void {
    this.collider = {
      x: this.x,
      y: this.y,
      width: this.width * this.scaleX,
      height: this.height * this.scaleY
    }
  }
  
  /**
   * 获取碰撞盒
   */
  public getCollider(): AABB {
    return { ...this.collider }
  }
  
  /**
   * ⭐ 销毁实体（回收到对象池）
   */
  public destroy(): void {
    this.active = false
    this.visible = false
    this.onDestroyCallbacks.forEach(cb => cb())
    this.onDestroyCallbacks = []
    
    // 触发释放回调（由对象池管理器处理）
    this.onRelease?.()
  }
  
  /**
   * 释放回调（对象池复用）
   */
  public onRelease?(): void
  
  /**
   * 注册销毁回调
   * @param callback - 回调函数
   */
  public onDestroy(callback: () => void): void {
    this.onDestroyCallbacks.push(callback)
  }
  
  /**
   * 绘制圆角矩形（工具方法）
   * @param ctx - 渲染上下文
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param width - 宽度
   * @param height - 高度
   * @param radius - 圆角半径
   */
  protected roundRect(
    ctx: any,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }
  
  /**
   * 检查点是否在实体内
   * @param pointX - 点 X 坐标
   * @param pointY - 点 Y 坐标
   * @returns 是否在实体内
   */
  public containsPoint(pointX: number, pointY: number): boolean {
    return (
      pointX >= this.x &&
      pointX <= this.x + this.width &&
      pointY >= this.y &&
      pointY <= this.y + this.height
    )
  }
}
