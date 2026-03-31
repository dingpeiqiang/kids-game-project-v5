// ============================================================================
// 📂 贪吃蛇关卡配置加载器
// ============================================================================
// 
// 📌 说明:
//   从 JSON 文件加载关卡配置
//   支持热插拔的配置文件方式
// ============================================================================

import { SnakeLevelConfig } from '../types/snake-level.types'

/**
 * ⭐ 预加载所有可用的关卡配置
 */
const LEVEL_FILES: Record<string, () => Promise<any>> = {
  'snake_level_1': () => import('../../config/levels/snake_level_1.json'),
  'snake_level_2': () => import('../../config/levels/snake_level_2.json'),
  'snake_level_3': () => import('../../config/levels/snake_level_3.json')
}

/**
 * ⭐ 关卡配置加载器
 */
export class SnakeLevelLoader {
  /** 配置缓存 */
  private static cache: Map<string, SnakeLevelConfig> = new Map()
  
  /**
   * ⭐ 从 JSON 文件加载关卡配置（增强版）
   */
  static async loadFromJSON(levelId: string): Promise<SnakeLevelConfig> {
    // 检查缓存
    if (this.cache.has(levelId)) {
      console.log(`📖 [LevelLoader] 从缓存读取：${levelId}`)
      return this.cache.get(levelId)!
    }
    
    try {
      // 使用预定义的加载器
      const loader = LEVEL_FILES[levelId]
      
      if (!loader) {
        throw new Error(`未知的关卡 ID: ${levelId}\n可用的关卡：${Object.keys(LEVEL_FILES).join(', ')}`)
      }
      
      console.log(`📖 [LevelLoader] 正在加载关卡：${levelId}`)
      
      // 动态导入 JSON 文件
      const module = await loader()
      const config = module.default as SnakeLevelConfig
      
      console.log(`✅ [LevelLoader] 关卡加载成功：${levelId}`)
      console.log(`   ├─ 名称：${config.info.name}`)
      console.log(`   ├─ 难度：${config.info.difficulty}`)
      console.log(`   └─ 目标数：${config.objectives.length}`)
      
      // 缓存配置
      this.cache.set(levelId, config)
      
      return config
      
    } catch (error) {
      console.error(`❌ [LevelLoader] 加载关卡配置失败：${levelId}`, error)
      console.error('可用关卡列表:', Object.keys(LEVEL_FILES))
      throw new Error(`无法加载关卡配置：${levelId}`)
    }
  }
  
  /**
   * ⭐ 批量加载多个关卡配置
   */
  static async loadMultiple(levelIds: string[]): Promise<SnakeLevelConfig[]> {
    const configs = await Promise.all(
      levelIds.map(id => this.loadFromJSON(id))
    )
    return configs
  }
  
  /**
   * ⭐ 清除缓存
   */
  static clearCache(levelId?: string): void {
    if (levelId) {
      this.cache.delete(levelId)
    } else {
      this.cache.clear()
    }
  }
}
