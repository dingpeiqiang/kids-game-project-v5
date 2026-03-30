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
 * ⭐ 关卡配置加载器
 */
export class SnakeLevelLoader {
  /** 配置缓存 */
  private static cache: Map<string, SnakeLevelConfig> = new Map()
  
  /**
   * ⭐ 从 JSON 文件加载关卡配置
   */
  static async loadFromJSON(levelId: string): Promise<SnakeLevelConfig> {
    // 检查缓存
    if (this.cache.has(levelId)) {
      console.log(`📖 [LevelLoader] 从缓存读取：${levelId}`)
      return this.cache.get(levelId)!
    }
    
    try {
      // 动态导入 JSON 文件
      const configPath = `../config/levels/${levelId}.json`
      const config = await import(configPath)
      
      console.log(`📖 [LevelLoader] 加载关卡配置：${levelId}`)
      
      // 缓存配置
      this.cache.set(levelId, config.default || config)
      
      return config.default || config
      
    } catch (error) {
      console.error(`❌ [LevelLoader] 加载关卡配置失败：${levelId}`, error)
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
