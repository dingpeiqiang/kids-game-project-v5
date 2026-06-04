// ============================================================================
// 🐍 蛇身实体 - Snake2 专属
// ============================================================================
// 
// 📌 说明:
//   继承 BaseEntity，实现蛇身的跟随移动和渲染逻辑
//   采用渐变效果，视觉更美观
// ============================================================================

import { BaseEntity } from './BaseEntity'

/**
 * 🐍 蛇身实体类
 * 
 * @remarks
 * 被动碰撞实体，特点：
 * - 跟随蛇头移动（每节移动到前一节的位置）
 * - 渐变渲染效果（从蛇头到蛇尾颜色递减）
 * - 无自主移动逻辑
 */
export class SnakeBody extends BaseEntity {
  public type = 'snakeBody' as const
  
  // === 蛇身专属属性 ===
  private segmentIndex: number = 0  // 在蛇身中的索引（0=蛇头后的第一节）
  
  constructor(x: number, y: number, index: number = 0) {
    super()
    this.x = x
    this.y = y
    this.width = 40
    this.height = 40
    this.segmentIndex = index
    this.zIndex = 9  // 蛇身渲染层级略低于蛇头
  }
  
  /**
   * ⭐ 每帧更新
   * @param deltaTime - 距离上一帧的时间（秒）
   */
  public update(deltaTime: number): void {
    // 蛇身被动移动，由 SnakeHead 控制
    // 这里只需要更新碰撞盒
    this.updateCollider()
  }
  
  /**
   * ⭐ 渲染蛇身
   * 
   * @param ctx - Phaser 场景或 Canvas 上下文
   */
  public render(ctx: any): void {
    if (!this.visible) return
    
    // === 方式 1: 使用 GTRS 主题资源（优先）===
    // TODO: 集成 GTRS 主题后实现
    // const themeKey = GTRS?.getAssetKey('snake_body')
    // if (themeKey && ctx.textures?.exists(themeKey)) {
    //   ctx.drawImage(ctx.textures.get(themeKey), this.x, this.y, this.width, this.height)
    //   return
    // }
    
    // === 方式 2: 程序化绘制（后备方案）===
    
    // 计算渐变透明度（越往后越透明）
    const gradient = 1 - (this.segmentIndex / 20) * 0.5  // 最多淡化 50%
    const alpha = Math.max(0.5, gradient)
    
    ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`  // 绿色渐变
    
    // 绘制圆角矩形
    this.roundRect(
      ctx,
      this.x,
      this.y,
      this.width,
      this.height,
      6  // 圆角半径略小于蛇头
    )
    ctx.fill()
    
    // 添加边框
    ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`
    ctx.lineWidth = 2
    ctx.strokeRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4)
  }
  
  /**
   * 设置蛇身索引
   * @param index - 新的索引
   */
  public setSegmentIndex(index: number): void {
    this.segmentIndex = index
  }
  
  /**
   * 重置（回收到对象池时调用）
   */
  public reset(): void {
    this.x = 0
    this.y = 0
    this.segmentIndex = 0
    this.active = true
    this.visible = true
  }
}
