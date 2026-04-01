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
      
      // 🔍 检查位置边界
      this.checkBoundaries()
      
      // ⬆️ 向上移动
      if (cursors.up?.isDown || keys.keyW?.isDown) {
        if (this.player.body) {
          const body = this.player.body as any
          body.setVelocityY(-speed)
        }
        this.player.setTexture('player_tank_up')
        this.currentDirection = MoveDirection.UP
        moving = true
      } 
      // ⬇️ 向下移动
      else if (cursors.down?.isDown || keys.keyS?.isDown) {
        if (this.player.body) {
          const body = this.player.body as any
          body.setVelocityY(speed)
        }
        this.player.setTexture('player_tank_down')
        this.currentDirection = MoveDirection.DOWN
        moving = true
      }
      
      // ⬅️ 向左移动
      if (cursors.left?.isDown || keys.keyA?.isDown) {
        if (this.player.body) {
          const body = this.player.body as any
          body.setVelocityX(-speed)
        }
        this.player.setTexture('player_tank_left')
        this.currentDirection = MoveDirection.LEFT
        moving = true
      } 
      // ➡️ 向右移动
      else if (cursors.right?.isDown || keys.keyD?.isDown) {
        if (this.player.body) {
          const body = this.player.body as any
          body.setVelocityX(speed)
        }
        this.player.setTexture('player_tank_right')
        this.currentDirection = MoveDirection.RIGHT
        moving = true
      }
      
      // 🔄 斜向移动时调整炮管方向（优先向上）
      if (moving && cursors.up?.isDown && cursors.left?.isDown) {
        this.player.setTexture('player_tank_up')
        this.currentDirection = MoveDirection.UP
      } else if (moving && cursors.up?.isDown && cursors.right?.isDown) {
        this.player.setTexture('player_tank_up')
        this.currentDirection = MoveDirection.UP
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
    const offsetX = (this.scene as any).offsetX
    const offsetY = (this.scene as any).offsetY
    const gridCols = (this.scene as any).gridCols
    const gridRows = (this.scene as any).gridRows
    const cellSize = (this.scene as any).cellSize
    
    const mapRight = offsetX + gridCols * cellSize
    const mapBottom = offsetY + gridRows * cellSize
    
    // 🔍 检查是否超出地图边界
    if (this.player.x < offsetX + this.config.boundaryPadding ||
        this.player.x > mapRight - this.config.boundaryPadding) {
      console.log('⚠️ 玩家 X 位置异常，强制校正')
      const centerX = offsetX + (gridCols * cellSize) / 2
      this.player.x = centerX
    }
    
    if (this.player.y < offsetY + this.config.boundaryPadding ||
        this.player.y > mapBottom - this.config.boundaryPadding) {
      console.log('⚠️ 玩家 Y 位置异常，强制校正')
      const centerY = offsetY + (gridRows * cellSize) / 2
      this.player.y = centerY
    }
  }
}
