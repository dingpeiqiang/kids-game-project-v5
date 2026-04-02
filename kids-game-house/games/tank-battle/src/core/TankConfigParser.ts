// ============================================================================
// 🎮 坦克大战 - 关卡配置解析器
// ============================================================================
// 
// 📌 说明:
//   将 ILevelConfig 解析为坦克大战特定的游戏数据
// ============================================================================

import { IConfigParser } from './TankGameOrchestrator'
import { ILevelConfig, ITankLevelData, ITankLevelParams } from '../types/level-types'


/**
 * ⭐ 坦克大战配置解析器
 * 
 * @remarks
 * 职责：
 * - 将标准 ILevelConfig 转换为坦克大战特定格式
 * - 根据地图布局生成墙壁和敌人位置
 * - 计算出生点和道具位置
 */
export class TankConfigParser implements IConfigParser {
  protected scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    console.log('✅ [TankConfigParser] 已创建')
  }
  
  /**
   * ⭐ 解析关卡配置
   */
  async parse(config: ILevelConfig<ITankLevelParams>): Promise<ITankLevelData> {
    console.log('📋 [TankConfigParser] 开始解析关卡:', config.info.name)
    
    const params = config.params
    
    // ✅ 获取场景的偏移量（如果有）
    const scene = this.scene as any
    const offsetX = scene.offsetX || 0
    const offsetY = scene.offsetY || 0
    
    console.log('🗺️ 地图偏移:', { offsetX, offsetY })
    
    // 1. 解析敌人配置（使用偏移量）
    const enemies = this.parseEnemies(params, offsetX, offsetY)
    
    // 2. 解析墙壁配置（使用偏移量）
    const walls = this.parseWalls(params, offsetX, offsetY)
    
    // 3. 解析道具配置（使用偏移量）
    const powerUps = this.parsePowerUps(params, offsetX, offsetY)
    
    // 4. 获取基地位置（使用偏移量）
    const base = this.parseBase(params, offsetX, offsetY)
    
    const levelData: ITankLevelData = {
      enemies,
      walls,
      powerUps,
      base,
      config: params
    }
    
    console.log('✅ [TankConfigParser] 解析完成:', {
      enemyCount: enemies.reduce((sum, e) => sum + e.count, 0),
      wallCount: walls.length,
      powerUpCount: powerUps.length
    })
    
    return levelData
  }
  
  /**
   * 解析敌人配置
   */
  protected parseEnemies(params: ITankLevelParams, offsetX: number = 0, offsetY: number = 0): ITankLevelData['enemies'] {
    const enemies: ITankLevelData['enemies'] = []
    
    // 按类型分组
    const typeMap = new Map<string, number>()
    params.enemyTypes.forEach(type => {
      typeMap.set(type, (typeMap.get(type) || 0) + 1)
    })
    
    // 计算每种类型的数量
    const totalTypes = params.enemyTypes.length
    params.enemyTypes.forEach((type, index) => {
      const count = Math.floor(params.enemyCount / totalTypes)
      enemies.push({
        type,
        count: index === totalTypes - 1 ? params.enemyCount - (totalTypes - 1) * count : count,
        spawnPoints: this.getEnemySpawnPoints(count).map(point => ({
          x: point.x + offsetX,
          y: point.y + offsetY
        }))
      })
    })
    
    return enemies
  }
  
  /**
   * 解析墙壁配置
   */
  protected parseWalls(params: ITankLevelParams, offsetX: number = 0, offsetY: number = 0): ITankLevelData['walls'] {
    const walls: ITankLevelData['walls'] = []

    // 根据密度生成随机墙壁
    const cellSize = 64
    const cols = 13
    const rows = 12

    for (let row = 2; row < rows - 1; row++) {
      for (let col = 1; col < cols; col++) {
        // 避开中心区域（玩家复活点）
        if (row > rows / 2 - 2 && col > cols / 2 - 2 && col < cols / 2 + 2) {
          continue
        }

        if (Math.random() < params.wallDensity) {
          const wallType = Math.random() > 0.7 ? 'steel' : 'brick'
          walls.push({
            x: col * cellSize + offsetX,
            y: row * cellSize + offsetY,
            type: wallType
          })
        }
      }
    }

    // 🏠 生成基地保护墙（经典坦克大战布局）
    const baseCenterX = cols * cellSize / 2 + offsetX
    const baseY = (rows - 0.5) * cellSize + offsetY  // 🏠 基地下移一个格子

    // 基地周围的保护墙布局（砖墙）
    // 基地位置在中心，保护墙围绕
    const protectionWalls: Array<{x: number, y: number, type: string}> = []

    // 基地上方的墙（3块）
    protectionWalls.push({ x: baseCenterX - cellSize, y: baseY - cellSize, type: 'brick' })
    protectionWalls.push({ x: baseCenterX, y: baseY - cellSize, type: 'brick' })
    protectionWalls.push({ x: baseCenterX + cellSize, y: baseY - cellSize, type: 'brick' })

    // 基地左侧的墙（2块）
    protectionWalls.push({ x: baseCenterX - cellSize, y: baseY, type: 'brick' })
    protectionWalls.push({ x: baseCenterX - cellSize, y: baseY + cellSize, type: 'brick' })

    // 基地右侧的墙（2块）
    protectionWalls.push({ x: baseCenterX + cellSize, y: baseY, type: 'brick' })
    protectionWalls.push({ x: baseCenterX + cellSize, y: baseY + cellSize, type: 'brick' })

    // 基地下方的墙（3块）
    protectionWalls.push({ x: baseCenterX - cellSize, y: baseY + cellSize * 2, type: 'brick' })
    protectionWalls.push({ x: baseCenterX, y: baseY + cellSize * 2, type: 'brick' })
    protectionWalls.push({ x: baseCenterX + cellSize, y: baseY + cellSize * 2, type: 'brick' })

    // 添加到墙壁列表
    walls.push(...protectionWalls)

    console.log(`🏠 已添加 ${protectionWalls.length} 个基地保护墙`)

    return walls
  }
  
  /**
   * 解析道具配置
   */
  protected parsePowerUps(params: ITankLevelParams, offsetX: number = 0, offsetY: number = 0): ITankLevelData['powerUps'] {
    const powerUps: ITankLevelData['powerUps'] = []
    const types: Array<'gun' | 'shield' | 'life' | 'clock'> = ['gun', 'shield', 'clock']
    
    // 随机生成几个道具点
    const count = Math.floor(Math.random() * 3) + 2 // 2-4 个
    const cellSize = 64
    const cols = 13
    const rows = 12
    
    for (let i = 0; i < count; i++) {
      const col = Phaser.Math.Between(2, cols - 2)
      const row = Phaser.Math.Between(2, rows - 2)
      
      powerUps.push({
        x: col * cellSize + offsetX,
        y: row * cellSize + offsetY,
        type: types[Phaser.Math.Between(0, types.length - 1)]
      })
    }
    
    return powerUps
  }
  
  /**
   * 解析基地位置
   */
  protected parseBase(params: ITankLevelParams, offsetX: number = 0, offsetY: number = 0): ITankLevelData['base'] {
    const cellSize = 64
    const cols = 13
    const rows = 12

    // 🏠 基地下移一个格子：从 (rows - 1) 改为 (rows - 0.5)
    return {
      x: cols * cellSize / 2 + offsetX,
      y: (rows - 0.5) * cellSize + offsetY
    }
  }
  
  /**
   * 获取敌人生成点
   */
  protected getEnemySpawnPoints(count: number): { x: number, y: number }[] {
    const points: { x: number, y: number }[] = []
    const cellSize = 64
    
    // 三个固定出生点
    const spawnPoints = [
      { x: cellSize * 2, y: cellSize * 2 },           // 左上
      { x: cellSize * 6.5, y: cellSize * 2 },         // 中上
      { x: cellSize * 11, y: cellSize * 2 }           // 右上
    ]
    
    for (let i = 0; i < count; i++) {
      const point = spawnPoints[i % spawnPoints.length]
      points.push({ ...point })
    }
    
    return points
  }
}
