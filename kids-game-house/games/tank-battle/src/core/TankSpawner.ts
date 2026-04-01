// ============================================================================
// 🎮 坦克大战 - 关卡生成器
// ============================================================================
// 
// 📌 说明:
//   根据解析后的配置数据生成游戏实体
// ============================================================================

import { ILevelSpawner } from './TankGameOrchestrator'
import { ITankLevelData } from '../types/level-types'
import { EntityType } from '@/managers/EntityManager'

/**
 * ⭐ 坦克大战关卡生成器
 * 
 * @remarks
 * 职责：
 * - 根据 ITankLevelData 生成敌人、墙壁、道具
 * - 初始化基地
 * - 设置玩家出生点
 */
export class TankSpawner implements ILevelSpawner {
  protected scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    console.log('🏗️ [TankSpawner] 已创建')
  }
  
  /**
   * ⭐ 生成关卡实体
   */
  async spawn(data: ITankLevelData): Promise<void> {
    console.log('🏗️ [TankSpawner] 开始生成关卡...')
    
    // 获取 EntityManager
    const entityManager = (this.scene as any).entityManager
    
    if (!entityManager) {
      console.warn('⚠️ 未找到 EntityManager，使用备用方案')
      await this.delay(100)
      return
    }
    
    // 1. 生成墙壁
    await this.spawnWalls(data.walls, entityManager)
    
    // 2. 生成敌人
    await this.spawnEnemies(data.enemies, entityManager)
    
    // 3. 生成道具
    await this.spawnPowerUps(data.powerUps, entityManager)
    
    // 4. 设置基地
    await this.setupBase(data.base)
    
    console.log('✅ [TankSpawner] 生成完成')
  }
  
  /**
   * 生成墙壁
   */
  protected async spawnWalls(walls: ITankLevelData['walls'], entityManager: any): Promise<void> {
    console.log(`🧱 生成 ${walls.length} 个墙壁...`)
    
    walls.forEach((wall, index) => {
      const texture = wall.type === 'brick' ? 'wall_brick' : 'wall_steel'
      const type = wall.type === 'brick' ? EntityType.WALL_BRICK : EntityType.WALL_STEEL
      const attributes = {
        health: wall.type === 'brick' ? 2 : Infinity,
        maxHealth: wall.type === 'brick' ? 2 : Infinity
      }
      
      // ✅ 传递完整的 5 个参数
      entityManager.createWall(wall.x, wall.y, type, texture, attributes)
      
      if (index % 10 === 0) {
        console.log(`   - ${wall.type} wall at (${wall.x}, ${wall.y})`)
      }
    })
    
    await this.delay(50)
  }
  
  /**
   * 生成敌人
   */
  protected async spawnEnemies(enemies: ITankLevelData['enemies'], entityManager: any): Promise<void> {
    console.log(`👾 生成敌人...`)
    
    enemies.forEach(group => {
      group.spawnPoints.forEach((spawnPoint, index) => {
        // ✅ 将字符串类型转换为 EntityType 枚举
        const type = group.type === 'light' ? EntityType.ENEMY_LIGHT : 
                     group.type === 'medium' ? EntityType.ENEMY_MEDIUM : 
                     EntityType.ENEMY_HEAVY
        
        // ✅ 使用 GTRS 中的正确纹理名称
        const texture = group.type === 'light' ? 'enemy_tank_1' :
                       group.type === 'medium' ? 'enemy_tank_2' :
                       'enemy_tank_3'
        
        console.log(`🔍 尝试使用纹理：${texture}`)
        
        const attributes = {
          health: group.type === 'light' ? 1 : group.type === 'medium' ? 2 : 3,
          speed: group.type === 'light' ? 150 : group.type === 'medium' ? 100 : 50,
          damage: group.type === 'light' ? 10 : group.type === 'medium' ? 20 : 30
        }
        
        const enemy = entityManager.createEnemy(spawnPoint.x, spawnPoint.y, type, texture, attributes)
        
        // ⭐ 为每个敌人设置 AI（关键！）
        this.setupEnemyAI(enemy, group.type)
        
        if (index === 0) {
          console.log(`   - ${group.type} enemy #${index + 1} at (${spawnPoint.x}, ${spawnPoint.y}) | texture: ${texture}`)
        }
      })
    })
    
    await this.delay(100)
  }
  
  /**
   * ⭐ 为敌人设置 AI 逻辑
   */
  protected setupEnemyAI(enemy: any, type: string): void {
    const scene = this.scene as any
    if (!scene || !scene.time) return
    
    // 设置速度属性
    enemy.speed = type === 'light' ? 150 : type === 'medium' ? 100 : 50
    
    // AI 移动定时器
    scene.time.addEvent({
      delay: Phaser.Math.Between(1000, 3000),
      callback: () => scene.updateEnemyAI(enemy),
      loop: true,
    })
    
    // 射击定时器
    scene.time.addEvent({
      delay: Phaser.Math.Between(2000, 4000),
      callback: () => scene.enemyShoot(enemy),
      loop: true,
    })
    
    console.log(`🤖 已为敌人设置 AI | speed: ${enemy.speed}`)
  }
  
  /**
   * 生成道具
   */
  protected async spawnPowerUps(powerUps: ITankLevelData['powerUps'], entityManager: any): Promise<void> {
    console.log(`🎁 生成 ${powerUps.length} 个道具...`)
    
    powerUps.forEach(prop => {
      const texture = `prop_${prop.type}`
      const attributes = {
        type: prop.type,
        duration: (prop as any).duration || 0
      }
      entityManager.createPowerUp(prop.x, prop.y, texture, attributes)
      console.log(`   - ${prop.type} prop at (${prop.x}, ${prop.y})`)
    })
    
    await this.delay(50)
  }
  
  /**
   * 设置基地
   */
  protected async setupBase(base: ITankLevelData['base']): Promise<void> {
    console.log(`🏠 设置基地 at (${base.x}, ${base.y})`)
    // TODO: 创建基地精灵
    await this.delay(50)
  }
  
  /**
   * 延迟工具函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
