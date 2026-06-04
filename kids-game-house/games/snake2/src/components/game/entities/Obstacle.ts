// ============================================================================
// 🧱 障碍物实体 - Snake2 专属
// ============================================================================
// 
// 📌 说明:
//   继承 BaseEntity，实现静态障碍物的渲染逻辑
//   用于关卡设计（墙壁、边界等）
// ============================================================================

import { BaseEntity } from './BaseEntity'

/**
 * 🧱 障碍物实体类
 * 
 * @remarks
 * 静态物体，特点：
 * - 不移动（isStatic = true）
 * - 简单的矩形渲染或主题图片
 * - 碰撞即游戏结束（蛇头撞墙）
 */
export class Obstacle extends BaseEntity {
  public type = 'obstacle' as const
  public isStatic = true  // 静态物体标志
  
  constructor(x: number, y: number, width?: number, height?: number) {
    super()
    this.x = x
    this.y = y
    this.width = width ?? 40
    this.height = height ?? 40
    this.zIndex = 8  // 障碍物渲染层级
    
    this.updateCollider()
  }
  
  /**
   * ⭐ 每帧更新
   * @param deltaTime - 距离上一帧的时间（秒）
   */
  public update(deltaTime: number): void {
    // 静态物体，无需更新
    // 只需要确保碰撞盒正确
    this.updateCollider()
  }
  
  /**
   * ⭐ 渲染障碍物
   * 
   * @param ctx - Phaser 场景或 Canvas 上下文
   */
  public render(ctx: any): void {
    if (!this.visible) return
    
    // === 方式 1: 使用 GTRS 主题资源（优先）===
    // TODO: 集成 GTRS 主题后实现
    // const themeKey = GTRS?.getAssetKey('obstacle')
    // if (themeKey && ctx.textures?.exists(themeKey)) {
    //   ctx.drawImage(ctx.textures.get(themeKey), this.x, this.y, this.width, this.height)
    //   return
    // }
    
    // === 方式 2: 程序化绘制（后备方案）===
    
    // 填充色（灰色）
    ctx.fillStyle = '#6b7280'
    ctx.fillRect(this.x, this.y, this.width, this.height)
    
    // 添加边框（深灰色）
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 3
    ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2)
    
    // 添加纹理效果（斜线）
    ctx.save()
    ctx.strokeStyle = '#4b5563'
    ctx.lineWidth = 1
    
    const spacing = 10
    for (let i = 0; i < this.width; i += spacing) {
      ctx.beginPath()
      ctx.moveTo(this.x + i, this.y)
      ctx.lineTo(this.x + i + spacing, this.y + spacing)
      ctx.stroke()
    }
    
    ctx.restore()
  }
  
  /**
   * 重置（回收到对象池时调用）
   */
  public reset(): void {
    this.x = 0
    this.y = 0
    this.active = true
    this.visible = true
    this.isStatic = true
  }
}
