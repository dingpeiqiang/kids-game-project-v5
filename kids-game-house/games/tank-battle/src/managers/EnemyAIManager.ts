// ============================================================================
// 🤖 敌人 AI 管理器
// ============================================================================
// 
// 📌 说明:
//   管理敌人坦克的 AI 行为（移动、射击）
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { EntityType } from './EntityManager'

/**
 * ⭐ 敌人 AI 管理器
 */
export class EnemyAIManager {
  private scene: TankGameScene
  
  constructor(scene: TankGameScene) {
    this.scene = scene
    console.log('✅ EnemyAIManager 已创建')
  }
  
  // ===========================================================================
  // 🎯 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 更新敌人 AI（移动）- 智能边界和障碍物检测
   */
  updateEnemyAI(enemy: any): void {
    if (!enemy || !enemy.active) return
    
    // 🔧 修复：首先确保敌人有物理 body
    if (!enemy.body) {
      console.warn('⚠️ [EnemyAI] 敌人没有物理 body，跳过 AI 更新:', enemy)
      return
    }
    
    // 🔍 边界检测：提前检测是否接近边界
    if (this.isNearBoundary(enemy)) {
      this.changeDirectionSmart(enemy, 'boundary')
      return
    }
    
    // 🧱 障碍物检测：前方有墙壁时改变方向
    if (this.isObstacleAhead(enemy)) {
      this.changeDirectionSmart(enemy, 'obstacle')
      return
    }
    
    // 🎲 随机改变方向（10% 概率，更频繁）
    if (Math.random() < 0.1) {
      this.changeDirectionSmart(enemy, 'random')
    }
    
    // 🔫 偶尔射击（5% 概率）
    if (Math.random() < 0.05) {
      this.enemyShoot(enemy)
    }
  }
  
  /**
   * 🔍 检测是否接近边界
   */
  private isNearBoundary(enemy: any): boolean {
    const scene = this.scene as any
    if (!scene || !scene.gridCols || !scene.gridRows || !scene.cellSize) {
      return false
    }
    
    const mapWidth = scene.gridCols * scene.cellSize
    const mapHeight = scene.gridRows * scene.cellSize
    const boundaryMargin = 80  // 提前 80px 检测
    const halfSize = enemy.displayWidth / 2 || 32
    
    // 检查是否接近边界
    return (
      enemy.x < boundaryMargin + halfSize ||
      enemy.x > mapWidth - boundaryMargin - halfSize ||
      enemy.y < boundaryMargin + halfSize ||
      enemy.y > mapHeight - boundaryMargin - halfSize
    )
  }
  
  /**
   * 🧱 检测前方是否有障碍物
   */
  private isObstacleAhead(enemy: any): boolean {
    const scene = this.scene as any
    const checkDistance = 50  // 检测前方 50px
    
    // 获取当前移动方向
    const vx = enemy.body.velocity.x
    const vy = enemy.body.velocity.y
    
    // 如果没有速度，不检测
    if (vx === 0 && vy === 0) return false
    
    // 计算检测点
    let checkX = enemy.x
    let checkY = enemy.y
    
    if (vx > 0) checkX += checkDistance      // 向右
    else if (vx < 0) checkX -= checkDistance // 向左
    else if (vy > 0) checkY += checkDistance // 向下
    else if (vy < 0) checkY -= checkDistance // 向上
    
    // 检查是否有墙壁
    const walls = scene.entityManager?.getGroup(EntityType.WALL_BRICK)
    if (walls) {
      let hasCollision = false
      walls.getChildren().forEach((wall: any) => {
        const dx = checkX - wall.x
        const dy = checkY - wall.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < 40) {  // 接近墙壁
          hasCollision = true
        }
      })
      if (hasCollision) return true
    }
    
    return false
  }
  
  /**
   * 🎯 智能改变方向（根据原因选择更好的方向）
   */
  private changeDirectionSmart(enemy: any, reason: string): void {
    const availableDirections: { x: number, y: number }[] = []
    const speed = enemy.speed || 100
    
    // 🔍 检测哪些方向是安全的
    const directions = [
      { x: 0, y: -speed, name: 'up' },
      { x: 0, y: speed, name: 'down' },
      { x: -speed, y: 0, name: 'left' },
      { x: speed, y: 0, name: 'right' }
    ]
    
    directions.forEach(dir => {
      // 检查这个方向是否安全（不会立即撞墙）
      if (!this.wouldCollide(enemy, dir.x, dir.y)) {
        availableDirections.push(dir)
      }
    })
    
    // 如果有安全方向，从中选择
    if (availableDirections.length > 0) {
      const newDir = Phaser.Utils.Array.GetRandom(availableDirections)
      if (enemy.body) {
        enemy.body.setVelocity(newDir.x, newDir.y)
        
        // 🎨 更新敌人朝向和纹理（根据敌人类型）
        const enemyType = enemy.enemyType
        
        if (newDir.y < 0) {      // 向上
          enemy.setAngle(-90)
          if (enemyType === 'ENEMY_LIGHT') enemy.setTexture('enemy_light_up')
          else if (enemyType === 'ENEMY_MEDIUM') enemy.setTexture('enemy_medium_up')
          else if (enemyType === 'ENEMY_HEAVY') enemy.setTexture('enemy_heavy_up')
          else enemy.setTexture('enemy_light_up')
        } else if (newDir.y > 0) { // 向下
          enemy.setAngle(90)
          if (enemyType === 'ENEMY_LIGHT') enemy.setTexture('enemy_light_down')
          else if (enemyType === 'ENEMY_MEDIUM') enemy.setTexture('enemy_medium_down')
          else if (enemyType === 'ENEMY_HEAVY') enemy.setTexture('enemy_heavy_down')
          else enemy.setTexture('enemy_light_down')
        } else if (newDir.x < 0) { // 向左
          enemy.setAngle(180)
          if (enemyType === 'ENEMY_LIGHT') enemy.setTexture('enemy_light_left')
          else if (enemyType === 'ENEMY_MEDIUM') enemy.setTexture('enemy_medium_left')
          else if (enemyType === 'ENEMY_HEAVY') enemy.setTexture('enemy_heavy_left')
          else enemy.setTexture('enemy_light_left')
        } else if (newDir.x > 0) { // 向右
          enemy.setAngle(0)
          if (enemyType === 'ENEMY_LIGHT') enemy.setTexture('enemy_light_right')
          else if (enemyType === 'ENEMY_MEDIUM') enemy.setTexture('enemy_medium_right')
          else if (enemyType === 'ENEMY_HEAVY') enemy.setTexture('enemy_heavy_right')
          else enemy.setTexture('enemy_light_right')
        }
      }
    } else {
      // 所有方向都危险，原地转向
      if (enemy.body) {
        enemy.body.setVelocity(0, 0)
      }
    }
  }
  
  /**
   * 🔍 检测某个方向是否会立即碰撞
   */
  private wouldCollide(enemy: any, vx: number, vy: number): boolean {
    const scene = this.scene as any
    const checkDistance = 40
    
    let checkX = enemy.x
    let checkY = enemy.y
    
    if (vx > 0) checkX += checkDistance
    else if (vx < 0) checkX -= checkDistance
    else if (vy > 0) checkY += checkDistance
    else if (vy < 0) checkY -= checkDistance
    
    // 检查是否超出边界
    const mapWidth = scene.gridCols * scene.cellSize
    const mapHeight = scene.gridRows * scene.cellSize
    
    if (checkX < 0 || checkX > mapWidth || checkY < 0 || checkY > mapHeight) {
      return true
    }
    
    // 检查是否有墙壁
    const walls = scene.entityManager?.getGroup(EntityType.WALL_BRICK)
    if (walls) {
      for (const wall of walls.getChildren()) {
        const dx = checkX - wall.x
        const dy = checkY - wall.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < 35) {
          return true
        }
      }
    }
    
    return false
  }
  

  
  /**
   * ⭐ 敌人射击
   */
  enemyShoot(enemy: any): void {
    if (!enemy || !enemy.active) return
    
    // 🎯 检查是否有玩家在视野内
    const player = (this.scene as any).player
    if (!player || !player.active) return
    
    // 📏 计算距离
    const distance = Phaser.Math.Distance.Between(
      enemy.x,
      enemy.y,
      player.x,
      player.y
    )
    
    // 🎯 只有在一定距离内才射击
    if (distance > 600) return
    
    // 🔫 生成子弹
    const bulletSpeed = 200
    let vx = 0, vy = bulletSpeed
    
    // 计算射击方向（朝向玩家）
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y)
    vx = Math.cos(angle) * bulletSpeed
    vy = Math.sin(angle) * bulletSpeed
    
    const entityManager = (this.scene as any).entityManager
    if (entityManager) {
      const bullet = entityManager.createEntity({
        type: EntityType.BULLET_ENEMY,
        x: enemy.x,
        y: enemy.y,
        texture: 'bullet_enemy',
        attributes: { damage: 10, speed: bulletSpeed },
        metadata: { velocity: { x: vx, y: vy } }
      })
      
      // ✅ 手动设置速度
      if (bullet && bullet.body) {
        bullet.body.setVelocity(vx, vy)
      }
    }
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 随机改变方向
   */
  private changeDirectionRandomly(enemy: any, speed: number): void {
    const newDirections = [
      { x: -speed, y: 0 },  // 左
      { x: speed, y: 0 },   // 右
      { x: 0, y: -speed },  // 上
      { x: 0, y: speed }    // 下
    ]
    
    const newDir = Phaser.Utils.Array.GetRandom(newDirections)
    
    // ✅ 通过 body 设置速度
    if (enemy.body) {
      enemy.body.setVelocity(newDir.x, newDir.y)
    } else {
      console.warn(`⚠️ [EnemyAI] 敌人没有物理 body，无法改变方向:`, enemy)
    }
  }
}
