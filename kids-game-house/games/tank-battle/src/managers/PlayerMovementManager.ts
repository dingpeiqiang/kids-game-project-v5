// ============================================================================
// 🎮 玩家移动管理器
// ============================================================================
// 
// 📌 说明:
//   专门负责玩家坦克的移动控制，包括输入处理、边界检查、位置校正
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { Logger } from '../utils/Logger'

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
  }
  
  // ===========================================================================
  // 🎯 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 设置玩家对象（复活时更新引用）
   */
  setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player
  }
  
  /**
   * ⭐ 重置方向为 NONE（复活时调用）
   */
  resetDirection(): void {
    this.currentDirection = MoveDirection.NONE
  }
  
  /**
   * ⭐ 设置速度倍率（道具加成）
   */
  setSpeedMultiplier(multiplier: number): void {
    this.config.speedMultiplier = multiplier
    Logger.debug(`🚀 速度倍率：${multiplier}`)
  }
  
  /**
   * ⭐ 更新移动状态
   */
  update(cursors: any, keys: any): void {
    try {
      // ⭐ 修复：更严格的检查，确保 player 和 body 都可用
      if (!this.player) {
        console.warn('⚠️ [PlayerMovementManager] player 不存在')
        return
      }
      
      if (!this.player.active) {
        console.warn('⚠️ [PlayerMovementManager] player 未激活')
        return
      }
      
      // ⭐ 关键修复：body 可能存在但 enable 属性为 undefined（刚创建时）
      if (!this.player.body) {
        console.warn('⚠️ [PlayerMovementManager] player body 不存在')
        return
      }
      
      // ⭐ 如果 body.enable 是 undefined，说明 body 还未完全初始化，需要启用它
      if (this.player.body.enable === undefined || this.player.body.enable === false) {
        console.warn('⚠️ [PlayerMovementManager] player body 未启用，尝试启用...')
        this.player.body.enable = true
      }
      
      if (!cursors || !keys) return
      
      if (this.player.body) {
        const body = this.player.body as any
        body.setVelocityX(0)
        body.setVelocityY(0)
      }
      
      const speed = this.config.baseSpeed * this.config.speedMultiplier
      let moving = false
      let newDirection: MoveDirection = MoveDirection.NONE
      let newTexture: string | null = null
      
      this.checkBoundaries()
      
      if (cursors.up?.isDown || keys.keyW?.isDown) {
        if (this.player.body) {
          (this.player.body as any).setVelocityY(-speed)
        }
        newTexture = 'player_tank_up'
        newDirection = MoveDirection.UP
        moving = true
      } 
      else if (cursors.down?.isDown || keys.keyS?.isDown) {
        if (this.player.body) {
          (this.player.body as any).setVelocityY(speed)
        }
        newTexture = 'player_tank_down'
        newDirection = MoveDirection.DOWN
        moving = true
      }
      
      if (cursors.left?.isDown || keys.keyA?.isDown) {
        if (this.player.body) {
          (this.player.body as any).setVelocityX(-speed)
        }
        newTexture = 'player_tank_left'
        newDirection = MoveDirection.LEFT
        moving = true
      } 
      else if (cursors.right?.isDown || keys.keyD?.isDown) {
        if (this.player.body) {
          (this.player.body as any).setVelocityX(speed)
        }
        newTexture = 'player_tank_right'
        newDirection = MoveDirection.RIGHT
        moving = true
      }
      
      if (moving && (newDirection !== this.currentDirection || (newTexture && this.player.texture?.key !== newTexture))) {
        this.currentDirection = newDirection
        if (newTexture) {
          this.player.setTexture(newTexture)
        }
      }
    } catch (error) {
      // 静默处理异常
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
    const gridCols = (this.scene as any).gridCols
    const gridRows = (this.scene as any).gridRows
    const cellSize = (this.scene as any).cellSize
    
    const mapRight = gridCols * cellSize
    const mapBottom = gridRows * cellSize
    const halfSize = this.player.displayWidth / 2 || 32
    const minX = this.config.boundaryPadding + halfSize
    const maxX = mapRight - this.config.boundaryPadding - halfSize
    const minY = this.config.boundaryPadding + halfSize
    const maxY = mapBottom - this.config.boundaryPadding - halfSize
    
    this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX)
    this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY)
  }
}
