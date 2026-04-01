// ============================================================================
// 🎮 玩家移动管理器
// ============================================================================
// 
// 📌 说明:
//   专门负责玩家坦克的移动控制，包括输入处理、边界检查、位置校正
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'

/**
 * ⭐ 移动方向
 */
export enum MoveDirection {
  NONE = 'NONE',
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

/**
 * ⭐ 移动配置
 */
export interface IMovementConfig {
  baseSpeed: number           // 基础速度
  speedMultiplier: number     // 速度倍率
  boundaryPadding: number     // 边界内边距
}

/**
 * ⭐ 玩家移动管理器
 */
export class PlayerMovementManager {
  private scene: TankGameScene
  private player: Phaser.Physics.Arcade.Sprite
  
  // 配置
  private readonly config: IMovementConfig = {
    baseSpeed: 200,
    speedMultiplier: 1,
    boundaryPadding: 10
  }
  
  // 当前方向
  private currentDirection: MoveDirection = MoveDirection.NONE
  
  constructor(scene: TankGameScene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene
    this.player = player
    
    console.log('✅ PlayerMovementManager 已创建')
  }
  
  // ===========================================================================
  // 🎯 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 设置玩家对象（复活时更新引用）
   */
  setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player
    console.log('✅ [移动管理器] 已更新 player 引用')
  }
  
  /**
   * ⭐ 重置方向为 NONE（复活时调用）
   */
  resetDirection(): void {
    this.currentDirection = MoveDirection.NONE
    console.log('✅ [移动管理器] 已重置方向为 NONE')
  }
  
  /**
   * ⭐ 设置速度倍率（道具加成）
   */
  setSpeedMultiplier(multiplier: number): void {
    this.config.speedMultiplier = multiplier
    console.log(`🚀 速度倍率：${multiplier}`)
  }
  
  /**
   * ⭐ 更新移动状态 - 增加完整防御检查
   */
  update(cursors: any, keys: any): void {
    try {
      // 🔧 修复：首先检查 player 是否存在
      if (!this.player || !this.player.active) {
        return
      }
      
      // ✅ 防御检查：确保输入有效
      if (!cursors || !keys) {
        return
      }
      
      // ✅ 清除所有速度（通过 body）
      if (this.player.body) {
        const body = this.player.body as any
        body.setVelocityX(0)
        body.setVelocityY(0)
      }
      
      const speed = this.config.baseSpeed * this.config.speedMultiplier
      let moving = false
      let newDirection: MoveDirection = MoveDirection.NONE
      let newTexture: string | null = null
      
      // 🔍 检查位置边界
      this.checkBoundaries()
      
      // ⬆️ 向上移动
      if (cursors.up?.isDown || keys.keyW?.isDown) {
        if (this.player.body) {
          const body = this.player.body as any
          body.setVelocityY(-speed)
        }
        newTexture = 'player_tank_up'
        newDirection = MoveDirection.UP
        moving = true
      } 
      // ⬇️ 向下移动
      else if (cursors.down?.isDown || keys.keyS?.isDown) {
        if (this.player.body) {
          const body = this.player.body as any
          body.setVelocityY(speed)
        }
        newTexture = 'player_tank_down'
        newDirection = MoveDirection.DOWN
        moving = true
      }
      
      // ⬅️ 向左移动
      if (cursors.left?.isDown || keys.keyA?.isDown) {
        if (this.player.body) {
          const body = this.player.body as any
          body.setVelocityX(-speed)
        }
        newTexture = 'player_tank_left'
        newDirection = MoveDirection.LEFT
        moving = true
      } 
      // ➡️ 向右移动
      else if (cursors.right?.isDown || keys.keyD?.isDown) {
        if (this.player.body) {
          const body = this.player.body as any
          body.setVelocityX(speed)
        }
        newTexture = 'player_tank_right'
        newDirection = MoveDirection.RIGHT
        moving = true
      }
      
      // 🔧 关键修复：只在移动且方向或纹理改变时才更新
      if (moving && (newDirection !== this.currentDirection || (newTexture && this.player.texture?.key !== newTexture))) {
        this.currentDirection = newDirection
        if (newTexture) {
          this.player.setTexture(newTexture)
        }
      }
      
    } catch (error) {
      // 🛡️ 静默处理物理系统异常
      console.warn('⚠️ PlayerMovementManager.update error:', error)
    }
  }
  
  /**
   * ⭐ 获取当前移动方向
   */
  getCurrentDirection(): MoveDirection {
    return this.currentDirection
  }
  
  /**
   * ⭐ 强制设置位置
   */
  setPosition(x: number, y: number): void {
    this.player.setPosition(x, y)
    this.player.setVelocity(0, 0)
  }
  
  /**
   * ⭐ 停止移动
   */
  stop(): void {
    this.player.setVelocity(0, 0)
    this.currentDirection = MoveDirection.NONE
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 检查并校正边界
   */
  private checkBoundaries(): void {
    // 🔧 修复：使用地图实际边界（从 0 开始）
    const gridCols = (this.scene as any).gridCols
    const gridRows = (this.scene as any).gridRows
    const cellSize = (this.scene as any).cellSize
    
    const mapRight = gridCols * cellSize
    const mapBottom = gridRows * cellSize
    
    // 🔍 检查是否超出地图边界（考虑坦克的大小）
    const halfSize = this.player.displayWidth / 2 || 32  // 假设坦克约 64px 宽
    
    if (this.player.x < this.config.boundaryPadding + halfSize) {
      console.log('⚠️ 玩家 X 位置接近左边界，强制校正')
      this.player.x = Phaser.Math.Clamp(this.player.x, this.config.boundaryPadding + halfSize, mapRight - this.config.boundaryPadding - halfSize)
    }
    
    if (this.player.x > mapRight - this.config.boundaryPadding - halfSize) {
      console.log('⚠️ 玩家 X 位置接近右边界，强制校正')
      this.player.x = Phaser.Math.Clamp(this.player.x, this.config.boundaryPadding + halfSize, mapRight - this.config.boundaryPadding - halfSize)
    }
    
    if (this.player.y < this.config.boundaryPadding + halfSize) {
      console.log('⚠️ 玩家 Y 位置接近上边界，强制校正')
      this.player.y = Phaser.Math.Clamp(this.player.y, this.config.boundaryPadding + halfSize, mapBottom - this.config.boundaryPadding - halfSize)
    }
    
    if (this.player.y > mapBottom - this.config.boundaryPadding - halfSize) {
      console.log('⚠️ 玩家 Y 位置接近下边界，强制校正')
      this.player.y = Phaser.Math.Clamp(this.player.y, this.config.boundaryPadding + halfSize, mapBottom - this.config.boundaryPadding - halfSize)
    }
  }
}
