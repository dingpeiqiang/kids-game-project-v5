// ============================================================================
// 🏃 玩家移动管理器 - 处理输入和边界检查
// ============================================================================
// 
// 📌 说明:
//   统一处理玩家移动输入、边界检查、位置校正
//   包含 try-catch 保护防止物理系统异常
// ============================================================================

import { IGameManager } from './IGameManager'
import type { PlayerEntity } from '../entities/PlayerEntity'

/**
 * ⭐ 移动配置
 */
export interface IMovementConfig {
  baseSpeed: number             // 基础速度
  speedMultiplier: number       // 速度倍率（道具效果）
  boundaryPadding: number       // 边界内边距
}

/**
 * ⭐ 移动管理器
 */
export class PlayerMovementManager implements IGameManager {
  protected player: PlayerEntity
  
  // 当前方向
  private currentDirection: 'up' | 'down' | 'left' | 'right' = 'up'
  
  // 配置
  private readonly config: IMovementConfig = {
    baseSpeed: 200,
    speedMultiplier: 1.0,
    boundaryPadding: 20
  }
  
  constructor(player: PlayerEntity) {
    this.player = player
  }
  
  // ===========================================================================
  // 📌 IGameManager 接口实现
  // ===========================================================================
  
  /**
   * ⭐ 初始化
   */
  init(): void {
    console.log('✅ [PlayerMovementManager] 已创建')
  }
  
  /**
   * ⭐ 每帧更新
   */
  update(cursors: any, keys: any): void {
    try {
      // ✅ 防御检查：确保输入有效
      if (!cursors || !keys) {
        return
      }
      
      const sprite = this.player.sprite
      if (!sprite || !sprite.active) {
        return
      }
      
      // ✅ 清除所有速度
      sprite.setVelocityX(0)
      sprite.setVelocityY(0)
      
      const speed = this.config.baseSpeed * this.config.speedMultiplier
      let moving = false
      
      // 🔍 检查位置边界
      this.checkBoundaries()
      
      // ⬆️ 向上移动
      if (cursors.up?.isDown || keys.keyW?.isDown) {
        sprite.setVelocityY(-speed)
        this.currentDirection = 'up'
        moving = true
      }
      // ⬇️ 向下移动
      else if (cursors.down?.isDown || keys.keyS?.isDown) {
        sprite.setVelocityY(speed)
        this.currentDirection = 'down'
        moving = true
      }
      // ⬅️ 向左移动
      else if (cursors.left?.isDown || keys.keyA?.isDown) {
        sprite.setVelocityX(-speed)
        this.currentDirection = 'left'
        moving = true
      }
      // ➡️ 向右移动
      else if (cursors.right?.isDown || keys.keyD?.isDown) {
        sprite.setVelocityX(speed)
        this.currentDirection = 'right'
        moving = true
      }
      
      // 🎯 如果正在移动，更新旋转角度
      if (moving && sprite.body) {
        this.updateRotation(sprite.body.velocity.x, sprite.body.velocity.y)
      }
      
    } catch (error) {
      // 🛡️ 静默处理物理系统异常
      console.warn('⚠️ PlayerMovementManager.update error:', error)
    }
  }
  
  /**
   * ⭐ 销毁清理
   */
  destroy(): void {
    console.log('🗑️ [PlayerMovementManager] 销毁')
  }
  
  // ===========================================================================
  // 📌 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 设置速度倍率
   * 
   * @param multiplier - 倍率（1.0 = 正常，1.5 = +50%）
   */
  setSpeedMultiplier(multiplier: number): void {
    this.config.speedMultiplier = Math.max(0.5, Math.min(2.0, multiplier))
    console.log(`⚡ [PlayerMovementManager] 速度倍率：x${this.config.speedMultiplier}`)
  }
  
  /**
   * ⭐ 重置速度倍率
   */
  resetSpeedMultiplier(): void {
    this.config.speedMultiplier = 1.0
    console.log('🔄 [PlayerMovementManager] 重置速度倍率')
  }
  
  /**
   * ⭐ 获取当前方向
   */
  getCurrentDirection(): 'up' | 'down' | 'left' | 'right' {
    return this.currentDirection
  }
  
  /**
   * ⭐ 瞬移到指定位置
   * 
   * @param x - X 坐标
   * @param y - Y 坐标
   */
  teleport(x: number, y: number): void {
    const sprite = this.player.sprite
    if (!sprite) return
    
    sprite.setPosition(x, y)
    console.log(`📍 [PlayerMovementManager] 瞬移到 (${x}, ${y})`)
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 检查边界并校正位置
   */
  private checkBoundaries(): void {
    const sprite = this.player.sprite
    if (!sprite || !sprite.scene) return
    
    const camera = sprite.scene.cameras.main
    const bounds = {
      left: camera.scrollX + this.config.boundaryPadding,
      right: camera.scrollX + camera.width - this.config.boundaryPadding,
      top: camera.scrollY + this.config.boundaryPadding,
      bottom: camera.scrollY + camera.height - this.config.boundaryPadding
    }
    
    // 检查并校正位置
    let corrected = false
    
    if (sprite.x < bounds.left) {
      sprite.x = bounds.left
      corrected = true
    }
    if (sprite.x > bounds.right) {
      sprite.x = bounds.right
      corrected = true
    }
    if (sprite.y < bounds.top) {
      sprite.y = bounds.top
      corrected = true
    }
    if (sprite.y > bounds.bottom) {
      sprite.y = bounds.bottom
      corrected = true
    }
    
    if (corrected) {
      console.log('🔧 [PlayerMovementManager] 边界校正')
    }
  }
  
  /**
   * 更新旋转角度
   */
  private updateRotation(vx: number, vy: number): void {
    const sprite = this.player.sprite
    if (!sprite) return
    
    // 根据速度计算角度
    const angle = Phaser.Math.RadToDeg(Math.atan2(vy, vx))
    
    // 平滑旋转到目标角度
    const targetRotation = Phaser.Math.DegToRad(angle)
    sprite.setRotation(targetRotation)
  }
}
