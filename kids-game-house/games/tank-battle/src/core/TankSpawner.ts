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
import { Logger } from '../utils/Logger'

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
    Logger.info('🏗️ [TankSpawner] 已创建')
  }
  
  /**
   * ⭐ 生成关卡实体
   */
  async spawn(data: ITankLevelData): Promise<void> {
    Logger.debug('🏗️ [TankSpawner] 开始生成关卡...')
    
    // 获取 EntityManager
    const entityManager = (this.scene as any).entityManager
    
    if (!entityManager) {
      Logger.warn('⚠️ 未找到 EntityManager，使用备用方案')
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
    
    Logger.debug('✅ [TankSpawner] 生成完成')
  }
  
  /**
   * 生成墙壁
   */
  protected async spawnWalls(walls: ITankLevelData['walls'], entityManager: any): Promise<void> {
    Logger.debug(`🧱 生成 ${walls.length} 个墙壁...`)
    
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
        Logger.debug(`   - ${wall.type} wall at (${wall.x}, ${wall.y})`)
      }
    })
    
    await this.delay(50)
  }
  
  /**
   * 生成敌人
   */
  protected async spawnEnemies(enemies: ITankLevelData['enemies'], entityManager: any): Promise<void> {
    Logger.debug(`👾 生成敌人...`)
    
    enemies.forEach(group => {
      group.spawnPoints.forEach((spawnPoint, index) => {
        // ✅ 将字符串类型转换为 EntityType 枚举
        const type = group.type === 'light' ? EntityType.ENEMY_LIGHT : 
                     group.type === 'medium' ? EntityType.ENEMY_MEDIUM : 
                     EntityType.ENEMY_HEAVY
        
        // ✅ 使用 GTRS 中的正确纹理名称
        const texture = group.type === 'light' ? 'enemy_light_up' :
                       group.type === 'medium' ? 'enemy_medium_up' :
                       'enemy_heavy_up'
        
        Logger.debug(`🔍 尝试使用纹理：${texture}`)
        
        const attributes = {
          health: group.type === 'light' ? 1 : group.type === 'medium' ? 2 : 3,
          speed: group.type === 'light' ? 150 : group.type === 'medium' ? 100 : 50,
          damage: group.type === 'light' ? 10 : group.type === 'medium' ? 20 : 30
        }
        
        const enemy = entityManager.createEnemy(spawnPoint.x, spawnPoint.y, type, texture, attributes)
        
        // ⭐ 为每个敌人设置 AI（关键！）
        this.setupEnemyAI(enemy, group.type)
        
        if (index === 0) {
          Logger.debug(`   - ${group.type} enemy #${index + 1} at (${spawnPoint.x}, ${spawnPoint.y}) | texture: ${texture}`)
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
    if (!scene || !scene.time) {
      Logger.warn('⚠️ 场景或 time 组件不存在，无法设置 AI')
      return
    }

    // 🔍 调试信息
    Logger.debug(`🔍 [setupEnemyAI] 开始设置 AI | enemy:`, {
      x: enemy.x,
      y: enemy.y,
      texture: enemy.texture.key,
      angle: enemy.angle,
      hasBody: !!enemy.body
    })

    // 设置速度属性
    enemy.speed = type === 'light' ? 150 : type === 'medium' ? 100 : 50
    enemy.enemyType = type === 'light' ? 'ENEMY_LIGHT' : type === 'medium' ? 'ENEMY_MEDIUM' : 'ENEMY_HEAVY'

    // 🤖 使用 EnemyAIManager
    const aiManager = scene.enemyAIManager
    if (!aiManager) {
      Logger.warn('⚠️ enemyAIManager 不存在，无法设置 AI')
      return
    }

    // ✅ 验证敌人是否有物理 body
    if (!enemy.body) {
      console.error('❌ 敌人没有物理 body，AI 无法工作')
      return
    }

    Logger.debug(`✅ 开始为敌人设置 AI | speed: ${enemy.speed}, hasBody: ${!!enemy.body}`)

    // 🔥 敌人初始向下移动（经典坦克大战特性）
    // ✅ 参考玩家坦克逻辑：直接使用对应的向下纹理，不旋转
    enemy.body.setVelocity(0, enemy.speed)

    // ✅ 向下移动使用向下纹理（图片命名和实际朝向一致）
    enemy.setAngle(0)  // 不旋转

    if (enemy.enemyType === 'ENEMY_LIGHT') {
      enemy.setTexture('enemy_light_down')
    } else if (enemy.enemyType === 'ENEMY_MEDIUM') {
      enemy.setTexture('enemy_medium_down')
    } else if (enemy.enemyType === 'ENEMY_HEAVY') {
      enemy.setTexture('enemy_heavy_down')
    }

    Logger.debug(`🚀 [AI] 敌人初始移动：向下，速度=${enemy.speed}，纹理=${enemy.texture.key}，角度=${enemy.angle}°`)

    // 🧠 根据敌人类型设置不同的 AI 参数
    let moveInterval: number
    let shootInterval: number

    if (type === 'light') {
      // 轻型敌人：移动快速，射击频繁
      moveInterval = Phaser.Math.Between(800, 2000)
      shootInterval = Phaser.Math.Between(1500, 3000)
    } else if (type === 'medium') {
      // 中型敌人：平衡
      moveInterval = Phaser.Math.Between(1000, 3000)
      shootInterval = Phaser.Math.Between(2000, 4000)
    } else {
      // 重型敌人：移动慢但聪明，射击频率中等
      moveInterval = Phaser.Math.Between(1500, 3500)
      shootInterval = Phaser.Math.Between(2500, 5000)
    }

    // AI 移动定时器（立即执行一次，然后循环）
    scene.time.addEvent({
      delay: moveInterval,
      callback: () => {
        if (enemy && enemy.active) {
          aiManager.updateEnemyAI(enemy)
        }
      },
      loop: true,
      startAt: 100 // 100ms 后首次执行
    })

    // 射击定时器
    scene.time.addEvent({
      delay: shootInterval,
      callback: () => {
        if (enemy && enemy.active) {
          aiManager.enemyShoot(enemy)
        }
      },
      loop: true,
      startAt: 500 // 500ms 后首次执行
    })

    Logger.debug(`✅ 敌人 AI 设置完成 | type: ${type}, speed: ${enemy.speed}, moveInterval: ${moveInterval}ms, shootInterval: ${shootInterval}ms`)
  }
  
  /**
   * 生成道具
   */
  protected async spawnPowerUps(powerUps: ITankLevelData['powerUps'], entityManager: any): Promise<void> {
    Logger.debug(`🎁 生成 ${powerUps.length} 个道具...`)
    
    powerUps.forEach(prop => {
      const texture = `prop_${prop.type}`
      const attributes = {
        type: prop.type,
        duration: (prop as any).duration || 0
      }
      entityManager.createPowerUp(prop.x, prop.y, texture, attributes)
      Logger.debug(`   - ${prop.type} prop at (${prop.x}, ${prop.y})`)
    })
    
    await this.delay(50)
  }
  
  /**
   * ⭐ 设置基地
   */
  protected async setupBase(base: ITankLevelData['base']): Promise<void> {
    Logger.debug(`🏠 设置基地 at (${base.x}, ${base.y})`)

    // ✅ 使用 physics.add.sprite 创建物理对象
    const scene = this.scene as any
    const baseSprite = scene.physics.add.sprite(base.x, base.y, 'base_home')
    baseSprite.setImmovable(true)

    // ✅ 存储到 scene.base 以便 CollisionManager 访问
    scene.base = baseSprite

    // 添加基地标记文字（仅用于显示）
    const baseText = this.scene.add.text(base.x, base.y - 50, '🏠 BASE', {
      fontSize: '16px',
      color: '#00FF00'
    }).setOrigin(0.5)

    // 存储到 scene 的 data 中以便清理
    const baseObjects = this.scene.registry.get('baseObjects') || []
    baseObjects.push(baseSprite, baseText)
    this.scene.registry.set('baseObjects', baseObjects)

    Logger.debug('✅ 基地设置完成')
    await this.delay(50)
  }
  
  /**
   * 延迟工具函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
