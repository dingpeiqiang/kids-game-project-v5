// ============================================================================
// 🎮 关卡配置加载器
// ============================================================================
// 
// 📌 说明:
//   从 JSON 文件加载关卡配置，支持错误处理和兜底方案
// ============================================================================

import { ILevelConfig } from '../types/level-types'
import { Logger } from './Logger'

/**
 * ⭐ 关卡配置加载器
 */
export class LevelConfigLoader {
  /**
   * ⭐ 从 JSON 文件加载关卡配置
   * 
   * @param levelId - 关卡 ID（如：tank_level_1）
   * @returns Promise<ILevelConfig> 关卡配置对象
   */
  static async loadLevelConfig(levelId: string): Promise<ILevelConfig> {
    Logger.debug('📥 加载关卡配置:', levelId)
    
    // 尝试多个可能的路径
    const possiblePaths = [
      `./config/levels/${levelId}.json`,           // 相对路径（Vite）
      `/kids-game-house/games/tank-battle/config/levels/${levelId}.json`,  // 完整开发路径
      `/games/tank-battle/config/levels/${levelId}.json`  // 简化路径
    ]
    
    for (const configPath of possiblePaths) {
      try {
        Logger.debug('🔍 尝试请求:', configPath)
        
        const response = await fetch(configPath)
        
        if (response.ok) {
          // 解析 JSON
          const config: ILevelConfig = await response.json()
          
          Logger.debug('✅ 配置加载成功:', config.info.name)
          Logger.debug('📊 配置详情:', {
            difficulty: config.info.difficulty,
            objectives: config.objectives.length,
            timeLimit: config.timeLimit
          })
          
          return config
        }
      } catch (error) {
        Logger.warn(`⚠️ 路径 ${configPath} 失败:`, error)
        // 继续尝试下一个路径
      }
    }
    
    // 所有路径都失败，使用默认配置
    console.error('❌ 所有路径都失败了，使用默认配置')
    return this.createDefaultConfig(levelId)
  }
  
  /**
   * ⭐ 创建默认配置（兜底方案）
   */
  private static createDefaultConfig(levelId: string): ILevelConfig {
    const defaultConfig: ILevelConfig = {
      info: {
        id: levelId,
        name: '默认关卡',
        description: '配置加载失败，使用默认值',
        difficulty: 'easy'
      },
      objectives: [
        {
          id: 'destroy_all_enemies',
          type: 'destroy_enemies',
          description: '消灭所有敌人',
          targetValue: 5,
          weight: 1.0,
          reward: { score: 500 }
        }
      ],
      params: {
        enemyCount: 5,
        spawnInterval: 3000,
        enemyTypes: ['light'],
        timeLimit: 120,
        playerLives: 3,
        playerSpeed: 200,
        bulletDamage: 10,
        mapLayout: 'training',
        wallDensity: 0.2,
        powerUpRate: 0.1
      },
      victoryCondition: {
        type: 'all_objectives',
        description: '完成所有目标'
      },
      failureConditions: [
        { type: 'no_lives', description: '生命耗尽' },
        { type: 'base_destroyed', description: '基地被摧毁' }
      ],
      timeLimit: 120,
      starCriteria: [
        { stars: 1, scoreThreshold: 500 },
        { stars: 2, scoreThreshold: 800 },
        { stars: 3, scoreThreshold: 1000 }
      ],
      baseRewards: {
        score: 100,
        currency: 50
      }
    }
    
    Logger.warn('🛡️ 已创建默认配置')
    return defaultConfig
  }
}
