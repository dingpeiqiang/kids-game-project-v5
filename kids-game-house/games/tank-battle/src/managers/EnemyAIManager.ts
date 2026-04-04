// ============================================================================
// 🤖 敌人 AI 管理器
// ============================================================================
// 
// 📌 说明:
//   管理敌人坦克的 AI 行为（移动、射击）
// ============================================================================

import type TankGameScene from '../scenes/TankGameScene'
import { EntityType } from './EntityManager'
import { Logger } from '../utils/Logger'

/**
 * ⭐ 敌人 AI 管理器
 */
export class EnemyAIManager {
  private scene: TankGameScene
  
  constructor(scene: TankGameScene) {
    this.scene = scene
    Logger.info('✅ EnemyAIManager 已创建')
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
      Logger.warn('⚠️ [EnemyAI] 敌人没有物理 body，跳过 AI 更新:', enemy)
      return
    }

    // 🔒 强制边界限制（防止敌人移出地图）
    this.clampToBoundary(enemy)

    // 🏠 计算到基地的距离（用于智能决策）
    const base = (this.scene as any).base
    let distanceToBase = Infinity
    if (base && base.active) {
      distanceToBase = Phaser.Math.Distance.Between(enemy.x, enemy.y, base.x, base.y)
    }

    // 🎯 靠近基地时增加射击频率
    let shootProbability = 0.05  // 基础射击概率 5%
    if (distanceToBase < 300) {
      shootProbability = 0.15  // 距离基地 < 300px 时，射击概率提升到 15%
    } else if (distanceToBase < 500) {
      shootProbability = 0.10  // 距离基地 < 500px 时，射击概率提升到 10%
    }

    // 🧱 持续碰撞检测：每帧检测前方是否有障碍物（避障优先）
    if (this.isObstacleAhead(enemy)) {
      Logger.debug(`🧱 [EnemyAI] 检测到前方障碍物，立即避障`)
      this.changeDirectionSmart(enemy, 'obstacle')
      return
    }

    // 🔍 边界检测：提前检测是否接近边界
    if (this.isNearBoundary(enemy)) {
      this.changeDirectionSmart(enemy, 'boundary')
      return
    }

    // 🎲 随机改变方向（10% 概率，更频繁）
    if (Math.random() < 0.1) {
      this.changeDirectionSmart(enemy, 'random')
    }

    // 🔫 动态射击概率（根据距离基地的远近调整）
    if (Math.random() < shootProbability) {
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
    const boundaryMargin = 40  // 🔧 减小边界检测距离，从 80px 改为 40px
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
   * 🧱 检测前方是否有障碍物（增强版：更远距离 + 多点检测）
   */
  private isObstacleAhead(enemy: any): boolean {
    const scene = this.scene as any

    // 获取当前移动方向
    const vx = enemy.body.velocity.x
    const vy = enemy.body.velocity.y

    // 如果没有速度，不检测
    if (vx === 0 && vy === 0) return false

    // 🔧 增大检测距离：从 40px 改为 70px，提前避障
    const checkDistance = 70

    // 🔍 多点检测：在移动方向上检测多个点，提高准确性
    const checkPoints = [0.5, 0.75, 1.0]  // 检测前方 50%、75%、100% 的距离

    for (const pointRatio of checkPoints) {
      const actualDistance = checkDistance * pointRatio
      let checkX = enemy.x
      let checkY = enemy.y

      if (vx > 0) checkX += actualDistance      // 向右
      else if (vx < 0) checkX -= actualDistance // 向左
      else if (vy > 0) checkY += actualDistance // 向下
      else if (vy < 0) checkY -= actualDistance // 向上

      // 检查是否有墙壁
      const walls = scene.entityManager?.getGroup(EntityType.WALL_BRICK)
      if (walls) {
        for (const wall of walls.getChildren()) {
          const dx = checkX - wall.x
          const dy = checkY - wall.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // 🔧 碰撞半径：增大到 40px，确保提前避障
          if (distance < 40) {
            if (process.env.NODE_ENV === 'development') {
              Logger.debug(`🧱 [isObstacleAhead] 检测到障碍物`)
            }
            return true
          }
        }
      }
    }

    return false
  }
  
  /**
   * 🎯 智能改变方向（增强版：优先攻击基地 + 避开障碍）
   */
  private changeDirectionSmart(enemy: any, reason: string): void {
    const availableDirections: { x: number, y: number, name: string, score: number }[] = []
    const speed = enemy.speed || 100

    // 🔍 调试信息（仅生产环境关闭）
    if (process.env.NODE_ENV === 'development') {
      Logger.debug(`🔄 [changeDirectionSmart] 改变方向 | 原因：${reason}`)
    }

    // 🎯 获取基地位置（主要目标）
    const base = (this.scene as any).base
    const baseX = base?.x || 0
    const baseY = base?.y || 0

    // 🎯 获取玩家位置（次要目标）
    const player = (this.scene as any).player
    const playerX = player?.x || 0
    const playerY = player?.y || 0

    // 🔍 检测哪些方向是安全的
    const directions = [
      { x: 0, y: -speed, name: 'up' },
      { x: 0, y: speed, name: 'down' },
      { x: -speed, y: 0, name: 'left' },
      { x: speed, y: 0, name: 'right' }
    ]

    directions.forEach(dir => {
      // 检查这个方向是否安全（不会立即撞墙）
      const isSafe = !this.wouldCollide(enemy, dir.x, dir.y)

      if (isSafe) {
        // 🧠 计算每个方向的得分（优先攻击基地）
        let score = 0

        // 基础得分：安全方向
        score += 100

        // 🏠 ⭐ 基地攻击得分（主要目标，权重最高）
        const distanceToBase = Phaser.Math.Distance.Between(
          enemy.x + dir.x * 0.1,
          enemy.y + dir.y * 0.1,
          baseX,
          baseY
        )
        const currentDistanceToBase = Phaser.Math.Distance.Between(enemy.x, enemy.y, baseX, baseY)

        if (distanceToBase < currentDistanceToBase) {
          // 这个方向会让敌人更接近基地（权重 30，远高于追玩家的权重 10）
          score += (currentDistanceToBase - distanceToBase) * 30
        }

        // 🏠 基地距离越近，得分越高（鼓励靠近基地）
        const baseProximityBonus = Math.max(0, 800 - distanceToBase) / 10  // 越接近 800px 以内的基地，得分越高
        score += baseProximityBonus * 15

        // 🎯 追逐玩家得分（次要目标，权重较低）
        const distanceToPlayer = Phaser.Math.Distance.Between(
          enemy.x + dir.x * 0.1,
          enemy.y + dir.y * 0.1,
          playerX,
          playerY
        )
        const currentDistanceToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, playerX, playerY)

        if (distanceToPlayer < currentDistanceToPlayer) {
          // 这个方向会让敌人更接近玩家（权重 5，低于基地的 30）
          score += (currentDistanceToPlayer - distanceToPlayer) * 5
        }

        // 🎯 根据敌人类型调整策略
        if (enemy.enemyType === 'ENEMY_LIGHT') {
          // 轻型敌人：优先快速接近基地（进攻性最强）
          score += (currentDistanceToBase - distanceToBase) * 40
        } else if (enemy.enemyType === 'ENEMY_MEDIUM') {
          // 中型敌人：平衡策略
          score += (currentDistanceToBase - distanceToBase) * 25
        } else if (enemy.enemyType === 'ENEMY_HEAVY') {
          // 重型敌人：稳定推进，优先靠近基地
          score += (currentDistanceToBase - distanceToBase) * 20
          score -= Math.random() * 20  // 轻微随机性
        }

        availableDirections.push({
          x: dir.x,
          y: dir.y,
          name: dir.name,
          score: score
        })
      }
    })

    if (process.env.NODE_ENV === 'development') {
      Logger.debug(`🔍 可用方向：${availableDirections.length} 个`)
    }

    if (availableDirections.length > 0) {
      // 🧠 选择得分最高的方向（智能决策，优先向基地移动）
      availableDirections.sort((a, b) => b.score - a.score)
      const bestDir = availableDirections[0]

      // 🎲 加入随机性，避免所有敌人行为完全一致
      if (availableDirections.length > 1 && Math.random() < 0.3) {
        // 30% 概率选择次优方向
        const secondBest = availableDirections[1]
        Logger.debug(`🎲 随机选择次优方向：${secondBest.name}`)

        if (enemy.body) {
          enemy.body.setVelocity(secondBest.x, secondBest.y)
          this.updateEnemyDirection(enemy, secondBest.x, secondBest.y)
        }
      } else {
        Logger.debug(`✅ 选择最优方向：${bestDir.name}`)

        if (enemy.body) {
          enemy.body.setVelocity(bestDir.x, bestDir.y)
          this.updateEnemyDirection(enemy, bestDir.x, bestDir.y)
        }
      }
    } else {
      // 🔧 紧急修复：如果所有方向都被判定为危险（误判），强制选择一个方向
      Logger.warn(`⚠️ 所有方向都危险，强制选择反向移动`)

      // 获取当前速度的反方向
      const currentVx = enemy.body.velocity.x
      const currentVy = enemy.body.velocity.y

      let newDir: { x: number, y: number, name: string }

      // 强制选择反向或相邻方向
      if (currentVy > 0) {
        // 向下移动，改为向上
        newDir = { x: 0, y: -speed, name: 'up' }
      } else if (currentVy < 0) {
        // 向上移动，改为向下
        newDir = { x: 0, y: speed, name: 'down' }
      } else if (currentVx > 0) {
        // 向右移动，改为向左
        newDir = { x: -speed, y: 0, name: 'left' }
      } else if (currentVx < 0) {
        // 向左移动，改为向右
        newDir = { x: speed, y: 0, name: 'right' }
      } else {
        // 停止状态，随机选择
        const randomDirections = [
          { x: 0, y: -speed, name: 'up' },
          { x: 0, y: speed, name: 'down' },
          { x: -speed, y: 0, name: 'left' },
          { x: speed, y: 0, name: 'right' }
        ]
        newDir = Phaser.Utils.Array.GetRandom(randomDirections)
      }

      if (enemy.body) {
        enemy.body.setVelocity(newDir.x, newDir.y)
        this.updateEnemyDirection(enemy, newDir.x, newDir.y)
        Logger.debug(`🚀 强制移动: ${newDir.name}, 速度: (${newDir.x}, ${newDir.y})`)
      }
    }
  }
  
  /**
   * 🔒 强制限制敌人位置在地图边界内（防止移出地图）
   */
  private clampToBoundary(enemy: any): void {
    const scene = this.scene as any
    if (!scene || !scene.gridCols || !scene.gridRows || !scene.cellSize) {
      return
    }

    const mapWidth = scene.gridCols * scene.cellSize
    const mapHeight = scene.gridRows * scene.cellSize
    const boundaryPadding = 10
    const halfSize = enemy.displayWidth / 2 || 32

    const minX = boundaryPadding + halfSize
    const maxX = mapWidth - boundaryPadding - halfSize
    const minY = boundaryPadding + halfSize
    const maxY = mapHeight - boundaryPadding - halfSize

    // 保存原始位置（用于调试）
    const originalX = enemy.x
    const originalY = enemy.y

    // 强制限制在边界内
    enemy.x = Phaser.Math.Clamp(enemy.x, minX, maxX)
    enemy.y = Phaser.Math.Clamp(enemy.y, minY, maxY)

    // 如果位置被修正且偏差较大，打印调试信息（仅开发环境）
    if ((enemy.x !== originalX || enemy.y !== originalY) && process.env.NODE_ENV === 'development') {
      const correction = Math.sqrt(Math.pow(enemy.x - originalX, 2) + Math.pow(enemy.y - originalY, 2))
      if (correction > 5) {  // 只有修正超过 5px 才打印
        Logger.debug(`🔒 [clampToBoundary] 敌人位置修正 > 5px`)
      }
    }
  }

  /**
   * 🎨 更新敌人炮口朝向（确保炮口与移动方向一致）
   */
  private updateEnemyDirection(enemy: any, vx: number, vy: number): void {
    const enemyType = enemy.enemyType
    let directionName = ''

    // ✅ 参考玩家坦克逻辑：图片命名和实际朝向一致，直接使用对应纹理，不旋转
    if (vy < 0) {      // 向上移动
      enemy.setAngle(0)  // 不旋转
      directionName = 'up'
      if (enemyType === 'ENEMY_LIGHT') enemy.setTexture('enemy_light_up')
      else if (enemyType === 'ENEMY_MEDIUM') enemy.setTexture('enemy_medium_up')
      else if (enemyType === 'ENEMY_HEAVY') enemy.setTexture('enemy_heavy_up')
      else enemy.setTexture('enemy_light_up')
    } else if (vy > 0) { // 向下移动（敌人初始方向）
      enemy.setAngle(0)  // 不旋转
      directionName = 'down'
      if (enemyType === 'ENEMY_LIGHT') enemy.setTexture('enemy_light_down')
      else if (enemyType === 'ENEMY_MEDIUM') enemy.setTexture('enemy_medium_down')
      else if (enemyType === 'ENEMY_HEAVY') enemy.setTexture('enemy_heavy_down')
      else enemy.setTexture('enemy_light_down')
    } else if (vx < 0) { // 向左移动
      enemy.setAngle(0)  // 不旋转
      directionName = 'left'
      if (enemyType === 'ENEMY_LIGHT') enemy.setTexture('enemy_light_left')
      else if (enemyType === 'ENEMY_MEDIUM') enemy.setTexture('enemy_medium_left')
      else if (enemyType === 'ENEMY_HEAVY') enemy.setTexture('enemy_heavy_left')
      else enemy.setTexture('enemy_light_left')
    } else if (vx > 0) { // 向右移动
      enemy.setAngle(0)  // 不旋转
      directionName = 'right'
      if (enemyType === 'ENEMY_LIGHT') enemy.setTexture('enemy_light_right')
      else if (enemyType === 'ENEMY_MEDIUM') enemy.setTexture('enemy_medium_right')
      else if (enemyType === 'ENEMY_HEAVY') enemy.setTexture('enemy_heavy_right')
      else enemy.setTexture('enemy_light_right')
    }

    // 🔍 调试信息（仅开发环境）
    if (process.env.NODE_ENV === 'development') {
      Logger.debug(`🔄 [updateEnemyDirection] 方向：${directionName}`)
    }
  }
  
  /**
   * 🔍 检测某个方向是否会立即碰撞（增强版：多点检测）
   */
  private wouldCollide(enemy: any, vx: number, vy: number): boolean {
    const scene = this.scene as any
    const checkDistance = 50  // 🔧 增大检测距离：从 30px 改为 50px

    // 🔍 多点检测：检测 50%、75%、100% 距离的多个点
    const checkPoints = [0.5, 0.75, 1.0]

    for (const pointRatio of checkPoints) {
      const actualDistance = checkDistance * pointRatio
      let checkX = enemy.x
      let checkY = enemy.y

      if (vx > 0) checkX += actualDistance
      else if (vx < 0) checkX -= actualDistance
      else if (vy > 0) checkY += actualDistance
      else if (vy < 0) checkY -= actualDistance

      // 检查是否超出边界（添加安全边距）
      const mapWidth = scene.gridCols * scene.cellSize
      const mapHeight = scene.gridRows * scene.cellSize
      const halfSize = enemy.displayWidth / 2 || 32

      if (checkX < halfSize || checkX > mapWidth - halfSize ||
          checkY < halfSize || checkY > mapHeight - halfSize) {
        return true
      }

      // 检查是否有墙壁（增大碰撞半径）
      const walls = scene.entityManager?.getGroup(EntityType.WALL_BRICK)
      if (walls) {
        for (const wall of walls.getChildren()) {
          const dx = checkX - wall.x
          const dy = checkY - wall.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // 🔧 碰撞半径：从 30px 改为 45px，提前避障
          if (distance < 45) {
            return true
          }
        }
      }
    }

    return false
  }
  

  
  /**
   * ⭐ 敌人射击（增强智能版：优先攻击基地）
   */
  enemyShoot(enemy: any): void {
    if (!enemy || !enemy.active) return

    // 🏠 获取基地位置（主要目标）
    const base = (this.scene as any).base
    if (!base || !base.active) {
      Logger.warn('⚠️ [EnemyShoot] 基地不存在，跳过射击')
      return
    }

    // 📏 计算到基地的距离
    const distanceToBase = Phaser.Math.Distance.Between(
      enemy.x,
      enemy.y,
      base.x,
      base.y
    )

    // 🎯 只有在一定距离内才射击（800px 范围）
    if (distanceToBase > 800) {
      return
    }

    // 🧠 智能决策：判断前方是否有基地或玩家
    const body = enemy.body as any
    if (!body) {
      Logger.warn('⚠️ [EnemyShoot] 敌人没有物理 body')
      return
    }

    const velocity = body.velocity
    const bulletSpeed = 200
    let vx = 0, vy = 0
    let shouldShoot = false

    // 🏠 判断基地是否在敌人前方（优先目标）
    const baseAhead = this.isTargetAhead(enemy, base, velocity)

    // 🎯 判断玩家是否在敌人前方（次要目标）
    const player = (this.scene as any).player
    let playerAhead = false
    if (player && player.active) {
      playerAhead = this.isTargetAhead(enemy, player, velocity)
    }

    // 🎯 决策逻辑：优先攻击基地，其次是玩家
    if (baseAhead) {
      // ✅ 基地在前方，射击基地（最高优先级）
      shouldShoot = true
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {  // 10% 概率打印，避免刷屏
        Logger.debug(`🎯 [EnemyShoot] 基地在前方，优先攻击基地！`)
      }
    } else if (playerAhead) {
      // ✅ 玩家在前方，射击玩家
      shouldShoot = true
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.2) {  // 20% 概率打印
        Logger.debug(`🎯 [EnemyShoot] 玩家在前方，射击玩家`)
      }
    } else {
      // 🧠 基地和玩家都不在前方，考虑转向射击（重型敌人智能）
      if (enemy.enemyType === 'ENEMY_HEAVY') {
        // 重型敌人：转向朝向基地
        this.turnTowardsBase(enemy, base)
        shouldShoot = true
      } else if (enemy.enemyType === 'ENEMY_MEDIUM' && Math.random() < 0.5) {
        // 中型敌人：50% 概率转向朝向基地
        this.turnTowardsBase(enemy, base)
        shouldShoot = true
      } else {
        // 轻型和中型敌人（概率未触发）：不射击，等待转向
        shouldShoot = false
      }
    }

    if (shouldShoot) {
      // 根据敌人的速度方向确定子弹方向
      if (velocity.y < 0) {  // 敌人向上移动
        vx = 0
        vy = -bulletSpeed
      } else if (velocity.y > 0) {  // 敌人向下移动
        vx = 0
        vy = bulletSpeed
      } else if (velocity.x < 0) {  // 敌人向左移动
        vx = -bulletSpeed
        vy = 0
      } else if (velocity.x > 0) {  // 敌人向右移动
        vx = bulletSpeed
        vy = 0
      } else {
        // 如果敌人静止，默认向下射击
        vx = 0
        vy = bulletSpeed
      }
    
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
    
        if (process.env.NODE_ENV === 'development') {
          Logger.debug(`🔫 [EnemyShoot] 发射子弹 | 距离基地：${distanceToBase.toFixed(0)}px`)
        }
      }
    }
  }

  /**
   * 🧠 判断目标是否在敌人前方
   */
  private isTargetAhead(enemy: any, target: any, velocity: any): boolean {
    const tolerance = 100  // 允许的角度和位置容差

    // 判断目标在哪个方向
    const dx = target.x - enemy.x
    const dy = target.y - enemy.y

    // 根据敌人的移动方向判断
    if (Math.abs(velocity.y) > Math.abs(velocity.x)) {
      // 垂直移动
      if (velocity.y < 0) {
        // 向上移动：目标必须在上方
        return dy < -tolerance
      } else {
        // 向下移动：目标必须在下方
        return dy > tolerance
      }
    } else {
      // 水平移动
      if (velocity.x < 0) {
        // 向左移动：目标必须在左侧
        return dx < -tolerance
      } else {
        // 向右移动：目标必须在右侧
        return dx > tolerance
      }
    }
  }

  /**
   * 🧠 转向朝向目标（重型敌人专属）
   */
  private turnTowardsTarget(enemy: any, target: any): void {
    const dx = target.x - enemy.x
    const dy = target.y - enemy.y

    const speed = enemy.speed || 100
    let vx = 0, vy = 0

    // 判断主要移动方向
    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平方向为主
      vx = dx > 0 ? speed : -speed
      vy = 0
    } else {
      // 垂直方向为主
      vx = 0
      vy = dy > 0 ? speed : -speed
    }

    // 设置新速度
    if (enemy.body) {
      enemy.body.setVelocity(vx, vy)
      this.updateEnemyDirection(enemy, vx, vy)
    }

    Logger.debug(`🧠 [EnemyAI] ${enemy.enemyType} 转向朝向目标 | 新方向: (${vx}, ${vy})`)
  }

  /**
   * 🧠 转向朝向基地（重型敌人专属）
   */
  private turnTowardsBase(enemy: any, base: any): void {
    this.turnTowardsTarget(enemy, base)
  }

  /**
   * 🧠 转向朝向玩家（重型敌人专属，保留兼容）
   */
  private turnTowardsPlayer(enemy: any, player: any): void {
    this.turnTowardsTarget(enemy, player)
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
      Logger.warn(`⚠️ [EnemyAI] 敌人没有物理 body，无法改变方向:`, enemy)
    }
  }
}
