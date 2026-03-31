// ============================================================================
// 🐍 蛇头实体 - Snake2 专属
// ============================================================================
// 
// 📌 说明:
//   继承 BaseEntity，实现贪吃蛇蛇头的移动、渲染、碰撞逻辑
//   支持 GTRS 主题渲染和对象池复用
// ============================================================================

import { BaseEntity } from './BaseEntity'
import type { Direction } from '../../../types/entity'

/**
 * 🐍 蛇头实体类
 * 
 * @remarks
 * 核心碰撞实体，负责：
 * - 响应键盘输入改变方向
 * - 持续移动
 * - 检测与食物、障碍物、自身的碰撞
 */
export class SnakeHead extends BaseEntity {
  public type = 'snakeHead' as const
  
  // === 蛇专属属性 ===
  public direction: Direction = 'right'
  public nextDirection: Direction = 'right'  // 缓冲下一步方向（防止快速按键导致反向）
  public speed: number = 200  // 像素/秒
  public alive: boolean = true
  public invincible: boolean = false  // 无敌状态（吃到无敌食物后）
  
  // === 状态 ===
  private moveTimer: number = 0  // 移动计时器
  private readonly moveInterval: number = 0.1  // 移动间隔（秒），根据速度动态调整
  
  constructor(x: number, y: number, speed?: number) {
    super()
    this.x = x
    this.y = y
    this.width = 40
    this.height = 40
    this.speed = speed ?? 200
    this.zIndex = 10  // 蛇头渲染层级较高
    
    this.updateCollider()
  }
  
  /**
   * ⭐ 每帧更新
   * @param deltaTime - 距离上一帧的时间（秒）
   */
  public update(deltaTime: number): void {
    if (!this.alive) return
    
    // 1. 更新实际方向（使用缓冲方向）
    this.direction = this.nextDirection
    
    // 2. 计算新位置
    const newHead = this.calculateNewPosition(deltaTime)
    
    // 3. 更新位置和碰撞盒
    this.x = newHead.x
    this.y = newHead.y
    this.updateCollider()
  }
  
  /**
   * 计算新位置
   */
  private calculateNewPosition(deltaTime: number): { x: number; y: number } {
    const distance = this.speed * deltaTime  // 物理公式：距离 = 速度 × 时间
    
    switch (this.direction) {
      case 'up':
        return { x: this.x, y: this.y - distance }
      case 'down':
        return { x: this.x, y: this.y + distance }
      case 'left':
        return { x: this.x - distance, y: this.y }
      case 'right':
        return { x: this.x + distance, y: this.y }
      default:
        return { x: this.x, y: this.y }
    }
  }
  
  /**
   * ⭐ 渲染蛇头
   * 
   * @param ctx - Phaser 场景或 Canvas 上下文
   */
  public render(ctx: any): void {
    if (!this.visible || !this.alive) return
    
    // === 方式 1: 使用 GTRS 主题资源（优先）===
    // TODO: 集成 GTRS 主题加载后实现
    // const themeKey = GTRS?.getAssetKey('snake_head')
    // if (themeKey && ctx.textures?.exists(themeKey)) {
    //   ctx.drawImage(ctx.textures.get(themeKey), this.x, this.y, this.width, this.height)
    //   return
    // }
    
    // === 方式 2: 程序化绘制（后备方案）===
    
    // 1. 保存上下文状态
    ctx.save()
    
    // 2. 移动到蛇头中心并旋转
    const centerX = this.x + this.width / 2
    const centerY = this.y + this.height / 2
    
    ctx.translate(centerX, centerY)
    
    // 根据方向旋转
    let rotation = 0
    switch (this.direction) {
      case 'up':    rotation = -Math.PI / 2; break
      case 'down':  rotation = Math.PI / 2; break
      case 'left':  rotation = Math.PI; break
      case 'right': rotation = 0; break
    }
    ctx.rotate(rotation)
    
    // 3. 绘制蛇头主体（圆角矩形）
    ctx.fillStyle = this.invincible ? '#ffffff' : '#4ade80'  // 无敌时变白色
    this.roundRect(
      ctx,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
      8  // 圆角半径
    )
    ctx.fill()
    
    // 4. 绘制眼睛
    this.renderEyes(ctx)
    
    // 5. 恢复上下文状态
    ctx.restore()
  }
  
  /**
   * 绘制眼睛
   */
  private renderEyes(ctx: any): void {
    ctx.fillStyle = 'white'
    
    // 左眼
    ctx.beginPath()
    ctx.arc(-10, -6, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // 右眼
    ctx.beginPath()
    ctx.arc(-10, 6, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // 瞳孔
    ctx.fillStyle = 'black'
    
    // 左眼瞳孔
    ctx.beginPath()
    ctx.arc(-8, -6, 3, 0, Math.PI * 2)
    ctx.fill()
    
    // 右眼瞳孔
    ctx.beginPath()
    ctx.arc(-8, 6, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  
  /**
   * 设置移动方向
   * @param newDirection - 新方向
   */
  public setDirection(newDirection: Direction): void {
    // 防止直接反向（例如向右时不能直接向左）
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    }
    
    if (opposites[newDirection] !== this.direction) {
      this.nextDirection = newDirection
    }
  }
  
  /**
   * 死亡处理
   */
  public die(): void {
    this.alive = false
    this.active = false
    this.visible = false
  }
  
  /**
   * 重置（回收到对象池时调用）
   */
  public reset(): void {
    this.x = 0
    this.y = 0
    this.direction = 'right'
    this.nextDirection = 'right'
    this.speed = 200
    this.alive = true
    this.invincible = false
    this.active = true
    this.visible = true
    this.updateCollider()
  }
}
