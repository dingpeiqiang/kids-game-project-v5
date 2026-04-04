// ============================================================================
// ♾️ 坦克大战 - 无限关卡解压系统
// ============================================================================
// 
// 📌 说明:
//   解决无限关卡与解压功能的冲突
//   采用"种子 + 模板"的混合架构
// ============================================================================

import { ILevelConfig, ITankLevelParams } from '../types/level-types'
import { InfiniteLevelGenerator } from './InfiniteLevelGenerator'
import { Logger } from '../utils/Logger'

/**
 * ⭐ 无限关卡解压数据
 */
export interface IInfiniteLevelDecompressData {
  seed: number              // 随机种子
  levelNumber: number       // 关卡编号
  config: ILevelConfig      // 完整关卡配置
  checksum: string          // 校验和（防篡改）
}

/**
 * ⭐ 无限关卡解压器
 */
export class InfiniteLevelDecompressor {
  private generator: InfiniteLevelGenerator
  private seedDatabase: Map<number, IInfiniteLevelDecompressData> = new Map()
  
  constructor() {
    this.generator = new InfiniteLevelGenerator()
  }
  
  // ===========================================================================
  // 📌 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 生成可解压的无限关卡
   */
  generateDecompressibleLevel(levelNumber: number): IInfiniteLevelDecompressData {
    Logger.debug(`♾️ [InfiniteLevelDecompressor] 生成第 ${levelNumber} 关的可解压数据`)
    
    // 1. 设置种子（基于关卡编号）
    const seed = this.calculateSeed(levelNumber)
    
    // 2. 使用固定种子生成确定性关卡
    const config = this.generateDeterministicLevel(seed, levelNumber)
    
    // 3. 计算校验和
    const checksum = this.calculateChecksum(config)
    
    // 4. 创建解压数据
    const decompressData: IInfiniteLevelDecompressData = {
      seed,
      levelNumber,
      config,
      checksum
    }
    
    // 5. 缓存到数据库
    this.seedDatabase.set(seed, decompressData)
    
    return decompressData
  }
  
  /**
   * ⭐ 从种子解压关卡
   */
  decompressFromSeed(seed: number): ILevelConfig | null {
    Logger.debug(`📦 [InfiniteLevelDecompressor] 从种子 ${seed} 解压关卡`)
    
    // 1. 尝试从缓存加载
    const cached = this.seedDatabase.get(seed)
    if (cached) {
      Logger.debug('✅ 从缓存命中')
      return cached.config
    }
    
    // 2. 从种子重新生成（确定性算法保证一致性）
    const levelNumber = this.extractLevelNumberFromSeed(seed)
    const config = this.generateDeterministicLevel(seed, levelNumber)
    
    // 3. 验证完整性（如果有缓存的话）
    // 注意：首次生成时没有缓存，跳过校验
    
    return config
  }
  
  /**
   * ⭐ 导出为 JSON（用于后端存储）
   */
  exportToJSON(levelNumber: number): string {
    const data = this.generateDecompressibleLevel(levelNumber)
    
    return JSON.stringify({
      seed: data.seed,
      levelNumber: data.levelNumber,
      config: data.config,
      checksum: data.checksum,
      exportedAt: new Date().toISOString()
    }, null, 2)
  }
  
  /**
   * ⭐ 从 JSON 导入
   */
  importFromJSON(jsonString: string): IInfiniteLevelDecompressData | null {
    try {
      const data = JSON.parse(jsonString) as IInfiniteLevelDecompressData
      
      // 验证校验和
      const checksum = this.calculateChecksum(data.config)
      if (checksum !== data.checksum) {
        console.error('❌ 导入失败：校验和不匹配')
        return null
      }
      
      // 缓存到数据库
      this.seedDatabase.set(data.seed, data)
      
      Logger.debug('✅ 导入成功')
      return data
    } catch (error) {
      console.error('❌ 解析 JSON 失败:', error)
      return null
    }
  }
  
  /**
   * ⭐ 批量生成并导出
   */
  exportBatch(startLevel: number, endLevel: number): string {
    const levels: Array<{
      seed: number
      levelNumber: number
      config: ILevelConfig
      checksum: string
    }> = []
    
    for (let i = startLevel; i <= endLevel; i++) {
      const data = this.generateDecompressibleLevel(i)
      levels.push({
        seed: data.seed,
        levelNumber: data.levelNumber,
        config: data.config,
        checksum: data.checksum
      })
    }
    
    return JSON.stringify({
      version: '1.0',
      totalLevels: levels.length,
      range: { start: startLevel, end: endLevel },
      generatedAt: new Date().toISOString(),
      levels
    }, null, 2)
  }
  
  // ===========================================================================
  // 🔧 内部方法
  // ===========================================================================
  
  /**
   * 计算种子（确定性算法）
   */
  private calculateSeed(levelNumber: number): number {
    // 使用线性同余生成器确保确定性
    // 公式：seed = (level × A + C) mod M
    const A = 1103515245
    const C = 12345
    const M = Math.pow(2, 31)
    
    return (levelNumber * A + C) % M
  }
  
  /**
   * 从种子提取关卡编号
   */
  private extractLevelNumberFromSeed(seed: number): number {
    // 反向计算（简化版，实际应该用更复杂的映射）
    const A = 1103515245
    const C = 12345
    
    return Math.floor((seed - C) / A)
  }
  
  /**
   * 生成确定性关卡（相同种子产生相同配置）
   */
  private generateDeterministicLevel(
    seed: number,
    levelNumber: number
  ): ILevelConfig {
    // 使用伪随机数生成器（PRNG）
    const rng = this.createSeededRandom(seed)
    
    // 重置生成器状态
    this.generator.reset()
    
    // 前进到指定关卡
    for (let i = 1; i < levelNumber; i++) {
      this.generator.generateNextLevel()
    }
    
    // 生成基础配置
    const baseConfig = this.generator.generateNextLevel()
    
    // 使用 PRNG 添加随机性（但保持确定性）
    const modifiedConfig = this.addDeterministicVariation(
      baseConfig,
      rng,
      levelNumber
    )
    
    return modifiedConfig
  }
  
  /**
   * 创建带种子的随机数生成器
   */
  private createSeededRandom(seed: number): () => number {
    let current = seed
    
    return () => {
      // 线性同余生成器
      current = (current * 1664525 + 1013904223) % Math.pow(2, 32)
      return current / Math.pow(2, 32)
    }
  }
  
  /**
   * 添加确定性变化
   */
  private addDeterministicVariation(
    config: ILevelConfig,
    rng: () => number,
    levelNumber: number
  ): ILevelConfig {
    // 深拷贝避免修改原对象
    const modified = JSON.parse(JSON.stringify(config)) as ILevelConfig
    
    // 1. 微调敌人数量（±10%）
    const variation = (rng() - 0.5) * 0.2  // -0.1 ~ +0.1
    modified.params.enemyCount = Math.floor(
      modified.params.enemyCount * (1 + variation)
    )
    
    // 2. 微调生成间隔（±5%）
    modified.params.spawnInterval = Math.floor(
      modified.params.spawnInterval * (1 + (rng() - 0.5) * 0.1)
    )
    
    // 3. 随机选择地图类型（从可用列表）
    const mapTypes: ITankLevelParams['mapLayout'][] = [
      'training', 'forest', 'steel', 'desert', 'final'
    ]
    const mapIndex = Math.floor(rng() * mapTypes.length)
    modified.params.mapLayout = mapTypes[mapIndex]
    
    // 4. 微调墙壁密度（±0.1）
    modified.params.wallDensity = Math.max(
      0.1,
      Math.min(0.9, modified.params.wallDensity + (rng() - 0.5) * 0.2)
    )
    
    return modified
  }
  
  /**
   * 计算校验和（简单版本）
   */
  private calculateChecksum(config: ILevelConfig): string {
    const json = JSON.stringify(config)
    
    // 简单的哈希算法（实际项目应该用 crypto）
    let hash = 0
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash  // Convert to 32bit integer
    }
    
    return `chk_${Math.abs(hash).toString(16)}`
  }
}
