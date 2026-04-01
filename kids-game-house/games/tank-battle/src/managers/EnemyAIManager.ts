// ============================================================================
// 🤖 敌人 AI 管理器
// ============================================================================
// 
// 📌 说明:
//   管理敌人坦克的 AI 行为（移动、射击）
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'

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
   * ⭐ 更新敌人 AI（移动）
   */
  updateEnemyAI(enemy: any): void {
    if (!enemy || !enemy.active) return
    
    // 🎲 只在没有速度或随机触发时改变方向
    const hasVelocity = enemy.body && (enemy.body.velocity.x !== 0 || enemy.body.velocity.y !== 0)
    
    // ✅ 30% 概率改变方向（而不是每帧都变）
    if (!hasVelocity || Math.random() < 0.02) {  // 2% 概率轻微调整
      const directions = ['up', 'down', 'left', 'right']
      const direction = Phaser.Utils.Array.GetRandom(directions)
      
      // 🏃 设置速度
      const speed = enemy.speed || 100
      
      // ✅ 通过 body 设置速度
      if (enemy.body) {
        switch (direction) {
          case 'up':
            enemy.body.setVelocityY(-speed)
            break
          case 'down':
            enemy.body.setVelocityY(speed)
            break
          case 'left':
            enemy.body.setVelocityX(-speed)
            break
          case 'right':
            enemy.body.setVelocityX(speed)
            break
        }
      } else {
        console.warn(`⚠️ [EnemyAI] 敌人没有物理 body:`, enemy)
      }
    }
    
    // 🔫 偶尔射击（5% 概率）
    if (Math.random() < 0.05) {
      this.enemyShoot(enemy)
    }
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
      const bullet = entityManager.createBullet(
        enemy.x,
        enemy.y,
        vx,
        vy,
        'bullet_enemy',
        { damage: 10 }
      )
      
      if (bullet) {
        console.log('🔫 敌人射击')
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
