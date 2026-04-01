// ============================================================================
// ♾️ 坦克大战 - 无限关卡生成器
// ============================================================================
// 
// 📌 说明:
//   基于程序化生成算法，创建无限个不重复的关卡
//   支持难度曲线、随机地图、敌人配置等
// ============================================================================

import { ILevelConfig, ILevelInfo, ITankLevelParams } from '../types/level-types'

/**
 * ⭐ 无限关卡配置
 */
export interface IInfiniteLevelConfig {
  startLevel: number        // 起始关卡编号
  difficultyCurve: number   // 难度曲线系数 (1.0-2.0)
  enableRandomMap: boolean  // 是否随机地图
  enableRandomEnemies: boolean  // 是否随机敌人
}

/**
 * ⭐ 无限关卡生成器
 */
export class InfiniteLevelGenerator {
  private currentLevelNumber: number = 1
  private readonly baseConfig: IInfiniteLevelConfig
  
  constructor(config?: Partial<IInfiniteLevelConfig>) {
    this.baseConfig = {
      startLevel: config?.startLevel ?? 1,
      difficultyCurve: config?.difficultyCurve ?? 1.5,
      enableRandomMap: config?.enableRandomMap ?? true,
      enableRandomEnemies: config?.enableRandomEnemies ?? true
    }
    
    this.currentLevelNumber = this.baseConfig.startLevel
  }
  
  // ===========================================================================
  // 📌 公开 API
  // ===========================================================================
  
  /**
   * ⭐ 生成下一关
   */
  generateNextLevel(): ILevelConfig<ITankLevelParams> {
    const levelNumber = this.currentLevelNumber++
    
    console.log(`♾️ [InfiniteLevelGenerator] 生成第 ${levelNumber} 关`)
    
    return this.generateLevel(levelNumber)
  }
  
  /**
   * ⭐ 重置进度
   */
  reset(): void {
    this.currentLevelNumber = this.baseConfig.startLevel
    console.log('🔄 [InfiniteLevelGenerator] 已重置进度')
  }
  
  /**
   * ⭐ 获取当前关卡数
   */
  getCurrentLevelNumber(): number {
    return this.currentLevelNumber - 1
  }
  
  // ===========================================================================
  // 🔧 核心生成逻辑
  // ===========================================================================
  
  /**
   * 生成单个关卡
   */
  private generateLevel(levelNumber: number): ILevelConfig<ITankLevelParams> {
    // 1. 计算难度系数
    const difficultyFactor = this.calculateDifficultyFactor(levelNumber)
    
    // 2. 生成关卡参数
    const params = this.generateLevelParams(levelNumber, difficultyFactor)
    
    // 3. 生成关卡信息
    const info = this.generateLevelInfo(levelNumber, difficultyFactor)
    
    // 4. 生成目标和胜利条件
    const objectives = this.generateObjectives(levelNumber, difficultyFactor)
    const victoryCondition = this.generateVictoryCondition()
    
    // 5. 组装完整配置
    return {
      info,
      objectives,
      params,
      victoryCondition,
      failureConditions: [
        { type: 'no_lives', description: '生命耗尽' },
        { type: 'base_destroyed', description: '基地被毁' },
        { type: 'time_up', description: '时间耗尽' }
      ],
      timeLimit: params.timeLimit,
      starCriteria: this.generateStarCriteria(difficultyFactor)
    }
  }
  
  /**
   * 计算难度系数
   */
  private calculateDifficultyFactor(levelNumber: number): number {
    // 使用指数增长曲线
    // 公式：factor = base ^ (level / 10)
    const base = this.baseConfig.difficultyCurve
    const factor = Math.pow(base, levelNumber / 10)
    
    // 限制最大难度（避免过于困难）
    return Math.min(factor, 5.0)
  }
  
  /**
   * 生成关卡参数
   */
  private generateLevelParams(
    levelNumber: number,
    difficultyFactor: number
  ): ITankLevelParams {
    // 敌人数量随关卡增加
    const enemyCount = Math.floor(5 + levelNumber * 1.5 * difficultyFactor)
    
    // 敌人生成间隔逐渐缩短
    const spawnInterval = Math.max(1000, 3000 - levelNumber * 100)
    
    // 敌人类型比例
    const enemyTypes = this.generateEnemyTypes(levelNumber, difficultyFactor)
    
    // 地图类型
    const mapLayout = this.baseConfig.enableRandomMap
      ? this.getRandomMapType(levelNumber)
      : this.getMapTypeByLevel(levelNumber)
    
    // 墙壁密度
    const wallDensity = Math.min(0.8, 0.3 + (levelNumber % 5) * 0.1)
    
    // 道具生成率
    const powerUpRate = Math.max(0.1, 0.3 - levelNumber * 0.02)
    
    return {
      enemyCount,
      spawnInterval,
      enemyTypes,
      timeLimit: Math.max(60, 180 - levelNumber * 5),
      playerLives: 3,
      playerSpeed: 200,
      bulletDamage: 10,
      mapLayout,
      wallDensity,
      powerUpRate
    }
  }
  
  /**
   * 生成敌人类型比例
   */
  private generateEnemyTypes(
    levelNumber: number,
    difficultyFactor: number
  ): Array<'light' | 'medium' | 'heavy'> {
    const types: Array<'light' | 'medium' | 'heavy'> = []
    
    // 轻型敌人始终存在
    const lightCount = Math.floor(5 * difficultyFactor)
    for (let i = 0; i < lightCount; i++) {
      types.push('light')
    }
    
    // 中型敌人从第 3 关开始出现
    if (levelNumber >= 3) {
      const mediumCount = Math.floor((levelNumber - 2) * 0.8 * difficultyFactor)
      for (let i = 0; i < mediumCount; i++) {
        types.push('medium')
      }
    }
    
    // 重型敌人从第 5 关开始出现
    if (levelNumber >= 5) {
      const heavyCount = Math.floor((levelNumber - 4) * 0.5 * difficultyFactor)
      for (let i = 0; i < heavyCount; i++) {
        types.push('heavy')
      }
    }
    
    return types
  }
  
  /**
   * 生成关卡信息
   */
  private generateLevelInfo(
    levelNumber: number,
    difficultyFactor: number
  ): ILevelInfo {
    const difficulty = this.getDifficultyName(difficultyFactor)
    
    return {
      id: `infinite_level_${levelNumber}`,
      name: `无尽模式 - 第${levelNumber}关`,
      description: `难度：${difficulty} | 敌人：${Math.floor(5 + levelNumber * 1.5 * difficultyFactor)}个`,
      difficulty: difficulty as 'easy' | 'normal' | 'hard' | 'expert',
      recommendedLevel: levelNumber,
      prerequisites: levelNumber > 1 ? [`infinite_level_${levelNumber - 1}`] : [],
      thumbnailUrl: undefined
    }
  }
  
  /**
   * 生成关卡目标
   */
  private generateObjectives(
    levelNumber: number,
    difficultyFactor: number
  ) {
    const enemyCount = Math.floor(5 + levelNumber * 1.5 * difficultyFactor)
    
    return [
      {
        id: 'destroy_all_enemies',
        type: 'destroy_enemies',
        description: '消灭所有敌人',
        targetValue: enemyCount,
        weight: 1.0,
        reward: { score: enemyCount * 100 }
      },
      {
        id: 'survive_time',
        type: 'survival',
        description: '存活到时间结束',
        targetValue: Math.max(60, 180 - levelNumber * 5),
        weight: 0.5,
        reward: { score: 500 }
      }
    ]
  }
  
  /**
   * 生成胜利条件
   */
  private generateVictoryCondition() {
    return {
      type: 'all_objectives' as const,
      description: '完成所有目标'
    }
  }
  
  /**
   * 生成星级评价标准
   */
  private generateStarCriteria(difficultyFactor: number) {
    const baseScore = 1000 * difficultyFactor
    
    return [
      {
        stars: 1 as const,
        scoreThreshold: baseScore,
        completionThreshold: 0.6
      },
      {
        stars: 2 as const,
        scoreThreshold: baseScore * 1.5,
        completionThreshold: 0.8
      },
      {
        stars: 3 as const,
        scoreThreshold: baseScore * 2,
        completionThreshold: 1.0,
        timeBonusThreshold: 30
      }
    ]
  }
  
  /**
   * 获取难度名称
   */
  private getDifficultyName(factor: number): string {
    if (factor < 1.5) return 'easy'
    if (factor < 2.5) return 'normal'
    if (factor < 3.5) return 'hard'
    if (factor < 4.5) return 'expert'
    return 'master'
  }
  
  /**
   * 随机地图类型
   */
  private getRandomMapType(seed: number): ITankLevelParams['mapLayout'] {
    const maps: ITankLevelParams['mapLayout'][] = [
      'training',
      'forest',
      'steel',
      'desert',
      'final'
    ]
    
    // 使用伪随机算法（基于关卡编号）
    const index = (seed * 7 + 13) % maps.length
    return maps[index]
  }
  
  /**
   * 根据关卡编号确定地图
   */
  private getMapTypeByLevel(levelNumber: number): ITankLevelParams['mapLayout'] {
    const remainder = levelNumber % 5
    
    switch (remainder) {
      case 1: return 'training'
      case 2: return 'forest'
      case 3: return 'steel'
      case 4: return 'desert'
      case 0: return 'final'
      default: return 'training'
    }
  }
}
