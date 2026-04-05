import { TerrainGenerator, TerrainStyle, TERRAIN_PRESETS, createTerrainForDistance } from './terrainGenerator'

/**
 * 关卡数据接口
 */
export interface LevelData {
  id: number
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  terrainStyle: TerrainStyle     // 地形风格（用于程序化生成和装饰）
  decorStyle: 'meadow' | 'forest' | 'desert' | 'snow' | 'canyon'  // 装饰风格
  terrain1Path: string           // 第一段地形SVG路径
  terrain2Path: string           // 第二段地形SVG路径
  terrain1Offset: { x: number; y: number }
  terrain2Offset: { x: number; y: number }
  carStartPosition: { x: number; y: number }
  bridgePositions: Array<{ x: number; y: number; width: number; height: number }>
  targetDistance: number         // 目标距离（米）
  timeLimit?: number             // 时间限制（秒，可选）
  stars: {
    one: number   // 1星要求
    two: number   // 2星要求
    three: number // 3星要求
  }
  worldWidth: number             // 世界总宽度（装饰系统需要）
  seed?: number                  // 地形随机种子（保证每次生成一致）
}

/**
 * 关卡管理器 - 管理所有关卡数据和进度
 * 使用程序化地形生成器替代手写 SVG 路径
 */
export default class LevelManager {
  private levels: LevelData[] = []
  private currentLevelId: number = 1
  private unlockedLevels: number[] = [1]
  private levelStars: Map<number, number> = new Map()

  constructor() {
    this.initializeLevels()
    this.loadProgress()
  }

  /**
   * 初始化所有关卡数据（使用程序化地形生成）
   */
  private initializeLevels() {
    const gen = new TerrainGenerator(42)

    // ===== 第1关：新手之路 =====
    this.addLevel({
      id: 1,
      name: '新手之路',
      description: '平缓的草地，适合练习驾驶',
      difficulty: 'easy',
      terrainStyle: 'gentle',
      decorStyle: 'meadow',
      targetDistance: 1000,
      stars: { one: 600, two: 800, three: 1000 },
      seed: 42
    })

    // ===== 第2关：山地挑战 =====
    this.addLevel({
      id: 2,
      name: '山地挑战',
      description: '起伏的山丘，考验驾驶技巧',
      difficulty: 'medium',
      terrainStyle: 'hilly',
      decorStyle: 'forest',
      targetDistance: 1500,
      stars: { one: 900, two: 1200, three: 1500 },
      seed: 137
    })

    // ===== 第3关：极限越野 =====
    this.addLevel({
      id: 3,
      name: '极限越野',
      description: '陡峭的山坡和峡谷',
      difficulty: 'hard',
      terrainStyle: 'mountain',
      decorStyle: 'canyon',
      targetDistance: 2000,
      stars: { one: 1200, two: 1600, three: 2000 },
      seed: 256
    })

    // ===== 第4关：沙漠公路 =====
    this.addLevel({
      id: 4,
      name: '沙漠公路',
      description: '炎热沙漠中的漫长旅途',
      difficulty: 'medium',
      terrainStyle: 'desert',
      decorStyle: 'desert',
      targetDistance: 2500,
      stars: { one: 1500, two: 2000, three: 2500 },
      seed: 777
    })

    // ===== 第5关：峡谷穿越 =====
    this.addLevel({
      id: 5,
      name: '峡谷穿越',
      description: '穿越危险的峡谷地带！',
      difficulty: 'hard',
      terrainStyle: 'canyon',
      decorStyle: 'canyon',
      targetDistance: 3000,
      stars: { one: 1800, two: 2400, three: 3000 },
      seed: 999
    })
  }

  /**
   * 使用程序化生成器添加关卡
   */
  private addLevel(baseConfig: {
    id: number
    name: string
    description: string
    difficulty: 'easy' | 'medium' | 'hard'
    terrainStyle: TerrainStyle
    decorStyle: 'meadow' | 'forest' | 'desert' | 'snow' | 'canyon'
    targetDistance: number
    stars: { one: number; two: number; three: number }
    seed?: number
  }) {
    const gen = new TerrainGenerator(baseConfig.seed)
    const preset = TERRAIN_PRESETS[baseConfig.terrainStyle]

    const totalWidth = baseConfig.targetDistance * 12 + 2000
    const segments = Math.max(60, Math.floor(totalWidth / 80))

    const config = {
      ...preset,
      totalWidth,
      segments,
      baseY: 400
    }

    const dualPaths = gen.generateDualPaths(config, 0.65)

    // 根据地形起伏计算桥梁位置
    const bridgeCount = baseConfig.difficulty === 'easy' ? 3 : baseConfig.difficulty === 'medium' ? 4 : 6
    const bridgePositions = this.generateBridgePositions(
      dualPaths.terrain1Width + dualPaths.terrain2Width,
      config.amplitude,
      config.downwardSlope,
      bridgeCount
    )

    this.levels.push({
      id: baseConfig.id,
      name: baseConfig.name,
      description: baseConfig.description,
      difficulty: baseConfig.difficulty,
      terrainStyle: baseConfig.terrainStyle,
      decorStyle: baseConfig.decorStyle,
      terrain1Path: dualPaths.terrain1Path,
      terrain2Path: dualPaths.terrain2Path,
      terrain1Offset: { x: -200, y: 350 },
      terrain2Offset: { x: dualPaths.terrain1Width - 400, y: 350 },
      carStartPosition: { x: 200, y: 450 },
      bridgePositions,
      targetDistance: baseConfig.targetDistance,
      stars: baseConfig.stars,
      worldWidth: totalWidth,
      seed: baseConfig.seed
    })
  }

  /**
   * 程序化生成桥梁位置
   * 桥梁均匀分布在地形上，位置高度与地形匹配
   */
  private generateBridgePositions(
    worldWidth: number,
    amplitude: number,
    slope: number,
    count: number
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const bridges: Array<{ x: number; y: number; width: number; height: number }> = []
    const spacing = (worldWidth - 500) / (count + 1)

    for (let i = 0; i < count; i++) {
      const x = 400 + spacing * (i + 1) + (Math.random() - 0.5) * spacing * 0.3
      const y = 400 + x * slope + (Math.random() - 0.5) * amplitude * 0.5
      const width = 250 + Math.random() * 150

      bridges.push({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: 15
      })
    }

    return bridges
  }

  /**
   * 获取所有关卡
   */
  getLevels(): LevelData[] {
    return this.levels
  }

  /**
   * 获取指定关卡
   */
  getLevel(levelId: number): LevelData | null {
    return this.levels.find(l => l.id === levelId) || null
  }

  /**
   * 获取当前关卡
   */
  getCurrentLevel(): LevelData | null {
    return this.getLevel(this.currentLevelId)
  }

  /**
   * 设置当前关卡
   */
  setCurrentLevel(levelId: number): boolean {
    if (this.isLevelUnlocked(levelId)) {
      this.currentLevelId = levelId
      return true
    }
    return false
  }

  /**
   * 检查关卡是否解锁
   */
  isLevelUnlocked(levelId: number): boolean {
    return this.unlockedLevels.includes(levelId)
  }

  /**
   * 解锁下一关
   */
  unlockNextLevel(): number | null {
    const nextLevelId = this.currentLevelId + 1
    if (nextLevelId <= this.levels.length && !this.unlockedLevels.includes(nextLevelId)) {
      this.unlockedLevels.push(nextLevelId)
      this.saveProgress()
      return nextLevelId
    }
    return null
  }

  /**
   * 保存关卡星级
   */
  saveLevelStars(levelId: number, stars: number) {
    const currentStars = this.levelStars.get(levelId) || 0
    if (stars > currentStars) {
      this.levelStars.set(levelId, stars)
      this.saveProgress()
    }
  }

  /**
   * 获取关卡星级
   */
  getLevelStars(levelId: number): number {
    return this.levelStars.get(levelId) || 0
  }

  /**
   * 计算应得星级
   */
  calculateStars(distance: number, level: LevelData): number {
    if (distance >= level.stars.three) return 3
    if (distance >= level.stars.two) return 2
    if (distance >= level.stars.one) return 1
    return 0
  }

  /**
   * 保存进度到localStorage
   */
  private saveProgress() {
    const progress = {
      unlockedLevels: this.unlockedLevels,
      levelStars: Object.fromEntries(this.levelStars)
    }
    localStorage.setItem('carGameLevelProgress', JSON.stringify(progress))
  }

  /**
   * 从localStorage加载进度
   */
  private loadProgress() {
    const saved = localStorage.getItem('carGameLevelProgress')
    if (saved) {
      try {
        const progress = JSON.parse(saved)
        this.unlockedLevels = progress.unlockedLevels || [1]
        this.levelStars = new Map(Object.entries(progress.levelStars || {}).map(([k, v]) => [parseInt(k), v as number]))
      } catch (e) {
        console.error('Failed to load level progress:', e)
      }
    }
  }

  /**
   * 重置所有进度
   */
  resetProgress() {
    this.unlockedLevels = [1]
    this.levelStars.clear()
    this.currentLevelId = 1
    localStorage.removeItem('carGameLevelProgress')
  }
}
